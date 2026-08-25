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
      .select(`
        *,
        cotizaciones ( id, nombre, telefono, vendedor_id, estado ),
        whatsapp_conversaciones ( id, vendedor_id, calificacion, whatsapp_contactos ( nombre_perfil, telefono ) ),
        instagram_conversaciones ( id, vendedor_id, calificacion, instagram_contactos ( username ) )
      `)
      .order("fecha_vencimiento", { ascending: true }),
    supabase
      .from("cotizaciones")
      .select("id, nombre, telefono, vendedor_id, created_at, calificacion")
      .in("estado", ["Nuevo", "Pendiente"])
      .order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre").order("nombre"),
  ]);

  // Normalizamos a un único "lead" por tarea sea cual sea el origen (cotización,
  // WhatsApp o Instagram) — el resto del board (TareaCard, gráficos) no tiene
  // que saber de las 3 tablas distintas, solo consume { id, nombre, vendedor_id, calificacion }.
  const todas = (todasLasTareasCompletas || []).map((t: any) => {
    const lead = t.cotizaciones
      ? { id: t.cotizaciones.id, nombre: t.cotizaciones.nombre, vendedor_id: t.cotizaciones.vendedor_id, calificacion: t.cotizaciones.calificacion }
      : t.whatsapp_conversaciones
      ? { id: t.whatsapp_conversaciones.id, nombre: t.whatsapp_conversaciones.whatsapp_contactos?.nombre_perfil || t.whatsapp_conversaciones.whatsapp_contactos?.telefono || "Consulta WhatsApp", vendedor_id: t.whatsapp_conversaciones.vendedor_id, calificacion: t.whatsapp_conversaciones.calificacion }
      : t.instagram_conversaciones
      ? { id: t.instagram_conversaciones.id, nombre: t.instagram_conversaciones.instagram_contactos?.username ? `@${t.instagram_conversaciones.instagram_contactos.username}` : "Consulta Instagram", vendedor_id: t.instagram_conversaciones.vendedor_id, calificacion: t.instagram_conversaciones.calificacion }
      : null;
    return { ...t, lead };
  });
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
