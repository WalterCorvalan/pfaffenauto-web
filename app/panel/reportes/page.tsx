import { redirect } from "next/navigation";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { puedeVerModulo } from "@/lib/panel/permisosModulos";
import ReportesClient from "./ReportesClient";

export const metadata = { title: "Reportes y Análisis | Pfaffen Cars" };

// Las 4 vistas "_por_vendedor"/ranking comparan a TODOS los vendedores entre
// sí (ranking, cotizaciones, clientes, operaciones) -- son SECURITY DEFINER
// (hallazgo del Advisor de Supabase, 28/9) y antes tenían SELECT concedido a
// "authenticated", así que cualquier usuario logueado podía leerlas directo
// por API/devtools sin pasar por el gate de puedeVerModulo("reportes") de
// esta página. Se le sacó ese grant a "authenticated"/"anon" (ver migración)
// y ahora se piden con este cliente de service role -- el gate server-side
// de abajo (línea ~19) es la única puerta, mismo criterio que puedeVerFinanzas
// ya usa para infracciones/taller/top clientes.
const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

export default async function ReportesPage() {
  const supabase = await createClient();
  // Mismo hallazgo que ya se corrigió en Finanzas (auditoría del 24/9,
  // permisos #18): por URL directa cualquier usuario logueado entraba
  // igual, el ítem del sidebar solo se ocultaba visualmente.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/panel/login");
  if (!(await puedeVerModulo(supabase, user.id, "reportes"))) redirect("/panel");

  // Hora de Argentina (UTC-3, sin horario de verano), no la del servidor: en Vercel el
  // servidor corre en UTC y entre las 21:00 y las 24:00 de Argentina ya "era mañana" --
  // el día, y el último día del mes, saltaban 3 horas antes. Se arma una fecha al
  // mediodía local con el día de Argentina para que getDate/getMonth/toISOString
  // den el mismo día en el servidor (UTC) y en una PC local.
  const ahoraAR = new Date(Date.now() - 3 * 3600000);
  const hoy = new Date(ahoraAR.getUTCFullYear(), ahoraAR.getUTCMonth(), ahoraAR.getUTCDate(), 12);
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
  const desde = mesActual;
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);
  // Ventana de 3 meses completos ANTES del mes actual, para calcular la
  // tasa de conversión histórica de cada vendedor (pipeline -> venta) que
  // alimenta la proyección del mes. Separada del mes en curso a propósito:
  // mezclar datos todavía "en progreso" del mes actual con el promedio
  // histórico infla la tasa con oportunidades que ni siquiera tuvieron
  // tiempo de convertir.
  const desde3m = `${new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1).getFullYear()}-${String(new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1).getMonth() + 1).padStart(2, "0")}-01`;
  const hasta3m = new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().slice(0, 10);

  const { data: miPerfil } = await supabase.from("perfiles").select("id, nombre, roles, ganancias_ocultas").eq("id", user.id).maybeSingle();
  const puedeVerFinanzas = (miPerfil?.roles?.includes("admin") || miPerfil?.roles?.includes("finanzas") || miPerfil?.roles?.includes("director")) ?? false;

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
    { data: senasActivas },
    { data: senasHist },
    { data: presupuestosMes },
    { data: presupuestosHist },
    { data: visitasMes },
    { data: visitasHist },
    { data: rankingHist },
  ] = await Promise.all([
    supabase.rpc("ranking_ventas", { p_desde: desde, p_hasta: hasta }),
    supabase.from("premios_consignaciones").select("*").order("orden"),
    supabaseAdmin.from("v_reportes_ranking_velocidad").select("*"),
    supabaseAdmin.from("v_reportes_operaciones_por_vendedor").select("*"),
    supabase.from("v_reportes_origen_leads").select("*"),
    supabase.from("v_reportes_embudo_comercial").select("*"),
    supabase.from("v_reportes_expedientes_resumen").select("*").maybeSingle(),
    supabase.from("v_reportes_expedientes_por_estado").select("*"),
    // Estos 3 muestran plata real (ganancia de infracciones, facturación de
    // taller, montos por cliente) -- antes se pedían siempre y el gate
    // puedeVerFinanzas solo decidía si ReportesClient los RENDERIZABA,
    // pero como client component los recibe todos como props, ya habían
    // viajado en el HTML/payload a cualquier usuario logueado (hallazgo de
    // auditoría). Mismo criterio que finanzas/page.tsx: se corta el fetch
    // acá, no solo el render.
    puedeVerFinanzas ? supabase.from("v_reportes_infracciones_resumen").select("*").maybeSingle() : Promise.resolve({ data: null }),
    puedeVerFinanzas ? supabase.from("v_reportes_taller_facturacion").select("*").maybeSingle() : Promise.resolve({ data: null }),
    // 24 filas = 12 meses x 2 monedas (la vista trae una fila por mes Y moneda; con limit(12) solo se veían ~6 meses)
    supabase.from("v_reportes_ventas_por_mes").select("*").limit(24),
    puedeVerFinanzas ? supabase.from("v_reportes_top_clientes").select("*") : Promise.resolve({ data: [] }),
    supabaseAdmin.from("v_reportes_clientes_por_vendedor").select("*"),
    supabase.from("v_reportes_cotizaciones_resumen").select("*").maybeSingle(),
    supabase.from("v_reportes_cotizaciones_por_estado").select("*"),
    supabaseAdmin.from("v_reportes_cotizaciones_por_vendedor").select("*"),
    supabase.from("v_reportes_stock_por_estado").select("*"),
    supabase.from("v_reportes_stock_por_marca").select("*"),
    supabase.from("v_reportes_infracciones_por_mes").select("*").limit(12),
    supabase.from("v_reportes_service_posventa").select("*").maybeSingle(),
    supabase.from("v_reportes_consultas_vs_ventas").select("*").limit(20),
    supabase.from("v_reportes_composicion_ventas").select("*").maybeSingle(),
    supabase.from("ventas").select("vehiculo_id, vehiculos(origen, marca)").eq("estado", "cerrada").gte("fecha_cierre", desde).lte("fecha_cierre", hasta),
    // Pipeline abierto del mes en curso, por vendedor (para "Proyección del
    // mes" en ReportesClient) -- ver comentario arriba sobre por qué el
    // histórico usa una ventana separada de 3 meses.
    supabase.from("senas").select("vendedor_id").eq("estado", "Activa"),
    supabase.from("senas").select("vendedor_id").gte("created_at", desde3m).lte("created_at", hasta3m),
    supabase.from("presupuestos").select("vendedor_id").eq("precio_confirmado", true).gte("fecha", desde).lte("fecha", hasta),
    supabase.from("presupuestos").select("vendedor_id").eq("precio_confirmado", true).gte("fecha", desde3m).lte("fecha", hasta3m),
    supabase.from("visitas").select("vendedor_id").in("estado", ["Pendiente", "Confirmada"]).gte("fecha_visita", desde).lte("fecha_visita", hasta),
    supabase.from("visitas").select("vendedor_id").gte("fecha_visita", desde3m).lte("fecha_visita", hasta3m),
    supabase.rpc("ranking_ventas", { p_desde: desde3m, p_hasta: hasta3m }),
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

  // Proyección del mes por vendedor: ventas ya cerradas + (pipeline abierto
  // actual × tasa de conversión histórica de ESE vendedor en los últimos 3
  // meses). No es un modelo de IA ni una predicción "inteligente" -- es una
  // cuenta simple y auditable a propósito, para que un vendedor pueda
  // entender de dónde sale el número en vez de confiar a ciegas.
  const contarPorVendedor = (filas: { vendedor_id: string | null }[]) =>
    (filas || []).reduce((acc: Record<string, number>, f) => {
      if (f.vendedor_id) acc[f.vendedor_id] = (acc[f.vendedor_id] || 0) + 1;
      return acc;
    }, {});

  const senasActivasPorVendedor = contarPorVendedor(senasActivas || []);
  const senasHistPorVendedor = contarPorVendedor(senasHist || []);
  const presupuestosMesPorVendedor = contarPorVendedor(presupuestosMes || []);
  const presupuestosHistPorVendedor = contarPorVendedor(presupuestosHist || []);
  const visitasMesPorVendedor = contarPorVendedor(visitasMes || []);
  const visitasHistPorVendedor = contarPorVendedor(visitasHist || []);
  const ventasHistPorVendedor = (rankingHist || []).reduce((acc: Record<string, number>, r: any) => {
    acc[r.vendedor_id] = Number(r.ventas_equivalentes) || 0;
    return acc;
  }, {} as Record<string, number>);

  const proyeccionVentas = (ranking || []).map((r: any) => {
    const pipelineActual = (senasActivasPorVendedor[r.vendedor_id] || 0) + (presupuestosMesPorVendedor[r.vendedor_id] || 0) + (visitasMesPorVendedor[r.vendedor_id] || 0);
    const oportunidadesHist = (senasHistPorVendedor[r.vendedor_id] || 0) + (presupuestosHistPorVendedor[r.vendedor_id] || 0) + (visitasHistPorVendedor[r.vendedor_id] || 0);
    const ventasHist = ventasHistPorVendedor[r.vendedor_id] || 0;
    const tasaConversion = oportunidadesHist > 0 ? ventasHist / oportunidadesHist : 0;
    const ventasCerradasMes = Number(r.ventas_equivalentes) || 0;
    return {
      vendedor_id: r.vendedor_id,
      nombre: r.nombre,
      ventas_cerradas_mes: ventasCerradasMes,
      pipeline_actual: pipelineActual,
      tasa_conversion_pct: Math.round(tasaConversion * 1000) / 10,
      proyeccion: Math.round((ventasCerradasMes + pipelineActual * tasaConversion) * 10) / 10,
    };
  });

  return (
    <ReportesClient
      miId={miPerfil?.id || ""}
      miNombre={miPerfil?.nombre || ""}
      soyAdmin={miPerfil?.roles?.includes("admin") ?? false}
      soyFinanzas={miPerfil?.roles?.includes("finanzas") ?? false}
      soyDirector={miPerfil?.roles?.includes("director") ?? false}
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
      proyeccionVentasInicial={proyeccionVentas}
    />
  );
}
