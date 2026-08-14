"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ESTADOS = ["Activa", "Convertida", "Perdida"];

const COLOR: Record<string, string> = {
  "Activa": "bg-amber-50 text-amber-700 border-amber-200",
  "Convertida": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Perdida": "bg-slate-100 text-slate-500 border-slate-200",
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
      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border outline-none cursor-pointer disabled:opacity-50 ${COLOR[actual] || COLOR.Activa}`}
    >
      {ESTADOS.map((e) => (<option key={e} value={e}>{e}</option>))}
    </select>
  );
}
