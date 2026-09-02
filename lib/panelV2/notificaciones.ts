import type { SupabaseClient } from "@supabase/supabase-js";

// Equivalentes de lib/notificaciones.ts (v1) pero sobre "alertas" (nova) en
// vez de "notificaciones" (v1), y roles como array (perfiles.roles) en vez
// de columna singular "rol".

export async function notificarEncargados(supabase: SupabaseClient, mensaje: string, link: string, tipo: string = "precio_a_confirmar") {
  const { data: encargados } = await supabase.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{encargado}").eq("activo", true);
  if (!encargados || encargados.length === 0) return;
  await supabase.from("alertas").insert(
    encargados.map((e) => ({ destinatario_id: e.id, tipo, titulo: mensaje, link, prioridad: "media" }))
  );
}

export async function notificarGestoria(supabase: SupabaseClient, mensaje: string, link: string, tipo: string = "movimiento_pendiente") {
  const { data: destinatarios } = await supabase.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{encargado},roles.cs.{gestoria}").eq("activo", true);
  if (!destinatarios || destinatarios.length === 0) return;
  await supabase.from("alertas").insert(
    destinatarios.map((d) => ({ destinatario_id: d.id, tipo, titulo: mensaje, link, prioridad: "media" }))
  );
}

export async function notificarFinanzas(supabase: SupabaseClient, mensaje: string, link: string, tipo: string = "sobrante_registro") {
  const { data: destinatarios } = await supabase.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{finanzas}").eq("activo", true);
  if (!destinatarios || destinatarios.length === 0) return;
  await supabase.from("alertas").insert(
    destinatarios.map((d) => ({ destinatario_id: d.id, tipo, titulo: mensaje, link, prioridad: "media" }))
  );
}

export async function notificarRespuestaPrecio(supabase: SupabaseClient, vendedorId: string | null, mensaje: string, link: string) {
  if (!vendedorId) return;
  await supabase.from("alertas").insert({ destinatario_id: vendedorId, tipo: "precio_confirmado_respuesta", titulo: mensaje, link, prioridad: "media" });
}
