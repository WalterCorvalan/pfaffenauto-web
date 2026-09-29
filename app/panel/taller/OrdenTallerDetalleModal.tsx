"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { X, ChevronLeft, ChevronRight, CheckCircle2, Circle, Wrench, FileText } from "lucide-react";
import { ETAPAS_TALLER, ETAPA_LABEL, indiceEtapa, etapaSiguiente, etapaAnterior, puedeAvanzarAEntrega } from "./etapasTaller";

export default function OrdenTallerDetalleModal({
  orden, mecanicos, onClose, onActualizada,
}: { orden: any; mecanicos: any[]; onClose: () => void; onActualizada: (orden: any) => void }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const mecanicoNombre = mecanicos.find((m) => m.id === orden.mecanico_id)?.nombre || "Sin asignar";
  const indiceActual = indiceEtapa(orden.estado);

  const cambiarEstado = async (nuevoEstado: string | null) => {
    if (!nuevoEstado) return;
    if (nuevoEstado === "entrega" && !puedeAvanzarAEntrega(orden.estado, orden.gestoria_lista)) {
      setError("Falta marcar Gestoría como lista antes de pasar a Entrega.");
      return;
    }
    setError("");
    setGuardando(true);
    const { data, error: err } = await supabase2.from("taller_ordenes").update({ estado: nuevoEstado }).eq("id", orden.id).select().single();
    setGuardando(false);
    if (err) return setError("No se pudo actualizar el estado.");
    onActualizada(data);
  };

  const toggleGestoria = async () => {
    setGuardando(true);
    const { data, error: err } = await supabase2.from("taller_ordenes").update({ gestoria_lista: !orden.gestoria_lista }).eq("id", orden.id).select().single();
    setGuardando(false);
    if (err) return setError("No se pudo actualizar Gestoría.");
    onActualizada(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 pb-4 shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-white/5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">OT {orden.patente || "sin patente"}</p>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{orden.marca} {orden.modelo} {orden.anio || ""}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{orden.cliente_nombre} · {mecanicoNombre}</p>
          </div>
          <button onClick={onClose} className="p-1.5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-6 overflow-y-auto flex-1 min-h-0 space-y-6">
          {/* Etapa actual y navegación */}
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Etapa actual</p>
            <p className="text-xl font-black text-[#0145F2] mb-4">{ETAPA_LABEL[orden.estado] || orden.estado}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => cambiarEstado(etapaAnterior(orden.estado))}
                disabled={guardando || indiceActual === 0}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <button
                onClick={() => cambiarEstado(etapaSiguiente(orden.estado))}
                disabled={guardando || indiceActual === ETAPAS_TALLER.length - 1}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-xl disabled:opacity-40"
              >
                Siguiente: {etapaSiguiente(orden.estado) ? ETAPA_LABEL[etapaSiguiente(orden.estado)!] : "—"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {error && <p className="text-xs text-rose-500 font-bold mt-2">{error}</p>}
          </div>

          {/* Gestoría (paralelo) */}
          <button
            onClick={toggleGestoria}
            disabled={guardando}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-colors ${
              orden.gestoria_lista
                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10"
            }`}
          >
            {orden.gestoria_lista ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 shrink-0" />}
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Gestoría {orden.gestoria_lista ? "lista" : "pendiente"}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Corre en paralelo — hace falta tenerla lista para pasar a Entrega.</p>
            </div>
          </button>

          {/* Línea de tiempo completa */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" /> Todas las etapas</p>
            <div className="space-y-1.5">
              {ETAPAS_TALLER.map((e, i) => (
                <button
                  key={e.value}
                  onClick={() => cambiarEstado(e.value)}
                  disabled={guardando}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors ${
                    i === indiceActual
                      ? "bg-[#0145F2]/10 text-[#0145F2] dark:text-[#5b8dff]"
                      : i < indiceActual
                      ? "text-slate-400 dark:text-slate-500"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  {i < indiceActual ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : i === indiceActual ? <div className="w-4 h-4 rounded-full bg-[#0145F2] shrink-0" /> : <Circle className="w-4 h-4 text-slate-200 dark:text-slate-700 shrink-0" />}
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {orden.motivo_ingreso && (
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Motivo de ingreso</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{orden.motivo_ingreso}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
