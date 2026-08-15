import type { SupabaseClient } from "@supabase/supabase-js";

// Avisa a todos los encargados activos (in-app, vía la campanita ya existente).
export async function notificarEncargados(supabase: SupabaseClient, mensaje: string, link: string) {
  const { data: encargados } = await supabase.from("perfiles").select("id").eq("rol", "encargado").eq("activo", true);
  if (!encargados || encargados.length === 0) return;

  await supabase.from("notificaciones").insert(
    encargados.map((e) => ({ perfil_id: e.id, tipo: "precio_a_confirmar", mensaje, link }))
  );
}
