// Búsqueda pública de publicaciones en MercadoLibre (Items Search API) --
// reusa ML_CLIENT_ID/ML_CLIENT_SECRET, la misma app ya usada para publicar
// stock y Product Ads (ver mercadolibrePublish.ts/mercadolibre.ts). A
// diferencia de esos dos, esto NO necesita ningún refresh_token de vendedor
// (no escribe nada, solo lee publicaciones públicas) -- alcanza con un
// access_token de aplicación vía client_credentials.
//
// Se consulta en vivo en cada búsqueda (no se guarda nada en la base), así
// que siempre refleja publicaciones activas en este momento -- ML no
// devuelve en el buscador público avisos pausados/finalizados/vendidos.
//
// ADVERTENCIA: armado según la documentación pública de MercadoLibre
// (developers.mercadolibre.com.ar/es_ar/items-y-busquedas), sin poder
// probarlo contra una respuesta real desde este entorno (sin acceso de red
// a api.mercadolibre.com). Si algo no calza (nombres de campos, código de
// categoría), ajustar acá con la primera respuesta real.

const CATEGORIA_AUTOS = "MLA1743"; // "Autos, Camionetas y Utilitarios" (Argentina)

export function mercadoLibreSearchConfigurado(): boolean {
  return !!(process.env.ML_CLIENT_ID && process.env.ML_CLIENT_SECRET);
}

async function obtenerAccessTokenApp(): Promise<string> {
  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.ML_CLIENT_ID!,
      client_secret: process.env.ML_CLIENT_SECRET!,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "No se pudo autenticar con MercadoLibre");
  return data.access_token;
}

export interface PublicacionML {
  id: string;
  titulo: string;
  precio: number;
  moneda: string;
  link: string;
  thumbnail: string;
  ciudad: string | null;
  provincia: string | null;
}

export async function buscarEnMercadoLibre(query: string): Promise<PublicacionML[]> {
  const accessToken = await obtenerAccessTokenApp();
  const url = `https://api.mercadolibre.com/sites/MLA/search?category=${CATEGORIA_AUTOS}&q=${encodeURIComponent(query)}&limit=30`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `MercadoLibre respondió ${res.status}`);

  return (data.results || []).map((r: any) => ({
    id: r.id,
    titulo: r.title,
    precio: r.price,
    moneda: r.currency_id,
    link: r.permalink,
    thumbnail: (r.thumbnail || "").replace("http://", "https://"),
    ciudad: r.address?.city_name || null,
    provincia: r.address?.state_name || null,
  }));
}
