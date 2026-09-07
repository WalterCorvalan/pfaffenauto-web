// Detecta el tipo real de un archivo por sus "magic bytes" en vez de confiar
// en el Content-Type que declara el cliente en el multipart (fácil de
// falsificar: alcanza con nombrar el campo con otro MIME para que un .svg
// con <script> pase cualquier chequeo basado solo en file.type).
export type CategoriaArchivo = "imagen" | "video" | "pdf";

function coincide(buffer: Buffer, offset: number, firma: number[]): boolean {
  if (buffer.length < offset + firma.length) return false;
  return firma.every((byte, i) => buffer[offset + i] === byte);
}

const FIRMAS: { mime: string; categoria: CategoriaArchivo; test: (b: Buffer) => boolean }[] = [
  { mime: "image/jpeg", categoria: "imagen", test: (b) => coincide(b, 0, [0xff, 0xd8, 0xff]) },
  { mime: "image/png", categoria: "imagen", test: (b) => coincide(b, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  { mime: "image/gif", categoria: "imagen", test: (b) => coincide(b, 0, [0x47, 0x49, 0x46, 0x38]) },
  { mime: "image/bmp", categoria: "imagen", test: (b) => coincide(b, 0, [0x42, 0x4d]) },
  { mime: "image/webp", categoria: "imagen", test: (b) => coincide(b, 0, [0x52, 0x49, 0x46, 0x46]) && coincide(b, 8, [0x57, 0x45, 0x42, 0x50]) },
  { mime: "application/pdf", categoria: "pdf", test: (b) => coincide(b, 0, [0x25, 0x50, 0x44, 0x46]) },
  { mime: "video/mp4", categoria: "video", test: (b) => b.length > 12 && coincide(b, 4, [0x66, 0x74, 0x79, 0x70]) }, // mp4/mov/m4v (....ftyp)
  { mime: "video/webm", categoria: "video", test: (b) => coincide(b, 0, [0x1a, 0x45, 0xdf, 0xa3]) }, // webm/mkv (EBML)
  { mime: "video/avi", categoria: "video", test: (b) => coincide(b, 0, [0x52, 0x49, 0x46, 0x46]) && coincide(b, 8, [0x41, 0x56, 0x49, 0x20]) },
];

export function detectarTipoReal(buffer: Buffer): { mime: string; categoria: CategoriaArchivo } | null {
  for (const firma of FIRMAS) {
    if (firma.test(buffer)) return { mime: firma.mime, categoria: firma.categoria };
  }
  return null;
}

/**
 * Valida que el contenido real del archivo (por sus magic bytes, no por el
 * Content-Type que mandó el cliente) sea alguna de las categorías permitidas.
 * Devuelve el MIME real detectado —el que hay que guardar/servir— o null si
 * no matchea ninguna firma conocida de las categorías permitidas.
 */
export function validarYObtenerMimeReal(buffer: Buffer, categoriasPermitidas: CategoriaArchivo[]): string | null {
  const detectado = detectarTipoReal(buffer);
  if (!detectado || !categoriasPermitidas.includes(detectado.categoria)) return null;
  return detectado.mime;
}
