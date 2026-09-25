import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { puedeVerModulo } from "@/lib/panel/permisosModulos";
import ReportesClient from "./ReportesClient";

export const metadata = { title: "Reportes y Análisis | Pfaffen Cars" };

export default async function ReportesPage() {
  const supabase = await createClient();
  // Mismo hallazgo que ya se corrigió en Finanzas (auditoría del 24/9,
  // permisos #18): por URL directa cualquier usuario logueado entraba
  // igual, el ítem del sidebar solo se ocultaba visualmente.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/panel/login");
  if (!(await puedeVerModulo(supabase, user.id, "reportes"))) redirect("/panel");

  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
  const desde = mesActual;
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);

  const { data: miPerfil } = await supabase.from("perfiles").select("id, nombre, roles, ganancias_ocultas").eq("id", user.id).single();
  const puedeVerFinanzas = (miPerfil?.roles?.includes("admin") || miPerfil?.roles?.includes("finanzas")) ?? false;

  const [
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
    { data: topClientes },
    { data: clientesPorVendedor },
    { data: cotizacionesResumen },
    { data: cotizacionesPorEstado },
    { data: cotizacionesPorVendedor },
    { data: stockPorEstado },
    { data: stockPorMarca },
    { data: infraccionesPorMes },
    { data: servicePosventa },
    { data: consultasVsVentas },
    { data: composicionVentas },
    { data: ventasPorOrigenRaw },
  ] = await Promise.all([
    supabase.rpc("ranking_ventas", { p_desde: desde, p_hasta: hasta }),
    supabase.from("premios_consignaciones").select("*").order("orden"),
    supabase.from("v_reportes_ranking_velocidad").select("*"),
    supabase.from("v_reportes_operaciones_por_vendedor").select("*"),
    supabase.from("v_reportes_origen_leads").select("*"),
    supabase.from("v_reportes_embudo_comercial").select("*"),
    supabase.from("v_reportes_expedientes_resumen").select("*").single(),
    supabase.from("v_reportes_expedientes_por_estado").select("*"),
    // Estos 3 muestran plata real (ganancia de infracciones, facturación de
    // taller, montos por cliente) -- antes se pedían siempre y el gate
    // puedeVerFinanzas solo decidía si ReportesClient los RENDERIZABA,
    // pero como client component los recibe todos como props, ya habían
    // viajado en el HTML/payload a cualquier usuario logueado (hallazgo de
    // auditoría). Mismo criterio que finanzas/page.tsx: se corta el fetch
    // acá, no solo el render.
    puedeVerFinanzas ? supabase.from("v_reportes_infracciones_resumen").select("*").single() : Promise.resolve({ data: null }),
    puedeVerFinanzas ? supabase.from("v_reportes_taller_facturacion").select("*").single() : Promise.resolve({ data: null }),
    supabase.from("v_reportes_ventas_por_mes").select("*").limit(12),
    puedeVerFinanzas ? supabase.from("v_reportes_top_clientes").select("*") : Promise.resolve({ data: [] }),
    supabase.from("v_reportes_clientes_por_vendedor").select("*"),
    supabase.from("v_reportes_cotizaciones_resumen").select("*").single(),
    supabase.from("v_reportes_cotizaciones_por_estado").select("*"),
    supabase.from("v_reportes_cotizaciones_por_vendedor").select("*"),
    supabase.from("v_reportes_stock_por_estado").select("*"),
    supabase.from("v_reportes_stock_por_marca").select("*"),
    supabase.from("v_reportes_infracciones_por_mes").select("*").limit(12),
    supabase.from("v_reportes_service_posventa").select("*").single(),
    supabase.from("v_reportes_consultas_vs_ventas").select("*").limit(20),
    supabase.from("v_reportes_composicion_ventas").select("*").single(),
    supabase.from("ventas").select("vehiculo_id, vehiculos(origen, marca)").eq("estado", "cerrada").gte("fecha_cierre", desde).lte("fecha_cierre", hasta),
  ]);

  // Ventas por origen y por marca salen de la misma consulta (una sola
  // vuelta a "ventas" filtrada por el mes elegido) -- antes "por marca"
  // venía de una vista (v_reportes_ventas_por_marca) sin parámetro de
  // fecha, así que no cambiaba nada al navegar de mes.
  type VentaConVehiculo = { vehiculos: { origen: string; marca: string } | { origen: string; marca: string }[] | null };
  const vehiculoDeVenta = (v: VentaConVehiculo) => (Array.isArray(v.vehiculos) ? v.vehiculos[0] : v.vehiculos);

  const ventasPorOrigen = Object.entries(
    (ventasPorOrigenRaw || []).reduce((acc: Record<string, number>, v: VentaConVehiculo) => {
      const origen = vehiculoDeVenta(v)?.origen || "Sin dato";
      acc[origen] = (acc[origen] || 0) + 1;
      return acc;
    }, {})
  ).map(([origen, cantidad]) => ({ origen, cantidad }));

  const ventasPorMarca = Object.entries(
    (ventasPorOrigenRaw || []).reduce((acc: Record<string, number>, v: VentaConVehiculo) => {
      const marca = vehiculoDeVenta(v)?.marca || "Sin dato";
      acc[marca] = (acc[marca] || 0) + 1;
      return acc;
    }, {})
  ).map(([marca, ventas_ponderadas]) => ({ marca, ventas_ponderadas }));

  return (
    <ReportesClient
      miId={miPerfil?.id || ""}
      miNombre={miPerfil?.nombre || ""}
      soyAdmin={miPerfil?.roles?.includes("admin") ?? false}
      soyFinanzas={miPerfil?.roles?.includes("finanzas") ?? false}
      soyVentas={miPerfil?.roles?.includes("ventas") ?? false}
      gananciasOcultas={miPerfil?.ganancias_ocultas ?? false}
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
      consultasVsVentas={consultasVsVentas || []}
      composicionVentas={composicionVentas || { total_cerradas: 0, con_financiacion: 0, pct_financiadas: 0, con_seguro: 0, pct_seguro: 0, con_permuta: 0, pct_permuta: 0 }}
      ventasPorOrigenInicial={ventasPorOrigen}
    />
  );
}
