import { createClient } from "@/lib/supabase2/server";
import DashboardClient from "./DashboardClient";

export const metadata = { title: "Dashboard | Pfaffen Autos" };

function margenPorMoneda(expedientes: any[], desde: string, hasta: string) {
  const map: Record<string, number> = {};
  (expedientes || []).forEach((e: any) => {
    const venta = Array.isArray(e.venta) ? e.venta[0] : e.venta;
    if (!venta || venta.estado !== "cerrada" || venta.fecha_cierre < desde || venta.fecha_cierre > hasta) return;
    if (e.precio_propietario_moneda !== venta.moneda_venta) return; // nunca restar monedas distintas
    map[venta.moneda_venta] = (map[venta.moneda_venta] || 0) + (Number(venta.precio_venta) - Number(e.precio_propietario));
  });
  return map;
}

export default async function PanelV2Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: miPerfil } = await supabase.from("perfiles").select("id, nombre, roles, ganancias_ocultas").eq("id", user.id).single();
  const esAdmin = miPerfil?.roles?.includes("admin") ?? false;

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);
  const hoyIso = hoy.toISOString().slice(0, 10);
  const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().slice(0, 10);
  const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().slice(0, 10);
  const inicioAno = `${hoy.getFullYear()}-01-01`;
  const hace7dias = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const hace12meses = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1).toISOString().slice(0, 10);
  const en7dias = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const inicioMesAnteriorMismoMesAnoPasado = `${hoy.getFullYear() - 1}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
  const finMesMismoMesAnoPasado = `${hoy.getFullYear() - 1}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(finMes.split("-")[2])}`;

  const [
    { data: ventasMes },
    { data: stockPorEstado },
    { count: clientesSinContactar },
    { data: cuotasPagarMes },
    { data: saldos },
    { data: recordatoriosHoy },
    { count: alertasPendientes },
    { count: cotizacionesActivas },
    { count: expedientesActivos },
    { count: comisionesPendientes },
    { count: infraccionesPendientes },
    { count: pedidosActivosCount },
    { data: ranking },
    { data: expedientesConMargen },
    { count: consignacionesDelMes },
    { count: ventasMesAnterior },
    // --- extras Cockpit CEO ---
    { data: rankingMesAnterior },
    { data: infraccionesMesAnterior },
    { data: ventasConCalificacion },
    { data: extraCobradoMes },
    { data: ventasUltimos12Meses },
    { data: ventasPorAno },
    { data: ventasVendedorAno },
    { count: consignacionesVendedorAno },
    // --- extras Dashboard general ---
    { data: clientesIngresados },
    { count: clientesUltimos7diasCount },
    { data: eventosProximos },
    { data: cuotasCobrarVencimientos },
    { data: expedientesVencimientos },
    { data: cuentasConSaldo },
    { data: movimientosMes },
    { data: visitasHoy },
    { data: pedidosConMatch },
    { data: ultimasOperaciones },
  ] = await Promise.all([
    supabase.from("ventas").select("precio_venta, moneda_venta, estado").gte("fecha_cierre", inicioMes).lte("fecha_cierre", finMes),
    supabase.from("vehiculos").select("estado"),
    supabase.from("clientes").select("id", { count: "exact", head: true }).eq("pipeline_stage", "sin_contactar"),
    supabase.from("cuotas_pagar_agencia").select("monto, moneda").gte("vencimiento", inicioMes).lte("vencimiento", finMes).eq("pagada", false),
    supabase.rpc("saldos_totales_por_moneda"),
    supabase.from("venta_recordatorios").select("id").eq("fecha_vencimiento", hoyIso).eq("estado", "pendiente"),
    supabase.from("alertas").select("id", { count: "exact", head: true }).eq("destinatario_id", user.id).eq("leida", false),
    supabase.from("cotizaciones").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
    supabase.from("expedientes").select("id", { count: "exact", head: true }).eq("archivado", false),
    supabase.from("comisiones").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
    supabase.from("infracciones").select("id", { count: "exact", head: true }).eq("estado", "Pendiente"),
    supabase.from("pedidos").select("id", { count: "exact", head: true }).eq("estado", "activo"),
    supabase.rpc("ranking_ventas", { p_desde: inicioMes, p_hasta: finMes }),
    supabase.from("expedientes").select("precio_propietario, precio_propietario_moneda, venta:venta_id(precio_venta, moneda_venta, fecha_cierre, estado)").not("precio_propietario", "is", null),
    supabase.from("vehiculos").select("id", { count: "exact", head: true }).eq("propio_agencia", false).gte("created_at", inicioMes),
    supabase.from("ventas").select("id", { count: "exact", head: true }).eq("estado", "cerrada").gte("fecha_cierre", inicioMesAnteriorMismoMesAnoPasado).lte("fecha_cierre", finMesMismoMesAnoPasado),
    supabase.rpc("ranking_ventas", { p_desde: inicioMesAnterior, p_hasta: finMesAnterior }),
    supabase.from("infracciones").select("ganancia_ars, estado, fecha").gte("fecha", inicioMesAnterior).lte("fecha", finMesAnterior),
    supabase.from("ventas").select("calificacion_puntaje, vendedor_id, calificacion_pedida").eq("estado", "cerrada").gte("fecha_cierre", inicioMes).lte("fecha_cierre", finMes),
    supabase.from("ventas").select("extra_cobrado_monto, extra_cobrado_moneda").eq("estado", "cerrada").gte("fecha_cierre", inicioMes).lte("fecha_cierre", finMes).not("extra_cobrado_monto", "is", null),
    supabase.from("expedientes").select("precio_propietario, precio_propietario_moneda, venta:venta_id(precio_venta, moneda_venta, fecha_cierre, estado)").not("precio_propietario", "is", null).gte("venta.fecha_cierre", hace12meses),
    supabase.from("ventas").select("id, precio_venta, moneda_venta, fecha_cierre, estado").eq("estado", "cerrada").gte("fecha_cierre", `${hoy.getFullYear() - 2}-01-01`),
    supabase.from("ventas").select("id, precio_venta, moneda_venta").eq("estado", "cerrada").eq("vendedor_id", user.id).gte("fecha_cierre", inicioAno),
    supabase.from("vehiculos").select("id", { count: "exact", head: true }).eq("propio_agencia", false).gte("created_at", inicioAno),
    // dashboard general
    supabase.from("clientes").select("id, created_at, canal_ingreso").gte("created_at", `${hoyIso}T00:00:00`),
    supabase.from("clientes").select("id", { count: "exact", head: true }).gte("created_at", `${hace7dias}T00:00:00`),
    supabase.from("eventos_calendario").select("id, titulo, fecha").eq("responsable_id", user.id).gte("fecha", hoyIso).lte("fecha", en7dias).order("fecha"),
    supabase.from("cuotas_cobrar_clientes").select("vencimiento").eq("cobrada", false),
    supabase.from("expedientes").select("vencimiento").eq("archivado", false).not("vencimiento", "is", null),
    supabase.from("cuentas").select("id, nombre, moneda, saldo_inicial").eq("activa", true),
    supabase.from("movimientos_caja").select("tipo, monto, moneda, tipo_movimiento, cuenta_id").is("deleted_at", null).eq("estado", "aprobado").gte("fecha", inicioMes).lte("fecha", finMes),
    supabase.from("visitas").select("id, nombre_cliente, vehiculo_marca, vehiculo_modelo, horario_visita").eq("estado", "Confirmada").eq("fecha_visita", hoyIso),
    supabase.from("pedidos").select("id, marca, modelo, nombre_cliente, vehiculo_match_id, created_at").eq("estado", "activo").not("vehiculo_match_id", "is", null),
    supabase.from("ventas").select("id, vehiculo_marca, vehiculo_modelo, comprador_nombre, precio_venta, moneda_venta, estado, vendedor_id, fecha_cierre").order("created_at", { ascending: false }).limit(8),
  ]);

  const perfilesMap: Record<string, string> = {};
  (await supabase.from("perfiles").select("id, nombre")).data?.forEach((p: any) => { perfilesMap[p.id] = p.nombre; });

  const gananciaPorMoneda = margenPorMoneda(expedientesConMargen || [], inicioMes, finMes);
  const gananciaMesAnteriorInfracciones: Record<string, number> = {};
  (infraccionesMesAnterior || []).forEach((i: any) => { if (i.estado === "Pagado") gananciaMesAnteriorInfracciones.ARS = (gananciaMesAnteriorInfracciones.ARS || 0) + Number(i.ganancia_ars || 0); });

  const ventasCerradas = (ventasMes || []).filter((v) => v.estado === "cerrada");
  const revenuePorMoneda: Record<string, number> = {};
  ventasCerradas.forEach((v) => { revenuePorMoneda[v.moneda_venta] = (revenuePorMoneda[v.moneda_venta] || 0) + Number(v.precio_venta); });

  const cuotasPagarPorMoneda: Record<string, number> = {};
  (cuotasPagarMes || []).forEach((c) => { cuotasPagarPorMoneda[c.moneda] = (cuotasPagarPorMoneda[c.moneda] || 0) + Number(c.monto); });

  const conteoEstado: Record<string, number> = {};
  (stockPorEstado || []).forEach((v) => { conteoEstado[v.estado] = (conteoEstado[v.estado] || 0) + 1; });

  // Calificaciones
  const calificadas = (ventasConCalificacion || []).filter((v: any) => v.calificacion_puntaje != null);
  const distribucionEstrellas = [1, 2, 3, 4, 5].map((n) => calificadas.filter((c: any) => c.calificacion_puntaje === n).length);
  const promedioCalificacion = calificadas.length > 0 ? calificadas.reduce((a: number, c: any) => a + c.calificacion_puntaje, 0) / calificadas.length : null;
  const pedidasSinResponder = (ventasConCalificacion || []).filter((v: any) => v.calificacion_pedida && v.calificacion_puntaje == null).length;

  // Gestoría/transferencias del mes (extra cobrado al comprador)
  const gestoriaPorMoneda: Record<string, number> = {};
  (extraCobradoMes || []).forEach((v: any) => { gestoriaPorMoneda[v.extra_cobrado_moneda] = (gestoriaPorMoneda[v.extra_cobrado_moneda] || 0) + Number(v.extra_cobrado_monto); });

  // Ganancia últimos 12 meses (por mes, USD priorizado ya que es la moneda dominante de venta)
  const gananciaPorMes: { mes: string; monto: number }[] = [];
  {
    const porMes = new Map<string, number>();
    (ventasUltimos12Meses || []).forEach((e: any) => {
      const venta = Array.isArray(e.venta) ? e.venta[0] : e.venta;
      if (!venta || venta.moneda_venta !== "USD" || e.precio_propietario_moneda !== "USD") return;
      const mes = venta.fecha_cierre?.slice(0, 7);
      if (!mes) return;
      porMes.set(mes, (porMes.get(mes) || 0) + (Number(venta.precio_venta) - Number(e.precio_propietario)));
    });
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      gananciaPorMes.push({ mes: d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }), monto: Math.round(porMes.get(key) || 0) });
    }
  }

  // Resumen anual (2 años atrás, año pasado, año actual)
  const resumenAnual = [hoy.getFullYear() - 2, hoy.getFullYear() - 1, hoy.getFullYear()].map((anio) => {
    const delAno = (ventasPorAno || []).filter((v: any) => v.fecha_cierre?.startsWith(String(anio)));
    const usd = delAno.filter((v: any) => v.moneda_venta === "USD").reduce((a: number, v: any) => a + Number(v.precio_venta), 0);
    return { anio, autos: delAno.length, usd: Math.round(usd) };
  });

  // Tu operación (vendedor logueado, en el año)
  const misVentasAno = ventasVendedorAno || [];
  const misVentasUsd = misVentasAno.filter((v: any) => v.moneda_venta === "USD").reduce((a: number, v: any) => a + Number(v.precio_venta), 0);

  // Clientes que ingresaron
  const canalConteo: Record<string, number> = {};
  (clientesIngresados || []).forEach((c: any) => { canalConteo[c.canal_ingreso || "Otro"] = (canalConteo[c.canal_ingreso || "Otro"] || 0) + 1; });
  const canalTop = Object.entries(canalConteo).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Vencimientos próximos 7 días (cuotas + expedientes)
  const vencidos = [
    ...(cuotasCobrarVencimientos || []).filter((c: any) => c.vencimiento < hoyIso),
    ...(expedientesVencimientos || []).filter((e: any) => e.vencimiento < hoyIso),
  ].length;
  const venceHoy = [
    ...(cuotasCobrarVencimientos || []).filter((c: any) => c.vencimiento === hoyIso),
    ...(expedientesVencimientos || []).filter((e: any) => e.vencimiento === hoyIso),
  ].length;
  const venceProx7d = [
    ...(cuotasCobrarVencimientos || []).filter((c: any) => c.vencimiento > hoyIso && c.vencimiento <= en7dias),
    ...(expedientesVencimientos || []).filter((e: any) => e.vencimiento > hoyIso && e.vencimiento <= en7dias),
  ].length;

  // Cash flow del mes + saldos por cuenta (nunca mezclar moneda)
  const ingresosPorMoneda: Record<string, number> = {};
  const egresosPorMoneda: Record<string, number> = {};
  const topIngresos: Record<string, number> = {};
  const topEgresos: Record<string, number> = {};
  (movimientosMes || []).forEach((m: any) => {
    const destino = m.tipo === "ingreso" ? ingresosPorMoneda : egresosPorMoneda;
    destino[m.moneda] = (destino[m.moneda] || 0) + Number(m.monto);
    const topDestino = m.tipo === "ingreso" ? topIngresos : topEgresos;
    const key = m.tipo_movimiento || "Sin categoría";
    topDestino[key] = (topDestino[key] || 0) + Number(m.monto);
  });
  const netoPorMoneda: Record<string, number> = {};
  ["ARS", "USD"].forEach((m) => { netoPorMoneda[m] = (ingresosPorMoneda[m] || 0) - (egresosPorMoneda[m] || 0); });

  // Saldo por cuenta individual (no solo total) requiere todo el histórico de
  // movimientos por cuenta, no solo el mes — queda para una vista de Reportes.

  return (
    <DashboardClient
      miNombre={miPerfil?.nombre || "Usuario"}
      esAdmin={esAdmin}
      gananciasOcultas={miPerfil?.ganancias_ocultas ?? false}
      revenuePorMoneda={revenuePorMoneda}
      ventasDelMes={ventasCerradas.length}
      operacionesDelMes={(ventasMes || []).length}
      stockDisponible={conteoEstado.disponible || 0}
      stockReservado={conteoEstado.reservado || 0}
      stockSenado={conteoEstado["señado"] || 0}
      stockVendido={conteoEstado.vendido || 0}
      stockEnPreparacion={conteoEstado.en_preparacion || 0}
      clientesSinContactar={clientesSinContactar ?? 0}
      cuotasPagarPorMoneda={cuotasPagarPorMoneda}
      saldos={saldos || []}
      recordatoriosHoy={recordatoriosHoy?.length ?? 0}
      alertasPendientes={alertasPendientes ?? 0}
      cotizacionesActivas={cotizacionesActivas ?? 0}
      expedientesActivos={expedientesActivos ?? 0}
      comisionesPendientes={comisionesPendientes ?? 0}
      infraccionesPendientes={infraccionesPendientes ?? 0}
      pedidosActivos={pedidosActivosCount ?? 0}
      diaDelMes={hoy.getDate()}
      diasEnElMes={Number(finMes.split("-")[2])}
      ranking={ranking || []}
      gananciaPorMoneda={gananciaPorMoneda}
      consignacionesDelMes={consignacionesDelMes ?? 0}
      ventasMesAnterior={ventasMesAnterior ?? 0}
      cierreMesAnterior={{
        autos: rankingMesAnterior?.reduce((a: number, r: any) => a + Number(r.ventas_equivalentes || 0), 0) || 0,
        mejorVendedor: rankingMesAnterior?.[0]?.nombre || null,
        multasArs: gananciaMesAnteriorInfracciones.ARS || 0,
      }}
      calificaciones={{ promedio: promedioCalificacion, distribucion: distribucionEstrellas, pedidasSinResponder, total: calificadas.length }}
      gestoriaPorMoneda={gestoriaPorMoneda}
      gananciaPorMes={gananciaPorMes}
      resumenAnual={resumenAnual}
      tuOperacion={{ ventas: misVentasAno.length, usd: Math.round(misVentasUsd), consignacionesAno: consignacionesVendedorAno ?? 0 }}
      clientesIngresadosHoy={clientesIngresados?.length ?? 0}
      clientesUltimos7dias={clientesUltimos7diasCount ?? 0}
      canalTop={canalTop}
      eventosProximos={eventosProximos || []}
      vencidos={vencidos}
      venceHoy={venceHoy}
      venceProx7d={venceProx7d}
      ingresosPorMoneda={ingresosPorMoneda}
      egresosPorMoneda={egresosPorMoneda}
      netoPorMoneda={netoPorMoneda}
      topIngresos={topIngresos}
      topEgresos={topEgresos}
      cuentas={cuentasConSaldo || []}
      visitasHoy={visitasHoy || []}
      pedidosConMatch={(pedidosConMatch || []).map((p: any) => ({ ...p }))}
      ultimasOperaciones={(ultimasOperaciones || []).map((v: any) => ({ ...v, vendedorNombre: perfilesMap[v.vendedor_id] || "—" }))}
    />
  );
}
