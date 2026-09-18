"use client";

import { AlertTriangle } from "lucide-react";

interface Props {
  abierto: boolean;
  titulo?: string;
  mensaje: string;
  onCerrar: () => void;
}

// Reemplazo del alert() nativo del navegador -- mismo motivo que
// ConfirmDialog.tsx (aviso de "JavaScript de <dominio>" que no encaja con
// el resto del panel), para mensajes puramente informativos (sin opción de
// cancelar, un solo botón).
export default function AlertDialog({ abierto, titulo = "Atención", mensaje, onCerrar }: Props) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40" onClick={onCerrar}>
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
        <div className="flex justify-end">
          <button onClick={onCerrar} className="px-3.5 py-2 text-xs font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg transition-colors">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
