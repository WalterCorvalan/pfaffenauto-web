import { createClient } from "@/lib/supabase2/server";
import CalendarioClient from "./CalendarioClient";

export default async function CalendarioPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: eventos }, { data: perfiles }] = await Promise.all([
    supabase
      .from("eventos_calendario")
      .select("*")
      .order("fecha", { ascending: true }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
  ]);

  return (
    <CalendarioClient
      eventosIniciales={eventos || []}
      perfiles={perfiles || []}
      miId={user?.id || ""}
    />
  );
}
