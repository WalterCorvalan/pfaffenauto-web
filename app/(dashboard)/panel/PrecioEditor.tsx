"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { DollarSign, Edit3, X, Save } from "lucide-react";

interface PrecioEditorProps {
  autoId: string;
  precioArs: number | null;
  precioUsd: number | null;
  puedeGestionar: boolean;
}

export default function PrecioEditor({ autoId, precioArs, precioUsd, puedeGestionar }: PrecioEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [ars, setArs] = useState(precioArs?.toString() || "");
  const [usd, setUsd] = useState(precioUsd?.toString() || "");
  const [cargando, setCargando] = useState(false);

  const guardarPrecio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeGestionar) return;
    setCargando(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updateData = { precio_publicado_ars: ars ? Number(ars) : null, precio_publicado_usd: usd ? Number(usd) : null };

      const { error } = await supabase.from("vehiculos").update(updateData).eq("id", autoId);
      if (error) throw error;

      await supabase.from("historial_cambios").insert({
        tabla: "vehiculos", registro_id: autoId, campo_modificado: "precios_publicados",
        valor_anterior: `ARS: ${precioArs} | USD: ${precioUsd}`, valor_nuevo: `ARS: ${updateData.precio_publicado_ars} | USD: ${updateData.precio_publicado_usd}`,
        usuario_id: user?.id,
      });

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error al actualizar precio:", error);
      alert("Error al actualizar el precio.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <div 
        onClick={() => puedeGestionar && setIsEditing(true)}
        className={`inline-flex flex-col gap-0.5 font-mono transition-all rounded-lg p-1.5 -ml-1.5
          ${puedeGestionar ? 'cursor-pointer hover:bg-slate-50 group' : 'cursor-default'}
        `}
        title={puedeGestionar ? "Tocar para editar precios" : ""}
      >
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-emerald-700 text-[15px]">
            {precioArs ? `$ ${precioArs.toLocaleString("es-AR")}` : "Sin ARS"}
          </span>
          {puedeGestionar && (
            <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
          )}
        </div>
        <div className="text-[11px] text-slate-500 font-semibold">
          {precioUsd ? `U$S ${precioUsd.toLocaleString("en-US")}` : "Sin USD"}
        </div>
      </div>

      {isEditing && puedeGestionar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !cargando && setIsEditing(false)}></div>
          <div className="relative bg-white border border-slate-200 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" /> Edición de Precios
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={guardarPrecio} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Precio en Dólares (USD)</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:border-emerald-500 transition-colors shadow-sm">
                  <span className="text-slate-400 mr-2 font-bold">US$</span>
                  <input type="number" value={usd} onChange={(e) => setUsd(e.target.value)} placeholder="Ej: 21000" className="w-full bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-mono" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Precio en Pesos (ARS)</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:border-emerald-500 transition-colors shadow-sm">
                  <span className="text-slate-400 mr-2 font-bold">AR$</span>
                  <input type="number" value={ars} onChange={(e) => setArs(e.target.value)} placeholder="Ej: 24500000" className="w-full bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-mono" />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={cargando} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  {cargando ? "Guardando..." : <><Save className="w-3.5 h-3.5" /> Guardar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}