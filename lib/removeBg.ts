// Recorta el auto de la foto y lo compone sobre el fondo de estudio (remove.bg).
// remove.bg necesita bajar la imagen de fondo desde una URL pública de internet,
// por eso vive en el CDN de Bunny (público siempre, sin depender de si el sitio está deployado).
const FONDO_ESTUDIO_URL = "https://pfaffen-autos.b-cdn.net/fondos/estudio.jpeg";

export function isRemoveBgConfigurado(): boolean {
  return !!process.env.REMOVE_BG_API_KEY;
}

export async function quitarFondo(buffer: Buffer, fileName: string): Promise<Buffer> {
  const formData = new FormData();
  formData.append("image_file", new Blob([new Uint8Array(buffer)]), fileName);
  formData.append("bg_image_url", FONDO_ESTUDIO_URL);
  formData.append("size", "auto");
  formData.append("type", "car");       // mejora la detección de bordes (espejos, antenas, ruedas)
  formData.append("scale", "80%");      // qué tan grande se ve el auto dentro del cuadro
  formData.append("position", "center"); // centrado horizontal/vertical dentro del fondo

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": process.env.REMOVE_BG_API_KEY! },
    body: formData,
  });

  if (!response.ok) {
    const detalle = await response.text().catch(() => "");
    throw new Error(`remove.bg respondió ${response.status}: ${detalle}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
