import { createClient } from "@/lib/supabase2/server";
import DashboardClient from "./DashboardClient";

export const metadata = { title: "Dashboard | Pfaffen Autos" };

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

  const [
    { data: ventasMes },
    { data: stockPorEstado },
    { data: clientesSinContactar },
    { data: cuotasPagarMes },
    { data: saldos },
    { data: recordatoriosHoy },
    { count: alertasPendientes },
    { count: cotizacionesActivas },
    { count: expedientesActivos },
    { count: comisionesPendientes },
    { count: infraccionesPendientes },
    { count: pedidosActivos },
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
  ]);

  const ventasCerradas = (ventasMes || []).filter((v) => v.estado === "cerrada");
  const revenuePorMoneda: Record<string, number> = {};
  ventasCerradas.forEach((v) => { revenuePorMoneda[v.moneda_venta] = (revenuePorMoneda[v.moneda_venta] || 0) + Number(v.precio_venta); });

  const cuotasPagarPorMoneda: Record<string, number> = {};
  (cuotasPagarMes || []).forEach((c) => { cuotasPagarPorMoneda[c.moneda] = (cuotasPagarPorMoneda[c.moneda] || 0) + Number(c.monto); });

  const conteoEstado: Record<string, number> = {};
  (stockPorEstado || []).forEach((v) => { conteoEstado[v.estado] = (conteoEstado[v.estado] || 0) + 1; });

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
      clientesSinContactar={clientesSinContactar?.length ?? 0}
      cuotasPagarPorMoneda={cuotasPagarPorMoneda}
      saldos={saldos || []}
      recordatoriosHoy={recordatoriosHoy?.length ?? 0}
      alertasPendientes={alertasPendientes ?? 0}
      cotizacionesActivas={cotizacionesActivas ?? 0}
      expedientesActivos={expedientesActivos ?? 0}
      comisionesPendientes={comisionesPendientes ?? 0}
      infraccionesPendientes={infraccionesPendientes ?? 0}
      pedidosActivos={pedidosActivos ?? 0}
    />
  );
}
