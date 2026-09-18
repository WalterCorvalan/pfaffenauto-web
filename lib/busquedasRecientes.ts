const CLAVE = "pfaffen_busquedas_recientes";
const MAXIMO = 5;

export function getBusquedasRecientes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CLAVE) || "[]");
  } catch {
    return [];
  }
}

export function agregarBusquedaReciente(termino: string) {
  if (typeof window === "undefined") return;
  const texto = termino.trim();
  if (!texto) return;
  const actuales = getBusquedasRecientes().filter((t) => t.toLowerCase() !== texto.toLowerCase());
  const nuevas = [texto, ...actuales].slice(0, MAXIMO);
  localStorage.setItem(CLAVE, JSON.stringify(nuevas));
}
