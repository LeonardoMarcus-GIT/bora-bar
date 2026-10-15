// Prévia do link da página avulsa (/r/<id>) no WhatsApp, Instagram, Facebook...
// Esses apps não executam o JavaScript do site: leem só as tags <meta> do HTML.
// Aqui, antes de entregar o index.html, buscamos o estabelecimento no Supabase
// e colocamos título, descrição e foto dele nas tags Open Graph.
// Se algo falhar, o HTML segue sem alteração (a página continua funcionando).

const PAGE_PATTERN = /^\/r\/([^/]+)\/?$/;

function readEnv(name) {
  try {
    return globalThis.Netlify?.env?.get(name) ?? globalThis.Deno?.env?.get(name) ?? "";
  } catch {
    return "";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(text, max) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

async function fetchBar(barId) {
  const supabaseUrl = readEnv("VITE_SUPABASE_URL");
  const supabaseKey = readEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  const query = new URL(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/bars`);
  query.searchParams.set("id", `eq.${barId}`);
  query.searchParams.set("is_active", "eq.true");
  query.searchParams.set("select", "name,description,image_url,neighborhood,city");

  const response = await fetch(query, {
    headers: { apikey: supabaseKey, Accept: "application/json" },
    signal: AbortSignal.timeout(2500)
  });

  if (!response.ok) {
    return null;
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

export function buildPreviewTags(bar, pageUrl) {
  const title = escapeHtml(bar.name);
  const place = [bar.neighborhood, bar.city].filter(Boolean).join(", ");
  const description = escapeHtml(
    truncate(bar.description || `Cardápio, horários e contato${place ? ` — ${place}` : ""}.`, 180)
  );
  const image = bar.image_url ? escapeHtml(new URL(bar.image_url, pageUrl).href) : "";
  const url = escapeHtml(pageUrl);

  return [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    image ? `<meta property="og:image" content="${image}" />` : "",
    image ? `<meta property="og:image:alt" content="${title}" />` : "",
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    image ? `<meta name="twitter:image" content="${image}" />` : ""
  ]
    .filter(Boolean)
    .join("\n    ");
}

export function injectPreview(html, bar, pageUrl) {
  const title = escapeHtml(bar.name);
  const description = escapeHtml(truncate(bar.description, 180));

  let nextHtml = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);

  if (description) {
    nextHtml = nextHtml.replace(
      /<meta\s+name="description"[\s\S]*?\/>/i,
      `<meta name="description" content="${description}" />`
    );
  }

  return nextHtml.replace("</head>", `    ${buildPreviewTags(bar, pageUrl)}\n  </head>`);
}

export default async function linkPreview(request, context) {
  const url = new URL(request.url);
  const match = url.pathname.match(PAGE_PATTERN);
  const response = await context.next();

  if (!match || !(response.headers.get("content-type") ?? "").includes("text/html")) {
    return response;
  }

  try {
    const bar = await fetchBar(decodeURIComponent(match[1]));

    if (!bar) {
      return response;
    }

    const html = injectPreview(await response.text(), bar, `${url.origin}${url.pathname}`);
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.set("cache-control", "public, max-age=0, must-revalidate");

    return new Response(html, { status: response.status, headers });
  } catch {
    return response;
  }
}

export const config = { path: "/r/*" };
