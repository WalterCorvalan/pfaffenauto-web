import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import PresupuestoForm from "./PresupuestoForm";

export default async function NuevoPresupuestoPage({ searchParams }: { searchParams: Promise<{ cotizacion_id?: string }> }) {
  const { cotizacion_id } = await searchParams;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const [{ data: clientes }, { data: vehiculos }, { data: vendedores }, { data: sucursales }] = await Promise.all([
    supabase.from("clientes").select("*").order("apellido"),
    supabase.from("vehiculos").select("*").in("estado", ["Disponible", "Reservado"]).order("marca"),
    supabase.from("perfiles").select("id, nombre").order("nombre"),
    supabase.from("sucursales").select("id, nombre").order("nombre"),
  ]);

  let vehiculoInicial = null;
  if (cotizacion_id) {
    const { data: cotizacion } = await supabase.from("cotizaciones").select("vehiculo_id").eq("id", cotizacion_id).maybeSingle();
    if (cotizacion?.vehiculo_id) {
      vehiculoInicial = (vehiculos || []).find((v) => v.id === cotizacion.vehiculo_id) || null;
    }
  }

  return <PresupuestoForm clientes={clientes || []} vehiculos={vehiculos || []} vendedores={vendedores || []} sucursales={sucursales || []} vehiculoInicial={vehiculoInicial} cotizacionId={cotizacion_id || null} />;
}
