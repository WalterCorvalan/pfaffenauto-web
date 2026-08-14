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

  const { data: conversaciones } = await supabase
    .from("whatsapp_conversaciones")
    .select(`
      id, last_message_at, unread_count, handoff_at, ai_habilitada, calificacion,
      whatsapp_contactos ( id, telefono, nombre_perfil ), cliente_id, vehiculo_id,
      vendedor_id, vendedor:perfiles!whatsapp_conversaciones_vendedor_id_fkey ( id, nombre )
    `)
    .order("last_message_at", { ascending: false });

  const { data: vendedores } = await supabase
    .from("perfiles")
    .select("id, nombre, sucursal_id")
    .eq("rol", "vendedor")
    .eq("activo", true);

  // Ocupa el 100% exacto del espacio disponible del nuevo layout
  return (
    <div className="w-full h-full flex overflow-hidden bg-white">
      <ChatClient conversacionesIniciales={conversaciones || []} vendedores={vendedores || []} />
    </div>
  );
}