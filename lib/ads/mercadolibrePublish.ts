import type { SupabaseClient } from "@supabase/supabase-js";

// Publicación automática de stock en MercadoLibre (Items API, categoría
// Autos/Camionetas/Utilitarios) -- separado de mercadolibre.ts, que solo
// sincroniza métricas de Product Ads y usa OTRO refresh token (con otro
// scope). Este necesita el scope de "publicar avisos" (offline_access +
// write), autorizado para el usuario vendedor de la cuenta de ML.
//
// ADVERTENCIA: igual que mercadolibre.ts -- armado según la documentación
// pública de MercadoLibre (developers.mercadolibre.com.ar), sin poder
// probarlo contra una cuenta real todavía. Lo más frágil es la categoría
// de vehículos en Argentina (MLA1743, "Autos, Camionetas y Utilitarios"):
// es una categoría "catálogo", así que ML puede exigir que MARCA/MODELO/
// VERSIÓN calcen con su propio catálogo interno (no acepta texto libre)
// -- si el primer intento de publicar falla por eso, el error de ML queda
// en ml_publicar_error y hay que ajustar el mapeo de atributos acá.
//
// Variables necesarias (agregar a .env.local / Vercel cuando se tengan):
//   ML_CLIENT_ID / ML_CLIENT_SECRET -> misma app de MercadoLibre que ya se
//     usa para Product Ads (developers.mercadolibre.com.ar, crear/reusar app)
//   ML_SELLER_REFRESH_TOKEN -> se obtiene UNA vez con el flujo OAuth
//     (authorization_code) autorizando la cuenta vendedora con scope de
//     escritura de items, usando ML_CLIENT_ID/SECRET/REDIRECT_URI
//   ML_SELLER_USER_ID -> id numérico del usuario vendedor en ML
//     (GET /users/me con el access token ya autorizado)
//   ML_SITE_ID -> "MLA" para Argentina (default si no se define)
//   ML_CATEGORY_ID -> "MLA1743" (Autos, Camionetas y Utilitarios) por default

export function mercadoLibrePublishConfigurado(): boolean {
  return !!(
    process.env.ML_CLIENT_ID &&
    process.env.ML_CLIENT_SECRET &&
    process.env.ML_SELLER_REFRESH_TOKEN &&
    process.env.ML_SELLER_USER_ID
  );
}

async function obtenerAccessTokenVendedor(): Promise<string> {
  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ML_CLIENT_ID!,
      client_secret: process.env.ML_CLIENT_SECRET!,
      refresh_token: process.env.ML_SELLER_REFRESH_TOKEN!,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "No se pudo refrescar el token de MercadoLibre");
  return data.access_token;
}

interface VehiculoParaML {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  km: number | null;
  precio_venta: number;
  moneda_venta: string;
  condicion: string;
  combustible: string | null;
  transmision: string | null;
  color: string | null;
  fotos: string[] | null;
  notas: string | null;
  ml_item_id: string | null;
}

// Mapeo de atributos best-effort -- ML acepta value_name en muchos
// atributos de vehículos (resuelve él mismo contra su catálogo), pero no
// en todos. Si un vehículo puntual falla por MARCA/MODELO no catalogado,
// ese es el lugar para agregar una tabla de mapeo manual marca/modelo
// interno -> ID de catálogo ML.
function construirAtributos(v: VehiculoParaML) {
  const atributos: { id: string; value_name?: string; value_id?: string }[] = [
    { id: "BRAND", value_name: v.marca },
    { id: "MODEL", value_name: v.modelo },
    { id: "VEHICLE_YEAR", value_name: String(v.anio) },
    { id: "KILOMETERS", value_name: String(v.km ?? 0) },
    { id: "ITEM_CONDITION", value_name: v.km === 0 ? "Nuevo" : "Usado" },
  ];
  if (v.combustible) atributos.push({ id: "FUEL_TYPE", value_name: v.combustible });
  if (v.transmision) atributos.push({ id: "TRANSMISSION", value_name: v.transmision });
  if (v.color) atributos.push({ id: "COLOR", value_name: v.color });
  return atributos;
}

function construirPayload(v: VehiculoParaML) {
  return {
    title: `${v.marca} ${v.modelo} ${v.anio}`.slice(0, 60),
    category_id: process.env.ML_CATEGORY_ID || "MLA1743",
    price: v.precio_venta,
    currency_id: v.moneda_venta === "USD" ? "USD" : "ARS",
    available_quantity: 1,
    buying_mode: "classified",
    listing_type_id: "gold_special",
    condition: v.km === 0 ? "new" : "used",
    description: { plain_text: v.notas || `${v.marca} ${v.modelo} ${v.anio}. Consultá financiación y disponibilidad.` },
    pictures: (v.fotos || []).slice(0, 10).map((url) => ({ source: url })),
    attributes: construirAtributos(v),
  };
}

export interface ResultadoPublicacionML {
  ok: boolean;
  itemId?: string;
  permalink?: string;
  error?: string;
}

// Publica (si no tiene ml_item_id) o actualiza (si ya lo tiene) el aviso
// del vehículo en MercadoLibre, y persiste el resultado en la fila.
export async function publicarVehiculoEnML(supabase: SupabaseClient, vehiculoId: string): Promise<ResultadoPublicacionML> {
  if (!mercadoLibrePublishConfigurado()) {
    return { ok: false, error: "MercadoLibre no está configurado todavía (faltan credenciales)." };
  }

  const { data: v, error: errLectura } = await supabase
    .from("vehiculos")
    .select("id, marca, modelo, anio, km, precio_venta, moneda_venta, condicion, combustible, transmision, color, fotos, notas, ml_item_id")
    .eq("id", vehiculoId)
    .single();
  if (errLectura || !v) return { ok: false, error: "Vehículo no encontrado." };
  if (!v.precio_venta) return { ok: false, error: "El vehículo no tiene precio cargado." };
  if (!v.fotos || v.fotos.length === 0) return { ok: false, error: "El vehículo no tiene fotos cargadas." };

  try {
    const accessToken = await obtenerAccessTokenVendedor();
    const payload = construirPayload(v as VehiculoParaML);
    const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

    const esActualizacion = !!v.ml_item_id;
    const res = await fetch(
      esActualizacion ? `https://api.mercadolibre.com/items/${v.ml_item_id}` : "https://api.mercadolibre.com/items",
      {
        method: esActualizacion ? "PUT" : "POST",
        headers,
        // En update, ML no acepta re-mandar category_id/listing_type_id.
        body: JSON.stringify(esActualizacion ? { price: payload.price, available_quantity: payload.available_quantity, pictures: payload.pictures, attributes: payload.attributes } : payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      const mensajeError = data?.message || data?.cause?.[0]?.message || `MercadoLibre respondió ${res.status}`;
      await supabase.from("vehiculos").update({ ml_publicar_error: mensajeError }).eq("id", vehiculoId);
      return { ok: false, error: mensajeError };
    }

    await supabase
      .from("vehiculos")
      .update({
        publicado_ml: true,
        publicado_por: "automatico",
        link_ml: data.permalink || null,
        ml_item_id: data.id || v.ml_item_id,
        ml_publicar_error: null,
      })
      .eq("id", vehiculoId);

    return { ok: true, itemId: data.id, permalink: data.permalink };
  } catch (err: any) {
    const mensaje = err?.message || "Error inesperado publicando en MercadoLibre.";
    await supabase.from("vehiculos").update({ ml_publicar_error: mensaje }).eq("id", vehiculoId);
    return { ok: false, error: mensaje };
  }
}

// Pausa el aviso en ML -- usar cuando el vehículo se vende/reserva, para no
// seguir mostrándolo disponible en el marketplace.
export async function pausarVehiculoEnML(supabase: SupabaseClient, vehiculoId: string): Promise<ResultadoPublicacionML> {
  if (!mercadoLibrePublishConfigurado()) return { ok: false, error: "MercadoLibre no está configurado todavía." };

  const { data: v } = await supabase.from("vehiculos").select("ml_item_id").eq("id", vehiculoId).single();
  if (!v?.ml_item_id) return { ok: true }; // nunca se publicó, nada que pausar

  try {
    const accessToken = await obtenerAccessTokenVendedor();
    const res = await fetch(`https://api.mercadolibre.com/items/${v.ml_item_id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paused" }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.message || `MercadoLibre respondió ${res.status}` };
    return { ok: true, itemId: v.ml_item_id };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Error inesperado pausando en MercadoLibre." };
  }
}
