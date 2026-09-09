import { createClient } from "@/lib/supabase2/server";
import LeadsUnificadosClient from "./LeadsUnificadosClient";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: whatsapp }, { data: instagram }, { data: rodi }, { data: manuales },
    { data: vendedores }, { data: sucursales },
  ] = await Promise.all([
    supabase.from("whatsapp_conversaciones").select("id, vendedor_id, calificacion, estado_lead, canal_origen, sucursal_id, created_at, last_message_at, whatsapp_contactos ( nombre_perfil, telefono )").order("last_message_at", { ascending: false }).limit(200),
    supabase.from("instagram_conversaciones").select("id, vendedor_id, calificacion, estado_lead, canal_origen, sucursal_id, created_at, last_message_at, instagram_contactos ( username, ig_user_id )").order("last_message_at", { ascending: false }).limit(200),
    supabase.from("rodi_conversaciones").select("id, vendedor_id, calificacion, estado_lead, canal_origen, sucursal_id, created_at, last_message_at, nombre_contacto, telefono_contacto").order("last_message_at", { ascending: false }).limit(200),
    supabase.from("leads_manuales").select("id, vendedor_id, calificacion, estado_lead, canal_origen, sucursal_id, created_at, nombre, telefono").order("created_at", { ascending: false }).limit(200),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    supabase.from("sucursales").select("id, nombre").order("nombre"),
  ]);

  // Se normaliza cada fuente a la misma forma para poder listarlas/filtrarlas
  // juntas -- cada una vive en su propia tabla (whatsapp/instagram/rodi
  // conversaciones + leads_manuales), esto es solo la vista unificada.
  const normalizados = [
    ...(whatsapp || []).map((c: any) => ({ id: c.id, origen: "whatsapp" as const, nombre: c.whatsapp_contactos?.nombre_perfil || c.whatsapp_contactos?.telefono || "Sin nombre", telefono: c.whatsapp_contactos?.telefono, vendedor_id: c.vendedor_id, calificacion: c.calificacion, estado_lead: c.estado_lead || "nuevo", canal_origen: c.canal_origen, sucursal_id: c.sucursal_id, created_at: c.created_at, last_message_at: c.last_message_at })),
    ...(instagram || []).map((c: any) => ({ id: c.id, origen: "instagram" as const, nombre: c.instagram_contactos?.username ? `@${c.instagram_contactos.username}` : c.instagram_contactos?.ig_user_id || "Sin nombre", telefono: null, vendedor_id: c.vendedor_id, calificacion: c.calificacion, estado_lead: c.estado_lead || "nuevo", canal_origen: c.canal_origen, sucursal_id: c.sucursal_id, created_at: c.created_at, last_message_at: c.last_message_at })),
    ...(rodi || []).map((c: any) => ({ id: c.id, origen: "rodi" as const, nombre: c.nombre_contacto || c.telefono_contacto || "Sin nombre", telefono: c.telefono_contacto, vendedor_id: c.vendedor_id, calificacion: c.calificacion, estado_lead: c.estado_lead || "nuevo", canal_origen: c.canal_origen, sucursal_id: c.sucursal_id, created_at: c.created_at, last_message_at: c.last_message_at })),
    ...(manuales || []).map((c: any) => ({ id: c.id, origen: "manual" as const, nombre: c.nombre, telefono: c.telefono, vendedor_id: c.vendedor_id, calificacion: c.calificacion, estado_lead: c.estado_lead || "nuevo", canal_origen: c.canal_origen, sucursal_id: c.sucursal_id, created_at: c.created_at, last_message_at: c.created_at })),
  ].sort((a, b) => new Date(b.last_message_at || b.created_at).getTime() - new Date(a.last_message_at || a.created_at).getTime());

  const vendedoresLista = (vendedores || []).filter((p: any) => p.roles?.includes("vendedor") || p.roles?.includes("admin"));

  return (
    <LeadsUnificadosClient
      leadsIniciales={normalizados}
      vendedores={vendedoresLista}
      sucursales={sucursales || []}
      miId={user?.id || ""}
    />
  );
}
