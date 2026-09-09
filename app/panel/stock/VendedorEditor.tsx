"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { UserCircle2, X, Save, AlertTriangle } from "lucide-react";

export default function VendedorEditor({
  vehiculoId, vendedorId, vendedorNombre, vehiculoSucursalId, perfiles, onActualizado,
}: {
  vehiculoId: string; vendedorId: string | null; vendedorNombre: string | null; vehiculoSucursalId?: string | null;
  perfiles: { id: string; nombre: string; sucursal_id?: string | null }[]; onActualizado: (id: string, cambios: any) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nuevo, setNuevo] = useState(vendedorId || "");
  const [guardando, setGuardando] = useState(false);

  // Mismo criterio que v1 (VendedorEditor de panel v1): agrupar primero los
  // de la sucursal del auto, y avisar si se elige a alguien de otra --
  // pasa justo el caso motivador: vendedor de Don Torcuato con un auto que
  // está físicamente en Casa Central.
  const perfilesSucursal = vehiculoSucursalId ? perfiles.filter((p) => p.sucursal_id === vehiculoSucursalId) : perfiles;
  const perfilesOtros = vehiculoSucursalId ? perfiles.filter((p) => p.sucursal_id !== vehiculoSucursalId) : [];
  const perfilesOrdenados = [...perfilesSucursal, ...perfilesOtros];
  const nuevoEsOtraSucursal = !!nuevo && perfilesOtros.some((p) => p.id === nuevo);

  const guardar = async () => {
    if (nuevo === (vendedorId || "")) return setEditando(false);
    setGuardando(true);
    const { error } = await supabase2.from("vehiculos").update({ vendedor_asignado_id: nuevo || null }).eq("id", vehiculoId);
    setGuardando(false);
    if (error) return alert("No se pudo asignar el vendedor.");
    onActualizado(vehiculoId, { vendedor_asignado_id: nuevo || null });
    setEditando(false);
  };

  if (!editando) {
    return (
      <button onClick={() => setEditando(true)} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold hover:text-rose-600 dark:hover:text-rose-400 group">
        <UserCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-rose-500" />
        {vendedorNombre || <span className="text-slate-300 dark:text-slate-600 font-normal">Sin asignar</span>}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !guardando && setEditando(false)} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-xs rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><UserCircle2 className="w-4 h-4 text-rose-600" /> Asignar vendedor</h3>
          <button onClick={() => setEditando(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <select value={nuevo} onChange={(e) => setNuevo(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white">
          <option value="">Sin asignar</option>
          {perfilesOrdenados.map((p) => <option key={p.id} value={p.id}>{p.nombre}{perfilesOtros.includes(p) ? " (otra sucursal)" : ""}</option>)}
        </select>
        {nuevoEsOtraSucursal && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Esta persona no pertenece a la sucursal del auto.
          </p>
        )}
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
