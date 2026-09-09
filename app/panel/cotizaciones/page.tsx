import { createClient } from "@/lib/supabase2/server";
import CotizacionesClient from "./CotizacionesClient";

export default async function CotizacionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: cotizaciones }, { data: perfiles }, { data: clientes }, { data: vehiculos }, { data: config }, { data: leadsWeb }] = await Promise.all([
    supabase.from("cotizaciones").select("*").order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    supabase.from("clientes").select("id, nombre, telefono, dni_cuit").order("nombre"),
    supabase.from("vehiculos").select("id, marca, modelo, anio, patente, precio_venta, moneda_venta, estado").order("marca"),
    supabase.from("configuracion_empresa").select("sla_cotizacion_horas").eq("id", true).maybeSingle(),
    // Tasaciones/permutas pedidas desde /cotizador en la web — viven en
    // leads_tasacion y se gestionan de verdad en Peritajes, pero también se
    // listan (solo lectura) acá para que no queden invisibles.
    supabase.from("leads_tasacion").select("id, nombre, telefono, marca, modelo, anio, oferta_calculada, precio_esperado_cliente, estado, created_at, tipo").in("tipo", ["tasacion", "permuta"]).order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <CotizacionesClient
      cotizacionesIniciales={cotizaciones || []}
      perfiles={perfiles || []}
      clientes={clientes || []}
      vehiculos={vehiculos || []}
      miId={user?.id || ""}
      slaHoras={config?.sla_cotizacion_horas || 48}
      leadsWebIniciales={leadsWeb || []}
    />
  );
}
