import { supabase } from "./supabase";

export async function uploadAutoImage(file: File, fileName: string) {
  // Subimos el archivo al bucket 'autos'
  const { data, error } = await supabase.storage
    .from("autos")
    .upload(`public/${fileName}`, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) throw error;

  // Obtenemos la URL pública para mostrar la foto
  const { data: urlData } = supabase.storage
    .from("autos")
    .getPublicUrl(`public/${fileName}`);

  return urlData.publicUrl;
}