"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { DollarSign, Edit3, X, Save } from "lucide-react";

interface EdicionPrecioProps {
  autoId: string;
  precioArs: number | null;
  precioUsd: number | null;
  puedeGestionar: boolean;
}

export default function EdicionPrecio({ autoId, precioArs, precioUsd, puedeGestionar }: EdicionPrecioProps) {
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
        className={`inline-flex flex-col gap-0.5 font-mono text-[#4A90E2] transition-all rounded-lg p-1.5 -ml-1.5
          ${puedeGestionar ? 'cursor-pointer hover:bg-white/10 hover:text-white group' : 'cursor-default'}
        `}
        title={puedeGestionar ? "Tocar para editar precios" : ""}
      >
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white text-sm md:text-base">
            {precioArs ? `$ ${precioArs.toLocaleString("es-AR")}` : "Sin ARS"}
          </span>
          {puedeGestionar && (
            <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
          )}
        </div>
        <div className="text-xs text-gray-400 font-medium">
          {precioUsd ? `U$S ${precioUsd.toLocaleString("en-US")}` : "Sin USD"}
        </div>
      </div>

      {isEditing && puedeGestionar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !cargando && setIsEditing(false)}></div>
          
          <div className="relative bg-[#121212] border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-3">
              <h3 className="text-lg font-serif text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#0055A4]" /> Edición de Precios
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={guardarPrecio} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Precio en Dólares (USD)</label>
                <div className="flex items-center bg-[#0A0A0A] border border-white/10 rounded-xl px-3 focus-within:border-[#0055A4] transition-colors shadow-inner">
                  <span className="text-gray-500 mr-2 font-bold">US$</span>
                  <input type="number" value={usd} onChange={(e) => setUsd(e.target.value)} placeholder="Ej: 21000" className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-gray-600 font-mono" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Precio en Pesos (ARS)</label>
                <div className="flex items-center bg-[#0A0A0A] border border-white/10 rounded-xl px-3 focus-within:border-[#0055A4] transition-colors shadow-inner">
                  <span className="text-gray-500 mr-2 font-bold">AR$</span>
                  <input type="number" value={ars} onChange={(e) => setArs(e.target.value)} placeholder="Ej: 24500000" className="w-full bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-gray-600 font-mono" />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-white/5 flex gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={cargando} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest bg-[#0055A4] hover:bg-[#1E6FD9] text-white rounded-xl transition-colors shadow-lg disabled:opacity-50">
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