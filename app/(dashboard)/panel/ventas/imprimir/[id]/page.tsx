import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ImprimirBoleto from "./ImprimirBoleto";

export default async function ImprimirOperacionPage({
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

  const { data: operacion } = await supabase
    .from("ventas")
    .select(`
      *,
      vehiculos (*, sucursales!vehiculos_sucursal_id_fkey(nombre, direccion)),
      clientes (*),
      perfiles (nombre)
    `)
    .eq("id", id)
    .single();

  if (!operacion) notFound();

  return <ImprimirBoleto operacion={operacion} />;
}