"use client";

import { AlertTriangle } from "lucide-react";

interface Props {
  abierto: boolean;
  titulo?: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

// Reemplazo del confirm() nativo del navegador -- en algunos casos (Chrome
// con extensiones, ciertos flujos embebidos) el confirm() nativo tira un
// warning de "JavaScript de <dominio>" y una animación que no encaja con el
// resto del panel. Mismo patrón visual que los demás modales.
export default function ConfirmDialog({ abierto, titulo = "Confirmar", mensaje, textoConfirmar = "Confirmar", textoCancelar = "Cancelar", onConfirmar, onCancelar }: Props) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40" onClick={onCancelar}>
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{titulo}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{mensaje}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancelar} className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
            {textoCancelar}
          </button>
          <button onClick={onConfirmar} className="px-3.5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors">
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
