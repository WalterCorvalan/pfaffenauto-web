"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Building2, X, Save } from "lucide-react";

export default function SucursalEditor({
  vehiculoId, sucursalId, sucursalNombre, sucursales, onActualizado,
}: {
  vehiculoId: string; sucursalId: string | null; sucursalNombre: string | null;
  sucursales: { id: string; nombre: string }[]; onActualizado: (id: string, cambios: any) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nueva, setNueva] = useState(sucursalId || "");
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (nueva === (sucursalId || "")) return setEditando(false);
    setGuardando(true);
    const { error } = await supabase2.from("vehiculos").update({ sucursal_id: nueva || null }).eq("id", vehiculoId);
    setGuardando(false);
    if (error) return alert("No se pudo mover el vehículo.");
    onActualizado(vehiculoId, { sucursal_id: nueva || null, sucursal: nueva ? { nombre: sucursales.find((s) => s.id === nueva)?.nombre || "" } : null });
    setEditando(false);
  };

  if (!editando) {
    return (
      <button onClick={() => setEditando(true)} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold hover:text-rose-600 dark:hover:text-rose-400 group">
        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-rose-500" />
        {sucursalNombre || <span className="text-slate-300 dark:text-slate-600 font-normal">Sin asignar</span>}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !guardando && setEditando(false)} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-xs rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Building2 className="w-4 h-4 text-rose-600" /> Mover de sucursal</h3>
          <button onClick={() => setEditando(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <select value={nueva} onChange={(e) => setNueva(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white">
          <option value="">Sin asignar</option>
          {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={() => setEditando(false)} disabled={guardando} className="flex-1 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl disabled:opacity-50">Cancelar</button>
          <button onClick={guardar} disabled={guardando} className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50">
            {guardando ? "Guardando..." : <><Save className="w-3.5 h-3.5" /> Confirmar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
