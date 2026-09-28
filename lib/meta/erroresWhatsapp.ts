// Traducción de los códigos de error de Meta que ya diagnosticamos en la
// migración de Fidu/Twilio a Cloud API (30/9) -- para que cualquiera del
// equipo entienda el motivo real sin tener que pegarlo en un chat. Si
// aparece un código nuevo no mapeado acá, se muestra el texto crudo de
// Meta tal cual (mejor eso que un genérico que esconde información).
const ERRORES_CONOCIDOS: { match: RegExp; titulo: string; explicacion: string }[] = [
  {
    match: /#?200\b.*permission|permission.*#?200\b/i,
    titulo: "Sin permiso para enviar en nombre de esta cuenta",
    explicacion: "El número todavía está \"atado\" a otro proveedor (ej. Twilio) del lado de Meta. Hay que completar la migración a Cloud API desde el Administrador de WhatsApp.",
  },
  {
    match: /133005/,
    titulo: "PIN de verificación en dos pasos no coincide",
    explicacion: "El número ya tenía un PIN de dos pasos configurado de un proveedor anterior. Hay que resetearlo desde el Administrador de WhatsApp antes de poder registrarlo en nuestra app.",
  },
  {
    match: /141010/,
    titulo: "Negocio sin verificar en Meta (bloqueo total de envío)",
    explicacion: "La cuenta de negocio (WABA) figura \"not_verified\" en Meta Business Suite. Mientras esté así, NINGÚN mensaje sale (ni bot, ni manual, ni plantillas) sin importar que todo lo demás esté bien configurado. Se resuelve completando la Verificación de la Empresa en Meta Business Suite (razón social, CUIT, documentación) -- no es un problema de código.",
  },
];

export function traducirErrorMeta(errorDetalle: string | null | undefined): { titulo: string; explicacion: string } | null {
  if (!errorDetalle) return null;
  const encontrado = ERRORES_CONOCIDOS.find((e) => e.match.test(errorDetalle));
  return encontrado ? { titulo: encontrado.titulo, explicacion: encontrado.explicacion } : null;
}
