import type { SupabaseClient } from "@supabase/supabase-js";
import { puedeVerModulo } from "./permisosModulos";

export type PrioridadAlerta = "alta" | "media" | "baja" | "novedad";

// Helper genérico para que los módulos avisen sin reinventar el insert cada
// vez. Autorizaciones ya lo usa (EditarSenaModal.tsx, VentaDetalleModal.tsx
// avisan a admin/finanzas cuando un no-admin pide un cambio que necesita
// PIN) -- si sumás otro punto que inserte en "autorizaciones", avisá ahí
// también, con el mismo criterio de audiencia.
//
// "modulo" es opcional (no todos los llamados lo pasan todavía) -- cuando
// se pasa, no se manda la alerta si el destinatario tiene ese módulo
// apagado para su rol (visibilidad_sector), para no avisarle de algo a lo
// que después no puede ni entrar (ej: un vendedor sin acceso a Reclamos
// asignado a un reclamo).
// Categorías tal cual las lista Mi Espacio → Notificaciones (NotificacionesTab.tsx)
// -- ahí el usuario elige qué apagar, pero hasta ahora nada leía esa
// preferencia y apagar una categoría no evitaba ningún aviso.
export type CategoriaNotif =
  | "leads" | "nps" | "clientes" | "reclamos" | "pedidos_atencion_expedientes" | "expedientes"
  | "gestoria" | "consignacion" | "stock" | "cambios_precio" | "ventas" | "cotizaciones"
  | "pedidos_wishlist" | "service_sla" | "taller" | "gerente_ia" | "oportunidades_red"
  | "logros" | "comisiones" | "finanzas" | "fraude" | "suscripcion";

export async function crearAlerta(
  supabase: SupabaseClient,
  destinatarioId: string,
  titulo: string,
  opciones?: { mensaje?: string; link?: string; tipo?: string; prioridad?: PrioridadAlerta; modulo?: string; categoriaNotif?: CategoriaNotif }
) {
  if (opciones?.modulo && !(await puedeVerModulo(supabase, destinatarioId, opciones.modulo))) {
    return;
  }
  if (opciones?.categoriaNotif) {
    const { data: prefs } = await supabase.from("espacio_notif_prefs").select("desactivadas").eq("perfil_id", destinatarioId).maybeSingle();
    if (prefs?.desactivadas?.includes(opciones.categoriaNotif)) return;
  }
  // WhatsApp (y otros previews de link) hacen su propio fetch de la URL
  // pública para generar la vista previa antes de que el cliente la abra de
  // verdad -- eso duplica la visita real. Si ya hay una alerta idéntica
  // (mismo destinatario+tipo+link) en los últimos 30s, no duplicar.
  if (opciones?.tipo && opciones?.link) {
    const haceTreintaSeg = new Date(Date.now() - 30_000).toISOString();
    const { data: reciente } = await supabase
      .from("alertas")
      .select("id")
      .eq("destinatario_id", destinatarioId)
      .eq("tipo", opciones.tipo)
      .eq("link", opciones.link)
      .gte("created_at", haceTreintaSeg)
      .maybeSingle();
    if (reciente) return;
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
