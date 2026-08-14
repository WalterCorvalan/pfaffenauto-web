"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ESTADOS = ["Pendiente", "En proceso", "Resuelto"];

const COLOR: Record<string, string> = {
  "Pendiente": "bg-amber-50 text-amber-700 border-amber-200",
  "En proceso": "bg-blue-50 text-blue-700 border-blue-200",
  "Resuelto": "bg-emerald-50 text-emerald-700 border-emerald-200",
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
      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border outline-none cursor-pointer disabled:opacity-50 ${COLOR[actual]}`}
    >
      {ESTADOS.map((e) => (<option key={e} value={e}>{e}</option>))}
    </select>
  );
}
