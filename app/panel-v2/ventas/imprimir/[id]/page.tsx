import { createClient } from "@/lib/supabase2/server";
import { notFound } from "next/navigation";
import ImprimirVenta from "./ImprimirVenta";

export default async function ImprimirVentaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: venta }, { data: config }] = await Promise.all([
    supabase
      .from("ventas")
      .select("*, perfiles:vendedor_id ( nombre ), vehiculo:vehiculo_id ( segmento, tipo, marca_motor, numero_motor, marca_chasis, numero_chasis, radicado_localidad ), cliente:cliente_id ( calle, numero_calle, depto, localidad, provincia, estado_civil, profesion, cuit_cuil )")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("configuracion_empresa").select("branding_nombre, branding_domicilio, branding_telefono, branding_cuit, branding_logo_url, branding_email, branding_web, branding_ingresos_brutos").eq("id", true).maybeSingle(),
  ]);

  if (!venta) notFound();

  const { data: senasAplicadas } = await supabase.from("venta_senas").select("monto, moneda").eq("venta_id", id);
  const totalSenaPorMoneda: Record<string, number> = {};
  (senasAplicadas || []).forEach((s: any) => { totalSenaPorMoneda[s.moneda] = (totalSenaPorMoneda[s.moneda] || 0) + Number(s.monto); });
  const senaPrevia = totalSenaPorMoneda[venta.moneda_venta] || 0;

  return <ImprimirVenta venta={venta} branding={config} senaPrevia={senaPrevia} />;
}
