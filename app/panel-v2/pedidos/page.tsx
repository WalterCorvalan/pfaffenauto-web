import { createClient } from "@/lib/supabase2/server";
import PedidosClient from "./PedidosClient";

export const metadata = { title: "Pedidos | Pfaffen Autos" };

export default async function PedidosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: pedidos }, { data: vendedores }, { data: clientes }, { data: vehiculosStock }] = await Promise.all([
    supabase
      .from("pedidos")
      .select("*, vehiculo_match:vehiculo_match_id ( marca, modelo, anio, precio_venta, moneda_venta )")
      .order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("clientes").select("id, nombre, telefono").order("nombre"),
    supabase.from("vehiculos").select("id, marca, modelo, anio, precio_venta, moneda_venta").in("estado", ["disponible", "reservado"]).order("marca"),
  ]);

  return <PedidosClient pedidosIniciales={pedidos || []} vendedores={vendedores || []} clientes={clientes || []} vehiculosStock={vehiculosStock || []} miId={user?.id || ""} />;
}
