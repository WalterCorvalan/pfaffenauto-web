import { createClient } from "@/lib/supabase2/server";
import { notFound } from "next/navigation";
import PeritajeClient from "./PeritajeClient";

export const metadata = { title: "Peritaje | Pfaffen Autos" };

export default async function PeritajePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: peritajeCrudo }, { data: items }] = await Promise.all([
    supabase
      .from("peritajes_lead")
      .select(`
        *,
        perfiles ( nombre ),
        whatsapp_conversaciones ( whatsapp_contactos ( nombre_perfil, telefono ) ),
        instagram_conversaciones ( instagram_contactos ( username ) )
      `)
      .eq("id", id)
      .maybeSingle(),
    supabase.from("peritaje_lead_items").select("*").eq("peritaje_id", id).order("orden", { ascending: true }),
  ]);

  if (!peritajeCrudo) notFound();

  const nombreCliente =
    peritajeCrudo.whatsapp_conversaciones?.whatsapp_contactos?.nombre_perfil ||
    peritajeCrudo.whatsapp_conversaciones?.whatsapp_contactos?.telefono ||
    (peritajeCrudo.instagram_conversaciones?.instagram_contactos?.username ? `@${peritajeCrudo.instagram_conversaciones.instagram_contactos.username}` : null);
  const peritaje = { ...peritajeCrudo, nombreCliente };

  return <PeritajeClient peritaje={peritaje as any} itemsIniciales={items || []} />;
}
