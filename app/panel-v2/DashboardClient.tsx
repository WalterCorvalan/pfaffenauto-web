"use client";

import { useState } from "react";
import { Target, LayoutDashboard, EyeOff, Eye, FileText, Receipt, Calculator } from "lucide-react";
import CockpitCeoTab from "./CockpitCeoTab";
import DashboardGeneralTab from "./DashboardGeneralTab";
import Link from "next/link";

interface Props {
  miNombre: string; esAdmin: boolean; gananciasOcultas: boolean;
  revenuePorMoneda: Record<string, number>;
  ventasDelMes: number; operacionesDelMes: number;
  stockDisponible: number; stockReservado: number; stockSenado: number; stockVendido: number; stockEnPreparacion: number;
  clientesSinContactar: number;
  cuotasPagarPorMoneda: Record<string, number>;
  saldos: { moneda: string; total: number }[];
  recordatoriosHoy: number; alertasPendientes: number; cotizacionesActivas: number;
  expedientesActivos: number; comisionesPendientes: number; infraccionesPendientes: number; pedidosActivos: number;
  diaDelMes: number; diasEnElMes: number;
  ranking: { vendedor_id: string; nombre: string; ventas_equivalentes: number; consignaciones: number }[];
  gananciaPorMoneda: Record<string, number>;
  consignacionesDelMes: number; ventasMesAnterior: number;
  cierreMesAnterior: { autos: number; mejorVendedor: string | null; multasArs: number };
  calificaciones: { promedio: number | null; distribucion: number[]; pedidasSinResponder: number; total: number };
  gestoriaPorMoneda: Record<string, number>;
  gananciaPorMes: { mes: string; monto: number }[];
  resumenAnual: { anio: number; autos: number; usd: number }[];
  tuOperacion: { ventas: number; usd: number; consignacionesAno: number };
  clientesIngresadosHoy: number; clientesUltimos7dias: number; canalTop: string | null;
  eventosProximos: { id: string; titulo: string; fecha: string }[];
  vencidos: number; venceHoy: number; venceProx7d: number;
  ingresosPorMoneda: Record<string, number>; egresosPorMoneda: Record<string, number>; netoPorMoneda: Record<string, number>;
  topIngresos: Record<string, number>; topEgresos: Record<string, number>;
  cuentas: { id: string; nombre: string; moneda: string; saldo_inicial: number }[];
  visitasHoy: { id: string; nombre_cliente: string; vehiculo_marca: string | null; vehiculo_modelo: string | null; horario_visita: string | null }[];
  pedidosConMatch: { id: string; marca: string; modelo: string; nombre_cliente: string }[];
  ultimasOperaciones: { id: string; vehiculo_marca: string; vehiculo_modelo: string; comprador_nombre: string | null; precio_venta: number; moneda_venta: string; estado: string; fecha_cierre: string | null; vendedorNombre: string }[];
}

export default function DashboardClient(props: Props) {
  const [tab, setTab] = useState<"cockpit" | "general">(props.esAdmin ? "cockpit" : "general");
  const [ocultarMontos, setOcultarMontos] = useState(props.gananciasOcultas);
  const oculto = ocultarMontos || props.gananciasOcultas;
  const hoyLabel = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Hola, {props.miNombre}</h1>
          <p className="text-sm text-slate-400 capitalize">Bienvenido, <span className="font-bold text-slate-500 dark:text-slate-300">{props.miNombre}</span> · {hoyLabel}</p>
        </div>
        <button onClick={() => setOcultarMontos((v) => !v)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
          {ocultarMontos ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} {ocultarMontos ? "Mostrar montos" : "Ocultar montos"}
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/panel-v2/expedientes" className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"><FileText className="w-3.5 h-3.5" /> Nuevo boleto</Link>
        <Link href="/panel-v2/cobros" className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"><Receipt className="w-3.5 h-3.5" /> Nuevo recibo</Link>
        <Link href="/panel-v2/presupuestos?nuevo=1" className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"><Calculator className="w-3.5 h-3.5" /> Nuevo presupuesto</Link>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10">
        {props.esAdmin && (
          <button onClick={() => setTab("cockpit")} className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === "cockpit" ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            <Target className="w-4 h-4" /> Cockpit CEO
          </button>
        )}
        <button onClick={() => setTab("general")} className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === "general" ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <LayoutDashboard className="w-4 h-4" /> Dashboard general
        </button>
      </div>

      {tab === "cockpit" && props.esAdmin ? (
        <CockpitCeoTab
          miNombre={props.miNombre}
          ocultarMontos={oculto}
          diaDelMes={props.diaDelMes}
          diasEnElMes={props.diasEnElMes}
          ventasDelMes={props.ventasDelMes}
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
          topIngresos={props.topIngresos}
          topEgresos={props.topEgresos}
          cuentas={props.cuentas}
          visitasHoy={props.visitasHoy}
          pedidosConMatch={props.pedidosConMatch}
          ultimasOperaciones={props.ultimasOperaciones}
        />
      )}
    </div>
  );
}
