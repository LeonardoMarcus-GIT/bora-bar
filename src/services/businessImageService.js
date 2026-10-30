import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function fileExtension(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension && /^[a-z0-9]+$/.test(extension) ? extension : "jpg";
}

// folder: "" para a capa; "stories" para fotos de story, que a função limpar-stories
// apaga sozinha 8 horas depois do envio.
export async function uploadBusinessCoverImage(barId, file, folder = "") {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("UPLOAD_UNAVAILABLE");
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("INVALID_IMAGE_TYPE");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  const filePath = [barId, folder, `${crypto.randomUUID()}.${fileExtension(file)}`].filter(Boolean).join("/");
  const { error } = await supabase.storage
    .from("bar-images")
    .upload(filePath, file, { contentType: file.type, upsert: false });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("bar-images").getPublicUrl(filePath);
  return data.publicUrl;
}

// Reduz a foto no próprio celular antes de enviar (WebP, até 1080 px de largura e
// 1920 de altura): deixa o envio rápido no 4G e economiza o armazenamento.
// Se o navegador não conseguir, envia o arquivo original.
async function shrinkImage(file, maxWidth = 1080, maxHeight = 1920) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

// Foto de promoção ou evento (vira o fundo do story no app). Expira em 8 horas.
export async function uploadBusinessStoryImage(barId, file) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("INVALID_IMAGE_TYPE");
  }

  return uploadBusinessCoverImage(barId, await shrinkImage(file), "stories");
}
