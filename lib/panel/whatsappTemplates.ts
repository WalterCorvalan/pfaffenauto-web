import { createClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/crypto";
import { createMessageTemplate, listMessageTemplates, sendTemplateMessage, MetaApiError } from "@/lib/meta/client";
import { registrarError } from "@/lib/panel/logger";

// Puerto del patrón de plantillas de Vocero CRM (src/server/whatsapp/templates.ts)
// a Supabase2 -- resuelve el mismo caso: enviar cuando la ventana de 24h de
// WhatsApp está vencida y Meta rechaza texto libre.

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

export class TemplateError extends Error {
  code: "not_connected" | "invalid" | "not_found" | "meta_error";
  constructor(code: TemplateError["code"], message: string) {
    super(message);
    this.name = "TemplateError";
    this.code = code;
  }
}

const VARIABLE_REGEX = /\{\{\s*(\d+)\s*\}\}/g;

export function countVariables(body: string): number {
  return [...body.matchAll(VARIABLE_REGEX)].length;
}

// v1: como en Vocero, se acota a máximo una variable y debe ser {{1}} --
// alcanza para "Hola [nombre]" / "Tenemos novedades sobre tu consulta" y
// evita el trabajo de mapear N variables posicionales todavía.
export function validateBodyVariables(body: string): string | null {
  const matches = [...body.matchAll(VARIABLE_REGEX)];
  if (matches.length > 1) return "Máximo una variable {{1}} en el cuerpo por ahora";
  if (matches.length === 1 && matches[0]![1] !== "1") return "La variable debe ser {{1}}";
  return null;
}

export function renderBody(body: string, variable?: string): string {
  return body.replace(VARIABLE_REGEX, variable ?? "");
}

async function getConfig() {
  const { data } = await supabaseAdmin.from("whatsapp_configuracion").select("*").eq("id", true).single();
  return data;
}

export async function crearPlantilla(input: { nombre: string; idioma: string; categoria: string; cuerpo: string }) {
  const errorVariable = validateBodyVariables(input.cuerpo);
  if (errorVariable) throw new TemplateError("invalid", errorVariable);

  const config = await getConfig();
  if (!config?.listo || !config.waba_id || !config.token_cifrado) {
    throw new TemplateError("not_connected", "Falta configurar WhatsApp o el WABA ID (Configuración → WhatsApp).");
  }

  const nombre = input.nombre.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  if (!nombre) throw new TemplateError("invalid", "Nombre de plantilla inválido");

  const hasVariable = countVariables(input.cuerpo) === 1;
  const token = decrypt(config.token_cifrado, config.token_iv, config.token_tag);

  let waTemplateId: string | null = null;
  try {
    const res = await createMessageTemplate(config.waba_id, token, {
      name: nombre,
      language: input.idioma,
      category: input.categoria,
      body: input.cuerpo,
      hasVariable,
    });
    waTemplateId = res.id ?? null;
  } catch (err) {
    if (err instanceof MetaApiError) throw new TemplateError("meta_error", err.message);
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from("whatsapp_templates")
    .upsert(
      { nombre, idioma: input.idioma, categoria: input.categoria, cuerpo: input.cuerpo, estado: "pending", wa_template_id: waTemplateId, motivo_rechazo: null, updated_at: new Date().toISOString() },
      { onConflict: "nombre,idioma" }
    )
    .select()
    .single();
  if (error || !data) throw new TemplateError("meta_error", "No se pudo guardar la plantilla localmente");
  return data;
}

function mapearEstadoMeta(status: string | undefined): "approved" | "rejected" | "pending" | null {
  const s = (status ?? "").toUpperCase();
  if (s === "APPROVED") return "approved";
  if (s === "REJECTED") return "rejected";
  if (s === "PENDING" || s === "IN_APPEAL" || s === "PENDING_DELETION") return "pending";
  return null;
}

// Pull de estados -- igual que Vocero, es la vía universal porque el webhook
// de message_template_status_update no está cableado en v2 todavía.
//
// Además de actualizar el estado de las que ya tenemos, IMPORTA las
// plantillas que ya existen aprobadas en el WABA de Meta pero que nunca se
// crearon localmente (ej: quedaron cargadas de Vocero/otro sistema, o se
// crearon a mano desde el Administrador de Meta) -- si no, quedaban
// aprobadas del lado de Meta pero invisibles/inutilizables desde acá.
export async function sincronizarPlantillas(): Promise<{ actualizadas: number; importadas: number }> {
  const config = await getConfig();
  if (!config?.waba_id || !config.token_cifrado) {
    throw new TemplateError("not_connected", "Falta configurar WhatsApp o el WABA ID.");
  }
  const token = decrypt(config.token_cifrado, config.token_iv, config.token_tag);

  let remoto;
  try {
    remoto = await listMessageTemplates(config.waba_id, token);
  } catch (err) {
    if (err instanceof MetaApiError) throw new TemplateError("meta_error", err.message);
    throw err;
  }

  const { data: locales } = await supabaseAdmin.from("whatsapp_templates").select("*");
  let actualizadas = 0;
  let importadas = 0;
  for (const r of remoto.data ?? []) {
    const estado = mapearEstadoMeta(r.status);
    if (!estado) continue;
    const match = (locales ?? []).find(
      (t) => (r.id && t.wa_template_id === r.id) || (t.nombre === r.name && t.idioma === r.language)
    );
    if (match) {
      if (match.estado === estado) continue;
      await supabaseAdmin
        .from("whatsapp_templates")
        .update({ estado, motivo_rechazo: r.rejected_reason ?? null, wa_template_id: match.wa_template_id ?? r.id ?? null, updated_at: new Date().toISOString() })
        .eq("id", match.id);
      actualizadas += 1;
      continue;
    }

    // No existe localmente -- la importamos con el cuerpo real que devuelve
    // Meta (componente BODY) para que quede lista para usar/enviar.
    if (!r.name || !r.language) continue;
    const cuerpo = r.components?.find((c) => c.type === "BODY")?.text?.trim();
    if (!cuerpo) continue;
    await supabaseAdmin.from("whatsapp_templates").insert({
      nombre: r.name,
      idioma: r.language,
      categoria: r.category ?? "UTILITY",
      cuerpo,
      estado,
      wa_template_id: r.id ?? null,
      motivo_rechazo: r.rejected_reason ?? null,
    });
    importadas += 1;
  }
  return { actualizadas, importadas };
}

export async function enviarPlantilla(input: { conversacionId: string; templateId: string; variable?: string }) {
  const { data: template } = await supabaseAdmin.from("whatsapp_templates").select("*").eq("id", input.templateId).maybeSingle();
  if (!template) throw new TemplateError("not_found", "Plantilla no encontrada");
  if (template.estado !== "approved") throw new TemplateError("invalid", "Solo se pueden enviar plantillas aprobadas");

  const necesitaVariable = countVariables(template.cuerpo) === 1;
  if (necesitaVariable && !input.variable?.trim()) throw new TemplateError("invalid", "La plantilla requiere el valor de {{1}}");

  const { data: conversacion } = await supabaseAdmin
    .from("whatsapp_conversaciones")
    .select("id, whatsapp_contactos(telefono)")
    .eq("id", input.conversacionId)
    .single();
  const telefono = (conversacion?.whatsapp_contactos as any)?.telefono;
  if (!telefono) throw new TemplateError("not_found", "Conversación o teléfono no encontrado");

  const config = await getConfig();
  if (!config?.listo || !config.token_cifrado) throw new TemplateError("not_connected", "WhatsApp no está configurado");
  const token = decrypt(config.token_cifrado, config.token_iv, config.token_tag);

  const { data: mensaje } = await supabaseAdmin
    .from("whatsapp_mensajes")
    .insert({ conversacion_id: input.conversacionId, direccion: "out", tipo: "template", texto: renderBody(template.cuerpo, input.variable?.trim()), status: "pending", ai_generado: false })
    .select("id")
    .single();
  if (!mensaje) throw new TemplateError("meta_error", "No se pudo guardar el mensaje");

  try {
    const resultado = await sendTemplateMessage(config.phone_number_id, token, telefono, template.nombre, template.idioma, input.variable?.trim());
    await supabaseAdmin.from("whatsapp_mensajes").update({ status: "sent", wa_message_id: resultado.messages?.[0]?.id }).eq("id", mensaje.id);
    await supabaseAdmin.from("whatsapp_conversaciones").update({ last_message_at: new Date().toISOString() }).eq("id", input.conversacionId);
  } catch (err: any) {
    registrarError("panelV2/whatsappTemplates:enviar", err, { conversacionId: input.conversacionId, mensajeId: mensaje.id });
    await supabaseAdmin.from("whatsapp_mensajes").update({ status: "failed" }).eq("id", mensaje.id);
    throw new TemplateError("meta_error", err?.message ?? "Error enviando la plantilla");
  }

  return { mensajeId: mensaje.id };
}
