import type { SupabaseClient } from "@supabase/supabase-js";

// Única fuente de verdad de las secciones válidas — antes estaba duplicada a
// mano (como array literal) en api/notificaciones/persona y
// api/vehiculos/notificar-cambio, y ya habían quedado desincronizadas
// (les faltaban "citas"/"comprar"/"gestoria" según el archivo). Ahora esos
// dos importan este mismo array en vez de tener su propia copia.
export const SECCIONES_NOTIFICACION = [
  "senas", "presupuestos", "boletos", "tareas", "pedidos", "chat",
  "cotizaciones", "consignaciones", "comprar", "crm", "postventa",
  "financiacion", "stock", "postulaciones", "citas", "gestoria",
] as const;

export type SeccionNotificacion = typeof SECCIONES_NOTIFICACION[number];

// Avisa a todos los encargados activos (in-app, vía la campanita) — el vendedor
// no está seguro de un precio y necesita que un encargado lo revise, o llegó
// algo nuevo (lead, consignación, reclamo) que hay que atender.
export async function notificarEncargados(
  supabase: SupabaseClient,
  mensaje: string,
  link: string,
  seccion: SeccionNotificacion,
  tipo: string = "precio_a_confirmar"
) {
  const { data: encargados } = await supabase.from("perfiles").select("id").in("rol", ["encargado", "admin"]).eq("activo", true);
  if (!encargados || encargados.length === 0) return;

  await supabase.from("notificaciones").insert(
    encargados.map((e) => ({ perfil_id: e.id, tipo, mensaje, link, seccion }))
  );
}

// Avisa a quien puede aprobar movimientos de Tesorería (admin, encargado y el
// rol dedicado "gestoria") — separado de notificarEncargados para no hacer que
// "gestoria" empiece a recibir TODAS las notificaciones genéricas de encargado
// (leads, postventa, etc), que no le corresponden.
export async function notificarGestoria(supabase: SupabaseClient, mensaje: string, link: string, tipo: string = "movimiento_pendiente") {
  const { data: destinatarios } = await supabase.from("perfiles").select("id").in("rol", ["admin", "encargado", "gestoria"]).eq("activo", true);
  if (!destinatarios || destinatarios.length === 0) return;

  await supabase.from("notificaciones").insert(
    destinatarios.map((d) => ({ perfil_id: d.id, tipo, mensaje, link, seccion: "gestoria" as SeccionNotificacion }))
  );
}

// Notifica directo a una persona puntual (ej: pedido de asistencia a un encargado específico).
export async function notificarPersona(
  supabase: SupabaseClient,
  perfilId: string | null,
  tipo: string,
  mensaje: string,
  link: string,
  seccion: SeccionNotificacion
) {
  if (!perfilId) return;
  await supabase.from("notificaciones").insert({ perfil_id: perfilId, tipo, mensaje, link, seccion });
}

// Precio, fotos o estado de un auto cambiaron: avisa a los encargados y, si el
// auto tiene vendedor asignado y no fue quien hizo el cambio, también a esa
// persona directo (para que no se le pase algo de "su" auto).
export async function notificarCambioVehiculo(
  supabase: SupabaseClient,
  opts: {
    autoId: string; vendedorAsignadoId: string | null; actorId: string | null; mensaje: string; tipo: string;
    seccion?: SeccionNotificacion; link?: string;
  }
) {
  const seccion = opts.seccion || "stock";
  const link = opts.link || `/panel/vehiculo/editar/${opts.autoId}`;
  await notificarEncargados(supabase, opts.mensaje, link, seccion, opts.tipo);
  if (opts.vendedorAsignadoId && opts.vendedorAsignadoId !== opts.actorId) {
    await notificarPersona(supabase, opts.vendedorAsignadoId, opts.tipo, opts.mensaje, link, seccion);
  }
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
