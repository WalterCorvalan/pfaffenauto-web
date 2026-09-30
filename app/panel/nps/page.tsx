import { createClient } from "@/lib/supabase/server";
import { fetchPaginado } from "@/lib/panel/fetchPaginado";
import NpsClient from "./NpsClientLazy";

export const metadata = { title: "NPS y Satisfacción | Pfaffen Cars" };

export default async function NpsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Traer el perfil actual para saber si es admin
  const { data: miPerfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).maybeSingle();
  const esAdminORecepcion = miPerfil?.roles?.includes("admin") || false;

  // Datos iniciales
  const [
    { data: configuracion },
    { data: respuestas },
    { data: vendedoresActivos },
    clientes
  ] = await Promise.all([
    supabase.from("configuracion_empresa").select("*").maybeSingle(),
    supabase.from("nps_respuestas").select("*, clientes(nombre), perfiles!nps_respuestas_vendedor_id_fkey(nombre)").order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true),
    // Sin .limit() -- PostgREST corta en 1000 filas igual. fetchPaginado()
    // trae la tabla entera.
    esAdminORecepcion ? fetchPaginado(() => supabase.from("clientes").select("id, nombre, telefono, vendedor_id").order("nombre")) : Promise.resolve([])
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