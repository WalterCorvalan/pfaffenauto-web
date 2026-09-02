"use client";

import { useMemo } from "react";
import { fmt } from "./shared";

export default function ResumenAgenciaTab({ liquidaciones, gananciasOcultas }: { liquidaciones: any[]; gananciasOcultas: boolean }) {
  const finalizadas = liquidaciones.filter((l) => l.estado === "terminado");

  const porMes = useMemo(() => {
    const map: Record<string, any[]> = {};
    finalizadas.forEach((l) => { const m = l.mes.slice(0, 7); map[m] = map[m] || []; map[m].push(l); });
    return Object.entries(map).map(([mes, filas]) => ({
      mes, ops: filas.length,
      difTransfTotal: filas.reduce((a, f) => a + Number(f.diferencia_transferencia), 0),
      difMultasTotal: filas.reduce((a, f) => a + Number(f.diferencia_multas), 0),
      comisiones: filas.reduce((a, f) => a + Number(f.comision_gestora), 0),
      ingresoNeto: filas.reduce((a, f) => a + Number(f.ingreso_agencia), 0),
    })).sort((a, b) => b.mes.localeCompare(a.mes));
  }, [finalizadas]);

  if (porMes.length === 0) {
    return <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin datos</p><p className="text-xs text-slate-400 mt-1">No hay transferencias finalizadas para el resumen de la agencia.</p></div>;
  }

  const ultimo = porMes[0];

  return (
    <div>
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 mb-4 inline-block">
        <p className="text-sm font-bold">{new Date(ultimo.mes + "-01T12:00:00").toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</p>
        <p className="text-2xl font-black text-blue-600">{gananciasOcultas ? "—" : fmt(ultimo.ingresoNeto)}</p>
        <p className="text-xs text-slate-400">Ingreso agencia ({finalizadas[0]?.pct_agencia_aplicado ?? 90}%)</p>
        <p className="text-xs text-slate-400 mt-1">{ultimo.ops} operaciones · Comisiones: {fmt(ultimo.comisiones)}</p>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
        <table className="w-full text-xs">
          <thead className="text-left text-slate-400 border-b border-slate-100 dark:border-white/10"><tr><th className="p-2.5">Mes</th><th className="p-2.5">Ops</th><th className="p-2.5">Dif. transf. total</th><th className="p-2.5">Dif. multas total</th><th className="p-2.5">Comisiones gestoras</th><th className="p-2.5">Ingreso neto agencia</th></tr></thead>
          <tbody>
            {porMes.map((m) => (
              <tr key={m.mes} className="border-b border-slate-50 dark:border-white/5">
                <td className="p-2.5 font-bold">{new Date(m.mes + "-01T12:00:00").toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</td>
                <td className="p-2.5">{m.ops}</td>
                <td className="p-2.5 font-mono text-emerald-600">{gananciasOcultas ? "—" : fmt(m.difTransfTotal)}</td>
                <td className="p-2.5 font-mono">{gananciasOcultas ? "—" : (m.difMultasTotal ? fmt(m.difMultasTotal) : "—")}</td>
                <td className="p-2.5 font-mono font-bold text-indigo-600">{fmt(m.comisiones)}</td>
                <td className="p-2.5 font-mono font-bold text-blue-600">{gananciasOcultas ? "—" : fmt(m.ingresoNeto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
