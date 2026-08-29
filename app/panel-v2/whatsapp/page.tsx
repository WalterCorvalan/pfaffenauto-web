import { createClient } from "@/lib/supabase2/server";
import ConversacionesShell from "./ConversacionesShell";

export default async function WhatsappPage() {
  const supabase = await createClient();

  const [waRes, igRes, vendedoresRes] = await Promise.all([
    supabase
      .from("whatsapp_conversaciones")
      .select(`
        id, last_message_at, unread_count, handoff_at, ai_habilitada, calificacion, origen_ads, notas, estado_pipeline, estado_lead,
        whatsapp_contactos ( id, telefono, nombre_perfil ), cliente_id, vehiculo_id,
        vendedor_id, vendedor:perfiles!whatsapp_conversaciones_vendedor_id_fkey ( id, nombre )
      `)
      .order("last_message_at", { ascending: false }),
    supabase
      .from("instagram_conversaciones")
      .select(`
        id, last_message_at, unread_count, handoff_at, ai_habilitada, calificacion, origen_ads, notas, estado_pipeline, estado_lead,
        instagram_contactos ( id, ig_user_id, username ), cliente_id, vehiculo_id,
        vendedor_id, vendedor:perfiles!instagram_conversaciones_vendedor_id_fkey ( id, nombre )
      `)
      .order("last_message_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
  ]);

  return (
    <ConversacionesShell
      conversacionesIniciales={waRes.data || []}
      conversacionesInstagramIniciales={igRes.data || []}
      vendedores={(vendedoresRes.data || []).filter((p) => p.roles?.includes("ventas") || p.roles?.includes("admin"))}
    />
  );
}
