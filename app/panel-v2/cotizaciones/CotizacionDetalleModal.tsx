"use client";

import { useState } from "react";
import { X, Download, MessageCircle, Trash2, ShoppingCart, Pencil, Send } from "lucide-react";
import { fmtFechaLocal } from "@/lib/panelV2/fechas";

interface Cotizacion {
  id: string; cliente_nombre: string; vehiculo_descripcion: string | null;
  permuta_marca: string | null; permuta_modelo: string | null; permuta_anio: number | null; permuta_km: number | null;
  permuta_estado: string | null; permuta_patente: string | null;
  precio_sugerido: number; precio_aprobado: number | null; moneda: string; fecha_emision: string;
  notas: string | null; notas_admin: string | null; estado: string; created_at: string;
  conversacion: { autor_nombre: string; texto: string; created_at: string }[];
  historial: { estado: string; actor_nombre: string; created_at: string }[];
}

const ESTADO_BADGE: Record<string, string> = {
  pendiente: "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300",
  aprobada: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rechazada: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300",
};
const ESTADO_LABEL: Record<string, string> = { pendiente: "Pendiente", aprobada: "Aprobada", rechazada: "Rechazada" };

function Fila({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <div className="col-span-2 text-sm text-slate-800 dark:text-white">{children}</div>
    </div>
  );
}

export default function CotizacionDetalleModal({
  cotizacion: c, vendedorNombre, onClose, onComentar, onEliminar, onEditar,
}: { cotizacion: Cotizacion; vendedorNombre: string; onClose: () => void; onComentar: (texto: string) => void; onEliminar: () => void; onEditar: () => void }) {
  const [comentario, setComentario] = useState("");

  const enviarComentario = () => {
    if (!comentario.trim()) return;
    onComentar(comentario.trim());
    setComentario("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-5 pb-3 shrink-0">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${ESTADO_BADGE[c.estado]}`}>{ESTADO_LABEL[c.estado]}</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 pb-4 overflow-y-auto flex-1 min-h-0">
          <div className="border border-slate-100 dark:border-white/10 rounded-xl px-4">
            <Fila label="Cliente">{c.cliente_nombre}</Fila>
            <Fila label="Vehículo">{c.vehiculo_descripcion || "—"}</Fila>
            {(c.permuta_marca || c.permuta_modelo) && (
              <Fila label="Auto en permuta">
                <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{c.permuta_marca} {c.permuta_modelo}{c.permuta_anio ? ` · (${c.permuta_anio})` : ""}{c.permuta_km ? ` · ${c.permuta_km.toLocaleString("es-AR")} km` : ""}{c.permuta_estado ? ` · ${c.permuta_estado}` : ""}{c.permuta_patente ? ` · ${c.permuta_patente}` : ""}</span>
              </Fila>
            )}
            <Fila label="Precio sugerido"><strong>{c.moneda} {c.precio_sugerido.toLocaleString("es-AR")}</strong></Fila>
            {c.precio_aprobado != null && <Fila label="Precio aprobado"><strong className="text-emerald-600 dark:text-emerald-400">{c.moneda} {c.precio_aprobado.toLocaleString("es-AR")}</strong></Fila>}
            <Fila label="Vendedor">{vendedorNombre}</Fila>
            <Fila label="Fecha de emisión">{fmtFechaLocal(c.fecha_emision)}</Fila>
            <Fila label="Notas">{c.notas || "—"}</Fila>
            {c.notas_admin && <Fila label="Notas del admin">{c.notas_admin}</Fila>}
            <Fila label="Creada">{new Date(c.created_at).toLocaleString("es-AR")}</Fila>
          </div>

          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-400 mt-5 mb-2"><MessageCircle className="w-3.5 h-3.5" /> Conversación ({c.conversacion?.length || 0})</p>
          <div className="space-y-2 mb-2">
            {(c.conversacion || []).map((m, i) => (
              <div key={i} className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl px-3 py-2">
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300">{m.autor_nombre} · {new Date(m.created_at).toLocaleString("es-AR")}</p>
                <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">{m.texto}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={comentario} onChange={(e) => setComentario(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviarComentario()} placeholder="Escribir comentario..." className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-rose-500 text-slate-900 dark:text-white" />
            <button onClick={enviarComentario} className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Send className="w-3.5 h-3.5" /></button>
          </div>

          {c.historial?.length > 0 && (
            <>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-5 mb-2">Historial de estados ({c.historial.length})</p>
              <div className="space-y-1.5">
                {c.historial.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2">
                    <span className={`font-bold px-2 py-0.5 rounded-full ${ESTADO_BADGE[h.estado]}`}>{ESTADO_LABEL[h.estado]}</span>
                    <span className="text-slate-400">{new Date(h.created_at).toLocaleString("es-AR")} · {h.actor_nombre}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 p-4 border-t border-slate-100 dark:border-white/10 shrink-0">
          <button onClick={onClose} className="px-3 py-2 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-300">Cerrar</button>
          <button disabled title="Todavía no construido" className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-400 opacity-60 cursor-not-allowed"><Download className="w-3.5 h-3.5" /> PDF</button>
          <a href={`https://wa.me/?text=${encodeURIComponent(`Cotización ${c.cliente_nombre} — ${c.vehiculo_descripcion || ""} — ${c.moneda} ${(c.precio_aprobado ?? c.precio_sugerido).toLocaleString("es-AR")}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</a>
          <button onClick={onEliminar} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-rose-600"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
          {c.estado === "aprobada" && <a href={`/panel-v2/ventas?cotizacion=${c.id}`} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg ml-auto"><ShoppingCart className="w-3.5 h-3.5" /> Convertir a venta</a>}
          <button onClick={onEditar} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-300 ${c.estado === "aprobada" ? "" : "ml-auto"}`}><Pencil className="w-3.5 h-3.5" /> Editar</button>
        </div>
      </div>
    </div>
  );
}
