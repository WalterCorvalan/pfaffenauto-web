"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { BookOpen, Landmark, TrendingUp, Activity, Loader2 } from "lucide-react";
import { fmt, inputClass, labelClass } from "./shared";

// Libros contables básicos armados enteramente sobre movimientos_caja y
// cuentas (nada nuevo en la base) — Diario, Mayor, Estado de Resultados y
// Flujo de Caja son distintas formas de agrupar/cruzar la misma tabla de
// movimientos que ya alimenta Finanzas > Movimientos.

const SUBTABS = [
  { value: "diario", label: "Libro Diario", icon: BookOpen },
  { value: "mayor", label: "Libro Mayor", icon: Landmark },
  { value: "resultados", label: "Estado de Resultados", icon: TrendingUp },
  { value: "flujo", label: "Flujo de Caja", icon: Activity },
] as const;

function primerDiaMes(offset = 0) {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth() + offset, 1);
}
function toISO(d: Date) { return d.toISOString().slice(0, 10); }

export default function LibrosContablesTab({ cuentas }: { cuentas: any[] }) {
  const [sub, setSub] = useState<(typeof SUBTABS)[number]["value"]>("diario");
  const [desde, setDesde] = useState(toISO(primerDiaMes(0)));
  const [hasta, setHasta] = useState(toISO(new Date(primerDiaMes(1).getTime() - 86400000)));
  const [cuentaId, setCuentaId] = useState(cuentas[0]?.id || "");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 pb-1 overflow-x-auto">
        {SUBTABS.map((t) => (
          <button key={t.value} onClick={() => setSub(t.value)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold whitespace-nowrap rounded-lg transition-colors ${sub === t.value ? "bg-rose-600 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {sub !== "mayor" && sub !== "flujo" && (
        <div className="flex items-center gap-2 flex-wrap">
          <div><label className={labelClass}>Desde</label><input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={inputClass} /></div>
          <div><label className={labelClass}>Hasta</label><input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={inputClass} /></div>
        </div>
      )}

      {sub === "diario" && <LibroDiario desde={desde} hasta={hasta} />}
      {sub === "mayor" && <LibroMayor cuentas={cuentas} cuentaId={cuentaId} setCuentaId={setCuentaId} />}
      {sub === "resultados" && <EstadoResultados desde={desde} hasta={hasta} />}
      {sub === "flujo" && <FlujoDeCaja />}
    </div>
  );
}

function LibroDiario({ desde, hasta }: { desde: string; hasta: string }) {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    supabase2.from("movimientos_caja")
      .select("id, fecha, tipo, monto, tipo_movimiento, observaciones, cuenta:cuentas(nombre, moneda)")
      .is("deleted_at", null).eq("estado", "aprobado")
      .gte("fecha", desde).lte("fecha", hasta)
      .order("fecha", { ascending: true }).order("created_at", { ascending: true })
      .then(({ data }) => { setMovimientos(data || []); setCargando(false); });
  }, [desde, hasta]);

  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
      <p className="text-xs text-slate-400 px-4 pt-3">Registro cronológico de todos los movimientos del período — un asiento por fila, en el orden en que ocurrieron.</p>
      {cargando ? (
        <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs mt-2">
            <thead><tr className="text-slate-400 uppercase text-[10px] border-b border-slate-100 dark:border-white/5"><th className="px-4 py-2">Fecha</th><th className="px-4 py-2">Cuenta</th><th className="px-4 py-2">Concepto</th><th className="px-4 py-2">Detalle</th><th className="px-4 py-2 text-right">Debe</th><th className="px-4 py-2 text-right">Haber</th></tr></thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id} className="border-b border-slate-50 dark:border-white/5">
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{m.fecha}</td>
                  <td className="px-4 py-2 font-bold text-slate-700 dark:text-slate-200">{m.cuenta?.nombre || "—"}</td>
                  <td className="px-4 py-2">{m.tipo_movimiento || "—"}</td>
                  <td className="px-4 py-2 text-slate-400 truncate max-w-[200px]">{m.observaciones || "—"}</td>
                  <td className="px-4 py-2 text-right font-mono text-emerald-600">{m.tipo === "ingreso" ? fmt(Number(m.monto), m.cuenta?.moneda) : ""}</td>
                  <td className="px-4 py-2 text-right font-mono text-rose-600">{m.tipo === "egreso" ? fmt(Number(m.monto), m.cuenta?.moneda) : ""}</td>
                </tr>
              ))}
              {movimientos.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Sin movimientos en este período.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LibroMayor({ cuentas, cuentaId, setCuentaId }: { cuentas: any[]; cuentaId: string; setCuentaId: (v: string) => void }) {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const cuenta = cuentas.find((c) => c.id === cuentaId);

  useEffect(() => {
    if (!cuentaId) return;
    setCargando(true);
    supabase2.from("movimientos_caja")
      .select("id, fecha, tipo, monto, tipo_movimiento, observaciones")
      .is("deleted_at", null).eq("estado", "aprobado").eq("cuenta_id", cuentaId)
      .order("fecha", { ascending: true }).order("created_at", { ascending: true })
      .then(({ data }) => { setMovimientos(data || []); setCargando(false); });
  }, [cuentaId]);

  // Saldo corriente = saldo_inicial de la cuenta + acumulado de ingresos/egresos
  // en orden cronológico — es exactamente lo que hace saldo_cuenta() en SQL,
  // pero mostrando la evolución fila por fila en vez de solo el total.
  const filasConSaldo = useMemo(() => {
    let acumulado = Number(cuenta?.saldo_inicial) || 0;
    return movimientos.map((m) => {
      acumulado += m.tipo === "ingreso" ? Number(m.monto) : -Number(m.monto);
      return { ...m, saldo: acumulado };
    });
  }, [movimientos, cuenta]);

  return (
    <div className="space-y-3">
      <div className="max-w-xs">
        <label className={labelClass}>Cuenta</label>
        <select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} className={inputClass}>
          {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>)}
        </select>
      </div>
      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
        <p className="text-xs text-slate-400 px-4 pt-3">Historial completo de la cuenta con saldo corriente — arranca en el saldo inicial cargado y va sumando/restando cada movimiento en orden.</p>
        {cargando ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs mt-2">
              <thead><tr className="text-slate-400 uppercase text-[10px] border-b border-slate-100 dark:border-white/5"><th className="px-4 py-2">Fecha</th><th className="px-4 py-2">Concepto</th><th className="px-4 py-2 text-right">Debe</th><th className="px-4 py-2 text-right">Haber</th><th className="px-4 py-2 text-right">Saldo</th></tr></thead>
              <tbody>
                <tr className="border-b border-slate-50 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                  <td className="px-4 py-2 text-slate-400" colSpan={4}>Saldo inicial</td>
                  <td className="px-4 py-2 text-right font-mono font-bold">{fmt(Number(cuenta?.saldo_inicial) || 0, cuenta?.moneda)}</td>
                </tr>
                {filasConSaldo.map((m) => (
                  <tr key={m.id} className="border-b border-slate-50 dark:border-white/5">
                    <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{m.fecha}</td>
                    <td className="px-4 py-2">{m.tipo_movimiento || "—"}</td>
                    <td className="px-4 py-2 text-right font-mono text-emerald-600">{m.tipo === "ingreso" ? fmt(Number(m.monto), cuenta?.moneda) : ""}</td>
                    <td className="px-4 py-2 text-right font-mono text-rose-600">{m.tipo === "egreso" ? fmt(Number(m.monto), cuenta?.moneda) : ""}</td>
                    <td className="px-4 py-2 text-right font-mono font-bold">{fmt(m.saldo, cuenta?.moneda)}</td>
                  </tr>
                ))}
                {filasConSaldo.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Sin movimientos en esta cuenta.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EstadoResultados({ desde, hasta }: { desde: string; hasta: string }) {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    supabase2.from("movimientos_caja")
      .select("tipo, monto, tipo_movimiento, cuenta:cuentas(moneda)")
      .is("deleted_at", null).eq("estado", "aprobado")
      .gte("fecha", desde).lte("fecha", hasta)
      .then(({ data }) => { setMovimientos(data || []); setCargando(false); });
  }, [desde, hasta]);

  // Nunca se mezcla ARS con USD — un estado de resultados por cada moneda.
  const porMoneda = useMemo(() => {
    const monedas: Record<string, { ingresos: Record<string, number>; egresos: Record<string, number> }> = {};
    movimientos.forEach((m: any) => {
      const moneda = m.cuenta?.moneda;
      if (!moneda) return;
      // Transferencia entre cajas propias no es ingreso ni egreso real -- es
      // la misma plata moviéndose de una caja a otra, no afecta el resultado.
      if (m.tipo_movimiento === "Transferencia") return;
      if (!monedas[moneda]) monedas[moneda] = { ingresos: {}, egresos: {} };
      const bucket = m.tipo === "ingreso" ? monedas[moneda].ingresos : monedas[moneda].egresos;
      const key = m.tipo_movimiento || "Sin categoría";
      bucket[key] = (bucket[key] || 0) + Number(m.monto);
    });
    return monedas;
  }, [movimientos]);

  if (cargando) return <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  const monedas = Object.keys(porMoneda);
  if (monedas.length === 0) return <p className="text-xs text-slate-400 text-center py-8">Sin movimientos en este período.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {monedas.map((moneda) => {
        const { ingresos, egresos } = porMoneda[moneda];
        const totalIngresos = Object.values(ingresos).reduce((a, b) => a + b, 0);
        const totalEgresos = Object.values(egresos).reduce((a, b) => a + b, 0);
        const resultado = totalIngresos - totalEgresos;
        return (
          <div key={moneda} className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
            <p className="text-sm font-bold text-slate-800 dark:text-white mb-3">Estado de Resultados — {moneda}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Ingresos</p>
            {Object.entries(ingresos).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs py-0.5"><span className="text-slate-500 dark:text-slate-400">{k}</span><span className="font-mono">{fmt(v, moneda)}</span></div>
            ))}
            <div className="flex justify-between text-xs font-bold border-t border-slate-100 dark:border-white/10 mt-1 pt-1"><span>Total ingresos</span><span className="font-mono text-emerald-600">{fmt(totalIngresos, moneda)}</span></div>

            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1 mt-4">Egresos</p>
            {Object.entries(egresos).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs py-0.5"><span className="text-slate-500 dark:text-slate-400">{k}</span><span className="font-mono">{fmt(v, moneda)}</span></div>
            ))}
            <div className="flex justify-between text-xs font-bold border-t border-slate-100 dark:border-white/10 mt-1 pt-1"><span>Total egresos</span><span className="font-mono text-rose-600">{fmt(totalEgresos, moneda)}</span></div>

            <div className={`flex justify-between text-sm font-black border-t-2 border-slate-200 dark:border-white/20 mt-3 pt-2 ${resultado >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              <span>Resultado del período</span><span className="font-mono">{fmt(resultado, moneda)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FlujoDeCaja() {
  const [datos, setDatos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const desde = toISO(primerDiaMes(-11));
    supabase2.from("movimientos_caja")
      .select("fecha, tipo, monto, tipo_movimiento, cuenta:cuentas(moneda)")
      .is("deleted_at", null).eq("estado", "aprobado")
      .gte("fecha", desde)
      .then(({ data }) => { setDatos(data || []); setCargando(false); });
  }, []);

  const porMes = useMemo(() => {
    const meses: { key: string; label: string; ingresos: Record<string, number>; egresos: Record<string, number> }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = primerDiaMes(-i);
      meses.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }), ingresos: {}, egresos: {} });
    }
    const porKey = new Map(meses.map((m) => [m.key, m]));
    datos.forEach((m: any) => {
      if (m.tipo_movimiento === "Transferencia") return;
      const key = m.fecha.slice(0, 7);
      const fila = porKey.get(key);
      const moneda = m.cuenta?.moneda;
      if (!fila || !moneda) return;
      const bucket = m.tipo === "ingreso" ? fila.ingresos : fila.egresos;
      bucket[moneda] = (bucket[moneda] || 0) + Number(m.monto);
    });
    return meses;
  }, [datos]);

  if (cargando) return <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
      <p className="text-xs text-slate-400 px-4 pt-3">Ingresos, egresos y neto por mes (últimos 12 meses), por moneda.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs mt-2">
          <thead><tr className="text-slate-400 uppercase text-[10px] border-b border-slate-100 dark:border-white/5"><th className="px-4 py-2">Mes</th><th className="px-4 py-2 text-right">Ingresos USD</th><th className="px-4 py-2 text-right">Egresos USD</th><th className="px-4 py-2 text-right">Neto USD</th><th className="px-4 py-2 text-right">Ingresos ARS</th><th className="px-4 py-2 text-right">Egresos ARS</th><th className="px-4 py-2 text-right">Neto ARS</th></tr></thead>
          <tbody>
            {porMes.map((m) => {
              const netoUsd = (m.ingresos.USD || 0) - (m.egresos.USD || 0);
              const netoArs = (m.ingresos.ARS || 0) - (m.egresos.ARS || 0);
              return (
                <tr key={m.key} className="border-b border-slate-50 dark:border-white/5">
                  <td className="px-4 py-2 font-bold text-slate-700 dark:text-slate-200 capitalize">{m.label}</td>
                  <td className="px-4 py-2 text-right font-mono text-emerald-600">{m.ingresos.USD ? fmt(m.ingresos.USD, "USD") : "—"}</td>
                  <td className="px-4 py-2 text-right font-mono text-rose-600">{m.egresos.USD ? fmt(m.egresos.USD, "USD") : "—"}</td>
                  <td className={`px-4 py-2 text-right font-mono font-bold ${netoUsd >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmt(netoUsd, "USD")}</td>
                  <td className="px-4 py-2 text-right font-mono text-emerald-600">{m.ingresos.ARS ? fmt(m.ingresos.ARS, "ARS") : "—"}</td>
                  <td className="px-4 py-2 text-right font-mono text-rose-600">{m.egresos.ARS ? fmt(m.egresos.ARS, "ARS") : "—"}</td>
                  <td className={`px-4 py-2 text-right font-mono font-bold ${netoArs >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmt(netoArs, "ARS")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
