import { createClient } from "@/lib/supabase2/server";
import PresupuestosClient from "./PresupuestosClient";

export const metadata = { title: "Presupuestos | Pfaffen Autos" };

export default async function PresupuestosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: miPerfil } = user ? await supabase.from("perfiles").select("roles").eq("id", user.id).single() : { data: null };
  const esEncargado = miPerfil?.roles?.some((r: string) => ["admin", "encargado"].includes(r));

  let query = supabase.from("presupuestos").select("*, perfiles:vendedor_id ( nombre )").order("created_at", { ascending: false }).limit(100);
  if (!esEncargado && user) query = query.eq("vendedor_id", user.id);

  const [{ data: presupuestos }, { data: clientes }, { data: vehiculos }, { data: vendedores }, { data: sucursales }] = await Promise.all([
    query,
    supabase.from("clientes").select("*").order("nombre"),
    supabase.from("vehiculos").select("*").eq("estado", "disponible").order("marca"),
    supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("sucursales").select("id, nombre").order("nombre"),
  ]);

  return (
    <PresupuestosClient
      presupuestosIniciales={presupuestos || []}
      clientes={clientes || []}
      vehiculos={vehiculos || []}
      vendedores={vendedores || []}
      sucursales={sucursales || []}
    />
  );
}
