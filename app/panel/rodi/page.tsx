import { createClient } from "@/lib/supabase/server";
import RodiShell from "./RodiShell";

export default async function RodiPage() {
  const supabase = await createClient();

  const [{ data: { user } }, convRes, vendedoresRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("rodi_conversaciones")
      .select("*, vendedor:perfiles!rodi_conversaciones_vendedor_id_fkey ( id, nombre )")
      .order("last_message_at", { ascending: false, nullsFirst: false }),
    supabase.from("perfiles").select("id, nombre, roles, sucursal_id").eq("activo", true).order("nombre"),
  ]);
  const { data: miPerfil } = user?.id ? await supabase.from("perfiles").select("roles, sucursal_id").eq("id", user.id).single() : { data: null };

  // Admin ve a todos. Encargado ve solo a los vendedores de SU sucursal.
  // Un vendedor sin esos roles solo ve a otros vendedores.
  const soyAdmin = miPerfil?.roles?.includes("admin") ?? false;
  const soyEncargado = miPerfil?.roles?.includes("encargado") ?? false;
  const miSucursalId = miPerfil?.sucursal_id ?? null;
  const vendedores = (vendedoresRes.data || []).filter((p) => {
    if (soyAdmin) return p.roles?.includes("ventas") || p.roles?.includes("admin");
    if (soyEncargado) return p.roles?.includes("ventas") && p.sucursal_id === miSucursalId;
    return p.roles?.includes("ventas");
  });

  return (
    <RodiShell
      conversacionesIniciales={convRes.data || []}
      vendedores={vendedores}
      miId={user?.id || ""}
    />
  );
}
