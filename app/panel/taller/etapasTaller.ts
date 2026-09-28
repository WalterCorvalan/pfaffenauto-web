// Secuencia real del proceso físico de taller (diagrama "PROCESOS" del
// usuario, 29/9) -- ver migraciones/sql_taller_etapas.sql para el CHECK
// constraint que valida estos mismos valores en la base.
//
// Gestoría NO es una etapa de esta fila -- corre en paralelo (se trackea
// con taller_ordenes.gestoria_lista) y hace falta tenerla en true para
// poder avanzar a "entrega" (ver requiereGestoria abajo).
export const ETAPAS_TALLER = [
  { value: "ingreso_unidad", label: "Ingreso de unidad" },
  { value: "checklist_reparaciones", label: "Check list de reparaciones" },
  { value: "lavadero", label: "Lavadero" },
  { value: "mecanico", label: "Mecánico" },
  { value: "gomeria", label: "Gomería" },
  { value: "chapa_pintura", label: "Chapa y pintura" },
  { value: "tapiceria", label: "Tapicería" },
  { value: "detail", label: "Detail" },
  { value: "preventa", label: "Preventa" },
  { value: "proceso_venta", label: "Proceso de venta" },
  { value: "pre_entrega", label: "Pre entrega" },
  { value: "entrega", label: "Entrega" },
] as const;

export type EtapaTaller = (typeof ETAPAS_TALLER)[number]["value"];

export const ETAPA_LABEL: Record<string, string> = Object.fromEntries(ETAPAS_TALLER.map((e) => [e.value, e.label]));

export function indiceEtapa(estado: string): number {
  const i = ETAPAS_TALLER.findIndex((e) => e.value === estado);
  return i === -1 ? 0 : i;
}

export function etapaSiguiente(estado: string): EtapaTaller | null {
  const i = indiceEtapa(estado);
  return i < ETAPAS_TALLER.length - 1 ? ETAPAS_TALLER[i + 1].value : null;
}

export function etapaAnterior(estado: string): EtapaTaller | null {
  const i = indiceEtapa(estado);
  return i > 0 ? ETAPAS_TALLER[i - 1].value : null;
}

export const ETAPA_ENTREGA: EtapaTaller = "entrega";

// Se exige Gestoría lista para pasar de "pre_entrega" a "entrega" -- es la
// única etapa donde el paralelo (papeles) tiene que haber terminado para
// seguir con la secuencia principal (auto).
export function puedeAvanzarAEntrega(estado: string, gestoriaLista: boolean): boolean {
  return estado === "pre_entrega" ? gestoriaLista : true;
}
