"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ESTADOS = ["Pendiente", "Contactado", "Convertido", "Descartado"];

const COLOR: Record<string, string> = {
  "Pendiente": "bg-amber-500 text-white border-amber-500",
  "Contactado": "bg-amber-500 text-white border-amber-500",
  "Convertido": "bg-emerald-500 text-white border-emerald-500",
  "Descartado": "bg-rose-500 text-white border-rose-500",
};

export default function EstadoConsignacionSelector({ id, estado }: { id: string; estado: string | null }) {
  const router = useRouter();
  const [actual, setActual] = useState(estado || "Pendiente");
  const [cargando, setCargando] = useState(false);

  const cambiar = async (nuevo: string) => {
    setActual(nuevo);
    setCargando(true);
    const { error } = await supabase.from("cotizaciones").update({ estado: nuevo }).eq("id", id);
    setCargando(false);
    if (error) {
      alert("Error al cambiar el estado");
      setActual(estado || "Pendiente");
      return;
    }
    router.refresh();
  };

  return (
    <select
      value={actual}
      disabled={cargando}
      onChange={(e) => cambiar(e.target.value)}
      className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer shadow-sm transition-transform hover:scale-105 disabled:opacity-50 ${COLOR[actual] || COLOR.Pendiente}`}
    >
      {ESTADOS.map((e) => (<option key={e} value={e} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{e}</option>))}
    </select>
  );
}
