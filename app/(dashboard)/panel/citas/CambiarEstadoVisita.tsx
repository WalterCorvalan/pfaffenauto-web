"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CambiarEstadoVisita({ 
  visitaId, 
  estadoActual 
}: { 
  visitaId: string; 
  estadoActual: string; 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoEstado = e.target.value;
    if (nuevoEstado === estadoActual) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("visitas_agendadas")
        .update({ estado: nuevoEstado })
        .eq("id", visitaId);
        
      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between w-full">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
        Cambiar estado:
      </span>
      <div className="relative">
        <select
          value={estadoActual}
          onChange={handleChange}
          disabled={loading}
          className="bg-[#0b1329] border border-[#1e293b] text-xs font-bold text-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-[#0ea5e9] transition-colors appearance-none cursor-pointer pr-8 disabled:opacity-50"
        >
          <option value="Pendiente">Pendiente</option>
          <option value="Confirmada">Confirmada</option>
          <option value="Asistió">Asistió</option>
          <option value="Cancelada">Cancelada</option>
        </select>
        {loading && (
          <Loader2 className="w-3 h-3 text-[#0ea5e9] animate-spin absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
        {!loading && (
          <svg className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        )}
      </div>
    </div>
  );
}