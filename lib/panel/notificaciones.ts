import type { SupabaseClient } from "@supabase/supabase-js";

// Equivalentes de lib/notificaciones.ts (v1) pero sobre "alertas" (nova) en
// vez de "notificaciones" (v1), y roles como array (perfiles.roles) en vez
// de columna singular "rol".

export async function notificarPersona(supabase: SupabaseClient, destinatarioId: string, tipo: string, mensaje: string, link: string) {
  await supabase.from("alertas").insert({ destinatario_id: destinatarioId, tipo, titulo: mensaje, link, prioridad: "media" });
}

// sucursalId opcional: si se pasa, prioriza al/los encargado(s) de ESA
// sucursal (admin siempre recibe, sea cual sea). Si nadie de esa sucursal
// tiene el rol "encargado" (hoy nadie lo tiene asignado todavía), cae al
// comportamiento viejo -- avisar a TODOS los admin/encargado -- para no
// perder silenciosamente un aviso importante mientras se carga esa data.
export async function notificarEncargados(supabase: SupabaseClient, mensaje: string, link: string, tipo: string = "precio_a_confirmar", sucursalId?: string | null) {
  const { data: candidatos } = await supabase.from("perfiles").select("id, roles, sucursal_id").or("roles.cs.{admin},roles.cs.{encargado}").eq("activo", true);
  if (!candidatos || candidatos.length === 0) return;

  let destinatarios = candidatos;
  if (sucursalId) {
    const filtrados = candidatos.filter((p) => p.roles.includes("admin") || p.sucursal_id === sucursalId);
    if (filtrados.some((p) => p.roles.includes("encargado"))) destinatarios = filtrados;
  }

  await supabase.from("alertas").insert(
    destinatarios.map((e) => ({ destinatario_id: e.id, tipo, titulo: mensaje, link, prioridad: "media" }))
  );
}

// Lead nuevo sin vendedor asignado todavía (el "hola" inicial): antes solo
// avisaba a encargados, que después reasignan a mano -- se pierden minutos
// valiosos. Avisa a TODOS los vendedores por igual (mismo criterio que
// disponibilidad_vendedor.recibir_leads usa el resto del sistema para lead
// routing) para que el primero que lo vea lo tome, no solo quien está de
// turno como encargado.
export async function notificarVendedoresDisponibles(supabase: SupabaseClient, mensaje: string, link: string, tipo: string) {
  const { data: disponibilidad } = await supabase.from("disponibilidad_vendedor").select("vendedor_id, recibir_leads");
  const noDisponibles = new Set((disponibilidad || []).filter((d) => d.recibir_leads === false).map((d) => d.vendedor_id));

  const { data: candidatos } = await supabase.from("perfiles").select("id, roles").or("roles.cs.{admin},roles.cs.{encargado},roles.cs.{ventas}").eq("activo", true);
  if (!candidatos || candidatos.length === 0) return;

  const destinatarios = candidatos.filter((p) => !noDisponibles.has(p.id));
  if (destinatarios.length === 0) return;

  await supabase.from("alertas").insert(
    destinatarios.map((d) => ({ destinatario_id: d.id, tipo, titulo: mensaje, link, prioridad: "media" }))
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
