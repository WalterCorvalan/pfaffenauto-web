// Renderiza el saludo + firma personal que cada vendedor carga en Mi Espacio
// → Mi WhatsApp (espacio_whatsapp_prefs). Antes ese dato se guardaba y no lo
// usaba ningún botón real del panel.
export const SALUDO_WHATSAPP_DEFAULT = "Hola {nombre}! 👋 Te escribo de {agencia}. ¿Cómo estás? Quería saber si seguís interesado/a y si te puedo ayudar en algo.";

export function renderSaludoWhatsApp(
  prefs: { saludo_seguimiento?: string | null; firma?: string | null } | null | undefined,
  variables: { nombre: string; agencia: string; vendedor?: string }
): string {
  const plantilla = prefs?.saludo_seguimiento?.trim() || SALUDO_WHATSAPP_DEFAULT;
  const cuerpo = plantilla
    .replace(/\{nombre\}/g, variables.nombre)
    .replace(/\{agencia\}/g, variables.agencia)
    .replace(/\{vendedor\}/g, variables.vendedor ?? "");
  const firma = prefs?.firma?.trim();
  return firma ? `${cuerpo}\n${firma}` : cuerpo;
}
