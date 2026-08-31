import { createClient } from "@/lib/supabase2/server";
import PeritajesClient from "./PeritajesClient";

export const metadata = { title: "Peritajes | Pfaffen Autos" };

export default async function PeritajesPage() {
  const supabase = await createClient();

  const { data: peritajesCrudos } = await supabase
    .from("peritajes_lead")
    .select(`
      *,
      perfiles ( nombre ),
      whatsapp_conversaciones ( whatsapp_contactos ( nombre_perfil, telefono ) ),
      instagram_conversaciones ( instagram_contactos ( username ) )
    `)
    .order("created_at", { ascending: false });

  const idsConPeritaje = {
    whatsapp: new Set((peritajesCrudos || []).map((p: any) => p.whatsapp_conversacion_id).filter(Boolean)),
    instagram: new Set((peritajesCrudos || []).map((p: any) => p.instagram_conversacion_id).filter(Boolean)),
  };

  const [{ data: wa }, { data: ig }] = await Promise.all([
    supabase
      .from("whatsapp_conversaciones")
      .select("id, created_at, whatsapp_contactos ( nombre_perfil, telefono )")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("instagram_conversaciones")
      .select("id, created_at, instagram_contactos ( username )")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const leadsSinPeritaje = [
    ...(wa || [])
      .filter((c: any) => !idsConPeritaje.whatsapp.has(c.id))
      .map((c: any) => ({
        origen: "whatsapp" as const,
        id: c.id,
        nombre: c.whatsapp_contactos?.nombre_perfil || c.whatsapp_contactos?.telefono || "Contacto de WhatsApp",
        created_at: c.created_at,
      })),
    ...(ig || [])
      .filter((c: any) => !idsConPeritaje.instagram.has(c.id))
      .map((c: any) => ({
        origen: "instagram" as const,
        id: c.id,
        nombre: c.instagram_contactos?.username ? `@${c.instagram_contactos.username}` : "Contacto de Instagram",
        created_at: c.created_at,
      })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const peritajes = (peritajesCrudos || []).map((p: any) => ({
    ...p,
    nombreCliente:
      p.whatsapp_conversaciones?.whatsapp_contactos?.nombre_perfil ||
      p.whatsapp_conversaciones?.whatsapp_contactos?.telefono ||
      (p.instagram_conversaciones?.instagram_contactos?.username ? `@${p.instagram_conversaciones.instagram_contactos.username}` : null),
  }));

  return <PeritajesClient peritajes={peritajes} leadsSinPeritaje={leadsSinPeritaje} />;
}
