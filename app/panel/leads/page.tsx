import { createClient } from "@/lib/supabase/server";
import LeadsUnificadosClient from "./LeadsUnificadosClient";

// Para las pestañas "Sin respuesta" y "Lead basura" hace falta saber si el
// ÚLTIMO mensaje de la charla lo mandó el cliente ("in") o nosotros/la IA
// ("out") -- eso no vive en la fila de la conversación, solo en la tabla de
// mensajes. Se trae un lote reciente ordenado desc y se agarra la primera
// ocurrencia por conversación (= el último mensaje real), en vez de una
// query por conversación (200 conversaciones x 3 canales sería carísimo).
async function ultimaDireccionPorConversacion(supabase: Awaited<ReturnType<typeof createClient>>, tabla: string) {
  const { data } = await supabase.from(tabla).select("conversacion_id, direccion").order("created_at", { ascending: false }).limit(3000);
  const mapa: Record<string, "in" | "out"> = {};
  for (const m of data || []) {
    if (!mapa[m.conversacion_id]) mapa[m.conversacion_id] = m.direccion;
  }
  return mapa;
}

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: whatsapp }, { data: instagram }, { data: rodi }, { data: manuales },
    { data: vendedores }, { data: sucursales },
    direccionWA, direccionIG, direccionRodi,
  ] = await Promise.all([
    supabase.from("whatsapp_conversaciones").select("id, vendedor_id, calificacion, estado_lead, canal_origen, sucursal_id, created_at, last_message_at, es_basura, whatsapp_contactos ( nombre_perfil, telefono )").order("last_message_at", { ascending: false }).limit(200),
    supabase.from("instagram_conversaciones").select("id, vendedor_id, calificacion, estado_lead, canal_origen, sucursal_id, created_at, last_message_at, es_basura, instagram_contactos ( username, ig_user_id )").order("last_message_at", { ascending: false }).limit(200),
    supabase.from("rodi_conversaciones").select("id, vendedor_id, calificacion, estado_lead, canal_origen, sucursal_id, created_at, last_message_at, es_basura, nombre_contacto, telefono_contacto").order("last_message_at", { ascending: false }).limit(200),
    supabase.from("leads_manuales").select("id, vendedor_id, calificacion, estado_lead, canal_origen, sucursal_id, created_at, es_basura, nombre, telefono").order("created_at", { ascending: false }).limit(200),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    supabase.from("sucursales").select("id, nombre").order("nombre"),
    ultimaDireccionPorConversacion(supabase, "whatsapp_mensajes"),
    ultimaDireccionPorConversacion(supabase, "instagram_mensajes"),
    ultimaDireccionPorConversacion(supabase, "rodi_mensajes"),
  ]);

  // Se normaliza cada fuente a la misma forma para poder listarlas/filtrarlas
  // juntas -- cada una vive en su propia tabla (whatsapp/instagram/rodi
  // conversaciones + leads_manuales), esto es solo la vista unificada.
  const normalizados = [
    ...(whatsapp || []).map((c: any) => ({ id: c.id, origen: "whatsapp" as const, nombre: c.whatsapp_contactos?.nombre_perfil || c.whatsapp_contactos?.telefono || "Sin nombre", telefono: c.whatsapp_contactos?.telefono, vendedor_id: c.vendedor_id, calificacion: c.calificacion, estado_lead: c.estado_lead || "nuevo", canal_origen: c.canal_origen, sucursal_id: c.sucursal_id, created_at: c.created_at, last_message_at: c.last_message_at, esBasura: c.es_basura || false, ultimaDireccion: direccionWA[c.id] || null })),
    ...(instagram || []).map((c: any) => ({ id: c.id, origen: "instagram" as const, nombre: c.instagram_contactos?.username ? `@${c.instagram_contactos.username}` : c.instagram_contactos?.ig_user_id || "Sin nombre", telefono: null, vendedor_id: c.vendedor_id, calificacion: c.calificacion, estado_lead: c.estado_lead || "nuevo", canal_origen: c.canal_origen, sucursal_id: c.sucursal_id, created_at: c.created_at, last_message_at: c.last_message_at, esBasura: c.es_basura || false, ultimaDireccion: direccionIG[c.id] || null })),
    ...(rodi || []).map((c: any) => ({ id: c.id, origen: "rodi" as const, nombre: c.nombre_contacto || c.telefono_contacto || "Sin nombre", telefono: c.telefono_contacto, vendedor_id: c.vendedor_id, calificacion: c.calificacion, estado_lead: c.estado_lead || "nuevo", canal_origen: c.canal_origen, sucursal_id: c.sucursal_id, created_at: c.created_at, last_message_at: c.last_message_at, esBasura: c.es_basura || false, ultimaDireccion: direccionRodi[c.id] || null })),
    ...(manuales || []).map((c: any) => ({ id: c.id, origen: "manual" as const, nombre: c.nombre, telefono: c.telefono, vendedor_id: c.vendedor_id, calificacion: c.calificacion, estado_lead: c.estado_lead || "nuevo", canal_origen: c.canal_origen, sucursal_id: c.sucursal_id, created_at: c.created_at, last_message_at: c.created_at, esBasura: c.es_basura || false, ultimaDireccion: null })),
  ].sort((a, b) => new Date(b.last_message_at || b.created_at).getTime() - new Date(a.last_message_at || a.created_at).getTime());

  // El rol de vendedor en toda la base es "ventas" (ver whatsapp/rodi/nps/
  // configuracion/notificaciones.ts) -- acá decía "vendedor", que ningún
  // perfil tiene, así que este listado quedaba vacío salvo por los admin.
  const vendedoresLista = (vendedores || []).filter((p: any) => p.roles?.includes("ventas") || p.roles?.includes("admin"));

  return (
    <LeadsUnificadosClient
      leadsIniciales={normalizados}
      vendedores={vendedoresLista}
      sucursales={sucursales || []}
      miId={user?.id || ""}
    />
  );
}
