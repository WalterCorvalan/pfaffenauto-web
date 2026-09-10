import { createClient } from "@/lib/supabase/server";
import ClientesClient from "./ClientesClient";

export default async function ClientesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: clientes }, { data: perfiles }, { data: disponibilidad }, { data: ventas }] = await Promise.all([
    // Sin límite esto traía TODA la base de clientes de toda la historia --
    // 5000 da margen de sobra hoy y evita que la query quede sin techo.
    supabase.from("clientes").select("*").order("created_at", { ascending: false }).limit(5000),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    supabase.from("disponibilidad_vendedor").select("*"),
    supabase.from("ventas").select("id, cliente_id").not("cliente_id", "is", null).limit(10000),
  ]);

  return (
    <ClientesClient
      clientesIniciales={clientes || []}
      perfiles={perfiles || []}
      disponibilidadInicial={disponibilidad || []}
      ventas={ventas || []}
      miId={user?.id || ""}
    />
  );
}
