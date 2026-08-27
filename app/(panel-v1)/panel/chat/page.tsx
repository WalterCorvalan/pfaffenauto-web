import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import ChatClient from "./ChatClient";

export default async function ChatPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const [{ data: conversacionesWhatsapp }, { data: conversacionesInstagram }, { data: vendedores }] = await Promise.all([
    supabase
      .from("whatsapp_conversaciones")
      .select(`
        id, last_message_at, unread_count, handoff_at, ai_habilitada, calificacion, origen_ads,
        whatsapp_contactos ( id, telefono, nombre_perfil ), cliente_id, vehiculo_id,
        vendedor_id, vendedor:perfiles!whatsapp_conversaciones_vendedor_id_fkey ( id, nombre )
      `)
      .order("last_message_at", { ascending: false }),
    supabase
      .from("instagram_conversaciones")
      .select(`
        id, last_message_at, unread_count, handoff_at, ai_habilitada, calificacion,
        instagram_contactos ( id, ig_user_id, username ), cliente_id, vehiculo_id,
        vendedor_id, vendedor:perfiles!instagram_conversaciones_vendedor_id_fkey ( id, nombre )
      `)
      .order("last_message_at", { ascending: false }),
    supabase
      .from("perfiles")
      .select("id, nombre, sucursal_id")
      .eq("rol", "vendedor")
      .eq("activo", true),
  ]);

  // Ocupa el 100% exacto del espacio disponible del nuevo layout
  return (
    <div className="w-full h-full flex overflow-hidden bg-white dark:bg-[#001233]">
      <ChatClient
        conversacionesIniciales={conversacionesWhatsapp || []}
        conversacionesInstagramIniciales={conversacionesInstagram || []}
        vendedores={vendedores || []}
      />
    </div>
  );
}