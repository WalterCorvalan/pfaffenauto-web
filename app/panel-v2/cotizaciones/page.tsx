import { createClient } from "@/lib/supabase2/server";
import CotizacionesClient from "./CotizacionesClient";

export default async function CotizacionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: cotizaciones }, { data: perfiles }, { data: clientes }, { data: vehiculos }] = await Promise.all([
    supabase.from("cotizaciones").select("*").order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    supabase.from("clientes").select("id, nombre, telefono, dni_cuit").order("nombre"),
    supabase.from("vehiculos").select("id, marca, modelo, anio, patente, precio_venta, moneda_venta, estado").order("marca"),
  ]);

  return (
    <CotizacionesClient
      cotizacionesIniciales={cotizaciones || []}
      perfiles={perfiles || []}
      clientes={clientes || []}
      vehiculos={vehiculos || []}
      miId={user?.id || ""}
    />
  );
}
