"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save } from "lucide-react";
import { inputClass, labelClass, fmt } from "./shared";

export default function ArqueosTab({ arqueos, setArqueos, cuentas, miNombre }: { arqueos: any[]; setArqueos: (fn: any) => void; cuentas: any[]; miNombre: string }) {
  const [showNuevo, setShowNuevo] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [cuentaId, setCuentaId] = useState("");
  const [contadoReal, setContadoReal] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cuenta = cuentas.find((c) => c.id === cuentaId);
  const saldoEsperado = cuenta?.saldo ?? 0;
  const diferencia = contadoReal ? Number(contadoReal) - saldoEsperado : 0;
  const hayDiferencia = contadoReal !== "" && Math.abs(diferencia) > 0.009;

  const abrir = () => { setFecha(new Date().toISOString().slice(0, 10)); setCuentaId(""); setContadoReal(""); setMotivo(""); setShowNuevo(true); };

  const guardar = async () => {
    if (!cuentaId || contadoReal === "") return alert("Completá caja y contado físico.");
    if (hayDiferencia && !motivo.trim()) return alert("Indicá el motivo de la diferencia.");
    setGuardando(true);
    try {
      const { data: { user } } = await supabase2.auth.getUser();
      const { data, error } = await supabase2.from("finanzas_arqueos").insert({
        fecha, cuenta_id: cuentaId, responsable_id: user?.id || null, moneda: cuenta.moneda, saldo_esperado: saldoEsperado, contado_real: Number(contadoReal), diferencia, motivo: motivo || null,
      }).select("*, cuenta:cuentas(nombre), responsable:perfiles(nombre)").single();
      if (error) throw error;
      setArqueos((prev: any[]) => [data, ...prev]);
      setShowNuevo(false);
    } catch { alert("No se pudo guardar el arqueo."); } finally { setGuardando(false); }
  };

  return (
    <div>
      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3 mb-4 text-xs text-indigo-700 dark:text-indigo-300">
        🔍 <b>Arqueo de caja</b>: comparación entre el saldo que el sistema calcula vs el efectivo contado físicamente. Cualquier diferencia debe quedar registrada con motivo.
      </div>

      <div className="flex justify-end mb-4"><button onClick={abrir} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Nuevo arqueo</button></div>

      {arqueos.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin arqueos registrados</p></div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 dark:border-white/10 text-left text-slate-400"><th className="p-2.5">Fecha</th><th className="p-2.5">Caja</th><th className="p-2.5">Moneda</th><th className="p-2.5">Esperado</th><th className="p-2.5">Contado</th><th className="p-2.5">Diferencia</th><th className="p-2.5">Responsable</th><th className="p-2.5">Motivo</th></tr></thead>
            <tbody>
              {arqueos.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 dark:border-white/5">
                  <td className="p-2.5">{a.fecha}</td>
                  <td className="p-2.5 font-bold">{a.cuenta?.nombre || cuentas.find((c) => c.id === a.cuenta_id)?.nombre || "—"}</td>
                  <td className="p-2.5">{a.moneda}</td>
                  <td className="p-2.5 font-mono">{Math.round(a.saldo_esperado).toLocaleString("es-AR")}</td>
                  <td className="p-2.5 font-mono">{Math.round(a.contado_real).toLocaleString("es-AR")}</td>
                  <td className={`p-2.5 font-mono font-bold ${Math.abs(a.diferencia) > 0.009 ? "text-rose-500" : "text-emerald-600"}`}>{Math.round(a.diferencia).toLocaleString("es-AR")}</td>
                  <td className="p-2.5">{a.responsable?.nombre || "—"}</td>
                  <td className="p-2.5 text-slate-400">{a.motivo || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevo(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Nuevo arqueo</h3><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Comparación entre el saldo que el sistema calcula vs el efectivo contado físicamente.</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelClass}>Fecha *</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Responsable</label><input value={miNombre} disabled className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Caja *</label><select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} className={inputClass}><option value="">— Elegí —</option>{cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
              <div><label className={labelClass}>Moneda</label><input value={cuenta?.moneda || ""} disabled className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Saldo esperado (calc.)</label><input value={cuentaId ? Math.round(saldoEsperado).toLocaleString("es-AR") : ""} disabled className={inputClass} placeholder="Auto-calculado al elegir caja" /></div>
              <div><label className={labelClass}>Contado físico real *</label><input type="number" value={contadoReal} onChange={(e) => setContadoReal(e.target.value)} className={inputClass} /></div>
            </div>
            {contadoReal !== "" && cuentaId && (
              <div className={`mt-3 p-3 rounded-lg text-xs font-bold ${hayDiferencia ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700"}`}>
                Diferencia: {fmt(diferencia, cuenta?.moneda)}
                {hayDiferencia && <p className="font-normal mt-0.5">⚠ Hay diferencia. El motivo es obligatorio.</p>}
              </div>
            )}
            <label className={labelClass + " mt-3"}>Motivo / Observaciones {hayDiferencia && "*"}</label>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} className={inputClass} />
            {hayDiferencia && !motivo.trim() && <p className="text-[10px] text-rose-500 mt-1">Indicá el motivo de la diferencia.</p>}
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={guardar} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Guardar arqueo</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
