import { createClient } from "@/lib/supabase/server";
import ConversacionesShell from "@/components/panel/conversaciones/ConversacionesShell";

export default async function InstagramPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [igRes, vendedoresRes, miPerfilRes] = await Promise.all([
    supabase
      .from("instagram_conversaciones")
      .select(`
        id, last_message_at, unread_count, handoff_at, handoff_reason, ai_habilitada, calificacion, origen_ads, notas, estado_pipeline, estado_lead, archivada,
        instagram_contactos ( id, ig_user_id, username, nombre_perfil ), cliente_id, vehiculo_id,
        vendedor_id, vendedor:perfiles!instagram_conversaciones_vendedor_id_fkey ( id, nombre )
      `)
      .order("last_message_at", { ascending: false })
      .limit(3000),
    supabase.from("perfiles").select("id, nombre, roles, sucursal_id").eq("activo", true).order("nombre"),
    user?.id ? supabase.from("perfiles").select("roles, sucursal_id").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  // Mismo criterio de reparto de la lista de vendedores que /panel/whatsapp
  // (ver ese page.tsx) -- admin ve a todos, encargado solo a los de su
  // sucursal, vendedor ve al resto de vendedores.
  const soyAdmin = miPerfilRes.data?.roles?.includes("admin") ?? false;
  const soyEncargado = miPerfilRes.data?.roles?.includes("encargado") ?? false;
  const miSucursalId = miPerfilRes.data?.sucursal_id ?? null;
  const vendedores = (vendedoresRes.data || []).filter((p) => {
    if (soyAdmin) return p.roles?.includes("ventas") || p.roles?.includes("admin");
    if (soyEncargado) return p.roles?.includes("ventas") && p.sucursal_id === miSucursalId;
    return p.roles?.includes("ventas");
  });

  return (
    <ConversacionesShell
      canalFijo="instagram"
      backTo="/panel/instagram?tab=leads"
      conversacionesIniciales={[]}
      conversacionesInstagramIniciales={igRes.data || []}
      vendedores={vendedores}
      miId={user?.id || ""}
    />
  );
}
