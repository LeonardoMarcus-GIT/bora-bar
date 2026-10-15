// Função da Netlify que expõe /api/geocode-profile (ver redirect em netlify.toml).
// Reaproveita a lógica de api/geocode-profile.js, que foi escrita no formato da
// Vercel (request/response estilo Node), adaptando para Request/Response da Web.
import handler from "../../api/geocode-profile.js";

export default async function geocodeProfile(request) {
  let statusCode = 200;
  let body = "";
  const headers = { "Content-Type": "application/json; charset=utf-8" };

  const legacyRequest = {
    method: request.method,
    body: request.method === "POST" ? await request.text() : "",
    headers: {
      authorization: request.headers.get("authorization") ?? undefined
    }
  };

  const legacyResponse = {
    setHeader(name, value) {
      headers[name] = value;
    },
    status(code) {
      statusCode = code;
      return legacyResponse;
    },
    json(payload) {
      body = JSON.stringify(payload);
      return legacyResponse;
    }
  };

  await handler(legacyRequest, legacyResponse);

  return new Response(body, { status: statusCode, headers });
}
