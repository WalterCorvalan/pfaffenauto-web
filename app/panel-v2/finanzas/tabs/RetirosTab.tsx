"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save } from "lucide-react";
import { inputClass, labelClass, fmt } from "./shared";

export default function RetirosTab({
  retiros, setRetiros, cuentas, setCuentas, setMovimientos,
}: { retiros: any[]; setRetiros: (fn: any) => void; cuentas: any[]; setCuentas: (fn: any) => void; setMovimientos: (fn: any) => void }) {
  const [showNuevo, setShowNuevo] = useState(false);
  const [persona, setPersona] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [monto, setMonto] = useState("");
  const [cuentaId, setCuentaId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cuentaSel = cuentas.find((c) => c.id === cuentaId);
  const totalesPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    retiros.forEach((r) => { map[r.moneda] = (map[r.moneda] || 0) + Number(r.monto); });
    return map;
  }, [retiros]);

  const abrir = () => { setPersona(""); setMonto(""); setCuentaId(cuentas[0]?.id || ""); setMotivo(""); setFecha(new Date().toISOString().slice(0, 10)); setShowNuevo(true); };

  const registrar = async () => {
    if (!persona.trim() || !monto || !cuentaId) return alert("Completá persona, monto y cuenta.");
    setGuardando(true);
    try {
      const cuenta = cuentas.find((c) => c.id === cuentaId);
      const { data: id, error } = await supabase2.rpc("registrar_retiro_caja", {
        p_persona: persona.trim(), p_fecha: fecha, p_monto: Number(monto), p_moneda: cuenta.moneda, p_cuenta_id: cuentaId, p_motivo: motivo || null,
      });
      if (error) throw error;

      const { data: fresh } = await supabase2.from("retiros_caja").select("*").eq("id", id).single();
      setRetiros((prev: any[]) => [fresh, ...prev]);

      const [{ data: nuevoMov }, { data: nuevoSaldo }] = await Promise.all([
        supabase2.from("movimientos_caja").select("*, cuenta:cuentas(nombre, moneda)").eq("id", fresh.movimiento_id).single(),
        supabase2.rpc("saldo_cuenta", { p_cuenta_id: cuentaId }),
      ]);
      if (nuevoMov) setMovimientos((prev: any[]) => [nuevoMov, ...prev]);
      setCuentas((prev: any[]) => prev.map((c) => (c.id === cuentaId ? { ...c, saldo: Number(nuevoSaldo) || 0 } : c)));

      setShowNuevo(false);
    } catch (err: any) {
      alert(err.message || "No se pudo registrar el retiro.");
    } finally { setGuardando(false); }
  };

  const eliminar = async (r: any) => {
    if (!confirm(`¿Eliminar el retiro de ${r.persona}? Se revierte el egreso en la caja.`)) return;
    try {
      await supabase2.rpc("eliminar_retiro_caja", { p_id: r.id });
      setRetiros((prev: any[]) => prev.filter((x) => x.id !== r.id));
      const { data: nuevoSaldo } = await supabase2.rpc("saldo_cuenta", { p_cuenta_id: r.cuenta_id });
      setCuentas((prev: any[]) => prev.map((c) => (c.id === r.cuenta_id ? { ...c, saldo: Number(nuevoSaldo) || 0 } : c)));
      setMovimientos((prev: any[]) => prev.map((m) => (m.id === r.movimiento_id ? { ...m, deleted_at: new Date().toISOString() } : m)).filter((m) => !m.deleted_at));
    } catch (err: any) { alert(err.message || "No se pudo eliminar."); }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {Object.keys(totalesPorMoneda).length === 0 ? (
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Total retiros</p><p className="text-sm">—</p></div>
        ) : Object.entries(totalesPorMoneda).map(([m, n]) => (
          <div key={m} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Total retiros {m}</p><p className="text-lg font-black">{fmt(n, m)}</p></div>
        ))}
      </div>

      <button onClick={abrir} className="flex items-center gap-1.5 px-4 py-2 mb-4 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Nuevo retiro</button>

      {retiros.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin retiros registrados</p></div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 dark:border-white/10 text-left text-slate-400"><th className="p-2.5">Fecha</th><th className="p-2.5">Persona</th><th className="p-2.5">Monto</th><th className="p-2.5">Cuenta</th><th className="p-2.5">Motivo</th><th className="p-2.5">Acciones</th></tr></thead>
            <tbody>
              {retiros.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 dark:border-white/5">
                  <td className="p-2.5">{r.fecha}</td>
                  <td className="p-2.5 font-bold">{r.persona}</td>
                  <td className="p-2.5 font-mono font-bold">{fmt(r.monto, r.moneda)}</td>
                  <td className="p-2.5">{cuentas.find((c) => c.id === r.cuenta_id)?.nombre || "—"}</td>
                  <td className="p-2.5 text-slate-400">{r.motivo || "—"}</td>
                  <td className="p-2.5"><button onClick={() => eliminar(r)} className="text-rose-500 font-bold">Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevo(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Nuevo retiro</h3><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Registrá un retiro de efectivo. Resta del saldo de la caja seleccionada y crea un movimiento automático en Finanzas.</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelClass}>Persona *</label><input value={persona} onChange={(e) => setPersona(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Fecha *</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Monto *</label><input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Cuenta (afecta saldo) *</label><select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} className={inputClass}><option value="">— Elegí —</option>{cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre} · saldo {fmt(c.saldo, c.moneda)}</option>)}</select></div>
            </div>
            <label className={labelClass + " mt-3"}>Motivo</label>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} placeholder="Retiro personal, viático, gastos, etc." className={inputClass} />
            {cuentaSel && monto && <p className="text-[10px] text-slate-400 mt-2">Resta {fmt(Number(monto), cuentaSel.moneda)} del saldo de "{cuentaSel.nombre}" y crea un movimiento Egreso vinculado en Finanzas.</p>}
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={registrar} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Registrar retiro</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
