import { createClient } from "@/lib/supabase/server";
import NpsClient from "./NpsClient";

export const metadata = { title: "NPS y Satisfacción | Pfaffen Autos" };

export default async function NpsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Traer el perfil actual para saber si es admin/recepción
  const { data: miPerfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).single();
  const esAdminORecepcion = miPerfil?.roles?.some((r: string) => ["admin", "recepcion"].includes(r)) || false;

  // Datos iniciales
  const [
    { data: configuracion },
    { data: respuestas },
    { data: vendedoresActivos },
    { data: clientes }
  ] = await Promise.all([
    supabase.from("configuracion_empresa").select("*").single(),
    supabase.from("nps_respuestas").select("*, clientes(nombre), perfiles!nps_respuestas_vendedor_id_fkey(nombre)").order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true),
    esAdminORecepcion ? supabase.from("clientes").select("id, nombre, telefono, vendedor_id").order("nombre") : Promise.resolve({ data: [] })
  ]);

  // El rol real en panel-v2 es "ventas" (ver ROLES en api/panel/usuarios) --
  // "vendedor" no existe, esto dejaba el ranking y el selector siempre vacíos.
  const vendedores = (vendedoresActivos || []).filter((v: any) => v.roles?.includes("ventas"));

  return (
    <NpsClient 
      esAdminORecepcion={esAdminORecepcion}
      respuestasIniciales={respuestas || []}
      configuracion={configuracion || {}}
      vendedores={vendedores}
      clientes={clientes || []}
      miId={user.id}
    />
  );
}