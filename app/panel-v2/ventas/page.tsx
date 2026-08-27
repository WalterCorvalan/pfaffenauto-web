import { createClient } from "@/lib/supabase2/server";
import VentasClient from "./VentasClient";

export default async function VentasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: ventas }, { data: perfiles }, { data: clientes }, { data: vehiculos }, { data: permutas }] = await Promise.all([
    supabase.from("ventas").select("*").order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    supabase.from("clientes").select("id, nombre, telefono, email, dni_cuit").order("nombre"),
    supabase.from("vehiculos").select("id, marca, modelo, anio, patente, km, precio_venta, moneda_venta, estado, color, condicion").in("estado", ["disponible", "reservado", "señado"]).order("marca"),
    supabase.from("venta_permutas").select("venta_id"),
  ]);

  return (
    <VentasClient
      ventasIniciales={ventas || []}
      perfiles={perfiles || []}
      clientes={clientes || []}
      vehiculos={vehiculos || []}
      ventaIdsConPermuta={Array.from(new Set((permutas || []).map((p) => p.venta_id)))}
      miId={user?.id || ""}
    />
  );
}
