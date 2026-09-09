import { createClient } from "@/lib/supabase2/server";
import PostventaClient from "./PostventaClient";

export default async function PostventaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: compras }, { data: recordatorios }, { data: perfiles }] = await Promise.all([
    supabase.from("postventa_compras").select("*").order("fecha_venta", { ascending: false }),
    supabase.from("postventa_recordatorios").select("*").eq("estado", "pendiente").order("fecha_vencimiento", { ascending: true }),
    supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
  ]);

  return (
    <PostventaClient
      comprasIniciales={compras || []}
      recordatoriosIniciales={recordatorios || []}
      perfiles={perfiles || []}
      miId={user?.id || ""}
    />
  );
}
