import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ImprimirPresupuesto from "./ImprimirPresupuesto";

export default async function ImprimirPresupuestoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: presupuesto } = await supabase
    .from("presupuestos")
    .select("*, perfiles ( nombre )")
    .eq("id", id)
    .maybeSingle();

  if (!presupuesto) notFound();

  return <ImprimirPresupuesto presupuesto={presupuesto} />;
}
