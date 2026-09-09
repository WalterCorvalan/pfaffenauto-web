// Sector elegido en el form de evento -> valores de perfiles.roles que lo
// cubren. Compartido entre el modal de creación (que solo guarda los
// sectores elegidos) y el cron que manda el aviso el día del evento (que
// resuelve a qué perfiles avisar). No hay un rol 1:1 para "Recepción"
// todavía, así que ese sector no notifica a nadie hasta que exista.
export const SECTOR_A_ROLES: Record<string, string[]> = {
  Ventas: ["vendedor", "admin"],
  "Gestoría": ["gestoria", "admin"],
  Finanzas: ["finanzas", "admin"],
  "Administración": ["admin"],
};
