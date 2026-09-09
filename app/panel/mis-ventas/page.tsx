import { createClient } from "@/lib/supabase2/server";
import MisVentasClient from "./MisVentasClient";

export const metadata = { title: "Mis ventas | Pfaffen Autos" };

export default async function MisVentasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: vendedores }, { data: miPerfil }] = await Promise.all([
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).contains("roles", ["ventas"]).order("nombre"),
    supabase.from("perfiles").select("id, nombre, roles").eq("id", user?.id || "").maybeSingle(),
  ]);

  const esAdmin = !!miPerfil?.roles?.includes("admin");

  return (
    <MisVentasClient
      vendedores={vendedores || []}
      miId={user?.id || ""}
      miNombre={miPerfil?.nombre || "Usuario"}
      esAdmin={esAdmin}
    />
  );
}
