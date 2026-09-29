// Deriva el "usuario" de login (perfiles.usuario) de la parte antes de la
// arroba del email real -- no es un campo que se carga a mano. El Nombre
// del colaborador queda solo para mostrar (como en todo el resto del
// panel); el email real de Supabase Auth no se toca. Server (app/api/
// panel/usuarios/route.ts) y cliente (UsuariosClient.tsx, para la vista
// previa) usan esta misma función -- si se desalinean, la vista previa
// mentiría (pedido del 29/9, ver migraciones/sql_perfiles_usuario.sql).
export function normalizarUsuario(email: string): string {
  const local = email.split("@")[0] || "";
  return local
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");
}
