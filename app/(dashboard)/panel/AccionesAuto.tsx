"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";

// en panel/page.tsx, junto con la consulta de vehículos:
const { data: { user } } = await supabase.auth.getUser();
const { data: perfil } = await supabase
  .from("perfiles")
  .select("rol")
  .eq("id", user?.id)
  .single();

const puedeGestionar = perfil?.rol === "admin" || perfil?.rol === "encargado";
export default function AccionesAuto({ autoId, estadoActual }: { autoId: string, estadoActual: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  

  const cambiarEstado = async (nuevoEstado: string) => {
    setCargando(true);
    
    const { error } = await supabase
      .from("vehiculos")
      .update({ estado: nuevoEstado })
      .eq("id", autoId);

    if (error) {
      console.error("Error al actualizar:", error);
      alert("Hubo un error al cambiar el estado.");
    } else {
      router.refresh();
    }
    
    setCargando(false);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={estadoActual}
        onChange={(e) => cambiarEstado(e.target.value)}
        disabled={cargando}
        className={`text-xs font-bold px-3 py-1.5 rounded-full border outline-none cursor-pointer appearance-none transition-colors
          ${cargando ? 'opacity-50 cursor-wait' : ''}
          ${estadoActual === 'Borrador' ? 'bg-gray-800 text-gray-300 border-gray-600' : ''}
          ${estadoActual === 'Disponible' ? 'bg-green-900/30 text-green-400 border-green-700/50' : ''}
          ${estadoActual === 'Reservado' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50' : ''}
          ${estadoActual === 'Vendido' ? 'bg-blue-900/30 text-blue-400 border-blue-700/50' : ''}
          ${estadoActual === 'Archivado' ? 'bg-red-900/30 text-red-400 border-red-700/50' : ''}
        `}
      >
        <option value="Borrador" className="bg-gray-900 text-white">Borrador</option>
        <option value="Disponible" className="bg-gray-900 text-white">Disponible</option>
        <option value="Reservado" className="bg-gray-900 text-white">Reservado</option>
        <option value="Vendido" className="bg-gray-900 text-white">Vendido</option>
        <option value="Archivado" className="bg-gray-900 text-white">Archivado</option>
      </select>
    </div>
  );
}