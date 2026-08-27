"use client";

import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";

const inputClass = "w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors text-slate-900 dark:text-white";

// El encargado revisa el precio que cargó el vendedor: lo deja igual (confirma)
// o lo corrige. En los dos casos queda un registro de qué valor final quedó,
// para poder avisarle al vendedor qué contestó.
export default function ConfirmarPrecioEncargadoModal({
  precioArsActual,
  precioUsdActual,
  guardando,
  onConfirmar,
  onClose,
}: {
  precioArsActual: number | null;
  precioUsdActual: number | null;
  guardando: boolean;
  onConfirmar: (ars: number | null, usd: number | null) => void;
  onClose: () => void;
}) {
  const [ars, setArs] = useState(precioArsActual ? String(precioArsActual) : "");
  const [usd, setUsd] = useState(precioUsdActual ? String(precioUsdActual) : "");

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#001c55] rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Revisar precio</h3>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[12px] text-slate-500 dark:text-slate-400">
          Dejalo como está si el precio es correcto, o corregilo antes de confirmar.
        </p>
        <div>
          <label className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1 block">Venta ($)</label>
          <input type="number" step="0.01" className={inputClass} value={ars} onChange={(e) => setArs(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1 block">Venta (US$)</label>
          <input type="number" step="0.01" className={inputClass} value={usd} onChange={(e) => setUsd(e.target.value)} placeholder="0" />
        </div>
        <button
          onClick={() => onConfirmar(ars ? Number(ars) : null, usd ? Number(usd) : null)}
          disabled={guardando}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-[11px] uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> {guardando ? "Guardando..." : "Confirmar precio"}
        </button>
      </div>
    </div>
  );
}
