import { createClient } from "@/lib/supabase/server";
import { fetchPaginado } from "@/lib/panel/fetchPaginado";
import DormidosClient from "./DormidosClient";

export const metadata = { title: "Clientes Dormidos | Pfaffen Cars" };

export default async function DormidosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: ventas }, clientes, { data: perfiles }, { data: config }] = await Promise.all([
    supabase
      .from("ventas")
      .select("cliente_id, fecha_cierre, precio_venta, moneda_venta, vehiculo_marca, vehiculo_modelo")
      .eq("estado", "cerrada")
      .not("cliente_id", "is", null)
      .order("fecha_cierre", { ascending: false }),
    // Sin .limit() -- PostgREST corta en 1000 filas igual. fetchPaginado()
    // trae la tabla entera (con la base real ya arriba de los 1000
    // clientes, esto se venía cortando en silencio).
    fetchPaginado(() => supabase.from("clientes").select("id, nombre, telefono, vendedor_id")),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    supabase.from("configuracion_empresa").select("plantilla_reactivacion_dormidos").eq("id", true).maybeSingle(),
  ]);

  return (
    <DormidosClient
      ventas={ventas || []}
      clientes={clientes || []}
      perfiles={perfiles || []}
      plantilla={config?.plantilla_reactivacion_dormidos || null}
      miId={user?.id || ""}
    />
  );
}
