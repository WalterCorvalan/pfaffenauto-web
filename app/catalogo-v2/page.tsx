import type { Metadata } from "next";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase2/server";
import CatalogoClient from "./CatalogoClient";

// Service role solo para leer whatsapp de perfiles/sucursales -- la sesión
// del visitante público es anónima y esas tablas no tienen policy pública.
const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

export const metadata: Metadata = {
  title: "Catálogo de Autos 0KM y Usados | Pfaffen Autos",
  description: "Explorá todo el stock de Pfaffen Autos: 0KM y usados seleccionados, con filtros por marca, tipo, precio y financiación.",
  alternates: { canonical: "https://pfaffenautos.com.ar/catalogo-v2" },
};

// Sin `revalidate`/ISR a propósito: esta página incrementa el contador de
// visitas del catálogo en cada render (RPC de abajo) — cachear la página
// haría que ese contador solo suba una vez por ventana de revalidación en
// vez de una vez por visitante real, rompiendo la métrica.
export default async function CatalogoV2Page() {
  const supabase = await createClient();

  const [{ data: vehiculos }, { data: config }] = await Promise.all([
    supabase.from("vehiculos").select("*").eq("estado", "disponible").order("created_at", { ascending: false }),
    supabase.from("catalogo_config").select("*").eq("id", "default").single(),
  ]);

  await supabase.rpc("incrementar_stat_catalogo", { campo: "visitas" });

  // Cadena real: vehículo -> vendedor asignado -> su whatsapp propio; si no
  // tiene, cae al telefono_encargado de la sucursal DEL VEHÍCULO. Antes el
  // botón de WhatsApp (general y por auto) apuntaba a un número de ejemplo
  // hardcodeado, ni real.
  const vendedorIds = Array.from(new Set((vehiculos || []).map((v) => v.vendedor_asignado_id).filter(Boolean)));
  const [{ data: vendedores }, { data: sucursales }] = await Promise.all([
    vendedorIds.length ? supabaseAdmin.from("perfiles").select("id, nombre, whatsapp, foto_url, sucursal_id").in("id", vendedorIds) : Promise.resolve({ data: [] as any[] }),
    supabaseAdmin.from("sucursales").select("id, telefono_encargado"),
  ]);
  const vendedorMap = Object.fromEntries((vendedores || []).map((v) => [v.id, v]));
  const sucursalMap = Object.fromEntries((sucursales || []).map((s) => [s.id, s]));

  const vehiculosConContacto = (vehiculos || []).map((v) => {
    const vendedor = v.vendedor_asignado_id ? vendedorMap[v.vendedor_asignado_id] : null;
    const sucursal = v.sucursal_id ? sucursalMap[v.sucursal_id] : null;
    return {
      ...v,
      whatsapp_contacto: vendedor?.whatsapp || sucursal?.telefono_encargado || null,
      vendedor_nombre: vendedor?.nombre || null,
      vendedor_foto: vendedor?.foto_url || null,
    };
  });

  // Número general del header (no ligado a un auto puntual): cualquier
  // sucursal con teléfono cargado, priorizando la primera con datos.
  const whatsappGeneral = (sucursales || []).map((s: any) => s.telefono_encargado).find(Boolean) || null;

  return <CatalogoClient vehiculos={vehiculosConContacto} mostrarPrecios={config?.mostrar_precios ?? true} whatsappGeneral={whatsappGeneral} />;
}
