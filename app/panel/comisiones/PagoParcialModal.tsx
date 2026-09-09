"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Save, Wallet } from "lucide-react";
import { hoyLocalISO } from "@/lib/panelV2/fechas";

export default function PagoParcialModal({
  comision,
  cuentas,
  onClose
}: {
  comision: any;
  cuentas: any[];
  onClose: () => void;
}) {
  const restante = Number(comision.monto) - Number(comision.monto_pagado);
  const [cargando, setCargando] = useState(false);
  const [monto, setMonto] = useState(String(restante));
  const [fecha, setFecha] = useState(hoyLocalISO());
  const [externo, setExterno] = useState(false);
  const cuentasMoneda = cuentas.filter((c) => c.moneda === comision.moneda);
  const [cuentaId, setCuentaId] = useState(cuentasMoneda[0]?.id || "");

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externo && !cuentaId) return alert('Elegí de qué caja sale el pago, o tildá "Pago Externo".');
    setCargando(true);
    try {
      const { error } = await supabase2.rpc("registrar_pago_parcial_comision", {
        p_comision_id: comision.id,
        p_monto: Number(monto),
        p_pago_externo: externo,
        p_fecha: fecha,
        p_cuenta_id: externo ? null : cuentaId,
      });
      if (error) throw error;
      onClose();
    } catch (err: any) {
      alert(err.message || "Error al registrar el pago.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !cargando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
        <div className="p-6 pb-4 shrink-0 flex items-center justify-between border-b border-slate-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" /> Registrar Pago
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={guardar} className="px-6 py-4 space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 rounded-xl mb-2 text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 block mb-1">Restante a pagar</span>
            <span className="text-2xl font-black font-mono text-emerald-800 dark:text-emerald-300">{comision.moneda} {restante.toLocaleString()}</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-widest">Monto a abonar ahora</label>
            <input required type="number" step="0.01" max={restante} value={monto} onChange={e => setMonto(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white font-mono" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-widest">Fecha del pago</label>
            <input required type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/10">
            <input type="checkbox" checked={externo} onChange={e => setExterno(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded border-slate-300" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Pago Externo (No descuenta de caja local)</span>
          </label>

          {!externo && (
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-widest">Caja de donde sale ({comision.moneda})</label>
              <select required value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white">
                <option value="">— Elegí —</option>
                {cuentasMoneda.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              {cuentasMoneda.length === 0 && <p className="text-[10px] text-rose-500 mt-1">No hay cajas en {comision.moneda} — creá una en Finanzas o tildá Pago Externo.</p>}
            </div>
          )}

          <button type="submit" disabled={cargando} className="w-full mt-4 px-6 py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {cargando ? "Guardando..." : <><Save className="w-4 h-4" /> Confirmar Pago</>}
          </button>
        </form>
      </div>
    </div>
  );
}
