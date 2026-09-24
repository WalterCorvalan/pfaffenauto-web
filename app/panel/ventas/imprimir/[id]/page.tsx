import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ImprimirVenta from "./ImprimirVenta";
import { totalEnMoneda } from "@/lib/moneda";

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

  const [{ data: senasAplicadas }, { data: permutasAplicadas }] = await Promise.all([
    supabase.from("venta_senas").select("monto, moneda").eq("venta_id", id),
    supabase.from("venta_permutas").select("valor, moneda").eq("venta_id", id),
  ]);
  // Una seña vinculada puede haberse cobrado en una moneda distinta a la de
  // la venta (ej. seña en USD sobre una venta en ARS) — sin convertir con la
  // cotización de la venta, esa seña se contaba como $0 en el recibo.
  const senaPrevia = totalEnMoneda(
    (senasAplicadas || []).map((s: any) => ({ monto: s.monto, moneda: s.moneda })),
    venta.moneda_venta,
    venta.tipo_cambio
  );
  // El saldo a abonar ignoraba las permutas por completo -- con un auto
  // entregado en parte de pago, el recibo mostraba el saldo inflado como si
  // el cliente todavía debiera el valor completo del auto que ya entregó.
  const permutaPrevia = totalEnMoneda(
    (permutasAplicadas || []).map((p) => ({ monto: p.valor, moneda: p.moneda })),
    venta.moneda_venta,
    venta.tipo_cambio
  );

  return <ImprimirVenta venta={venta} branding={config} senaPrevia={senaPrevia} permutaPrevia={permutaPrevia} />;
}
