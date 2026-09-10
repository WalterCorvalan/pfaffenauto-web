import { createClient } from "@/lib/supabase/server";
import ConversacionesShell from "./ConversacionesShell";

export default async function WhatsappPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [waRes, igRes, vendedoresRes, miPerfilRes] = await Promise.all([
    supabase
      .from("whatsapp_conversaciones")
      .select(`
        id, last_message_at, unread_count, handoff_at, handoff_reason, handoff_resumen, ai_habilitada, calificacion, origen_ads, notas, estado_pipeline, estado_lead, archivada,
        whatsapp_contactos ( id, telefono, nombre_perfil ), cliente_id, vehiculo_id,
        vendedor_id, vendedor:perfiles!whatsapp_conversaciones_vendedor_id_fkey ( id, nombre )
      `)
      .order("last_message_at", { ascending: false }),
    supabase
      .from("instagram_conversaciones")
      .select(`
        id, last_message_at, unread_count, handoff_at, handoff_reason, ai_habilitada, calificacion, origen_ads, notas, estado_pipeline, estado_lead, archivada,
        instagram_contactos ( id, ig_user_id, username ), cliente_id, vehiculo_id,
        vendedor_id, vendedor:perfiles!instagram_conversaciones_vendedor_id_fkey ( id, nombre )
      `)
      .order("last_message_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    user?.id ? supabase.from("perfiles").select("roles").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  // Un vendedor (rol "ventas" sin "admin") solo puede reasignar entre otros
  // vendedores -- no ve encargados/admin en el selector. Admin ve todos.
  const soyAdmin = miPerfilRes.data?.roles?.includes("admin") ?? false;
  const vendedores = (vendedoresRes.data || []).filter((p) =>
    soyAdmin ? p.roles?.includes("ventas") || p.roles?.includes("admin") : p.roles?.includes("ventas")
  );

  return (
    <ConversacionesShell
      conversacionesIniciales={waRes.data || []}
      conversacionesInstagramIniciales={igRes.data || []}
      vendedores={vendedores}
      miId={user?.id || ""}
    />
  );
}
