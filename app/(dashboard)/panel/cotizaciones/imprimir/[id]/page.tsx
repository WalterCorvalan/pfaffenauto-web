import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ImprimirCotizacion from "./ImprimirCotizacion";

export default async function ImprimirCotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: cot } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!cot) notFound();

  const { data: vehiculoObjetivo } = cot.vehiculo_id
    ? await supabase
        .from("vehiculos")
        .select("marca, modelo, precio_publicado_ars, precio_publicado_usd")
        .eq("id", cot.vehiculo_id)
        .maybeSingle()
    : { data: null };

  return <ImprimirCotizacion cot={cot} vehiculoObjetivo={vehiculoObjetivo} />;
}
