import { createClient } from "@/lib/supabase2/server";
import ClientesClient from "./ClientesClient";

export default async function ClientesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: clientes }, { data: perfiles }, { data: disponibilidad }] = await Promise.all([
    supabase.from("clientes").select("*").order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    supabase.from("disponibilidad_vendedor").select("*"),
  ]);

  return (
    <ClientesClient
      clientesIniciales={clientes || []}
      perfiles={perfiles || []}
      disponibilidadInicial={disponibilidad || []}
      miId={user?.id || ""}
    />
  );
}
