"use client";

import { useMemo, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, Clock, CheckCircle2, Building2, Search, HandCoins } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { fmt } from "./shared";

const COLOR_CUENTA = ["#e11d48", "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#a855f7", "#64748b"];
const COLOR_CUOTAS = { vencidas: "#e11d48", porVencer: "#f59e0b", enFecha: "#10b981" };

interface Operacion {
  id: string; tipo: "Venta" | "Seña"; numero: string; fecha: string | null;
  vehiculo: string; sucursal: string; persona: string; monto: number; moneda: string; documento: string | null;
}

export default function ResumenTab({
  cuentas, totalPorMoneda, ingresosTotales, egresosTotales, pendientesCobrarStats,
  saldosACobrarPorMoneda, cajaPorSucursal, historialOperaciones, setTab,
}: {
  cuentas: any[];
  totalPorMoneda: Record<string, number>;
  ingresosTotales: Record<string, number>;
  egresosTotales: Record<string, number>;
  pendientesCobrarStats: { vencidas: number; porVencer: number; enFecha: number };
  saldosACobrarPorMoneda: Record<string, number>;
  cajaPorSucursal: { nombre: string; ingresos: Record<string, number>; saldosACobrar: Record<string, number> }[];
  historialOperaciones: Operacion[];
  setTab: (t: string) => void;
}) {
  const [busquedaOp, setBusquedaOp] = useState("");
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

  return (
    <div className="space-y-5">
      {/* Hero: saldo total por moneda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {["ARS", "USD"].map((m) => (
          <div key={m} className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-sm bg-gradient-to-br ${m === "USD" ? "from-emerald-600 to-emerald-700" : "from-rose-600 to-rose-700"}`}>
            <Wallet className="w-24 h-24 absolute -right-4 -bottom-4 opacity-10" />
            <p className={`text-[10px] font-bold uppercase tracking-widest ${m === "USD" ? "text-emerald-100" : "text-rose-100"}`}>Total en {m} — todas las cajas</p>
            <p className="text-3xl font-black mt-1">{fmt(totalPorMoneda[m] || 0, m)}</p>
          </div>
        ))}
      </div>

      {/* Flujo del mes + saldos a cobrar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Ingresos Efectivos (mes)</p>
          {Object.keys(ingresosTotales).length === 0 ? <p className="text-xl font-black mt-1">$ 0</p> : Object.entries(ingresosTotales).map(([m, v]) => <p key={m} className="text-xl font-black mt-1">{fmt(v, m)}</p>)}
          <p className="text-[10px] text-slate-400 mt-1">Suma de Ventas y Señas cobradas</p>
        </div>
        <div className="rounded-2xl p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Egresos Totales (mes)</p>
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
                    {o.documento ? <Link href={o.documento} className="text-rose-600 hover:underline font-bold">Ver</Link> : "—"}
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
