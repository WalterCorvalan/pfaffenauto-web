import { createClient } from "@/lib/supabase2/server";
import { notFound } from "next/navigation";
import ImprimirPresupuesto from "./ImprimirPresupuesto";

export default async function ImprimirPresupuestoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: presupuesto }, { data: config }] = await Promise.all([
    supabase
      .from("presupuestos")
      .select("*, perfiles:vendedor_id ( nombre )")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("configuracion_empresa").select("branding_nombre, branding_domicilio, branding_telefono, branding_cuit").eq("id", true).maybeSingle(),
  ]);

  if (!presupuesto) notFound();

  return <ImprimirPresupuesto presupuesto={presupuesto} branding={config} />;
}
