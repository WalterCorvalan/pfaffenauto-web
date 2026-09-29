// Regla única de horario de atención para agendar una visita -- la usan los
// 3 formularios públicos que ofrecen turno (AgendarVisitaForm.tsx,
// AgendarCitaForm.tsx, CotizadorForm.tsx). Antes cada uno hardcodeaba su
// propia lista de horarios sin distinguir el día de la semana -- domingo
// dejaba agendar igual que cualquier otro día, y sábado tenía el mismo
// rango 9 a 18 que un día de semana. Pedido del 29/9: domingo cerrado,
// sábado 9 a 13, lunes a viernes 9 a 18 (sin cambios). Centralizado acá
// para no repetir la regla ni desincronizar los 3 formularios entre sí.

export function esDomingo(fechaIso: string): boolean {
  if (!fechaIso) return false;
  return new Date(fechaIso + "T00:00:00").getDay() === 0;
}

function esSabado(fechaIso: string): boolean {
  if (!fechaIso) return false;
  return new Date(fechaIso + "T00:00:00").getDay() === 6;
}

// Franjas de media hora entre horaInicio y horaFin (exclusivo), con un
// corte de almuerzo opcional [almuerzoDesde, almuerzoHasta) que se salta --
// sábado no tiene almuerzo (cierra a la 13, no da tiempo).
function generarFranjas(horaInicio: number, horaFin: number, almuerzo?: [number, number]): string[] {
  const franjas: string[] = [];
  for (let h = horaInicio; h < horaFin; h++) {
    if (almuerzo && h >= almuerzo[0] && h < almuerzo[1]) continue;
    franjas.push(`${String(h).padStart(2, "0")}:00`);
    if (h + 0.5 < horaFin) franjas.push(`${String(h).padStart(2, "0")}:30`);
  }
  return franjas;
}

// Franjas de media hora válidas para una fecha dada -- sin almuerzo (usado
// por AgendarCitaForm.tsx, que nunca lo tuvo).
export function franjasParaFecha(fechaIso: string): string[] {
  if (!fechaIso || esDomingo(fechaIso)) return [];
  return esSabado(fechaIso) ? generarFranjas(9, 13) : generarFranjas(9, 18);
}

// Mismas franjas pero con el corte de almuerzo 12-14 en día de semana (usado
// por AgendarVisitaForm.tsx y CotizadorForm.tsx, que sí lo tenían).
export function franjasParaFechaConAlmuerzo(fechaIso: string): string[] {
  if (!fechaIso || esDomingo(fechaIso)) return [];
  return esSabado(fechaIso) ? generarFranjas(9, 13) : generarFranjas(9, 18, [12, 14]);
}
