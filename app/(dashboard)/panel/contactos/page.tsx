import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import ContactosClient from "./ContactosClient";

export default async function ContactosPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: contactos } = await supabase
    .from("whatsapp_contactos")
    .select(`
      id, telefono, nombre_perfil, notas, archivado_at, created_at,
      whatsapp_conversaciones ( id )
    `)
    .order("created_at", { ascending: false });

  return <ContactosClient contactosIniciales={contactos || []} />;
}
