"use client";

import { useState } from "react";
import { Target, LayoutDashboard, EyeOff, Eye, FileText, Receipt, Calculator, ChevronLeft, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PanelSkeletonDashboard } from "@/components/panel/PanelSkeleton";
import { Crossfade } from "@/components/ui/movimiento";

// Dynamic import (sin SSR) -- CockpitCeoTab y DashboardGeneralTab usan
// recharts (pesado) y nunca se muestran los dos a la vez (son un tab), así
// que cargar los dos de una en el bundle inicial del Dashboard (la página
// más visitada del panel) era peso muerto para la mitad de los usuarios.
const CockpitCeoTab = dynamic(() => import("./CockpitCeoTab"), { ssr: false, loading: () => <PanelSkeletonDashboard /> });
const DashboardGeneralTab = dynamic(() => import("./DashboardGeneralTab"), { ssr: false, loading: () => <PanelSkeletonDashboard /> });

interface Props {
  miNombre: string; esAdmin: boolean; puedeVerFinanzas: boolean; gananciasOcultas: boolean;
  revenuePorMoneda: Record<string, number>;
  ventasDelMes: number; operacionesDelMes: number; objetivoVentasMensual: number | null;
  stockDisponible: number; stockReservado: number; stockSenado: number; stockVendido: number; stockEnPreparacion: number;
  clientesSinContactar: number;
  leadsSinAtender: number;
  cuotasPagarPorMoneda: Record<string, number>;
  saldos: { moneda: string; total: number }[];
  recordatoriosHoy: number; alertasPendientes: number; cotizacionesActivas: number;
  expedientesActivos: number; comisionesPendientes: number; infraccionesPendientes: number; pedidosActivos: number;
  diaDelMes: number; diasEnElMes: number;
  mesSeleccionado: { key: string; label: string; anterior: string; siguiente: string | null; esActual: boolean };
  ranking: { vendedor_id: string; nombre: string; ventas_equivalentes: number; consignaciones: number }[];
  gananciaPorMoneda: Record<string, number>;
  consignacionesDelMes: number; ventasMesAnterior: number;
  cierreMesAnterior: { autos: number; mejorVendedor: string | null; multasArs: number };
  calificaciones: { promedio: number | null; distribucion: number[]; pedidasSinResponder: number; total: number };
  gestoriaPorMoneda: Record<string, number>;
  gananciaPorMes: { mes: string; monto: number; montoArs: number }[];
  ventasPorMes12: { mes: string; cantidad: number }[];
  proyeccionCaja: {
    saldos: { moneda: string; total: number }[];
    aCobrarPorMoneda: Record<string, number>; aPagarPorMoneda: Record<string, number>; resultadoPorMoneda: Record<string, number>;
    topEntrada: { id: string; label: string; monto: number; moneda: string } | null;
    topSalidas: { id: string; label: string; monto: number; moneda: string }[];
    cantidadEntradas: number; cantidadSalidas: number;
  };
  miPerformance: {
    ventas: number; consignaciones: number;
    tierActual: string | null; tierEmoji: string | null; ventasParaSiguiente: number | null; siguienteTier: string | null;
    premioSiguiente: { faltan: number; meta: number; premioUsd: number | null } | null;
  };
  cuotasPagarResumen: { totalPorMoneda: Record<string, number>; cantidadDelMes: number; vencidas: number };
  resumenAnual: { anio: number; autos: number; usd: number; ars: number }[];
  tuOperacion: { ventas: number; usd: number; ars: number; consignacionesAno: number };
  clientesIngresadosHoy: number; clientesUltimos7dias: number; canalTop: string | null;
  eventosProximos: { id: string; titulo: string; fecha: string }[];
  vencidos: number; venceHoy: number; venceProx7d: number;
  ingresosPorMoneda: Record<string, number>; egresosPorMoneda: Record<string, number>; netoPorMoneda: Record<string, number>;
  gastosFijosTotales: Record<string, number>; gastosVariablesTotales: Record<string, number>;
  topIngresos: Record<string, number>; topEgresos: Record<string, number>;
  cuentas: { id: string; nombre: string; moneda: string; saldo: number }[];
  visitasHoy: { id: string; nombre_cliente: string; vehiculo_marca: string | null; vehiculo_modelo: string | null; horario_visita: string | null }[];
  pedidosConMatch: { id: string; marca: string; modelo: string; nombre_cliente: string }[];
  ultimasOperaciones: { id: string; vehiculo_marca: string; vehiculo_modelo: string; comprador_nombre: string | null; precio_venta: number; moneda_venta: string; estado: string; fecha_cierre: string | null; vendedorNombre: string }[];
  stockEstancado: number; tareasVencidas: number; postventaPendiente: number;
  reclamosResumen: { abiertos: number; enCurso: number; estancados: number; lista: { id: string; titulo: string; clienteNombre: string | null; prioridad: string; estado: string }[] };
  ticketPromedioPorMoneda: Record<string, number>;
  top10Gastos: { concepto: string; categoria: string; fecha: string; monto: number; moneda: string }[];
  gastosAtipicos: { categoria: string; montoMes: number; promedioHistorico: number; moneda: string }[];
}

export default function DashboardClient(props: Props) {
  const [tab, setTab] = useState<"cockpit" | "general">(props.esAdmin ? "cockpit" : "general");
  const [ocultarMontos, setOcultarMontos] = useState(props.gananciasOcultas);
  const oculto = ocultarMontos || props.gananciasOcultas;
  const hoyLabel = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="relative p-6 max-w-6xl mx-auto space-y-5">
      {/* Luz ambiente del dashboard -- mismo recurso visual que ya usan las
          páginas públicas (blob difuminado del color de marca), acá metido
          detrás del contenido sin afectar el layout (absolute + pointer-events-none). */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#0145F2]/5 dark:bg-[#0145F2]/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Hola, {props.miNombre}</h1>
          <p className="text-sm text-slate-400 first-letter:uppercase">Bienvenido, <span className="font-bold text-slate-500 dark:text-slate-300">{props.miNombre}</span> · {hoyLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de mes: lo "mensual" (ventas, ranking, caja, gastos) sigue al mes elegido; lo de hoy (stock, saldos, urgentes) no cambia. */}
          <div className="flex items-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg">
            <Link href={`/panel?mes=${props.mesSeleccionado.anterior}`} aria-label="Mes anterior" className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"><ChevronLeft className="w-4 h-4" /></Link>
            <span className="px-2 text-xs font-bold first-letter:uppercase text-slate-700 dark:text-slate-200 min-w-[110px] text-center">{props.mesSeleccionado.label}</span>
            {props.mesSeleccionado.siguiente
              ? <Link href={props.mesSeleccionado.siguiente ? `/panel?mes=${props.mesSeleccionado.siguiente}` : "/panel"} aria-label="Mes siguiente" className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"><ChevronRight className="w-4 h-4" /></Link>
              : <span className="p-2 text-slate-300 dark:text-slate-600"><ChevronRight className="w-4 h-4" /></span>}
          </div>
          {!props.mesSeleccionado.esActual && (
            <Link href="/panel" className="px-3 py-2 text-xs font-bold bg-[#0145F2] text-white rounded-lg hover:bg-[#0138c9] transition-colors">Volver a este mes</Link>
          )}
        <button onClick={() => setOcultarMontos((v) => !v)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
          {ocultarMontos ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} {ocultarMontos ? "Mostrar montos" : "Ocultar montos"}
        </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/panel/expedientes" className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"><FileText className="w-3.5 h-3.5" /> Nuevo boleto</Link>
        <Link href="/panel/cobros" className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"><Receipt className="w-3.5 h-3.5" /> Nuevo recibo</Link>
        <Link href="/panel/presupuestos?nuevo=1" className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"><Calculator className="w-3.5 h-3.5" /> Nuevo presupuesto</Link>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10">
        {props.esAdmin && (
          <button onClick={() => setTab("cockpit")} className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === "cockpit" ? "border-[#0145F2] text-[#0145F2]" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            <Target className="w-4 h-4" /> Cockpit CEO
          </button>
        )}
        <button onClick={() => setTab("general")} className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === "general" ? "border-[#0145F2] text-[#0145F2]" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <LayoutDashboard className="w-4 h-4" /> Dashboard general
        </button>
      </div>

      <Crossfade id={tab === "cockpit" && props.esAdmin ? "cockpit" : "general"}>
      {tab === "cockpit" && props.esAdmin ? (
        <CockpitCeoTab
          miNombre={props.miNombre}
          ocultarMontos={oculto}
          diaDelMes={props.diaDelMes}
          diasEnElMes={props.diasEnElMes}
          ventasDelMes={props.ventasDelMes}
          objetivoVentasMensual={props.objetivoVentasMensual}
          ventasMesAnterior={props.ventasMesAnterior}
          gananciaPorMoneda={props.gananciaPorMoneda}
          consignacionesDelMes={props.consignacionesDelMes}
          ranking={props.ranking}
          cierreMesAnterior={props.cierreMesAnterior}
          calificaciones={props.calificaciones}
          gestoriaPorMoneda={props.gestoriaPorMoneda}
          gananciaPorMes={props.gananciaPorMes}
          resumenAnual={props.resumenAnual}
          tuOperacion={props.tuOperacion}
        />
      ) : (
        <DashboardGeneralTab
          esAdmin={props.esAdmin}
          puedeVerFinanzas={props.puedeVerFinanzas}
          ocultarMontos={oculto}
          revenuePorMoneda={props.revenuePorMoneda}
          ventasDelMes={props.ventasDelMes}
          operacionesDelMes={props.operacionesDelMes}
          stockDisponible={props.stockDisponible}
          stockReservado={props.stockReservado}
          stockSenado={props.stockSenado}
          stockVendido={props.stockVendido}
          stockEnPreparacion={props.stockEnPreparacion}
          clientesSinContactar={props.clientesSinContactar}
          leadsSinAtender={props.leadsSinAtender}
          cuotasPagarPorMoneda={props.cuotasPagarPorMoneda}
          saldos={props.saldos}
          recordatoriosHoy={props.recordatoriosHoy}
          alertasPendientes={props.alertasPendientes}
          cotizacionesActivas={props.cotizacionesActivas}
          expedientesActivos={props.expedientesActivos}
          comisionesPendientes={props.comisionesPendientes}
          infraccionesPendientes={props.infraccionesPendientes}
          pedidosActivos={props.pedidosActivos}
          ranking={props.ranking}
          clientesIngresadosHoy={props.clientesIngresadosHoy}
          canalTop={props.canalTop}
          eventosProximos={props.eventosProximos}
          vencidos={props.vencidos}
          venceHoy={props.venceHoy}
          venceProx7d={props.venceProx7d}
          ingresosPorMoneda={props.ingresosPorMoneda}
          egresosPorMoneda={props.egresosPorMoneda}
          netoPorMoneda={props.netoPorMoneda}
          gastosFijosTotales={props.gastosFijosTotales}
          gastosVariablesTotales={props.gastosVariablesTotales}
          topIngresos={props.topIngresos}
          topEgresos={props.topEgresos}
          cuentas={props.cuentas}
          visitasHoy={props.visitasHoy}
          pedidosConMatch={props.pedidosConMatch}
          ultimasOperaciones={props.ultimasOperaciones}
          ventasPorMes12={props.ventasPorMes12}
          proyeccionCaja={props.proyeccionCaja}
          miPerformance={props.miPerformance}
          cuotasPagarResumen={props.cuotasPagarResumen}
          stockEstancado={props.stockEstancado}
          tareasVencidas={props.tareasVencidas}
          postventaPendiente={props.postventaPendiente}
          reclamosResumen={props.reclamosResumen}
          ticketPromedioPorMoneda={props.ticketPromedioPorMoneda}
          top10Gastos={props.top10Gastos}
          gastosAtipicos={props.gastosAtipicos}
        />
      )}
      </Crossfade>
    </div>
  );
}
