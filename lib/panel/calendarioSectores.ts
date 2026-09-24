// Sector elegido en el form de evento -> valores de perfiles.roles que lo
// cubren. Compartido entre el modal de creación (que solo guarda los
// sectores elegidos) y el cron que manda el aviso el día del evento (que
// resuelve a qué perfiles avisar). "Administración" y "Recepción" se
// sacaron de SECTORES (NuevoEventoModal.tsx) porque no existe ningún rol
// real para ellos (ver ROLES en UsuariosClient.tsx: admin/encargado/
// ventas/finanzas/gestoria) -- se mantiene este mapa así por si algún
// evento viejo todavía tiene guardado alguno de esos dos sectores.
export const SECTOR_A_ROLES: Record<string, string[]> = {
  // "vendedor" nunca existió como valor real de perfiles.roles (es
  // "ventas", como dice el comentario de arriba) -- un evento de sector
  // "Ventas" nunca avisaba a ningún vendedor real, solo a admins.
  Ventas: ["ventas", "admin"],
  "Gestoría": ["gestoria", "admin"],
  Finanzas: ["finanzas", "admin"],
  "Administración": ["admin"],
};
