"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, RotateCcw, Loader2 } from "lucide-react";

interface EstadoTasacionSelectorProps {
  cotizacionId: string;
  estadoTasacion: string;
}

export default function EstadoTasacionSelector({ cotizacionId, estadoTasacion }: EstadoTasacionSelectorProps) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  const cambiar = async (nuevo: string) => {
    setCargando(true);
    try {
      const { error } = await supabase.from("cotizaciones").update({ estado_tasacion: nuevo }).eq("id", cotizacionId);
      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error("Error al actualizar estado de tasación:", error);
      alert("No se pudo actualizar el estado.");
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-1.5">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (estadoTasacion === "Pendiente") {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => cambiar("Aprobada")}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" /> Aprobar
        </button>
        <button
          type="button"
          onClick={() => cambiar("Rechazada")}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors"
        >
          <XCircle className="w-3.5 h-3.5" /> Rechazar
        </button>
      </div>
    );
  }

  const aprobada = estadoTasacion === "Aprobada";
  return (
    <button
      type="button"
      onClick={() => cambiar("Pendiente")}
      title="Reabrir (volver a Pendiente)"
      className={`w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-lg transition-colors ${
        aprobada
          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
          : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
      }`}
    >
      {aprobada ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {aprobada ? "Aprobada" : "Rechazada"}
      <RotateCcw className="w-3 h-3 opacity-50" />
    </button>
  );
}
