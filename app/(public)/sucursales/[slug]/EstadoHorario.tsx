"use client";

import { useEffect, useState } from "react";

interface Rango {
  diaDesde: number;
  diaHasta: number;
  horaDesde: number;
  horaHasta: number;
}

interface Props extends Rango {
  // Segundo rango opcional -- p.ej. Lun a Vie 9 a 18 + Sáb 9 a 13, dos
  // horarios distintos que el único rango desde/hasta no puede expresar.
  diaDesde2?: number | null;
  diaHasta2?: number | null;
  horaDesde2?: number | null;
  horaHasta2?: number | null;
}

function estadoEnRango(ahora: Date, { diaDesde, diaHasta, horaDesde, horaHasta }: Rango) {
  const dia = ahora.getDay();
  const hora = ahora.getHours() + ahora.getMinutes() / 60;
  const esDiaHabil = dia >= diaDesde && dia <= diaHasta;
  const abierto = esDiaHabil && hora >= horaDesde && hora < horaHasta;
  return { abierto, esDiaHabil, horaDesde, horaHasta };
}

function calcularEstado(ahora: Date, props: Props) {
  const rangos: Rango[] = [{ diaDesde: props.diaDesde, diaHasta: props.diaHasta, horaDesde: props.horaDesde, horaHasta: props.horaHasta }];
  if (props.diaDesde2 != null && props.diaHasta2 != null && props.horaDesde2 != null && props.horaHasta2 != null) {
    rangos.push({ diaDesde: props.diaDesde2, diaHasta: props.diaHasta2, horaDesde: props.horaDesde2, horaHasta: props.horaHasta2 });
  }

  const evaluados = rangos.map((r) => estadoEnRango(ahora, r));
  const abiertoEn = evaluados.find((e) => e.abierto);
  if (abiertoEn) {
    return { abierto: true, texto: `Abierto ahora · cierra a las ${abiertoEn.horaHasta}:00hs` };
  }

  // Cerrado: si hoy es día hábil de algún rango y todavía no abrió, avisamos
  // con la hora de apertura de hoy; si no, con la del próximo rango.
  const hoyPendiente = evaluados.find((e) => e.esDiaHabil && ahora.getHours() + ahora.getMinutes() / 60 < e.horaDesde);
  if (hoyPendiente) {
    return { abierto: false, texto: `Cerrado · abre hoy a las ${hoyPendiente.horaDesde}:00hs` };
  }
  const horaDesde = rangos[0].horaDesde;
  return { abierto: false, texto: `Cerrado · abre el próximo día hábil a las ${horaDesde}:00hs` };
}

export default function EstadoHorario(props: Props) {
  const [estado, setEstado] = useState<{ abierto: boolean; texto: string } | null>(null);

  useEffect(() => {
    setEstado(calcularEstado(new Date(), props));
    const id = setInterval(() => setEstado(calcularEstado(new Date(), props)), 60000);
    return () => clearInterval(id);
  }, [props.diaDesde, props.diaHasta, props.horaDesde, props.horaHasta, props.diaDesde2, props.diaHasta2, props.horaDesde2, props.horaHasta2]);

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
