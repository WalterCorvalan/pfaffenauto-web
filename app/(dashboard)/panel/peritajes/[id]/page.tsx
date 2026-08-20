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

  const [{ data: peritaje }, { data: items }] = await Promise.all([
    supabase
      .from("peritajes")
      .select("*, cotizaciones ( id, marca, modelo, anio, nombre, telefono ), vehiculos ( marca, modelo, patente ), perfiles ( nombre )")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("peritaje_items").select("*").eq("peritaje_id", id).order("orden", { ascending: true }),
  ]);

  if (!peritaje) notFound();

  return <PeritajeClient peritaje={peritaje as any} itemsIniciales={items || []} />;
}
