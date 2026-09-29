"use client";

import { useEffect, useState } from "react";

// Lun a Vie 9 a 18hs, Sáb 9 a 13hs -- mismo horario que ya se muestra como
// texto fijo en ambas sucursales (FALLBACK_DATA en page.tsx).
const HORA_DESDE = 9;
const HORA_HASTA_SEMANA = 18;
const HORA_HASTA_SABADO = 13;

function calcularEstado(ahora: Date) {
  const dia = ahora.getDay(); // 0 domingo ... 6 sábado
  const hora = ahora.getHours() + ahora.getMinutes() / 60;
  const esDiaHabil = dia >= 1 && dia <= 6;
  const horaHasta = dia === 6 ? HORA_HASTA_SABADO : HORA_HASTA_SEMANA;
  const abierto = esDiaHabil && hora >= HORA_DESDE && hora < horaHasta;

  if (abierto) {
    return { abierto: true, texto: `Abierto ahora · cierra a las ${horaHasta}:00hs` };
  }
  if (esDiaHabil && hora < HORA_DESDE) {
    return { abierto: false, texto: `Cerrado · abre hoy a las ${HORA_DESDE}:00hs` };
  }
  return { abierto: false, texto: `Cerrado · abre el próximo día hábil a las ${HORA_DESDE}:00hs` };
}

export default function EstadoHorario() {
  const [estado, setEstado] = useState<{ abierto: boolean; texto: string } | null>(null);

  useEffect(() => {
    setEstado(calcularEstado(new Date()));
    const id = setInterval(() => setEstado(calcularEstado(new Date())), 60000);
    return () => clearInterval(id);
  }, []);

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
