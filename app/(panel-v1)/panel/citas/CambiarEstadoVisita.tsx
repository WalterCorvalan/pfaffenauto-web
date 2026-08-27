"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
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
    <div className="relative flex-1">
      <select
        value={estadoActual}
        onChange={handleChange}
        disabled={loading}
        className="w-full bg-white dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] text-[11px] font-bold text-slate-600 dark:text-slate-300 rounded-md px-2 py-1.5 outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer pr-8 disabled:opacity-50"
      >
        <option value="Pendiente" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Pendiente</option>
        <option value="Confirmada" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Confirmada</option>
        <option value="Asistió" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Asistió</option>
        <option value="Cancelada" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Cancelada</option>
      </select>
      {loading && (
        <Loader2 className="w-3 h-3 text-indigo-500 animate-spin absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      )}
      {!loading && (
        <svg className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      )}
    </div>
  );
}