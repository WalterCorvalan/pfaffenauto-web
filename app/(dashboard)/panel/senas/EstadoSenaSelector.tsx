"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ESTADOS = ["Activa", "Convertida", "Perdida"];

const COLOR: Record<string, string> = {
  "Activa": "bg-amber-500 text-white border-amber-500",
  "Convertida": "bg-emerald-500 text-white border-emerald-500",
  "Perdida": "bg-slate-400 text-white border-slate-400",
};

export default function EstadoSenaSelector({ id, estado }: { id: string; estado: string }) {
  const router = useRouter();
  const [actual, setActual] = useState(estado || "Activa");
  const [cargando, setCargando] = useState(false);

  const cambiar = async (nuevo: string) => {
    setActual(nuevo);
    setCargando(true);
    const { error } = await supabase.from("senas").update({ estado: nuevo }).eq("id", id);
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
      className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer shadow-sm transition-transform hover:scale-105 disabled:opacity-50 ${COLOR[actual] || COLOR.Activa}`}
    >
      {ESTADOS.map((e) => (<option key={e} value={e} className="bg-white text-slate-900">{e}</option>))}
    </select>
  );
}
