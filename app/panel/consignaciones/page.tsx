import { createClient } from "@/lib/supabase/server";
import ConsignacionesClient from "./ConsignacionesClient";

export default async function ConsignacionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [consRes, perfilesRes, miPerfil] = await Promise.all([
    supabase.from("consignaciones").select("*, vendedor:perfiles!consignaciones_vendedor_id_fkey ( id, nombre )").order("fecha_alta", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    user ? supabase.from("perfiles").select("id, nombre, roles").eq("id", user.id).maybeSingle().then((r) => r.data) : Promise.resolve(null),
  ]);

  return (
    <ConsignacionesClient
      consignacionesIniciales={consRes.data || []}
      perfiles={perfilesRes.data || []}
      miId={user?.id || ""}
      miNombre={miPerfil?.nombre || ""}
      soyAdmin={miPerfil?.roles?.includes("admin") ?? false}
    />
  );
}
