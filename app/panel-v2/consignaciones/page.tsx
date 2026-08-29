import { createClient } from "@/lib/supabase2/server";
import ConsignacionesClient from "./ConsignacionesClient";

export default async function ConsignacionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [consRes, perfilesRes, clientesRes, miPerfil] = await Promise.all([
    supabase.from("consignaciones").select("*, vendedor:perfiles!consignaciones_vendedor_id_fkey ( id, nombre )").order("fecha_alta", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    supabase.from("clientes").select("id, nombre, telefono").order("nombre"),
    user ? supabase.from("perfiles").select("id, nombre, roles").eq("id", user.id).single().then((r) => r.data) : Promise.resolve(null),
  ]);

  return (
    <ConsignacionesClient
      consignacionesIniciales={consRes.data || []}
      perfiles={perfilesRes.data || []}
      clientes={clientesRes.data || []}
      miId={user?.id || ""}
      soyAdmin={miPerfil?.roles?.includes("admin") ?? false}
    />
  );
}
