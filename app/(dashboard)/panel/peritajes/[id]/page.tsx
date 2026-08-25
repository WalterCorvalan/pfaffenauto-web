import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import PeritajeClient from "./PeritajeClient";

export default async function PeritajePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const [{ data: peritajeCrudo }, { data: items }] = await Promise.all([
    supabase
      .from("peritajes")
      .select(`
        *,
        cotizaciones ( id, marca, modelo, anio, nombre, telefono ),
        vehiculos ( marca, modelo, patente ),
        perfiles ( nombre ),
        whatsapp_conversaciones ( whatsapp_contactos ( nombre_perfil, telefono ) ),
        instagram_conversaciones ( instagram_contactos ( username ) )
      `)
      .eq("id", id)
      .maybeSingle(),
    supabase.from("peritaje_items").select("*").eq("peritaje_id", id).order("orden", { ascending: true }),
  ]);

  if (!peritajeCrudo) notFound();

  // Nombre/teléfono del cliente según de dónde vino el lead.
  const nombreCliente =
    peritajeCrudo.cotizaciones?.nombre ||
    peritajeCrudo.whatsapp_conversaciones?.whatsapp_contactos?.nombre_perfil ||
    peritajeCrudo.whatsapp_conversaciones?.whatsapp_contactos?.telefono ||
    (peritajeCrudo.instagram_conversaciones?.instagram_contactos?.username ? `@${peritajeCrudo.instagram_conversaciones.instagram_contactos.username}` : null);
  const telefonoCliente = peritajeCrudo.cotizaciones?.telefono || peritajeCrudo.whatsapp_conversaciones?.whatsapp_contactos?.telefono || null;
  const peritaje = { ...peritajeCrudo, nombreCliente, telefonoCliente };

  return <PeritajeClient peritaje={peritaje as any} itemsIniciales={items || []} />;
}
