"use client";

import { useState } from "react";
import { MessageCircle, X, Globe, PenSquare, Mail } from "lucide-react";

// Burbuja de "Mensajes" (arriba del botón "+"). El módulo de mensajería en
// sí (Comunicación → Mensajes) todavía no está construido — esto reproduce
// la cáscara visual del CRM viejo; las acciones avisan que falta conectarlas.
export default function MensajesBubble() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-6 z-40">
      {open && (
        <>
          <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-14 right-0 w-72 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 mb-1">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Mensajes</p>
                <p className="text-[11px] text-slate-400 leading-snug">Tocá un chat para abrirlo en una ventana flotante</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              title="La mensajería todavía no está construida"
              className="w-full flex items-center gap-2.5 px-2 py-2.5 mt-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-left"
            >
              <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">General</span>
                <span className="block text-[11px] text-slate-400 truncate">Canal principal del equipo</span>
              </span>
            </button>

            <div className="border-t border-slate-100 dark:border-white/10 mt-2 pt-2 space-y-1">
              <button type="button" title="Todavía no construido" className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                <PenSquare className="w-3.5 h-3.5" /> Mensaje nuevo
              </button>
              <button type="button" title="Todavía no construido" className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5">
                <Mail className="w-3.5 h-3.5" /> Ver Mensajes completo
              </button>
            </div>
          </div>
        </>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-11 h-11 rounded-full bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 shadow-lg flex items-center justify-center transition-transform active:scale-95"
        title="Mensajes"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
    </div>
  );
}
