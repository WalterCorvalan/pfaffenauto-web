import type { SupabaseClient } from "@supabase/supabase-js";

export type SeccionNotificacion = "senas" | "presupuestos" | "boletos" | "tareas" | "pedidos" | "chat";

// Avisa a todos los encargados activos (in-app, vía la campanita) — el vendedor
// no está seguro de un precio y necesita que un encargado lo revise.
export async function notificarEncargados(
  supabase: SupabaseClient,
  mensaje: string,
  link: string,
  seccion: SeccionNotificacion
) {
  const { data: encargados } = await supabase.from("perfiles").select("id").eq("rol", "encargado").eq("activo", true);
  if (!encargados || encargados.length === 0) return;

  await supabase.from("notificaciones").insert(
    encargados.map((e) => ({ perfil_id: e.id, tipo: "precio_a_confirmar", mensaje, link, seccion }))
  );
}

// Respuesta de vuelta: el encargado ya revisó el precio (confirmado o corregido),
// el vendedor que lo cargó tiene que enterarse qué quedó.
export async function notificarRespuestaPrecio(
  supabase: SupabaseClient,
  vendedorId: string | null,
  mensaje: string,
  link: string,
  seccion: SeccionNotificacion
) {
  if (!vendedorId) return;
  await supabase.from("notificaciones").insert({
    perfil_id: vendedorId,
    tipo: "precio_confirmado_respuesta",
    mensaje,
    link,
    seccion,
  });
}
