"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { MapPin, Edit3, X, Save } from "lucide-react";

interface EdicionSucursalProps {
  autoId: string;
  sucursalActualId: string | null;
  sucursalActualNombre: string | null;
  sucursales: { id: string; nombre: string }[];
  puedeGestionar: boolean;
}

export default function EdicionSucursal({ autoId, sucursalActualId, sucursalActualNombre, sucursales, puedeGestionar }: EdicionSucursalProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [nuevaSucursal, setNuevaSucursal] = useState(sucursalActualId || "");
  const [cargando, setCargando] = useState(false);

  const guardarSucursal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeGestionar || nuevaSucursal === sucursalActualId) return;
    setCargando(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("vehiculos").update({ sucursal_id: nuevaSucursal }).eq("id", autoId);
      if (error) throw error;

      const nombreNueva = sucursales.find(s => s.id === nuevaSucursal)?.nombre || "N/A";

      await supabase.from("historial_cambios").insert({
        tabla: "vehiculos", registro_id: autoId, campo_modificado: "sucursal_id",
        valor_anterior: sucursalActualNombre || "Sin sucursal", valor_nuevo: nombreNueva,
        usuario_id: user?.id,
      });

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error al actualizar sucursal:", error);
      alert("Error al mover el vehículo de sucursal.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <div 
        onClick={() => puedeGestionar && setIsEditing(true)}
        className={`inline-flex items-center gap-1.5 truncate font-medium text-sm transition-all rounded-md px-1.5 py-1 -ml-1.5
          ${puedeGestionar ? 'cursor-pointer hover:bg-white/10 hover:text-white text-gray-300 group' : 'cursor-default text-gray-300'}
        `}
        title={puedeGestionar ? "Tocar para mover de sucursal" : ""}
      >
        <MapPin className={`w-3.5 h-3.5 shrink-0 ${puedeGestionar ? 'text-gray-500 group-hover:text-white' : 'text-gray-500'}`} />
        <span className="truncate">{sucursalActualNombre || "Sin asignar"}</span>
        
        {puedeGestionar && (
          <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0" />
        )}
      </div>

      {isEditing && puedeGestionar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !cargando && setIsEditing(false)}></div>
          
          <div className="relative bg-[#121212] border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-3">
              <h3 className="text-lg font-serif text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0055A4]" /> Mover Vehículo
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={guardarSucursal} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Nueva Ubicación</label>
                <div className="flex items-center bg-[#0A0A0A] border border-white/10 rounded-xl px-3 focus-within:border-[#0055A4] transition-colors shadow-inner">
                  <select value={nuevaSucursal} onChange={(e) => setNuevaSucursal(e.target.value)} className="w-full bg-transparent py-3 text-sm text-white outline-none appearance-none cursor-pointer">
                    <option value="" disabled className="bg-[#121212]">Seleccionar sucursal...</option>
                    {sucursales.map(s => (<option key={s.id} value={s.id} className="bg-[#121212]">{s.nombre}</option>))}
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-white/5 flex gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={cargando || nuevaSucursal === sucursalActualId} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest bg-[#0055A4] hover:bg-[#1E6FD9] text-white rounded-xl transition-colors shadow-lg disabled:opacity-50">
                  {cargando ? "Moviendo..." : <><Save className="w-3.5 h-3.5" /> Confirmar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}