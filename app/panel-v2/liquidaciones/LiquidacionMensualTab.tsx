"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { supabase2 } from "@/lib/supabase2/client";
import { fmt } from "./shared";

export default function LiquidacionMensualTab({ liquidaciones, setLiquidaciones, gananciasOcultas, soyAdminOFinanzas }: { liquidaciones: any[]; setLiquidaciones: (fn: any) => void; gananciasOcultas: boolean; soyAdminOFinanzas: boolean }) {
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [marcando, setMarcando] = useState<string | null>(null);

  const finalizadas = liquidaciones.filter((l) => l.estado === "terminado");

  const porMes = useMemo(() => {
    const map: Record<string, any[]> = {};
    finalizadas.forEach((l) => { const m = l.mes.slice(0, 7); map[m] = map[m] || []; map[m].push(l); });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [finalizadas]);

  const marcarLiquidada = async (mes: string, gestora: string | null) => {
    const key = `${mes}::${gestora || ""}`;
    setMarcando(key);
    try {
      const { error } = await supabase2.rpc("marcar_liquidadas_gestora", { p_mes: `${mes}-01`, p_gestora: gestora });
      if (error) throw error;
      setLiquidaciones((prev: any[]) => prev.map((l) => (l.mes.slice(0, 7) === mes && (l.gestora || null) === gestora && l.estado === "terminado" ? { ...l, liquidado_gestora: true, liquidado_gestora_en: new Date().toISOString() } : l)));
    } catch (err: any) {
      alert(err.message || "No se pudo marcar como liquidada.");
    } finally { setMarcando(null); }
  };

  if (porMes.length === 0) {
    return <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin liquidaciones todavía</p><p className="text-xs text-slate-400 mt-1">No hay transferencias finalizadas para liquidar.</p></div>;
  }

  return (
    <div className="space-y-6">
      {porMes.map(([mes, filas]) => {
        const porGestora: Record<string, any[]> = {};
        filas.forEach((f) => { const g = f.gestora || "__sin_asignar__"; porGestora[g] = porGestora[g] || []; porGestora[g].push(f); });
        const comisionesMes = filas.reduce((a, f) => a + Number(f.comision_gestora), 0);
        const agenciaMes = filas.reduce((a, f) => a + Number(f.ingreso_agencia), 0);

        return (
          <div key={mes} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-white/10">
              <p className="text-sm font-bold">{new Date(mes + "-01T12:00:00").toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</p>
              <p className="text-xs text-slate-400">{filas.length} operación{filas.length === 1 ? "" : "es"} · <span className="text-indigo-600 font-bold">Comisiones: {fmt(comisionesMes)}</span> · <span className="text-blue-600 font-bold">Agencia: {gananciasOcultas ? "—" : fmt(agenciaMes)}</span></p>
            </div>
            <table className="w-full text-xs">
              <thead className="text-left text-slate-400"><tr><th className="p-2.5"></th><th className="p-2.5">Gestora</th><th className="p-2.5">Ops</th><th className="p-2.5">Fijo (40K×ops)</th><th className="p-2.5">10% Transf.</th><th className="p-2.5">10% Multas</th><th className="p-2.5">Total a cobrar</th><th className="p-2.5">Ing. agencia</th><th className="p-2.5">Estado</th><th className="p-2.5">Acción</th></tr></thead>
              <tbody>
                {Object.entries(porGestora).map(([g, fs]) => {
                  const key = `${mes}::${g}`;
                  const isOpen = expandidos[key];
                  const fijo = fs.reduce((a, f) => a + Number(f.comision_fija_aplicada), 0);
                  const pctT = fs.reduce((a, f) => a + (Number(f.pct_gestora_aplicado) / 100) * Number(f.diferencia_transferencia), 0);
                  const pctM = fs.reduce((a, f) => a + (Number(f.pct_gestora_aplicado) / 100) * Number(f.diferencia_multas), 0);
                  const totalCobrar = fs.reduce((a, f) => a + Number(f.comision_gestora), 0);
                  const ingAgencia = fs.reduce((a, f) => a + Number(f.ingreso_agencia), 0);
                  const todasLiquidadas = fs.every((f) => f.liquidado_gestora);
                  return (
                    <React.Fragment key={key}>
                      <tr className="border-t border-slate-50 dark:border-white/5">
                        <td className="p-2.5"><button onClick={() => setExpandidos((p) => ({ ...p, [key]: !p[key] }))}>{isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</button></td>
                        <td className="p-2.5 font-bold text-indigo-600">{g === "__sin_asignar__" ? "Sin asignar" : g}</td>
                        <td className="p-2.5">{fs.length}</td>
                        <td className="p-2.5 font-mono">{fmt(fijo)}</td>
                        <td className="p-2.5 font-mono text-emerald-600">{fmt(pctT)}</td>
                        <td className="p-2.5 font-mono">{pctM ? fmt(pctM) : "—"}</td>
                        <td className="p-2.5 font-mono font-black">{fmt(totalCobrar)}</td>
                        <td className="p-2.5 font-mono font-black">{gananciasOcultas ? "—" : fmt(ingAgencia)}</td>
                        <td className="p-2.5">{todasLiquidadas ? <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700">Liquidada</span> : <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700">Pendiente</span>}</td>
                        <td className="p-2.5">{soyAdminOFinanzas && !todasLiquidadas && <button onClick={() => marcarLiquidada(mes, g === "__sin_asignar__" ? null : g)} disabled={marcando === key} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"><CheckCircle2 className="w-3.5 h-3.5" /> Marcar liquidada</button>}</td>
                      </tr>
                      {isOpen && fs.map((f) => (
                        <tr key={f.id} className="text-slate-500 border-t border-slate-50 dark:border-white/5">
                          <td className="p-2.5"></td>
                          <td className="p-2.5 pl-4 font-bold">{f.dominio}</td>
                          <td className="p-2.5">{f.anio}</td>
                          <td className="p-2.5">{f.cliente_comprador}</td>
                          <td className="p-2.5 font-mono">{fmt(f.comision_fija_aplicada)}</td>
                          <td className="p-2.5 font-mono">{fmt((f.pct_gestora_aplicado / 100) * f.diferencia_transferencia)}</td>
                          <td className="p-2.5 font-mono">{fmt(f.comision_gestora)}</td>
                          <td className="p-2.5 font-mono">{gananciasOcultas ? "—" : fmt(f.ingreso_agencia)}</td>
                          <td className="p-2.5" colSpan={2}></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-white/10 font-bold bg-slate-50 dark:bg-white/5">
                  <td className="p-2.5" colSpan={2}>TOTAL</td>
                  <td className="p-2.5">{filas.length}</td>
                  <td className="p-2.5 font-mono">{fmt(filas.reduce((a, f) => a + Number(f.comision_fija_aplicada), 0))}</td>
                  <td className="p-2.5 font-mono">{fmt(filas.reduce((a, f) => a + (Number(f.pct_gestora_aplicado) / 100) * Number(f.diferencia_transferencia), 0))}</td>
                  <td className="p-2.5"></td>
                  <td className="p-2.5 font-mono">{fmt(comisionesMes)}</td>
                  <td className="p-2.5 font-mono">{gananciasOcultas ? "—" : fmt(agenciaMes)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      })}
    </div>
  );
}
