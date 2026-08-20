import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import TareasLeadBoard from "./TareasLeadBoard";

export default async function TareasLeadPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const [{ data: todasLasTareasCompletas }, { data: leadsNuevos }, { data: vendedores }] = await Promise.all([
    supabase
      .from("tareas_lead")
      .select("*, cotizaciones ( id, nombre, telefono, vendedor_id, estado, calificacion )")
      .order("fecha_vencimiento", { ascending: true }),
    supabase
      .from("cotizaciones")
      .select("id, nombre, telefono, vendedor_id, created_at, calificacion")
      .in("estado", ["Nuevo", "Pendiente"])
      .order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre").order("nombre"),
  ]);

  const todas = todasLasTareasCompletas || [];
  const idsConTarea = new Set(todas.map((t) => t.cotizacion_id));
  const leadsSinContacto = (leadsNuevos || []).filter((l) => !idsConTarea.has(l.id));

  return (
    <TareasLeadBoard
      tareasIniciales={todas.filter((t) => !t.completada)}
      tareasCompletadas={todas.filter((t) => t.completada)}
      leadsSinContacto={leadsSinContacto}
      vendedores={vendedores || []}
    />
  );
}
