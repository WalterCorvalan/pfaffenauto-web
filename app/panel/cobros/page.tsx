import { createClient } from "@/lib/supabase2/server";
import CobrosClient from "./CobrosClient";

export const metadata = { title: "Cobros | Pfaffen Autos" };

export default async function CobrosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const miPerfil = user ? await supabase.from("perfiles").select("id, nombre, roles").eq("id", user.id).single().then((r) => r.data) : null;
  const soyAdminOFinanzas = miPerfil?.roles?.some((r: string) => r === "admin" || r === "finanzas") ?? false;

  let query = supabase
    .from("cuotas_cobrar_clientes")
    .select("*, cliente:clientes(nombre), venta:ventas(vehiculo_marca, vehiculo_modelo)")
    .order("vencimiento");

  if (!soyAdminOFinanzas && user) {
    query = query.eq("vendedor_id", user.id);
  }

  const { data: cuotas } = await query;
  const { data: cuentas } = await supabase.from("cuentas").select("id, nombre, moneda").eq("activa", true).order("nombre");

  return (
    <CobrosClient
      miId={user?.id || ""}
      soyAdminOFinanzas={soyAdminOFinanzas}
      cuotasIniciales={cuotas || []}
      cuentas={cuentas || []}
    />
  );
}
