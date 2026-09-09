// Catálogo completo de módulos del sidebar (calcado de GRUPOS en
// app/panel/layout.tsx) -- única fuente para la pantalla de
// Configuración > Empresa > Módulos. Antes esa pantalla solo listaba los
// ~20 módulos que ya tenían fila en modulos_config (los "apagables" desde
// el vamos) y se perdía todo lo que se fue etiquetando después (stock,
// leads, ventas, calendario, dashboard, etc.) -- ahí no se podía ni ver ni
// tocar su visibilidad por sector, aunque la tabla visibilidad_sector sí
// la soporta.
export const MODULOS_CATALOGO: { modulo: string; label: string }[] = [
  { modulo: "dashboard", label: "Dashboard" },
  { modulo: "calendario", label: "Calendario" },
  { modulo: "alertas", label: "Alertas" },
  { modulo: "reportes", label: "Reportes" },
  { modulo: "marketing", label: "Marketing" },
  { modulo: "mi_espacio", label: "Mi Espacio" },
  { modulo: "stock", label: "Stock" },
  { modulo: "visitas", label: "Visitas" },
  { modulo: "clientes", label: "Clientes" },
  { modulo: "leads", label: "Leads" },
  { modulo: "cotizaciones", label: "Cotizaciones" },
  { modulo: "financiaciones", label: "Financiaciones" },
  { modulo: "senas", label: "Señas" },
  { modulo: "presupuestos", label: "Presupuestos" },
  { modulo: "ventas", label: "Ventas" },
  { modulo: "mis_ventas", label: "Mis ventas" },
  { modulo: "pedidos", label: "Pedidos" },
  { modulo: "postventa", label: "Postventa" },
  { modulo: "expedientes", label: "Expedientes" },
  { modulo: "reclamos", label: "Reclamos" },
  { modulo: "gestoria", label: "Gestoría" },
  { modulo: "consignaciones", label: "Consignaciones" },
  { modulo: "peritajes", label: "Peritajes" },
  { modulo: "infracciones", label: "Infracciones" },
  { modulo: "telefonos_utiles", label: "Teléfonos útiles" },
  { modulo: "taller", label: "Taller" },
  { modulo: "service", label: "Service" },
  { modulo: "finanzas", label: "Finanzas" },
  { modulo: "cobros", label: "Cobros" },
  { modulo: "tesoreria", label: "Tesorería" },
  { modulo: "liquidaciones", label: "Liquidaciones" },
  { modulo: "comisiones", label: "Mis Comisiones" },
  { modulo: "mensajes", label: "Mensajes" },
  { modulo: "whatsapp", label: "WhatsApp" },
  { modulo: "rodi", label: "Rodi (chat web)" },
  { modulo: "tareas_leads", label: "Tareas de Leads" },
  { modulo: "correos", label: "Correos" },
  { modulo: "nps", label: "NPS" },
  { modulo: "autorizaciones", label: "Autorizaciones" },
  { modulo: "dormidos", label: "Dormidos" },
  { modulo: "recontactos", label: "Recontactos" },
  { modulo: "sugerencias", label: "Sugerencias" },
  { modulo: "papelera", label: "Papelera" },
  { modulo: "configuracion", label: "Configuración" },
  { modulo: "oportunidades", label: "Oportunidades" },
  { modulo: "postulaciones", label: "Postulaciones" },
  { modulo: "liquidador_sueldos", label: "Liquidador de Sueldos" },
  { modulo: "categorias_empleados", label: "Categorías de Empleados" },
  { modulo: "errores_sistema", label: "Errores del sistema" },
  { modulo: "logs", label: "Registro de Cambios" },
];

// Sectores = los roles que efectivamente se le pueden asignar a alguien
// hoy (ver ROLES en app/panel/configuracion/UsuariosClient.tsx),
// mapeados 1 a 1 vía ROL_A_SECTOR en permisosModulos.ts. Admin no entra
// porque nunca se filtra.
export const SECTORES = ["ventas", "encargado", "finanzas", "gestoria"] as const;
export const SECTOR_LABEL: Record<string, string> = { ventas: "Ventas", encargado: "Encargado", finanzas: "Finanzas", gestoria: "Gestoría" };
