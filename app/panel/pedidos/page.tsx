import { createClient } from "@/lib/supabase/server";
import PedidosClient from "./PedidosClient";

export const metadata = { title: "Pedidos | Pfaffen Autos" };

export default async function PedidosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const desde6Meses = new Date();
  desde6Meses.setMonth(desde6Meses.getMonth() - 6);

  const [{ data: pedidos }, { data: vendedores }, { data: clientes }, { data: vehiculosStock }] = await Promise.all([
    supabase
      .from("pedidos")
      .select("*, vehiculo_match:vehiculo_match_id ( marca, modelo, anio, precio_venta, moneda_venta )")
      // Un pedido "activo" puede seguir esperando stock hace más de 6 meses --
      // solo acotamos por fecha los ya cerrados (cumplido/cancelado), nunca los activos.
      .or(`estado.eq.activo,created_at.gte.${desde6Meses.toISOString()}`)
      .order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("clientes").select("id, nombre, telefono").order("nombre").limit(2000),
    supabase.from("vehiculos").select("id, marca, modelo, anio, precio_venta, moneda_venta").in("estado", ["disponible", "reservado"]).order("marca"),
  ]);

  return <PedidosClient pedidosIniciales={pedidos || []} vendedores={vendedores || []} clientes={clientes || []} vehiculosStock={vehiculosStock || []} miId={user?.id || ""} />;
}
