import type { SupabaseClient } from "@supabase/supabase-js";

// Consulta el permiso dinámico del usuario logueado (excepción por usuario > default del rol).
// Usable tanto client-side (supabase browser) como server-side (createServerClient).
export async function tienePermiso(supabase: SupabaseClient, clave: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase.rpc("tiene_permiso", { uid: user.id, clave_permiso: clave });
  if (error) {
    console.error("Error verificando permiso:", error);
    return false;
  }
  return !!data;
}
