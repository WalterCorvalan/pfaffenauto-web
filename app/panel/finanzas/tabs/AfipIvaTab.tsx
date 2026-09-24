"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { inputClass, fmt } from "./shared";
import { hoyLocalISO } from "@/lib/panel/fechas";

const CATS = ["A", "B", "C", "Exenta"] as const;
const IVA_OPCIONES = [21, 10.5, 27, 0];

export default function AfipIvaTab({ movimientos, setMovimientos }: { movimientos: any[]; setMovimientos: (fn: any) => void }) {
  const [periodo, setPeriodo] = useState(hoyLocalISO().slice(0, 7));

  const delPeriodo = movimientos.filter((m) => !m.deleted_at && m.estado === "aprobado" && m.fecha.slice(0, 7) === periodo);

  const ivaDe = (m: any) => {
    if (!m.iva_pct) return 0;
    return Number(m.monto) * (Number(m.iva_pct) / (100 + Number(m.iva_pct)));
  };

  // Los importes acá pueden venir de movimientos en ARS o en USD -- sumarlos
  // todos juntos en un solo número (como hacía antes, con "USD" hardcodeado
  // sin que ningún monto real estuviera en esa moneda) mezclaba pesos y
  // dólares sin conversión, mismo criterio a evitar que en Señas/Expedientes.
  // Se agrupa por moneda y se muestra cada una por separado, formato
  // "$ X · US$ Y" (mismo patrón que el cron de resumen diario).
  const sumaPorMoneda = (lista: any[], campo: (m: any) => number) => {
    const porMoneda: Record<string, number> = {};
    for (const m of lista) {
      const moneda = m.cuenta?.moneda || "ARS";
      porMoneda[moneda] = (porMoneda[moneda] || 0) + campo(m);
    }
    return porMoneda;
  };
  const fmtPorMoneda = (porMoneda: Record<string, number>) => {
    const partes = Object.entries(porMoneda).filter(([, v]) => v !== 0);
    if (partes.length === 0) return fmt(0, "ARS");
    return partes.map(([moneda, v]) => fmt(v, moneda)).join(" · ");
  };

  const resumen = useMemo(() => {
    const cats = [...CATS, "Sin clasificar"];
    return cats.map((cat) => {
      const lista = cat === "Sin clasificar" ? delPeriodo.filter((m) => !m.categoria_fiscal) : delPeriodo.filter((m) => m.categoria_fiscal === cat);
      const ingresos = sumaPorMoneda(lista.filter((m) => m.tipo === "ingreso"), (m) => Number(m.monto));
      const egresos = sumaPorMoneda(lista.filter((m) => m.tipo === "egreso"), (m) => Number(m.monto));
      const ivaCobrado = sumaPorMoneda(lista.filter((m) => m.tipo === "ingreso"), ivaDe);
      const ivaPagado = sumaPorMoneda(lista.filter((m) => m.tipo === "egreso"), ivaDe);
      return { cat, movs: lista.length, ingresos, egresos, ivaCobrado, ivaPagado };
    });
  }, [delPeriodo]);

  const ivaCobradoTotal = sumaPorMoneda(delPeriodo.filter((m) => m.tipo === "ingreso"), ivaDe);
  const ivaPagadoTotal = sumaPorMoneda(delPeriodo.filter((m) => m.tipo === "egreso"), ivaDe);
  const saldoIva: Record<string, number> = {};
  for (const moneda of new Set([...Object.keys(ivaCobradoTotal), ...Object.keys(ivaPagadoTotal)])) {
    saldoIva[moneda] = (ivaCobradoTotal[moneda] || 0) - (ivaPagadoTotal[moneda] || 0);
  }

  const clasificar = async (m: any, patch: { categoria_fiscal?: string; iva_pct?: number }) => {
    const { error } = await supabase2.from("movimientos_caja").update(patch).eq("id", m.id);
    if (error) return alert("No se pudo clasificar.");
    setMovimientos((prev: any[]) => prev.map((x) => (x.id === m.id ? { ...x, ...patch } : x)));
  };

  return (
    <div>
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3 mb-4 text-xs text-amber-700 dark:text-amber-300">
        🏛 <b>AFIP / IVA (scaffold)</b>: categorización fiscal por movimiento. Asigná tipo de comprobante (A/B/C/Exenta) y % IVA. El sistema calcula el IVA cobrado vs pagado. DDJJ, retenciones e integración AFIP web service quedan para fase posterior.
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <label className="flex items-center gap-2 text-sm font-bold">📅 Período: <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className={inputClass + " w-auto"} /></label>
        <p className="text-xs text-slate-400">{delPeriodo.length} movimientos en el mes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4"><p className="text-[10px] font-bold uppercase text-emerald-600">IVA cobrado (débito)</p><p className="text-2xl font-black">{fmtPorMoneda(ivaCobradoTotal)}</p><p className="text-[10px] text-slate-400">A pagar a AFIP</p></div>
        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4"><p className="text-[10px] font-bold uppercase text-indigo-600">IVA pagado (crédito)</p><p className="text-2xl font-black">{fmtPorMoneda(ivaPagadoTotal)}</p><p className="text-[10px] text-slate-400">A descontar del débito</p></div>
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-4"><p className="text-[10px] font-bold uppercase text-rose-500">Saldo IVA</p><p className="text-2xl font-black">{fmtPorMoneda(saldoIva)}</p><p className="text-[10px] text-slate-400">A pagar a AFIP</p></div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden mb-4">
        <p className="text-xs font-bold uppercase text-slate-400 p-3 border-b border-slate-100 dark:border-white/10">Resumen por categoría fiscal</p>
        <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-slate-400"><th className="p-2.5">Categoría</th><th className="p-2.5">Movs</th><th className="p-2.5">Ingresos</th><th className="p-2.5">Egresos</th><th className="p-2.5">IVA cobrado</th><th className="p-2.5">IVA pagado</th></tr></thead>
          <tbody>
            {resumen.map((r) => (
              <tr key={r.cat} className="border-t border-slate-50 dark:border-white/5">
                <td className={`p-2.5 font-bold ${r.cat === "Sin clasificar" ? "text-amber-600" : ""}`}>{r.cat === "Sin clasificar" ? "⚠ Sin clasificar" : r.cat}</td>
                <td className="p-2.5">{r.movs}</td>
                <td className="p-2.5 font-mono text-emerald-600">{fmtPorMoneda(r.ingresos)}</td>
                <td className="p-2.5 font-mono text-rose-500">{fmtPorMoneda(r.egresos)}</td>
                <td className="p-2.5 font-mono text-emerald-600">{fmtPorMoneda(r.ivaCobrado)}</td>
                <td className="p-2.5 font-mono text-indigo-600">{fmtPorMoneda(r.ivaPagado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-2"><p className="text-sm font-bold">📋 Clasificar movimientos del período {periodo}</p><p className="text-xs text-slate-400">Mostrando {delPeriodo.length} de {delPeriodo.length}</p></div>
        <div className="divide-y divide-slate-100 dark:divide-white/10">
          {delPeriodo.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2.5 text-xs">
              <div><p className="font-bold">{m.tipo_movimiento || m.observaciones || "Movimiento"}</p><p className="text-slate-400">{m.fecha} · {m.tipo === "ingreso" ? "Ingreso" : "Egreso"} · {fmt(m.monto, m.cuenta?.moneda)}</p></div>
              <div className="flex items-center gap-2">
                <select value={m.categoria_fiscal || ""} onChange={(e) => clasificar(m, { categoria_fiscal: e.target.value || undefined })} className="text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1"><option value="">— Cat. —</option>{CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                <select value={m.iva_pct ?? ""} onChange={(e) => clasificar(m, { iva_pct: e.target.value ? Number(e.target.value) : undefined })} className="text-xs bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1"><option value="">% IVA</option>{IVA_OPCIONES.map((v) => <option key={v} value={v}>{v}%</option>)}</select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
