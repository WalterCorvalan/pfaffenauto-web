import { createClient } from "@/lib/supabase2/server";
import SenasClient from "./SenasClient";

export const metadata = { title: "Señas | Pfaffen Autos" };

export default async function SenasPage() {
  const supabase = await createClient();

  const [{ data: senas }, { data: clientes }, { data: vehiculos }, { data: vendedores }, { data: sucursales }, { data: cuentas }] = await Promise.all([
    supabase.from("senas").select("*, perfiles:vendedor_id ( nombre ), sucursales:sucursal_id ( nombre )").order("created_at", { ascending: false }).limit(100),
    supabase.from("clientes").select("*").order("nombre"),
    supabase.from("vehiculos").select("*").eq("estado", "disponible").order("marca"),
    supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("sucursales").select("id, nombre").order("nombre"),
    supabase.from("cuentas").select("id, nombre, moneda").eq("activa", true).order("nombre"),
  ]);

  return (
    <SenasClient
      senasIniciales={senas || []}
      clientes={clientes || []}
      vehiculos={vehiculos || []}
      vendedores={vendedores || []}
      sucursales={sucursales || []}
      cuentas={cuentas || []}
    />
  );
}
