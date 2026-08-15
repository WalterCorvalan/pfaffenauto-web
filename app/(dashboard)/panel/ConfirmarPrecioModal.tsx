"use client";

import { AlertTriangle } from "lucide-react";

export default function ConfirmarPrecioModal({
  precioTexto,
  onConfirmar,
  onNoSeguro,
  onCancelar,
}: {
  precioTexto: string;
  onConfirmar: () => void;
  onNoSeguro: () => void;
  onCancelar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Confirmá el valor</h3>
        </div>
        <p className="text-[13px] text-slate-600 leading-relaxed">
          Vas a generar el documento con <strong className="text-slate-900">{precioTexto}</strong>. Verificá que no sea un precio viejo antes de continuar.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onConfirmar}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-[12px] uppercase tracking-widest transition-colors"
          >
            Sí, es el valor correcto
          </button>
          <button
            type="button"
            onClick={onNoSeguro}
            className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold py-2.5 rounded-xl text-[12px] uppercase tracking-widest transition-colors"
          >
            No estoy seguro, avisar al encargado
          </button>
          <button type="button" onClick={onCancelar} className="w-full text-slate-400 hover:text-slate-600 text-[11px] font-bold py-1">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
