import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SucursalesClient from "./SucursalesClient";

export const metadata = { title: "Sucursales | Configuración | Pfaffen Cars" };

export default async function SucursalesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/panel/login");

  const { data: perfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).maybeSingle();
  if (!perfil?.roles?.includes("admin")) {
    return <div className="p-6 text-sm text-slate-500">Solo Admin puede ver la Configuración.</div>;
  }

  const { data: sucursales } = await supabase.from("sucursales").select("*").order("nombre");

  return <SucursalesClient sucursalesIniciales={sucursales || []} />;
}
