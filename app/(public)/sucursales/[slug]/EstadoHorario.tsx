"use client";

import { useEffect, useState } from "react";

interface Props {
  diaDesde: number;
  diaHasta: number;
  horaDesde: number;
  horaHasta: number;
}

function calcularEstado(ahora: Date, { diaDesde, diaHasta, horaDesde, horaHasta }: Props) {
  const dia = ahora.getDay();
  const hora = ahora.getHours() + ahora.getMinutes() / 60;
  const esDiaHabil = dia >= diaDesde && dia <= diaHasta;
  const abierto = esDiaHabil && hora >= horaDesde && hora < horaHasta;

  if (abierto) {
    return { abierto: true, texto: `Abierto ahora · cierra a las ${horaHasta}:00hs` };
  }
  if (esDiaHabil && hora < horaDesde) {
    return { abierto: false, texto: `Cerrado · abre hoy a las ${horaDesde}:00hs` };
  }
  return { abierto: false, texto: `Cerrado · abre el próximo día hábil a las ${horaDesde}:00hs` };
}

export default function EstadoHorario(props: Props) {
  const [estado, setEstado] = useState<{ abierto: boolean; texto: string } | null>(null);

  useEffect(() => {
    setEstado(calcularEstado(new Date(), props));
    const id = setInterval(() => setEstado(calcularEstado(new Date(), props)), 60000);
    return () => clearInterval(id);
  }, [props.diaDesde, props.diaHasta, props.horaDesde, props.horaHasta]);

  // Sin estado todavía (primer render server-side): no mostramos nada para
  // no arriesgar un mismatch de hidratación con la hora del cliente.
  if (!estado) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${estado.abierto ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${estado.abierto ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
      {estado.texto}
    </span>
  );
}
