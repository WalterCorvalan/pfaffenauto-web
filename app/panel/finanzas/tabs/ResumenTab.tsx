"use client";

import { useMemo, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, Clock, CheckCircle2, Building2, Search, HandCoins, CarFront, Receipt, Landmark } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { fmt, porMoneda, netoOperatoriaAreaPorMoneda, ingresosEgresosOperatoriaAreaPorMoneda, zonaEquilibrio, CLASE_ZONA_CARD, type ZonaSemaforo } from "./shared";
import { useRentabilidadPorVehiculo } from "./useRentabilidadPorVehiculo";
import InfoTooltip from "@/components/panel/InfoTooltip";

const COLOR_CUENTA = ["#e11d48", "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#a855f7", "#64748b"];
const COLOR_CUOTAS = { vencidas: "#e11d48", porVencer: "#f59e0b", enFecha: "#10b981" };

interface Operacion {
  id: string; tipo: "Venta" | "Seña"; numero: string; fecha: string | null;
  vehiculo: string; sucursal: string; persona: string; monto: number; moneda: string; documento: string | null;
}

// Semáforo financiero / punto de equilibrio (pedido de la reunión del
// 22/9): rojo por debajo del equilibrio, amarillo en el equilibrio (banda
// del 100-110%, no un punto exacto -- con montos reales nunca da justo),
// verde con ganancia, azul al duplicar el equilibrio (el color de marca,
// "se exceden las expectativas"). La barra usa el mismo color, llenándose
// hasta 100% = 2x el equilibrio (o sea, 50% de la barra = equilibrio).
// La zona en sí la calcula zonaEquilibrio() (shared.ts, única fuente de
// verdad, reusada también en las tarjetas de "Números clave") -- acá solo
// se agrega el % de barra y el label de este componente puntual.
function zonaEquilibrioDetalle(ingresos: number, equilibrio: number): { zona: ZonaSemaforo; pct: number; label: string } {
  const zona = zonaEquilibrio(ingresos, equilibrio);
  if (equilibrio <= 0) return { zona, pct: 0, label: "Sin gastos fijos/variables cargados este mes" };
  const pct = Math.min(100, Math.round((ingresos / equilibrio / 2) * 100));
  const label = zona === "rojo" ? "Por debajo del punto de equilibrio" : zona === "amarillo" ? "En el punto de equilibrio" : zona === "verde" ? "Con ganancia" : "Duplicó el punto de equilibrio";
  return { zona, pct, label };
}

const ZONA_TEXTO: Record<ZonaSemaforo, string> = {
  rojo: "text-rose-600 dark:text-rose-400",
  amarillo: "text-amber-600 dark:text-amber-400",
  verde: "text-emerald-600 dark:text-emerald-400",
  azul: "text-[#0145F2] dark:text-sky-300",
};
const ZONA_BARRA: Record<ZonaSemaforo, string> = {
  rojo: "bg-rose-500",
  amarillo: "bg-amber-500",
  verde: "bg-emerald-500",
  azul: "bg-[#0145F2]",
};

function SemaforoPuntoEquilibrio({ ingresosTotales, puntoEquilibrioPorMoneda }: { ingresosTotales: Record<string, number>; puntoEquilibrioPorMoneda: Record<string, number> }) {
  const monedas = Array.from(new Set([...Object.keys(ingresosTotales), ...Object.keys(puntoEquilibrioPorMoneda)]));
  if (monedas.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {monedas.map((m) => {
        const ingresos = ingresosTotales[m] || 0;
        const equilibrio = puntoEquilibrioPorMoneda[m] || 0;
        const { zona, pct, label } = zonaEquilibrioDetalle(ingresos, equilibrio);
        const color = { bg: CLASE_ZONA_CARD[zona], texto: ZONA_TEXTO[zona], barra: ZONA_BARRA[zona] };
        return (
          <div key={m} className={`border rounded-2xl p-4 ${color.bg}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Punto de equilibrio ({m})</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${color.texto}`}>{label}</span>
            </div>
            <div className="w-full h-2.5 bg-white/60 dark:bg-black/20 rounded-full overflow-hidden mb-1.5">
              <div className={`h-full rounded-full transition-all ${color.barra}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{fmt(ingresos, m)} de ingresos · equilibrio en {fmt(equilibrio, m)}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function ResumenTab({
  cuentas, totalPorMoneda, ingresosTotales, egresosTotales, pendientesCobrarStats,
  saldosACobrarPorMoneda, cajaPorSucursal, historialOperaciones, puntoEquilibrioPorMoneda, setTab,
  ventas, movimientos, vehiculosDisponiblesFull, gastosFijosTotales, gastosVariablesTotales,
}: {
  cuentas: any[];
  totalPorMoneda: Record<string, number>;
  ingresosTotales: Record<string, number>;
  egresosTotales: Record<string, number>;
  pendientesCobrarStats: { vencidas: number; porVencer: number; enFecha: number };
  saldosACobrarPorMoneda: Record<string, number>;
  cajaPorSucursal: { nombre: string; ingresos: Record<string, number>; saldosACobrar: Record<string, number> }[];
  historialOperaciones: Operacion[];
  puntoEquilibrioPorMoneda: Record<string, number>;
  setTab: (t: string) => void;
  ventas: any[];
  movimientos: any[];
  vehiculosDisponiblesFull: any[];
  gastosFijosTotales: Record<string, number>;
  gastosVariablesTotales: Record<string, number>;
}) {
  const [busquedaOp, setBusquedaOp] = useState("");

  // Números clave de la empresa, todos juntos y con tooltip de origen (pedido
  // del dueño: "si vamos separando costos de gastos, de ventas, de señas,
  // de consignación, de valor acumulado por vehículos... va a ser todo más
  // fácil"). Cada tarjeta reusa un cálculo que YA existe en otro lado del
  // módulo (Rentabilidad por vehículo, Operatoria del área, punto de
  // equilibrio) -- no se inventa una fórmula nueva acá.
  const { totalesPorMoneda: rentabilidadVehiculoPorMoneda } = useRentabilidadPorVehiculo(ventas);
  const operatoriaAreaPorMoneda = useMemo(() => netoOperatoriaAreaPorMoneda(movimientos), [movimientos]);
  const { ingresos: ingresosOperatoriaPorMoneda, egresos: egresosOperatoriaPorMoneda } = ingresosEgresosOperatoriaAreaPorMoneda(movimientos);
  const valorStockPorMoneda = useMemo(() => porMoneda(vehiculosDisponiblesFull, "moneda_venta", "precio_venta"), [vehiculosDisponiblesFull]);
  // Indicador simple (pedido del dueño, 23/9): solo informativo, no afecta
  // ningún cálculo de plata de acá -- todavía no hay una regla de negocio
  // clara sobre qué debería hacer un vehículo sin facturar en Rentabilidad
  // o patrimonio, así que se muestra aparte en vez de inventar una.
  const vehiculosSinFacturar = useMemo(() => vehiculosDisponiblesFull.filter((v: { facturado?: boolean }) => !v.facturado), [vehiculosDisponiblesFull]);
  const rentabilidadGeneralPorMoneda = useMemo(() => {
    const monedas = new Set([...Object.keys(rentabilidadVehiculoPorMoneda), ...Object.keys(operatoriaAreaPorMoneda)]);
    const map: Record<string, number> = {};
    monedas.forEach((m) => { map[m] = (rentabilidadVehiculoPorMoneda[m]?.ganancia || 0) + (operatoriaAreaPorMoneda[m] || 0); });
    return map;
  }, [rentabilidadVehiculoPorMoneda, operatoriaAreaPorMoneda]);
  const generadoVentasSenasPorMoneda = useMemo(() => {
    const hoy = new Date(); const inicioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
    const delMes = historialOperaciones.filter((o) => (o.fecha || "").slice(0, 7) === inicioMes);
    return porMoneda(delMes, "moneda", "monto");
  }, [historialOperaciones]);
  const monedasNumeros = Array.from(new Set([
    ...Object.keys(rentabilidadGeneralPorMoneda), ...Object.keys(valorStockPorMoneda), ...Object.keys(generadoVentasSenasPorMoneda),
    ...Object.keys(gastosFijosTotales), ...Object.keys(gastosVariablesTotales), ...Object.keys(operatoriaAreaPorMoneda),
  ]));
  const netoTotalPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    Array.from(new Set([...Object.keys(ingresosTotales), ...Object.keys(egresosTotales)])).forEach((m) => {
      map[m] = (ingresosTotales[m] || 0) - (egresosTotales[m] || 0);
    });
    return map;
  }, [ingresosTotales, egresosTotales]);
  const operacionesFiltradas = useMemo(() => {
    const q = busquedaOp.trim().toLowerCase();
    if (!q) return historialOperaciones;
    return historialOperaciones.filter((o) => [o.numero, o.vehiculo, o.persona, o.sucursal].join(" ").toLowerCase().includes(q));
  }, [historialOperaciones, busquedaOp]);
  const monedas = Array.from(new Set([...Object.keys(ingresosTotales), ...Object.keys(egresosTotales), ...Object.keys(totalPorMoneda)]));
  const totalCuotas = pendientesCobrarStats.vencidas + pendientesCobrarStats.porVencer + pendientesCobrarStats.enFecha;
  const cuotasData = [
    { key: "vencidas", label: "Vencidas", n: pendientesCobrarStats.vencidas },
    { key: "porVencer", label: "Por vencer", n: pendientesCobrarStats.porVencer },
    { key: "enFecha", label: "En fecha", n: pendientesCobrarStats.enFecha },
  ].filter((d) => d.n > 0);

  const maxSaldoCuenta = Math.max(1, ...cuentas.map((c) => Number(c.saldo) || 0));

  // Evolución de ventas mes a mes (últimos 6 meses), separando Ventas de
  // Señas dentro de la misma barra apilada, por moneda — arma la serie a
  // partir del mismo historialOperaciones ya unificado que alimenta la
  // tabla de abajo, sin pegarle otra vez a la base.
  const evolucionPorMoneda = useMemo(() => {
    const ahora = new Date();
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - (5 - i), 1);
      return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("es-AR", { month: "short" }) };
    });
    const porMoneda: Record<string, { mes: string; Ventas: number; Señas: number }[]> = {};
    historialOperaciones.forEach((o) => {
      if (!o.fecha) return;
      const idx = meses.findIndex((m) => m.key === o.fecha!.slice(0, 7));
      if (idx === -1) return;
      if (!porMoneda[o.moneda]) porMoneda[o.moneda] = meses.map((m) => ({ mes: m.label, Ventas: 0, Señas: 0 }));
      porMoneda[o.moneda][idx][o.tipo === "Venta" ? "Ventas" : "Señas"] += o.monto;
    });
    return porMoneda;
  }, [historialOperaciones]);

  return (
    <div className="space-y-5">
      {/* Hero: saldo total por moneda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {["ARS", "USD"].map((m) => (
          <div key={m} className={`relative overflow-hidden rounded-2xl p-5 shadow-sm border ${m === "USD" ? "text-white bg-gradient-to-br from-emerald-600 to-emerald-700 border-transparent" : "bg-gradient-to-br from-sky-400 via-white to-sky-400 border-sky-200"}`}>
            <Wallet className={`w-24 h-24 absolute -right-4 -bottom-4 ${m === "USD" ? "opacity-10" : "opacity-[0.08] text-sky-700"}`} />
            <p className={`text-[10px] font-bold uppercase tracking-widest ${m === "USD" ? "text-emerald-100" : "text-sky-700"}`}>Total en {m} — todas las cajas</p>
            <p className={`text-3xl font-black mt-1 ${m === "USD" ? "" : "text-slate-800"}`}>{fmt(totalPorMoneda[m] || 0, m)}</p>
          </div>
        ))}
      </div>

      {/* Números clave de la empresa: cada tarjeta trae su ⓘ con de dónde
          sale el número, para no tener que adivinar ni ir a buscarlo a otro
          tab. Reusa cálculos que ya existen (Rentabilidad por vehículo,
          Operatoria del área, punto de equilibrio) -- no inventa fórmulas nuevas. */}
      {monedasNumeros.length > 0 && (
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Números clave de la empresa</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {monedasNumeros.map((m) => {
              // Zona ventas vs gastos: la misma para Rentabilidad general y
              // Generado en ventas+señas (ventas+señas es el ingreso, gastos
              // fijos+variables el egreso), para que ese par se lea
              // consistente.
              const zonaVentasGastos = zonaEquilibrio(generadoVentasSenasPorMoneda[m] || 0, (gastosFijosTotales[m] || 0) + (gastosVariablesTotales[m] || 0));
              const zonaOperatoria = zonaEquilibrio(ingresosOperatoriaPorMoneda[m] || 0, egresosOperatoriaPorMoneda[m] || 0);
              // Zona propia de "Fijos vs variables": compara los dos gastos
              // ENTRE SÍ, no contra las ventas -- en cero o iguales (sin
              // diferencia entre uno y otro) es el equilibrio, va amarillo.
              const zonaFijoVariable = zonaEquilibrio(gastosVariablesTotales[m] || 0, gastosFijosTotales[m] || 0);
              return (
              <div key={m} className="contents">
                <div className={`rounded-2xl p-4 border ${CLASE_ZONA_CARD[zonaVentasGastos]}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> Rentabilidad general ({m})
                    <InfoTooltip texto="Ganancia por vehículos vendidos (Rentabilidad por vehículo) + neto de gestoría/honorarios/trámites (Operatoria del área). No incluye gastos fijos ni variables de la agencia." />
                  </p>
                  <p className="text-xl font-black mt-1">{fmt(rentabilidadGeneralPorMoneda[m] || 0, m)}</p>
                </div>
                <div className={`rounded-2xl p-4 border ${CLASE_ZONA_CARD.verde}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center">
                    <CarFront className="w-3 h-3 mr-1" /> Valor de stock ({m})
                    <InfoTooltip texto="Suma del precio de venta publicado de los vehículos con estado Disponible en Stock. No incluye señados ni vendidos." />
                  </p>
                  <p className="text-xl font-black mt-1">{fmt(valorStockPorMoneda[m] || 0, m)}</p>
                </div>
                <div className={`rounded-2xl p-4 border ${CLASE_ZONA_CARD[zonaVentasGastos]}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center">
                    <HandCoins className="w-3 h-3 mr-1" /> Generado en ventas + señas ({m})
                    <InfoTooltip texto="Suma de ventas cerradas y señas registradas este mes. No implica que ya esté cobrado en caja (eso lo ves en Ingresos Efectivos)." />
                  </p>
                  <p className="text-xl font-black mt-1">{fmt(generadoVentasSenasPorMoneda[m] || 0, m)}</p>
                </div>
                <div className={`rounded-2xl p-4 border ${CLASE_ZONA_CARD[zonaFijoVariable]}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center">
                    <Landmark className="w-3 h-3 mr-1" /> Gastos fijos / variables ({m})
                    <InfoTooltip texto="Fijos: alquiler, sueldos, seguros, impuestos. Variables: comisiones, marketing, gestoría, insumos. Mismas categorías que usa el punto de equilibrio, del mes en curso." />
                  </p>
                  <p className="text-sm font-bold mt-1">Fijos <span className="font-black">{fmt(gastosFijosTotales[m] || 0, m)}</span></p>
                  <p className="text-sm font-bold">Variables <span className="font-black">{fmt(gastosVariablesTotales[m] || 0, m)}</span></p>
                </div>
                <div className={`rounded-2xl p-4 border sm:col-span-2 lg:col-span-1 ${CLASE_ZONA_CARD[zonaOperatoria]}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center">
                    <Receipt className="w-3 h-3 mr-1" /> Ingresos extra / consignación ({m})
                    <InfoTooltip texto="Neto de movimientos que no vienen de una venta de vehículo: gestoría, multas, honorarios, trámites, verificaciones (mismo total que Operatoria del área)." />
                  </p>
                  <p className="text-xl font-black mt-1">{fmt(operatoriaAreaPorMoneda[m] || 0, m)}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {vehiculosSinFacturar.length > 0 && (
        <Link href="/panel/facturacion" className="block rounded-2xl p-4 border bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 hover:opacity-90 transition-opacity">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" /> Vehículos en stock sin facturar
          </p>
          <p className="text-xl font-black mt-1 text-amber-800 dark:text-amber-200">{vehiculosSinFacturar.length}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Solo informativo — no afecta ningún cálculo de Finanzas. Ver en Facturación →</p>
        </Link>
      )}

      <SemaforoPuntoEquilibrio ingresosTotales={ingresosTotales} puntoEquilibrioPorMoneda={puntoEquilibrioPorMoneda} />

      {/* Flujo del mes + saldos a cobrar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Ingresos Efectivos (mes)</p>
          {Object.keys(ingresosTotales).length === 0 ? <p className="text-xl font-black mt-1">$ 0</p> : Object.entries(ingresosTotales).map(([m, v]) => <p key={m} className="text-xl font-black mt-1">{fmt(v, m)}</p>)}
          {/* La leyenda decía "Suma de Ventas y Señas cobradas", pero
              ingresosTotales suma TODO movimiento de tipo ingreso aprobado
              (cobro de cuota, "Otro", etc.), no solo Venta/Seña -- el que sí
              está acotado a ventas+señas es "Generado en ventas + señas"
              más arriba (historialOperaciones). Corregido para no confundir
              esta tarjeta con una validación cruzada de esa otra. */}
          <p className="text-[10px] text-slate-400 mt-1">Todo ingreso de caja aprobado (ventas, señas, cobros de cuota, otros)</p>
        </div>
        <div className="rounded-2xl p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0145F2] dark:text-[#5b8dff]">Egresos Totales (mes)</p>
          {Object.keys(egresosTotales).length === 0 ? <p className="text-xl font-black mt-1">$ 0</p> : Object.entries(egresosTotales).map(([m, v]) => <p key={m} className="text-xl font-black mt-1">{fmt(v, m)}</p>)}
          <p className="text-[10px] text-slate-400 mt-1">Gastos manuales + categorías</p>
        </div>
        <div className="rounded-2xl p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Neto del mes</p>
          {Object.keys(netoTotalPorMoneda).length === 0 ? <p className="text-xl font-black mt-1">$ 0</p> : Object.entries(netoTotalPorMoneda).map(([m, v]) => <p key={m} className={`text-xl font-black mt-1 ${v >= 0 ? "" : "text-rose-600"}`}>{fmt(v, m)}</p>)}
          <p className="text-[10px] text-slate-400 mt-1">Ingresos menos egresos</p>
        </div>
        <div className="rounded-2xl p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><HandCoins className="w-3 h-3" /> Saldos a Cobrar (total)</p>
          {Object.keys(saldosACobrarPorMoneda).length === 0 ? <p className="text-xl font-black mt-1">$ 0</p> : Object.entries(saldosACobrarPorMoneda).map(([m, v]) => <p key={m} className="text-xl font-black mt-1">{fmt(v, m)}</p>)}
          <p className="text-[10px] text-slate-400 mt-1">Plata en la calle por operaciones señadas</p>
        </div>
      </div>

      {/* Control de caja por sucursal */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Control de caja por sucursal (este mes)</p>
        {cajaPorSucursal.length === 0 ? (
          <p className="text-xs text-slate-400 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-center">Sin sucursales cargadas.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cajaPorSucursal.map((s) => (
              <div key={s.nombre} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
                <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">{s.nombre}</p>
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-white/5">
                  <span className="text-slate-500">Ingresos Efectivos:</span>
                  <span className="font-mono font-bold text-emerald-600">{Object.keys(s.ingresos).length === 0 ? "$ 0" : Object.entries(s.ingresos).map(([m, v]) => fmt(v, m)).join(" · ")}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-500">Saldos a Cobrar:</span>
                  <span className="font-mono font-bold text-indigo-600">{Object.keys(s.saldosACobrar).length === 0 ? "$ 0" : Object.entries(s.saldosACobrar).map(([m, v]) => fmt(v, m)).join(" · ")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cuentas: barras de proporción */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">💰 Cajas — dinero disponible</p>
        <div className="space-y-2.5">
          {cuentas.map((c, i) => {
            const saldo = Number(c.saldo) || 0;
            const pct = Math.max(2, Math.round((Math.abs(saldo) / maxSaldoCuenta) * 100));
            return (
              <button key={c.id} onClick={() => setTab("movimientos")} className="w-full text-left group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-slate-400" /> {c.nombre} <span className="text-[10px] font-normal text-slate-400">{c.tipo} · {c.moneda}</span></span>
                  <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-200">{fmt(saldo, c.moneda)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full transition-all group-hover:opacity-80" style={{ width: `${pct}%`, backgroundColor: COLOR_CUENTA[i % COLOR_CUENTA.length] }} />
                </div>
              </button>
            );
          })}
          {cuentas.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Todavía no creaste ninguna caja.</p>}
        </div>
      </div>

      {/* Actividad: ingresos vs egresos por moneda */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">📊 Actividad acumulada — ingresos vs egresos</p>
        {monedas.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Sin movimientos todavía.</p>
        ) : (
          <div className={`grid grid-cols-1 ${monedas.length > 1 ? "sm:grid-cols-2" : ""} gap-4`}>
            {monedas.map((m) => {
              const data = [{ name: m, Ingresos: ingresosTotales[m] || 0, Egresos: egresosTotales[m] || 0 }];
              const neto = (ingresosTotales[m] || 0) - (egresosTotales[m] || 0);
              return (
                <div key={m} className="h-[170px] flex flex-col">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">{m}</span>
                    <span className={`text-xs font-black flex items-center gap-1 ${neto >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {neto >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />} Neto {fmt(neto, m)}
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-slate-100 dark:text-white/10" />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" hide />
                      <Tooltip
                        formatter={(value: any, name: any) => [fmt(Number(value), m), name]}
                        contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }}
                      />
                      <Bar dataKey="Ingresos" fill="#10b981" radius={[6, 6, 6, 6]} barSize={28} />
                      <Bar dataKey="Egresos" fill="#e11d48" radius={[6, 6, 6, 6]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Evolución de ventas mes a mes (Ventas + Señas), últimos 6 meses */}
      {Object.keys(evolucionPorMoneda).length > 0 && (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">📈 Evolución de ventas — últimos 6 meses</p>
          <div className={`grid grid-cols-1 ${Object.keys(evolucionPorMoneda).length > 1 ? "sm:grid-cols-2" : ""} gap-4`}>
            {Object.entries(evolucionPorMoneda).map(([m, serie]) => {
              const totalMesActual = serie[serie.length - 1].Ventas + serie[serie.length - 1].Señas;
              const totalMesAnterior = serie[serie.length - 2].Ventas + serie[serie.length - 2].Señas;
              const variacion = totalMesAnterior > 0 ? Math.round(((totalMesActual - totalMesAnterior) / totalMesAnterior) * 100) : totalMesActual > 0 ? 100 : 0;
              return (
                <div key={m} className="h-[220px] flex flex-col">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">{m}</span>
                    {totalMesAnterior > 0 || totalMesActual > 0 ? (
                      <span className={`text-xs font-black flex items-center gap-1 ${variacion >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {variacion >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />} {variacion >= 0 ? "+" : ""}{variacion}% vs. mes anterior
                      </span>
                    ) : null}
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serie} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/10" />
                      <XAxis dataKey="mes" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} className="text-slate-400" />
                      <YAxis hide />
                      <Tooltip
                        formatter={(value: any, name: any) => [fmt(Number(value), m), name]}
                        contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }}
                      />
                      <Bar dataKey="Ventas" stackId="a" fill="#0145F2" radius={[0, 0, 0, 0]} barSize={22} />
                      <Bar dataKey="Señas" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cuotas por cobrar: donut + detalle */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">🧮 Cuotas por cobrar — estado</p>
        {totalCuotas === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4 flex items-center justify-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No hay cuotas pendientes.</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={cuotasData} dataKey="n" nameKey="label" innerRadius={28} outerRadius={44} paddingAngle={2} stroke="none">
                    {cuotasData.map((d) => <Cell key={d.key} fill={COLOR_CUOTAS[d.key as keyof typeof COLOR_CUOTAS]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-lg font-black text-slate-800 dark:text-white">{totalCuotas}</span>
                <span className="text-[8px] font-bold uppercase text-slate-400">total</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 gap-1.5">
              <button onClick={() => setTab("cuotas")} className="flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5">
                <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Vencidas</span>
                <span className="text-sm font-black">{pendientesCobrarStats.vencidas}</span>
              </button>
              <button onClick={() => setTab("cuotas")} className="flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5">
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Por vencer (7 días)</span>
                <span className="text-sm font-black">{pendientesCobrarStats.porVencer}</span>
              </button>
              <button onClick={() => setTab("cuotas")} className="flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5">
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> En fecha</span>
                <span className="text-sm font-black">{pendientesCobrarStats.enFecha}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historial de Operaciones: ventas + señas unificado */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-b border-slate-100 dark:border-white/5">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Historial de Operaciones</p>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={busquedaOp} onChange={(e) => setBusquedaOp(e.target.value)} placeholder="Buscar cliente, auto o N°..." className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-rose-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/5">
                <th className="py-2 px-4">Op N° / Fecha</th>
                <th className="py-2 px-4">Tipo</th>
                <th className="py-2 px-4">Vehículo / Sucursal</th>
                <th className="py-2 px-4">Cliente / Vendedor</th>
                <th className="py-2 px-4 text-right">Monto</th>
                <th className="py-2 px-4 text-center">Documento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {operacionesFiltradas.slice(0, 100).map((o) => (
                <tr key={`${o.tipo}-${o.id}`} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="py-2 px-4">
                    <p className="font-mono font-bold text-slate-700 dark:text-slate-200">{o.numero}</p>
                    <p className="text-slate-400">{o.fecha ? new Date(`${o.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—"}</p>
                  </td>
                  <td className="py-2 px-4"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${o.tipo === "Venta" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{o.tipo}</span></td>
                  <td className="py-2 px-4">
                    <p className="font-bold text-slate-700 dark:text-slate-200">{o.vehiculo}</p>
                    <p className="text-slate-400">{o.sucursal}</p>
                  </td>
                  <td className="py-2 px-4 text-slate-600 dark:text-slate-300">{o.persona}</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-slate-800 dark:text-white">{fmt(o.monto, o.moneda)}</td>
                  <td className="py-2 px-4 text-center">
                    {o.documento ? <Link href={o.documento} className="text-[#0145F2] hover:underline font-bold">Ver</Link> : "—"}
                  </td>
                </tr>
              ))}
              {operacionesFiltradas.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-slate-400 italic">Sin operaciones que coincidan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
