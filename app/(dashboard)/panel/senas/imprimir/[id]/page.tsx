import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ImprimirSena from "./ImprimirSena";

export default async function ImprimirSenaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: sena } = await supabase
    .from("senas")
    .select("*, perfiles ( nombre ), sucursales ( nombre ), permuta_vehiculo:vehiculos!senas_permuta_vehiculo_id_fkey ( marca, modelo, patente, anio )")
    .eq("id", id)
    .maybeSingle();

  if (!sena) notFound();

  return <ImprimirSena sena={sena} />;
}
