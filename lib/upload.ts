export async function uploadAutoImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  // Mandamos el archivo a nuestra propia API
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("No se pudo subir la imagen al servidor");
  }

  const data = await response.json();
  
  if (!data.publicUrl) {
    throw new Error("El servidor no devolvió la URL de la imagen");
  }

  // Retornamos el link de Bunny.net listo para guardar en Supabase
  return data.publicUrl;
}