"use client";

import { X, CreditCard, MessageSquareText } from "lucide-react";

function Fila({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-50 dark:border-white/5 last:border-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 col-span-1">{label}</p>
      <p className="text-sm text-slate-800 dark:text-white col-span-2 whitespace-pre-wrap">{valor ?? "—"}</p>
    </div>
  );
}

export default function FinanciacionDetalleModal({ solicitud: s, onClose }: { solicitud: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => { if (window.innerWidth >= 768) onClose(); }}>
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 pt-4 pb-2 sticky top-0 bg-white dark:bg-[#111] z-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-rose-600" /> Solicitud de financiación</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Cliente</p>
            <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3">
              <Fila label="Nombre" valor={s.nombre} />
              <Fila label="Teléfono" valor={s.telefono} />
              <Fila label="Email" valor={s.email} />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Vehículo</p>
            <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3">
              <Fila label="Descripción" valor={[s.marca, s.modelo, s.anio].filter(Boolean).join(" ") || "—"} />
              <Fila label="Km" valor={s.kilometraje ? Number(s.kilometraje).toLocaleString("es-AR") : null} />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Detalle del plan pedido</p>
            <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2">
              <p className="text-sm text-slate-800 dark:text-white whitespace-pre-wrap">{s.version || "Sin detalle."}</p>
            </div>
          </div>

          {(s.utm_source || s.utm_medium || s.utm_campaign || s.canal_origen) && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Origen</p>
              <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl px-3">
                <Fila label="Canal" valor={s.canal_origen} />
                <Fila label="UTM Source" valor={s.utm_source} />
                <Fila label="UTM Medium" valor={s.utm_medium} />
                <Fila label="UTM Campaign" valor={s.utm_campaign} />
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400">Recibido el {new Date(s.created_at).toLocaleString("es-AR")}</p>

          {s.telefono && (
            <a
              href={`https://wa.me/${s.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${s.nombre}! Te contactamos de Pfaffen Autos por tu solicitud de financiación${s.marca ? ` para el ${s.marca} ${s.modelo || ""}`.trim() : ""}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
            >
              <MessageSquareText className="w-4 h-4" /> Contactar por WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
