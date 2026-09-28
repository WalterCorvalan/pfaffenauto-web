import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CategoriasClient from "./CategoriasClient";

export const metadata = { title: "Categorías de empleados | Pfaffen Cars" };

export default async function CategoriasPage() {
  const supabase = await createClient();
  // Mismo hallazgo que liquidador/page.tsx -- sin esto, cualquier usuario
  // logueado podía cambiar el sueldo base de cualquier categoría de
  // empleado por URL directa.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/panel/login");
  const { data: miPerfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).single();
  if (!miPerfil?.roles?.includes("admin")) redirect("/panel");

  const { data: categorias } = await supabase
    .from("categorias_empleado")
    .select("*")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  return <CategoriasClient categoriasIniciales={categorias || []} />;
}
