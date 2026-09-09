import { createClient } from "@/lib/supabase2/server";
import TareasLeadBoard from "./TareasLeadBoard";

export const metadata = { title: "Tareas de Leads | Pfaffen Autos" };

export default async function TareasLeadPage() {
  const supabase = await createClient();

  const [{ data: todasLasTareas }, { data: leadsWaNuevos }, { data: leadsIgNuevos }, { data: vendedores }] = await Promise.all([
    supabase
      .from("tareas_lead")
      .select(`
        *,
        whatsapp_conversaciones ( id, vendedor_id, calificacion, whatsapp_contactos ( nombre_perfil, telefono ) ),
        instagram_conversaciones ( id, vendedor_id, calificacion, instagram_contactos ( username ) )
      `)
      .order("fecha_vencimiento", { ascending: true }),
    supabase
      .from("whatsapp_conversaciones")
      .select("id, vendedor_id, calificacion, created_at, whatsapp_contactos ( nombre_perfil, telefono )")
      .eq("estado_lead", "nuevo")
      .order("created_at", { ascending: false }),
    supabase
      .from("instagram_conversaciones")
      .select("id, vendedor_id, calificacion, created_at, instagram_contactos ( username )")
      .eq("estado_lead", "nuevo")
      .order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
  ]);

  const todas = (todasLasTareas || []).map((t: any) => {
    const lead = t.whatsapp_conversaciones
      ? { id: t.whatsapp_conversaciones.id, origen: "whatsapp" as const, nombre: t.whatsapp_conversaciones.whatsapp_contactos?.nombre_perfil || t.whatsapp_conversaciones.whatsapp_contactos?.telefono || "Consulta WhatsApp", vendedor_id: t.whatsapp_conversaciones.vendedor_id, calificacion: t.whatsapp_conversaciones.calificacion }
      : t.instagram_conversaciones
      ? { id: t.instagram_conversaciones.id, origen: "instagram" as const, nombre: t.instagram_conversaciones.instagram_contactos?.username ? `@${t.instagram_conversaciones.instagram_contactos.username}` : "Consulta Instagram", vendedor_id: t.instagram_conversaciones.vendedor_id, calificacion: t.instagram_conversaciones.calificacion }
      : null;
    return { ...t, lead };
  }).filter((t) => t.lead);

  const idsConTarea = new Set(todas.map((t) => t.lead!.id));
  const leadsSinContacto = [
    ...(leadsWaNuevos || []).filter((l) => !idsConTarea.has(l.id)).map((l: any) => ({ id: l.id, origen: "whatsapp" as const, nombre: l.whatsapp_contactos?.nombre_perfil || l.whatsapp_contactos?.telefono || "Consulta WhatsApp", telefono: l.whatsapp_contactos?.telefono, vendedor_id: l.vendedor_id, calificacion: l.calificacion, created_at: l.created_at })),
    ...(leadsIgNuevos || []).filter((l) => !idsConTarea.has(l.id)).map((l: any) => ({ id: l.id, origen: "instagram" as const, nombre: l.instagram_contactos?.username ? `@${l.instagram_contactos.username}` : "Consulta Instagram", telefono: null, vendedor_id: l.vendedor_id, calificacion: l.calificacion, created_at: l.created_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <TareasLeadBoard
      tareasIniciales={todas.filter((t) => !t.completada)}
      tareasCompletadas={todas.filter((t) => t.completada)}
      leadsSinContacto={leadsSinContacto}
      vendedores={vendedores || []}
    />
  );
}
