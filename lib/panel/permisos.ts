import type { SupabaseClient } from "@supabase/supabase-js";

// Mecanismo central de permisos -- hasta ahora Configuración → Permisos
// (PermisosTab.tsx) guardaba `rol_permisos`/`usuario_permisos` pero NADA los
// leía: todo el control de acceso real seguía siendo chequeos de rol
// hardcodeados por pantalla (`roles.includes("admin")`, etc, ~32 lugares).
// Esta función es el primer punto real de lectura -- reemplazá un chequeo
// hardcodeado por un llamado a esto de a uno, no hay que migrar los 32 de
// una. Mismo criterio de "default por rol + excepción por usuario" que ya
// usa PermisosTab.tsx para mostrar la pantalla, ahora aplicado de verdad:
//
// 1. admin siempre tiene todos los permisos (igual que la UI lo hardcodea).
// 2. si el usuario tiene una fila en usuario_permisos para esta clave, esa
//    excepción manda (otorgado u denegado), sin importar el rol.
// 3. si no, el default es "otorgado si CUALQUIERA de sus roles lo otorga"
//    en rol_permisos (un perfil puede tener varios roles a la vez).
export async function tienePermiso(
  supabase: SupabaseClient,
  perfil: { id: string; roles: string[] } | null | undefined,
  clave: string
): Promise<boolean> {
  if (!perfil) return false;
  if (perfil.roles?.includes("admin")) return true;

  const { data: excepcion } = await supabase
    .from("usuario_permisos")
    .select("otorgado")
    .eq("perfil_id", perfil.id)
    .eq("permiso_clave", clave)
    .maybeSingle();
  if (excepcion) return !!excepcion.otorgado;

  if (!perfil.roles || perfil.roles.length === 0) return false;
  const { data: rolPermisos } = await supabase
    .from("rol_permisos")
    .select("otorgado")
    .in("rol", perfil.roles)
    .eq("permiso_clave", clave);
  return (rolPermisos || []).some((r) => r.otorgado);
}
