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
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
  ]);
  const { data: miPerfil } = user?.id ? await supabase.from("perfiles").select("roles").eq("id", user.id).single() : { data: null };

  // Un vendedor (rol "ventas" sin "admin") solo ve otros vendedores en el
  // selector de reasignación -- admin ve a todos.
  const soyAdmin = miPerfil?.roles?.includes("admin") ?? false;
  const vendedores = (vendedoresRes.data || []).filter((p) =>
    soyAdmin ? p.roles?.includes("ventas") || p.roles?.includes("admin") : p.roles?.includes("ventas")
  );

  return (
    <RodiShell
      conversacionesIniciales={convRes.data || []}
      vendedores={vendedores}
      miId={user?.id || ""}
    />
  );
}
