// Renderiza el saludo + firma personal que cada vendedor carga en Mi Espacio
// → Mi WhatsApp (espacio_whatsapp_prefs). Antes ese dato se guardaba y no lo
// usaba ningún botón real del panel.
// Sin emoji a propósito: confirmado que api.whatsapp.com/wa.me rompe
// CUALQUIER emoji en el parámetro "text" (lo muestra como el carácter de
// reemplazo "�", tanto en la página intermedia como en el mensaje final) --
// probado con 👋, 🚗 y ✅, los tres rotos. Tildes/ñ sí andan bien, no tocar
// esas. No agregar un emoji acá ni en ningún otro saludo que se mande por
// este mismo mecanismo (link wa.me) hasta que Meta lo arregle de su lado.
export const SALUDO_WHATSAPP_DEFAULT = "Hola {nombre}! Te escribo de {agencia}. ¿Cómo estás? Quería saber si seguís interesado/a y si te puedo ayudar en algo.";

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
