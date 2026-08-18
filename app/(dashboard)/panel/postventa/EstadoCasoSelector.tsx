"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ESTADOS = ["Pendiente", "En proceso", "Resuelto"];

const COLOR: Record<string, string> = {
  "Pendiente": "bg-amber-500 text-white border-amber-500",
  "En proceso": "bg-amber-500 text-white border-amber-500",
  "Resuelto": "bg-emerald-500 text-white border-emerald-500",
};

export default function EstadoCasoSelector({ id, estado }: { id: string; estado: string }) {
  const router = useRouter();
  const [actual, setActual] = useState(estado);
  const [cargando, setCargando] = useState(false);

  const cambiar = async (nuevo: string) => {
    setActual(nuevo);
    setCargando(true);
    const { error } = await supabase.from("postventa_casos").update({ estado: nuevo }).eq("id", id);
    setCargando(false);
    if (error) {
      alert("Error al cambiar el estado");
      setActual(estado);
      return;
    }
    router.refresh();
  };

  return (
    <select
      value={actual}
      disabled={cargando}
      onChange={(e) => cambiar(e.target.value)}
      className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer shadow-sm transition-transform hover:scale-105 disabled:opacity-50 ${COLOR[actual]}`}
    >
      {ESTADOS.map((e) => (<option key={e} value={e} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{e}</option>))}
    </select>
  );
}
