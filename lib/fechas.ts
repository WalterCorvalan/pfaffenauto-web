// El bot de WhatsApp/Rodi guarda "dia_visita" tal cual lo dice el cliente
// ("lunes", "mañana", "el 15"), pero "visitas.fecha_visita" se compara como
// string ISO (VisitasClient filtra/ordena con ">= hoy") -- un texto crudo
// tipo "lunes" rompe ese orden/filtro y en la práctica la visita queda
// invisible. Esto resuelve el texto a una fecha ISO real antes de guardar,
// asumiendo el PRÓXIMO día que corresponda (si hoy es lunes y dice "lunes",
// es el lunes que viene, no hoy).
const DIAS = ["domingo", "lunes", "martes", "miercoles", "miércoles", "jueves", "viernes", "sabado", "sábado"];
const DIA_A_INDICE: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, "miércoles": 3, jueves: 4, viernes: 5, sabado: 6, "sábado": 6,
};

function aIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function resolverFechaVisita(texto: string, ahora: Date = new Date()): string {
  const t = texto.trim().toLowerCase();

  if (/\bhoy\b/.test(t)) return aIso(ahora);
  if (/\bma[ñn]ana\b/.test(t)) {
    const d = new Date(ahora);
    d.setDate(d.getDate() + 1);
    return aIso(d);
  }

  const fechaExplicita = t.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (fechaExplicita) {
    const dia = Number(fechaExplicita[1]);
    const mes = Number(fechaExplicita[2]) - 1;
    let anio = fechaExplicita[3] ? Number(fechaExplicita[3]) : ahora.getFullYear();
    if (anio < 100) anio += 2000;
    const d = new Date(anio, mes, dia);
    if (!Number.isNaN(d.getTime())) {
      if (!fechaExplicita[3] && d < ahora) d.setFullYear(d.getFullYear() + 1);
      return aIso(d);
    }
  }

  const diaEncontrado = DIAS.find((nombre) => t.includes(nombre));
  if (diaEncontrado) {
    const objetivo = DIA_A_INDICE[diaEncontrado];
    const d = new Date(ahora);
    let delta = (objetivo - d.getDay() + 7) % 7;
    if (delta === 0) delta = 7; // "el lunes" dicho un lunes = el próximo, no hoy
    d.setDate(d.getDate() + delta);
    return aIso(d);
  }

  // No se pudo resolver -- se guarda tal cual para no perder el dato, aunque
  // quede fuera del orden/filtro por fecha en el panel.
  return texto;
}
