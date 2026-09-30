import { createClient } from "@/lib/supabase/server";
import { fetchPaginado } from "@/lib/panel/fetchPaginado";
import VisitasClient from "./VisitasClient";

export default async function VisitasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [visitasRes, perfilesRes, sucursalesRes, vehiculosRes, clientes] = await Promise.all([
    supabase.from("visitas").select("*").order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    supabase.from("sucursales").select("id, nombre").order("nombre"),
    supabase.from("vehiculos").select("id, marca, modelo, patente").eq("estado", "disponible").order("marca"),
    // Sin .limit() -- PostgREST corta en 1000 filas igual. fetchPaginado()
    // trae la tabla entera (el buscador en vivo de NuevaVisitaModal ya no
    // depende de esto, pero el fallback local de 1 carácter sí).
    fetchPaginado(() => supabase.from("clientes").select("id, nombre, telefono").order("nombre")),
  ]);

  return (
    <VisitasClient
      visitasIniciales={visitasRes.data || []}
      perfiles={perfilesRes.data || []}
      sucursales={sucursalesRes.data || []}
      vehiculos={vehiculosRes.data || []}
      clientes={clientes || []}
      miId={user?.id || ""}
    />
  );
}
