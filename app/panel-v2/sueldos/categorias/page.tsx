import { createClient } from "@/lib/supabase2/server";
import CategoriasClient from "./CategoriasClient";

export const metadata = { title: "Categorías de empleados | Pfaffen Autos" };

export default async function CategoriasPage() {
  const supabase = await createClient();

  const { data: categorias } = await supabase
    .from("categorias_empleado")
    .select("*")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  return <CategoriasClient categoriasIniciales={categorias || []} />;
}
