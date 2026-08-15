import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import BoletoClient from "./BoletoClient";

export default async function BoletoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: auto } = await supabase
    .from("vehiculos")
    .select("*, sucursales!vehiculos_sucursal_id_fkey(nombre, direccion)")
    .eq("id", id)
    .single();

  if (!auto) notFound();

  return <BoletoClient auto={auto} />;
}