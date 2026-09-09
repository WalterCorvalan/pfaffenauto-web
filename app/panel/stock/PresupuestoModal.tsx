"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2, FileText } from "lucide-react";

interface Vehiculo { id: string; marca: string; modelo: string; precio_venta: number; moneda_venta: string }
interface Props { vehiculo: Vehiculo; miId: string; onClose: () => void }

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block";

export default function PresupuestoModal({ vehiculo, miId, onClose }: Props) {
  const [clienteNombre, setClienteNombre] = useState("");
  const [precioArs, setPrecioArs] = useState(vehiculo.moneda_venta === "ARS" ? String(vehiculo.precio_venta) : "");
  const [precioUsd, setPrecioUsd] = useState(vehiculo.moneda_venta === "USD" ? String(vehiculo.precio_venta) : "");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);

  const guardar = async () => {
    if (!clienteNombre.trim()) {
      setError("Falta el nombre del cliente.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const { error: errInsert } = await supabase2.from("presupuestos").insert({
        vehiculo_id: vehiculo.id,
        cliente_nombre: clienteNombre.trim(),
        precio_ars: precioArs ? Number(precioArs) : null,
        precio_usd: precioUsd ? Number(precioUsd) : null,
        observaciones: observaciones || null,
        vendedor_id: miId || null,
      });
      if (errInsert) throw errInsert;
      setGuardado(true);
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el presupuesto.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500" /> Nuevo presupuesto</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{vehiculo.marca} {vehiculo.modelo}</p>

        {error && <div className="mb-3 p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-xl font-medium">{error}</div>}

        {guardado ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Presupuesto guardado.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nombre del cliente *</label>
              <input autoFocus value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Apellido y nombre" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Precio ($)</label>
                <input type="number" value={precioArs} onChange={(e) => setPrecioArs(e.target.value)} placeholder="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Precio (US$)</label>
                <input type="number" value={precioUsd} onChange={(e) => setPrecioUsd(e.target.value)} placeholder="0" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Observaciones</label>
              <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={3} className={inputClass} />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-5 mt-1 border-t border-slate-100 dark:border-white/10">
          <button onClick={onClose} disabled={guardando} className="flex-1 py-2.5 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl transition-colors disabled:opacity-50">{guardado ? "Cerrar" : "Cancelar"}</button>
          {!guardado && (
            <button onClick={guardar} disabled={guardando} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors disabled:opacity-50">
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar presupuesto"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
