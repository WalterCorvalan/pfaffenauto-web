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

interface SolicitudBase {
  id: string;
  estado: string | null;
  nombre: string;
  telefono: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number | null;
}

export default function EstadoConsignacionSelector({ s }: { s: SolicitudBase }) {
  const router = useRouter();
  const [actual, setActual] = useState(s.estado || "Pendiente");
  const [cargando, setCargando] = useState(false);

  const cambiar = async (nuevo: string) => {
    setActual(nuevo);
    setCargando(true);
    const { error } = await supabase.from("cotizaciones").update({ estado: nuevo }).eq("id", s.id);
    setCargando(false);
    if (error) {
      alert("Error al cambiar el estado");
      setActual(s.estado || "Pendiente");
      return;
    }
    router.refresh();
    if (nuevo === "Convertido") {
      const params = new URLSearchParams({
        marca: s.marca || "",
        modelo: s.modelo || "",
        anio: s.anio ? String(s.anio) : "",
        kilometraje: s.kilometraje != null ? String(s.kilometraje) : "",
        origen: "Consignado",
        prov_nombre: s.nombre || "",
        prov_telefono_celular: s.telefono || "",
        revertir_cotizacion_id: s.id,
        estado_anterior: s.estado || "Pendiente",
      });
      router.push(`/panel/vehiculo/nuevo?${params.toString()}`);
    }
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
