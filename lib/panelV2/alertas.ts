import type { SupabaseClient } from "@supabase/supabase-js";

export type PrioridadAlerta = "alta" | "media" | "baja" | "novedad";

// Helper genérico para que futuros módulos (Expedientes, Autorizaciones,
// Tareas, Calendario...) avisen sin reinventar el insert cada vez.
export async function crearAlerta(
  supabase: SupabaseClient,
  destinatarioId: string,
  titulo: string,
  opciones?: { mensaje?: string; link?: string; tipo?: string; prioridad?: PrioridadAlerta }
) {
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
