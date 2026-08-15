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

  const [{ data: tareas }, { data: leadsNuevos }, { data: todasLasTareas }, { data: vendedores }] = await Promise.all([
    supabase
      .from("tareas_lead")
      .select("*, cotizaciones ( id, nombre, telefono, vendedor_id, estado )")
      .eq("completada", false)
      .order("fecha_vencimiento", { ascending: true }),
    supabase
      .from("cotizaciones")
      .select("id, nombre, telefono, vendedor_id, created_at")
      .eq("estado", "Nuevo")
      .order("created_at", { ascending: false }),
    supabase.from("tareas_lead").select("cotizacion_id"),
    supabase.from("perfiles").select("id, nombre").order("nombre"),
  ]);

  const idsConTarea = new Set((todasLasTareas || []).map((t) => t.cotizacion_id));
  const leadsSinContacto = (leadsNuevos || []).filter((l) => !idsConTarea.has(l.id));

  return (
    <TareasLeadBoard
      tareasIniciales={tareas || []}
      leadsSinContacto={leadsSinContacto}
      vendedores={vendedores || []}
    />
  );
}
