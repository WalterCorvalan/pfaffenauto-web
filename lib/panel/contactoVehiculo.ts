import type { SupabaseClient } from "@supabase/supabase-js";

// Cadena real del negocio: vehículo -> vendedor asignado -> su WhatsApp
// propio; si no tiene (o no hay vendedor asignado), cae al
// telefono_encargado de la SUCURSAL DEL VEHÍCULO (no la del vendedor --
// para el caso justamente que motiva esto: un vendedor de Don Torcuato
// con un auto que está físicamente en Casa Central).
export interface ContactoResuelto {
  numero: string | null;
  nombreVendedor: string | null;
  fotoVendedor: string | null;
  sucursalNombre: string | null;
  direccion: string | null;
  googleMapsUrl: string | null;
}

export async function resolverContacto(
  supabase: SupabaseClient,
  input: { vendedorId?: string | null; sucursalId?: string | null }
): Promise<ContactoResuelto> {
  let numero: string | null = null;
  let nombreVendedor: string | null = null;
  let fotoVendedor: string | null = null;
  let sucursalId = input.sucursalId ?? null;

  if (input.vendedorId) {
    const { data: vendedor } = await supabase
      .from("perfiles")
      .select("nombre, whatsapp, foto_url, sucursal_id")
      .eq("id", input.vendedorId)
      .maybeSingle();
    nombreVendedor = vendedor?.nombre ?? null;
    fotoVendedor = vendedor?.foto_url ?? null;
    numero = vendedor?.whatsapp || null;
    // Si el vehículo no trae su propia sucursal, mostramos al menos la del
    // vendedor -- mejor que nada, pero la del vehículo siempre gana si está.
    if (!sucursalId) sucursalId = vendedor?.sucursal_id ?? null;
  }

  let sucursalNombre: string | null = null;
  let direccion: string | null = null;
  let googleMapsUrl: string | null = null;
  if (sucursalId) {
    const { data: sucursal } = await supabase
      .from("sucursales")
      .select("nombre, direccion, telefono_encargado, google_maps_url")
      .eq("id", sucursalId)
      .maybeSingle();
    if (sucursal) {
      sucursalNombre = sucursal.nombre;
      direccion = sucursal.direccion;
      googleMapsUrl = sucursal.google_maps_url;
      if (!numero) numero = sucursal.telefono_encargado || null;
    }
  }

  return { numero, nombreVendedor, fotoVendedor, sucursalNombre, direccion, googleMapsUrl };
}
