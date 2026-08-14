import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ImprimirBoletoVenta from "./ImprimirBoletoVenta";

export default async function ImprimirBoletoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: boleto } = await supabase
    .from("boletos_venta")
    .select("*, perfiles ( nombre ), sucursales ( nombre, direccion )")
    .eq("id", id)
    .maybeSingle();

  if (!boleto) notFound();

  return <ImprimirBoletoVenta boleto={boleto} />;
}
