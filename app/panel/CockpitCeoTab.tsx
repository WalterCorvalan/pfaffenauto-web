"use client";

import { useState, useEffect } from "react";
import GerenteChat from "@/components/panel/GerenteChat";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import {
  Sparkles, Send, Loader2, Trophy, TrendingUp, Handshake, DollarSign, FileText,
  Star, Landmark, ClipboardList, Award,
} from "lucide-react";
import { supabase2 } from "@/lib/supabase/client";
import { useRentabilidadPorVehiculo } from "./finanzas/tabs/useRentabilidadPorVehiculo";
import { ingresosEgresosOperatoriaAreaPorMoneda, zonaEquilibrio, CLASE_ZONA_CARD } from "./finanzas/tabs/shared";
import { Cascada } from "@/components/ui/movimiento";

interface RankingFila { vendedor_id: string; nombre: string; ventas_equivalentes: number; consignaciones: number }
interface Props {
  miNombre: string; ocultarMontos: boolean;
  diaDelMes: number; diasEnElMes: number;
  ventasDelMes: number; ventasMesAnterior: number; objetivoVentasMensual: number | null;
  gananciaPorMoneda: Record<string, number>;
  consignacionesDelMes: number;
  ranking: RankingFila[];
  cierreMesAnterior: { autos: number; mejorVendedor: string | null; multasArs: number };
  calificaciones: { promedio: number | null; distribucion: number[]; pedidasSinResponder: number; total: number };
  gestoriaPorMoneda: Record<string, number>;
  gananciaPorMes: { mes: string; monto: number; montoArs: number }[];
  resumenAnual: { anio: number; autos: number; usd: number; ars: number }[];
  tuOperacion: { ventas: number; usd: number; ars: number; consignacionesAno: number };
}


function fmtMoneda(n: number, moneda: string) {
  return moneda === "ARS" ? `$ ${Math.round(n).toLocaleString("es-AR")}` : `${moneda} ${Math.round(n).toLocaleString("es-AR")}`;
}
function MiniStat({ label, valor, sub }: { label: string; valor: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl p-3 bg-white/10">
      <p className="text-lg font-black">{valor}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-indigo-200/70 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function CockpitCeoTab({ miNombre, ocultarMontos, diaDelMes, diasEnElMes, ventasDelMes, ventasMesAnterior, objetivoVentasMensual, consignacionesDelMes, ranking, cierreMesAnterior, calificaciones, gananciaPorMes, resumenAnual, tuOperacion }: Props) {
  const [monedaGanancia, setMonedaGanancia] = useState<"USD" | "ARS">("USD");

  // Reemplaza "Ganancia del mes" (antes solo precio venta − precio
  // propietario, sin restar comisión ni gastos) y "Gestoría/Transferencias"
  // (antes el total cobrado, sin restar gastos del área) por los mismos
  // cálculos ya reales de Finanzas → Análisis y planificación -- mismos
  // hooks/funciones que usan esos tabs, para no tener dos fórmulas de lo
  // mismo desincronizándose entre el Dashboard y Finanzas.
  const [ventasDelMesFin, setVentasDelMesFin] = useState<any[]>([]);
  const [movimientosAreaMes, setMovimientosAreaMes] = useState<any[]>([]);
  useEffect(() => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);
    supabase2
      .from("ventas")
      .select("id, comprador_nombre, vehiculo_marca, vehiculo_modelo, vehiculo_id, precio_venta, moneda_venta, fecha_cierre, estado")
      .eq("estado", "cerrada")
      .gte("fecha_cierre", inicioMes)
      .lte("fecha_cierre", finMes)
      .then(({ data }) => setVentasDelMesFin(data || []));
    supabase2
      .from("movimientos_caja")
      .select("tipo, monto, venta_id, tipo_movimiento, estado, deleted_at, fecha, cuenta:cuentas(moneda)")
      .is("venta_id", null)
      .is("deleted_at", null)
      .eq("estado", "aprobado")
      .gte("fecha", inicioMes)
      .lte("fecha", finMes)
      .then(({ data }) => setMovimientosAreaMes(data || []));
  }, []);
  const { totalesPorMoneda: rentabilidadVehiculoMes } = useRentabilidadPorVehiculo(ventasDelMesFin);
  const { ingresos: ingresosAreaMes, egresos: egresosAreaMes } = ingresosEgresosOperatoriaAreaPorMoneda(movimientosAreaMes);
  const operatoriaAreaMonedas = Array.from(new Set([...Object.keys(ingresosAreaMes), ...Object.keys(egresosAreaMes)]));

  const avancePct = Math.round((diaDelMes / diasEnElMes) * 100);
  const variacionAnual = ventasMesAnterior > 0 ? Math.round(((ventasDelMes - ventasMesAnterior) / ventasMesAnterior) * 100) : null;
  const totalEstrellas = calificaciones.distribucion.reduce((a, b) => a + b, 0) || 1;

  return (
    <Cascada className="space-y-5">
      <GerenteChat />

      <div className="rounded-2xl p-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Cockpit CEO</p>
          <p className="text-lg font-black">Buen día, {miNombre}</p>
          <p className="text-xs text-indigo-200">Día {diaDelMes} de {diasEnElMes}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Avance del mes</p>
          <p className="text-3xl font-black">{avancePct}%</p>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-500/10 dark:to-indigo-500/10 border border-violet-100 dark:border-violet-500/20">
        <p className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5"><Award className="w-4 h-4 text-violet-500" /> Cierre del mes anterior</p>
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Autos vendidos" valor={cierreMesAnterior.autos} />
          <MiniStat label="Mejor vendedor" valor={cierreMesAnterior.mejorVendedor || "—"} />
          <MiniStat label="Ganancia por multas" valor={fmtMoneda(cierreMesAnterior.multasArs, "ARS")} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl p-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 shadow-[0_2px_10px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
          <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1"><TrendingUp className="w-3.5 h-3.5" /> Autos vendidos</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{ventasDelMes}{objetivoVentasMensual ? <span className="text-sm font-bold text-slate-400"> / {objetivoVentasMensual}</span> : null}</p>
          {objetivoVentasMensual ? (
            <>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden mt-2">
                <div className={`h-full rounded-full ${ventasDelMes >= objetivoVentasMensual ? "bg-emerald-500" : "bg-indigo-500"}`} style={{ width: `${Math.min(100, Math.round((ventasDelMes / objetivoVentasMensual) * 100))}%` }} />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{Math.round((ventasDelMes / objetivoVentasMensual) * 100)}% del objetivo mensual</p>
            </>
          ) : (
            variacionAnual !== null && <p className={`text-[11px] mt-1 font-bold ${variacionAnual >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{variacionAnual >= 0 ? "+" : ""}{variacionAnual}% vs mismo mes año anterior</p>
          )}
        </div>
        <div className="rounded-2xl p-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 shadow-[0_2px_10px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
          <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1"><Handshake className="w-3.5 h-3.5" /> Consignaciones del mes</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{consignacionesDelMes}</p>
          <p className="text-[11px] text-slate-400 mt-1">Autos de terceros que ingresaron</p>
        </div>
        <div className="rounded-2xl p-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 shadow-[0_2px_10px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
          <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1"><Trophy className="w-3.5 h-3.5" /> Mejor vendedor</p>
          {/* ranking[0] es solo el primero de la lista, no necesariamente alguien
              con ventas -- si todos están en 0 no hay "mejor vendedor" real que
              mostrar. */}
          <p className="text-lg font-black text-slate-900 dark:text-white truncate">{ranking[0]?.ventas_equivalentes > 0 ? ranking[0].nombre : "—"}</p>
          <p className="text-[11px] text-slate-400 mt-1">{ranking[0]?.ventas_equivalentes > 0 ? `${ranking[0].ventas_equivalentes} venta${ranking[0].ventas_equivalentes === 1 ? "" : "s"}` : "Sin ventas todavía"}</p>
        </div>
      </div>

      {/* Rentabilidad por vehículo: una tarjeta por moneda (antes ARS y USD
          quedaban mezclados en una sola) con semáforo de venta vs costo+
          comisión+gastos de ese mismo vehículo -- mismo criterio que
          "Rentabilidad general" en Finanzas → Resumen. */}
      {Object.keys(rentabilidadVehiculoMes).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(rentabilidadVehiculoMes).map(([moneda, t]) => {
            const zona = zonaEquilibrio(t.precioVenta, t.costo + t.comision + t.gastos);
            return (
              <Link key={moneda} href="/panel/finanzas" className={`rounded-2xl p-4 border transition-colors hover:opacity-90 block ${CLASE_ZONA_CARD[zona]}`}>
                <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1"><DollarSign className="w-3.5 h-3.5" /> Rentabilidad por vehículo ({moneda})</p>
                <p className={`text-2xl font-black text-slate-900 dark:text-white ${ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtMoneda(t.ganancia, moneda)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Venta − costo − comisión − gastos, del mes ({t.cantidad} venta{t.cantidad === 1 ? "" : "s"})</p>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 shadow-[0_2px_10px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-indigo-500" /> Ganancia últimos 12 meses ({monedaGanancia})</p>
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-white/10 rounded-lg p-0.5">
              {(["USD", "ARS"] as const).map((m) => (<button key={m} onClick={() => setMonedaGanancia(m)} className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${monedaGanancia === m ? "bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"}`}>{m}</button>))}
            </div>
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gananciaPorMes.map((g) => ({ mes: g.mes, monto: monedaGanancia === "USD" ? g.monto : g.montoArs }))}>
                <XAxis dataKey="mes" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => new Intl.NumberFormat("es-AR", { notation: "compact" }).format(v)} />
                <Tooltip formatter={(v: any) => [`${monedaGanancia === "USD" ? "USD" : "$"} ${Number(v).toLocaleString("es-AR")}`, "Ganancia"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="monto" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 shadow-[0_2px_10px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
          <p className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5"><Award className="w-4 h-4 text-indigo-500" /> Resumen anual</p>
          <div className="grid grid-cols-3 gap-2">
            {resumenAnual.map((r) => (
              <div key={r.anio} className={`rounded-xl p-3 ${r.anio === new Date().getFullYear() ? "bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20" : "bg-slate-50 dark:bg-white/5"}`}>
                <p className="text-[10px] font-bold text-slate-400">{r.anio}{r.anio === new Date().getFullYear() ? " · en curso" : ""}</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">{r.autos} <span className="text-[10px] font-bold text-slate-400 uppercase">autos</span></p>
                <p className={`text-xs font-bold text-slate-500 ${ocultarMontos ? "blur-sm select-none" : ""}`}>USD {r.usd.toLocaleString("es-AR")}</p>
                <p className={`text-xs font-bold text-slate-500 ${ocultarMontos ? "blur-sm select-none" : ""}`}>$ {r.ars.toLocaleString("es-AR")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-gradient-to-br from-violet-50 to-white dark:from-violet-500/10 dark:to-transparent border border-violet-100 dark:border-violet-500/20">
        <p className="text-sm font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-violet-500" /> Tu operación (año)</p>
        <div className="flex items-end justify-between mt-2">
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{tuOperacion.ventas}</p>
            <p className="text-[10px] font-bold uppercase text-slate-400">Ventas cerradas</p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-black text-violet-600 dark:text-violet-400 ${ocultarMontos ? "blur-sm select-none" : ""}`}>USD {tuOperacion.usd.toLocaleString("es-AR")}</p>
            <p className={`text-lg font-black text-violet-600 dark:text-violet-400 ${ocultarMontos ? "blur-sm select-none" : ""}`}>$ {tuOperacion.ars.toLocaleString("es-AR")}</p>
            <p className="text-[9px] text-slate-400">ventas por moneda, sin mezclar</p>
          </div>
        </div>
      </div>

      {/* Operatoria del área: una tarjeta por moneda con semáforo de
          ingresos vs egresos del área (misma lógica que RentabilidadTab.tsx
          en Finanzas), en vez de una sola tarjeta con ARS y USD mezclados. */}
      {operatoriaAreaMonedas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {operatoriaAreaMonedas.map((moneda) => {
            const zona = zonaEquilibrio(ingresosAreaMes[moneda] || 0, egresosAreaMes[moneda] || 0);
            const neto = (ingresosAreaMes[moneda] || 0) - (egresosAreaMes[moneda] || 0);
            return (
              <Link key={moneda} href="/panel/finanzas" className={`rounded-2xl p-5 border transition-colors hover:opacity-90 block ${CLASE_ZONA_CARD[zona]}`}>
                <p className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-indigo-500" /> Operatoria del área · mes ({moneda})</p>
                <p className={`text-lg font-black text-slate-900 dark:text-white ${ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtMoneda(neto, moneda)}</p>
                <p className="text-[11px] text-slate-400">Neto de gestoría, multas, honorarios y trámites — ya con gastos del área descontados.</p>
              </Link>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 shadow-[0_2px_10px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
        <p className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500" /> Calificaciones de ventas — mes en curso</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Promedio</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{calificaciones.promedio != null ? calificaciones.promedio.toFixed(1) : "Sin calif."}</p>
            <p className="text-[11px] text-slate-400">{calificaciones.total} recibidas · {calificaciones.pedidasSinResponder} pedidas sin responder</p>
          </div>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-6 font-bold text-amber-600">{n}★</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${(calificaciones.distribucion[n - 1] / totalEstrellas) * 100}%` }} />
                </div>
                <span className="w-4 text-right text-slate-400">{calificaciones.distribucion[n - 1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 shadow-[0_2px_10px_rgba(15,23,42,0.06)] dark:shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
        <p className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5"><Trophy className="w-4 h-4 text-indigo-500" /> Ranking del mes</p>
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
              <th className="py-1.5">Vendedor</th>
              <th className="py-1.5 text-right">Ventas</th>
              <th className="py-1.5 text-right">Consignaciones</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr key={r.vendedor_id} className="border-b border-slate-50 dark:border-white/5 last:border-0">
                <td className="py-1.5 font-bold text-slate-700 dark:text-slate-200">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "•"} {r.nombre}</td>
                <td className="py-1.5 text-right font-mono">{r.ventas_equivalentes}</td>
                <td className="py-1.5 text-right font-mono">{r.consignaciones}</td>
              </tr>
            ))}
            {ranking.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-slate-400 text-xs">Sin vendedores activos este mes.</td></tr>}
          </tbody>
        </table>
        </div>
      </div>

      {!objetivoVentasMensual && (
        <p className="text-xs text-slate-400 text-center">Cargá el objetivo mensual de ventas en Configuración → Empresa para ver el progreso acá.</p>
      )}
    </Cascada>
  );
}
