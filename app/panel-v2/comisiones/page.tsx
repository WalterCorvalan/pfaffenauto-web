import { createClient } from "@/lib/supabase2/server";
import ComisionesClient from "./ComisionesClient";

export const metadata = { title: "Mis Comisiones | Pfaffen Autos" };

export default async function ComisionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Traemos el perfil del usuario actual para saber si es admin/finanzas
  const { data: miPerfil } = await supabase
    .from("perfiles")
    .select("roles")
    .eq("id", user.id)
    .single();

  const esAdminOFinanzas = miPerfil?.roles?.some((r: string) => ["admin", "finanzas"].includes(r)) || false;

  // Buscamos la configuración (si la tabla no existe aún, usamos valores por defecto)
  let configuracion = { paga_comisiones: true, exigir_resena_comision: false };

  try {
    const { data: configEmpresa } = await supabase
      .from("configuracion_empresa")
      .select("paga_comisiones, exigir_resena_comision")
      .limit(1)
      .maybeSingle();

    configuracion = configEmpresa || configuracion;
  } catch {
    configuracion = { paga_comisiones: true, exigir_resena_comision: false };
  }

  // Traemos los vendedores/encargados para el filtro (solo útil si es admin)
  const { data: perfiles } = await supabase
    .from("perfiles")
    .select("id, nombre, roles")
    .eq("activo", true)
    .order("nombre");

  const vendedores = (perfiles || []).filter((p) => p.roles.some((r: string) => ["vendedor", "encargado", "admin"].includes(r)));

  return (
    <ComisionesClient 
      usuarioActualId={user.id}
      esAdminOFinanzas={esAdminOFinanzas}
      configuracion={configuracion}
      vendedores={vendedores}
    />
  );
}