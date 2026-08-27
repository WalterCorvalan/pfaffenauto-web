import type { SupabaseClient } from "@supabase/supabase-js";
import { notificarGestoria } from "./notificaciones";

export const TIPOS_TRAMITE = ["Transferencia", "Patentamiento", "Alta", "Baja", "Otro"] as const;
export type TipoTramite = typeof TIPOS_TRAMITE[number];

export const MODALIDADES_TRAMITE = ["Gestoría propia", "Gestor propio", "Concesionario externo", "Otro"] as const;
export type ModalidadTramite = typeof MODALIDADES_TRAMITE[number];

// Orden real del flujo (no alfabético) — se usa para pintar el timeline y
// para saber si un cambio de estado es "avance" o "retroceso".
export const ESTADOS_TRAMITE = [
  "Nuevo", "Pendiente de documentación", "Listo para iniciar", "Iniciado",
  "En curso", "Esperando pago o respuesta", "Finalizado", "Listo para retirar", "Entregado",
] as const;
export type EstadoTramite = typeof ESTADOS_TRAMITE[number];

// Se llama al crear una venta (boleto) — todo trámite nace acá, con el
// vehículo y la venta ya conectados, para que Gestoría no tenga que volver a
// pedir esos datos. El historial arranca con la fila "Nuevo".
export async function crearTramite(
  supabase: SupabaseClient,
  { vehiculoId, ventaId, tipoTramite = "Transferencia" as TipoTramite, responsableId }: { vehiculoId: string; ventaId?: string | null; tipoTramite?: TipoTramite; responsableId?: string | null }
) {
  const { data: tramite, error } = await supabase
    .from("tramites_gestoria")
    .insert({ vehiculo_id: vehiculoId, venta_id: ventaId || null, tipo_tramite: tipoTramite, responsable_id: responsableId || null })
    .select("id")
    .single();
  if (error || !tramite) return null;

  await supabase.from("tramites_gestoria_historial").insert({ tramite_id: tramite.id, estado_anterior: null, estado_nuevo: "Nuevo", responsable_id: responsableId || null });

  return tramite.id as string;
}

// Cambia de estado y deja constancia en el historial — usar siempre esto en
// vez de un update directo a "estado", si no el historial queda mentiroso.
export async function cambiarEstadoTramite(
  supabase: SupabaseClient,
  tramiteId: string,
  estadoAnterior: string,
  estadoNuevo: EstadoTramite,
  responsableId: string | null,
  contextoNotificacion?: { mensaje: string; link: string }
) {
  const { error } = await supabase.from("tramites_gestoria").update({ estado: estadoNuevo, updated_at: new Date().toISOString() }).eq("id", tramiteId);
  if (error) return false;

  await supabase.from("tramites_gestoria_historial").insert({ tramite_id: tramiteId, estado_anterior: estadoAnterior, estado_nuevo: estadoNuevo, responsable_id: responsableId });

  if (contextoNotificacion) {
    await notificarGestoria(supabase, contextoNotificacion.mensaje, contextoNotificacion.link, "tramite_actualizado");
  }

  return true;
}
