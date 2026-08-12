import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function fileExtension(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension && /^[a-z0-9]+$/.test(extension) ? extension : "jpg";
}

export async function uploadBusinessCoverImage(barId, file) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("UPLOAD_UNAVAILABLE");
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("INVALID_IMAGE_TYPE");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  const filePath = `${barId}/${crypto.randomUUID()}.${fileExtension(file)}`;
  const { error } = await supabase.storage
    .from("bar-images")
    .upload(filePath, file, { contentType: file.type, upsert: false });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("bar-images").getPublicUrl(filePath);
  return data.publicUrl;
}
