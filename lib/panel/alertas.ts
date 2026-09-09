import type { SupabaseClient } from "@supabase/supabase-js";
import { puedeVerModulo } from "./permisosModulos";

export type PrioridadAlerta = "alta" | "media" | "baja" | "novedad";

// Helper genérico para que futuros módulos (Expedientes, Autorizaciones,
// Tareas, Calendario...) avisen sin reinventar el insert cada vez.
//
// "modulo" es opcional (no todos los llamados lo pasan todavía) -- cuando
// se pasa, no se manda la alerta si el destinatario tiene ese módulo
// apagado para su rol (visibilidad_sector), para no avisarle de algo a lo
// que después no puede ni entrar (ej: un vendedor sin acceso a Reclamos
// asignado a un reclamo).
export async function crearAlerta(
  supabase: SupabaseClient,
  destinatarioId: string,
  titulo: string,
  opciones?: { mensaje?: string; link?: string; tipo?: string; prioridad?: PrioridadAlerta; modulo?: string }
) {
  if (opciones?.modulo && !(await puedeVerModulo(supabase, destinatarioId, opciones.modulo))) {
    return;
  }
  const { error } = await supabase.from("alertas").insert({
    destinatario_id: destinatarioId,
    titulo,
    mensaje: opciones?.mensaje || null,
    link: opciones?.link || null,
    tipo: opciones?.tipo || "general",
    prioridad: opciones?.prioridad || "novedad",
  });
  // Antes se ignoraba el error de insert (ej: RLS bloqueando el destinatario)
  // sin dejar rastro -- la alerta simplemente no aparecía y no había forma
  // de saber por qué.
  if (error) console.error("[crearAlerta] no se pudo insertar", error);
}
