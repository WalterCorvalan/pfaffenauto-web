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
  await supabase.from("alertas").insert({
    destinatario_id: destinatarioId,
    titulo,
    mensaje: opciones?.mensaje || null,
    link: opciones?.link || null,
    tipo: opciones?.tipo || "general",
    prioridad: opciones?.prioridad || "novedad",
  });
}
