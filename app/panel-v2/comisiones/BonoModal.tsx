"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Save, Gift } from "lucide-react";

export default function BonoModal({
  vendedores,
  usuarioActualId,
  esAdmin,
  onClose
}: {
  vendedores: any[];
  usuarioActualId: string;
  esAdmin: boolean;
  onClose: () => void;
}) {
  const [cargando, setCargando] = useState(false);
  const [formData, setFormData] = useState({
    beneficiario_id: esAdmin ? "" : usuarioActualId,
    concepto: "",
    monto: "",
    moneda: "USD"
  });

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const { error } = await supabase2.rpc("crear_bono_comision", {
        p_beneficiario_id: formData.beneficiario_id,
        p_concepto: formData.concepto,
        p_monto: Number(formData.monto),
        p_moneda: formData.moneda
      });
      if (error) throw error;
      onClose();
    } catch (err: any) {
      alert(err.message || "Error al registrar el bono.");
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
            <Gift className="w-5 h-5 text-emerald-600" /> {esAdmin ? "Cargar Comisión Manual" : "Pedir Comisión"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={guardar} className="px-6 py-4 space-y-4">
          {esAdmin && (
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-widest">Beneficiario</label>
              <select required value={formData.beneficiario_id} onChange={e => setFormData({...formData, beneficiario_id: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white cursor-pointer">
                <option value="">Seleccionar...</option>
                {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </div>
          )}
          
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-widest">Concepto</label>
            <input required type="text" placeholder="Ej: Premio objetivo ventas" value={formData.concepto} onChange={e => setFormData({...formData, concepto: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-widest">Monto</label>
              <input required type="number" placeholder="0" value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white font-mono" />
            </div>
            <div className="w-24">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block uppercase tracking-widest">Moneda</label>
              <select value={formData.moneda} onChange={e => setFormData({...formData, moneda: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white cursor-pointer">
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={cargando} className="w-full mt-4 px-6 py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {cargando ? "Procesando..." : <><Save className="w-4 h-4" /> {esAdmin ? "Cargar y Aprobar" : "Enviar Solicitud"}</>}
          </button>
        </form>
      </div>
    </div>
  );
}