import { createClient } from "@/lib/supabase2/server";
import ReportesClient from "./ReportesClient";

export const metadata = { title: "Reportes y Análisis | Pfaffen Autos" };

export default async function ReportesPage() {
  const supabase = await createClient();
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
  const desde = mesActual;
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [
    { data: miPerfil },
    { data: ranking },
    { data: premios },
    { data: rankingVelocidad },
    { data: operacionesPorVendedor },
    { data: origenLeads },
    { data: embudoComercial },
    { data: expedientesResumen },
    { data: expedientesPorEstado },
    { data: infraccionesResumen },
    { data: tallerFacturacion },
    { data: ventasPorMes },
    { data: ventasPorMarca },
    { data: topClientes },
    { data: clientesPorVendedor },
    { data: cotizacionesResumen },
    { data: cotizacionesPorEstado },
    { data: cotizacionesPorVendedor },
    { data: stockPorEstado },
    { data: stockPorMarca },
    { data: infraccionesPorMes },
    { data: servicePosventa },
  ] = await Promise.all([
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return { data: null };
      return supabase.from("perfiles").select("id, nombre, roles").eq("id", data.user.id).single();
    }),
    supabase.rpc("ranking_ventas", { p_desde: desde, p_hasta: hasta }),
    supabase.from("premios_consignaciones").select("*").order("orden"),
    supabase.from("v_reportes_ranking_velocidad").select("*"),
    supabase.from("v_reportes_operaciones_por_vendedor").select("*"),
    supabase.from("v_reportes_origen_leads").select("*"),
    supabase.from("v_reportes_embudo_comercial").select("*"),
    supabase.from("v_reportes_expedientes_resumen").select("*").single(),
    supabase.from("v_reportes_expedientes_por_estado").select("*"),
    supabase.from("v_reportes_infracciones_resumen").select("*").single(),
    supabase.from("v_reportes_taller_facturacion").select("*").single(),
    supabase.from("v_reportes_ventas_por_mes").select("*").limit(12),
    supabase.from("v_reportes_ventas_por_marca").select("*"),
    supabase.from("v_reportes_top_clientes").select("*"),
    supabase.from("v_reportes_clientes_por_vendedor").select("*"),
    supabase.from("v_reportes_cotizaciones_resumen").select("*").single(),
    supabase.from("v_reportes_cotizaciones_por_estado").select("*"),
    supabase.from("v_reportes_cotizaciones_por_vendedor").select("*"),
    supabase.from("v_reportes_stock_por_estado").select("*"),
    supabase.from("v_reportes_stock_por_marca").select("*"),
    supabase.from("v_reportes_infracciones_por_mes").select("*").limit(12),
    supabase.from("v_reportes_service_posventa").select("*").single(),
  ]);

  return (
    <ReportesClient
      miId={miPerfil?.id || ""}
      miNombre={miPerfil?.nombre || ""}
      soyAdmin={miPerfil?.roles?.includes("admin") ?? false}
      soyFinanzas={miPerfil?.roles?.includes("finanzas") ?? false}
      soyVentas={miPerfil?.roles?.includes("ventas") ?? false}
      mesInicial={mesActual}
      rankingInicial={ranking || []}
      premios={premios || []}
      rankingVelocidadInicial={rankingVelocidad || []}
      operacionesPorVendedorInicial={operacionesPorVendedor || []}
      origenLeadsInicial={origenLeads || []}
      embudoComercialInicial={(embudoComercial || [])[0] || { clientes: 0, cotizaciones: 0, ventas: 0 }}
      expedientesResumenInicial={expedientesResumen || { total: 0, activos: 0, cerrados: 0, vencidos: 0 }}
      expedientesPorEstado={expedientesPorEstado || []}
      infraccionesResumenInicial={infraccionesResumen || { total: 0, pendientes: 0, pagadas: 0, ganancia_total: 0 }}
      tallerFacturacionInicial={tallerFacturacion || { facturado_cobrado: 0, ots_cobradas: 0, ots_generadas: 0 }}
      ventasPorMes={ventasPorMes || []}
      ventasPorMarca={ventasPorMarca || []}
      topClientes={topClientes || []}
      clientesPorVendedor={clientesPorVendedor || []}
      cotizacionesResumen={cotizacionesResumen || { total_generadas: 0, aprobadas: 0, en_revision: 0, tasa_conversion_pct: 0 }}
      cotizacionesPorEstado={cotizacionesPorEstado || []}
      cotizacionesPorVendedor={cotizacionesPorVendedor || []}
      stockPorEstado={stockPorEstado || []}
      stockPorMarca={stockPorMarca || []}
      infraccionesPorMes={infraccionesPorMes || []}
      servicePosventaInicial={servicePosventa || { oportunidades: 0, contactadas: 0, pct_contactadas: 0, con_ot: 0 }}
    />
  );
}
