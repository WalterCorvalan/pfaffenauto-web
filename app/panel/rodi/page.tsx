import { createClient } from "@/lib/supabase2/server";
import RodiShell from "./RodiShell";

export default async function RodiPage() {
  const supabase = await createClient();

  const [convRes, vendedoresRes] = await Promise.all([
    supabase
      .from("rodi_conversaciones")
      .select("*, vendedor:perfiles!rodi_conversaciones_vendedor_id_fkey ( id, nombre )")
      .order("last_message_at", { ascending: false, nullsFirst: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
  ]);

  return (
    <RodiShell
      conversacionesIniciales={convRes.data || []}
      vendedores={(vendedoresRes.data || []).filter((p) => p.roles?.includes("ventas") || p.roles?.includes("admin"))}
    />
  );
}
