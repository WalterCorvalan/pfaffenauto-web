// Recorta el auto (fondo transparente) y lo componemos nosotros sobre el fondo de
// estudio (Cloudflare R2) con sharp — encuadre fijo y exacto siempre, en vez de
// depender del auto-fit de remove.bg (que recortaba el fondo de forma inconsistente
// según el aspect ratio de cada foto subida).
import sharp from "sharp";

const FONDO_ESTUDIO_URL = "https://pub-e8051b52508949878d450ac52092f601.r2.dev/bg/fondo.png";
const CANVAS_ANCHO = 1600;
const CANVAS_ALTO = 1067; // mismo aspect ratio (3:2) que el fondo original

let fondoCache: Buffer | null = null;
async function obtenerFondo(): Promise<Buffer> {
  if (fondoCache) return fondoCache;
  const res = await fetch(FONDO_ESTUDIO_URL);
  if (!res.ok) throw new Error(`No se pudo bajar el fondo de estudio: ${res.status}`);
  fondoCache = Buffer.from(await res.arrayBuffer());
  return fondoCache;
}

// Servicio propio (rembg self-hosted en Render) — reemplaza remove.bg. A 3.000+
// autos x 12 fotos, remove.bg salía miles de USD; esto es ~gratis (server chico).
export function isRemoveBgConfigurado(): boolean {
  return !!process.env.BG_REMOVER_URL;
}

export async function quitarFondo(buffer: Buffer, fileName: string): Promise<Buffer> {
  const formData = new FormData();
  formData.append("image_file", new Blob([new Uint8Array(buffer)]), fileName);

  const response = await fetch(`${process.env.BG_REMOVER_URL}/remove`, {
    method: "POST",
    headers: process.env.BG_REMOVER_TOKEN ? { "X-Api-Token": process.env.BG_REMOVER_TOKEN } : undefined,
    body: formData,
  });

  if (!response.ok) {
    const detalle = await response.text().catch(() => "");
    throw new Error(`Removedor de fondo respondió ${response.status}: ${detalle}`);
  }

  const recorte = Buffer.from(await response.arrayBuffer());
  const fondo = await obtenerFondo();

  const fondoRedimensionado = await sharp(fondo)
    .resize(CANVAS_ANCHO, CANVAS_ALTO, { fit: "cover", position: "centre" })
    .toBuffer();

  const anchoObjetivo = Math.round(CANVAS_ANCHO * 0.68); // el auto ocupa ~68% del ancho del cuadro
  const autoRedimensionado = await sharp(recorte)
    .resize({ width: anchoObjetivo, fit: "inside" })
    .toBuffer();
  const metaAuto = await sharp(autoRedimensionado).metadata();
  const anchoAuto = metaAuto.width ?? CANVAS_ANCHO;
  const altoAuto = metaAuto.height ?? CANVAS_ALTO;

  return sharp(fondoRedimensionado)
    .composite([
      {
        input: autoRedimensionado,
        left: Math.round((CANVAS_ANCHO - anchoAuto) / 2),
        top: CANVAS_ALTO - altoAuto - Math.round(CANVAS_ALTO * 0.06), // deja aire abajo, auto "parado" en el piso
      },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();
}
