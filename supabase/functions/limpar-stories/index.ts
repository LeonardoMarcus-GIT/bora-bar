// Edge Function "limpar-stories": apaga as fotos de story com mais de 8 horas.
// Chamada de hora em hora pelo pg_cron (ver supabase/stories-cleanup-migration.sql).
// Não recebe dados de quem chama: só apaga o que já venceu, então pode ser chamada
// sem login (verify_jwt desligado) sem risco de apagar outra coisa.
import { createClient } from "jsr:@supabase/supabase-js@2";

const BUCKET = "bar-images";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase.rpc("list_expired_story_images");
  if (error) {
    return Response.json({ ok: false, step: "listar", error: error.message }, { status: 500 });
  }

  // Só caminhos da pasta de stories de algum bar: "<bar_id>/stories/<arquivo>".
  const paths = (data ?? [])
    .map((row: { path: string }) => row.path)
    .filter((path: string) => path.split("/")[1] === "stories");

  if (!paths.length) {
    return Response.json({ ok: true, removed: 0 });
  }

  const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
  if (removeError) {
    return Response.json({ ok: false, step: "apagar", error: removeError.message }, { status: 500 });
  }

  const { error: clearError } = await supabase.rpc("clear_story_image_urls", { paths });
  if (clearError) {
    return Response.json({ ok: false, step: "limpar-links", error: clearError.message }, { status: 500 });
  }

  return Response.json({ ok: true, removed: paths.length });
});
