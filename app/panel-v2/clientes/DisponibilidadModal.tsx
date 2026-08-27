"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2, Sun, Palmtree, Thermometer } from "lucide-react";

interface Perfil { id: string; nombre: string; roles: string[] }
interface Disponibilidad { vendedor_id: string; estado: string; desde: string | null; hasta: string | null; recibir_leads: boolean }

interface Props {
  perfiles: Perfil[];
  disponibilidad: Disponibilidad[];
  miId: string;
  esAdmin: boolean;
  onClose: () => void;
  onGuardado: (fila: Disponibilidad) => void;
}

const ESTADOS = [
  { value: "disponible", label: "Disponible", icon: Sun, color: "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300" },
  { value: "vacaciones", label: "De vacaciones", icon: Palmtree, color: "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300" },
  { value: "enfermo", label: "Enfermo", icon: Thermometer, color: "bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300" },
];

export default function DisponibilidadModal({ perfiles, disponibilidad, miId, esAdmin, onClose, onGuardado }: Props) {
  const [vendedorId, setVendedorId] = useState(miId);
  const actual = disponibilidad.find((d) => d.vendedor_id === vendedorId);
  const [estado, setEstado] = useState(actual?.estado || "disponible");
  const [desde, setDesde] = useState(actual?.desde || "");
  const [hasta, setHasta] = useState(actual?.hasta || "");
  const [recibirLeads, setRecibirLeads] = useState(actual?.recibir_leads ?? true);
  const [guardando, setGuardando] = useState(false);

  const cambiarVendedor = (id: string) => {
    setVendedorId(id);
    const d = disponibilidad.find((x) => x.vendedor_id === id);
    setEstado(d?.estado || "disponible");
    setDesde(d?.desde || "");
    setHasta(d?.hasta || "");
    setRecibirLeads(d?.recibir_leads ?? true);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const payload = {
        vendedor_id: vendedorId,
        estado,
        desde: desde || null,
        hasta: hasta || null,
        recibir_leads: estado === "disponible" ? true : recibirLeads,
        actualizado_por: miId,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase2.from("disponibilidad_vendedor").upsert(payload).select().single();
      if (error) throw error;
      onGuardado(data);
      onClose();
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar la disponibilidad.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mi disponibilidad</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {esAdmin && (
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Vendedor</label>
              <select value={vendedorId} onChange={(e) => cambiarVendedor(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white">
                {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}{p.id === miId ? " (vos)" : ""}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {ESTADOS.map((e) => {
              const Icon = e.icon;
              const activo = estado === e.value;
              return (
                <button key={e.value} type="button" onClick={() => setEstado(e.value)} className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-[11px] font-semibold transition-colors ${activo ? e.color : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400"}`}>
                  <Icon className="w-4 h-4" /> {e.label}
                </button>
              );
            })}
          </div>

          {estado !== "disponible" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Desde</label>
                  <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Hasta</label>
                  <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white" />
                </div>
              </div>

              <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-pointer">
                <input type="checkbox" checked={recibirLeads} onChange={(e) => setRecibirLeads(e.target.checked)} className="w-4 h-4 accent-rose-600" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Seguir recibiendo leads mientras estoy ausente</span>
              </label>
              {!recibirLeads && <p className="text-[10px] text-amber-600 dark:text-amber-400">Salís de la rotación: tus leads sin contactar se reparten entre los que están trabajando. Volvés solo pasada la fecha "hasta".</p>}
            </>
          )}
        </div>

        <div className="pt-5 mt-2 border-t border-slate-100 dark:border-white/10 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl transition-colors">Cancelar</button>
          <button type="button" onClick={guardar} disabled={guardando} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors disabled:opacity-50">
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
