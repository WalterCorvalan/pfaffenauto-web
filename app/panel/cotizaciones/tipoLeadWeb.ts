// leads_tasacion.tipo -- las 3 formas reales de pedido que puede mandar el
// sitio público a este módulo (financiacion tiene su propio módulo, se
// filtra aparte en page.tsx). "tasacion" (nombre histórico de columna) es
// el form /vender ("Compra": el cliente nos ofrece su auto). Archivo aparte
// para que CotizacionesClient.tsx y LeadWebDetalleModal.tsx no se importen
// en círculo entre sí.
export const TIPO_LEAD_WEB_LABEL: Record<string, string> = { tasacion: "Compra", cotizacion: "Cotización", permuta: "Permuta" };
export const TIPO_LEAD_WEB_ESTILO: Record<string, string> = {
  tasacion: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-300",
  cotizacion: "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-300",
  permuta: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
};
