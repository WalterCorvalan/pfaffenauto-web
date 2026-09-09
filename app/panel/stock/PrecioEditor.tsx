"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { DollarSign, X, Save } from "lucide-react";

function fmtPrecio(n: number, moneda: string) {
  return moneda === "ARS" ? `$ ${n.toLocaleString("es-AR")}` : `${moneda} ${n.toLocaleString("es-AR")}`;
}

export default function PrecioEditor({
  vehiculoId, precio, moneda, onActualizado,
}: {
  vehiculoId: string; precio: number; moneda: string; onActualizado: (id: string, cambios: any) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nuevoPrecio, setNuevoPrecio] = useState(String(precio || ""));
  const [nuevaMoneda, setNuevaMoneda] = useState(moneda);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const monto = Number(nuevoPrecio);
    if (!monto || monto <= 0) return alert("Cargá un precio válido.");
    if (monto === precio && nuevaMoneda === moneda) return setEditando(false);
    setGuardando(true);
    const { error } = await supabase2.from("vehiculos").update({ precio_venta: monto, moneda_venta: nuevaMoneda }).eq("id", vehiculoId);
    setGuardando(false);
    if (error) return alert("No se pudo actualizar el precio.");
    onActualizado(vehiculoId, { precio_venta: monto, moneda_venta: nuevaMoneda });
    setEditando(false);
  };

  if (!editando) {
    return (
      <button onClick={() => setEditando(true)} className="font-bold text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400">
        {precio ? fmtPrecio(precio, moneda) : <span className="text-slate-300 dark:text-slate-600 font-normal">Sin precio</span>}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !guardando && setEditando(false)} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-xs rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><DollarSign className="w-4 h-4 text-rose-600" /> Editar precio</h3>
          <button onClick={() => setEditando(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-2">
          <select value={nuevaMoneda} onChange={(e) => setNuevaMoneda(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2.5 text-sm outline-none text-slate-900 dark:text-white">
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
          <input type="number" value={nuevoPrecio} onChange={(e) => setNuevoPrecio(e.target.value)} placeholder="Precio" className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white font-mono" />
        </div>
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
