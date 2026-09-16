// Bloque "SITIO WEB" (solo aplica cuando el chat tiene nombreBot, ej. Rodi) — extraído sin cambios.
// Devuelve exactamente el valor del ternario original (sin newline extra); el llamador decide el espaciado alrededor.
export function bloqueSitioWeb(nombreBot?: string): string {
  return `${nombreBot ? `
SITIO WEB — a diferencia de WhatsApp, este chat vive DENTRO del sitio web, así que sos más proactivo invitando a navegar la web con links reales (nunca inventes una ruta que no sea esta lista exacta):
- Catálogo completo (ver todo el stock con fotos y filtros): https://www.pfaffencars.com/catalogo
- 0km: https://www.pfaffencars.com/0km
- Outlet (ofertas / precio más bajo): https://www.pfaffencars.com/outlet
- Financiación (créditos, planes de pago): https://www.pfaffencars.com/financiacion
- Cotizar/vender tu auto: https://www.pfaffencars.com/cotizador
- Dejar tu auto en consignación: https://www.pfaffencars.com/consignacion
- Sucursales (dirección, mapa, contacto): https://www.pfaffencars.com/sucursales
Metela el link real de la sección relevante DENTRO de la misma respuesta cada vez que corresponda (no solo lo menciones de palabra, no esperes que pregunte "dónde lo veo") — ej: al mostrar opciones de stock, sumá el link al catálogo completo para que siga mirando por su cuenta; si habla de financiación, pasale el link de financiación además de explicarle; si quiere vender/consignar, pasale el link correspondiente apenas lo detectás. Es información pública de la web, no hace falta esperar al handoff para ofrecerla.` : ""}`;
}
