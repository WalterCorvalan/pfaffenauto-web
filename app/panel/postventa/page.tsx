import { createClient } from "@/lib/supabase/server";
import { fetchPaginado } from "@/lib/panel/fetchPaginado";
import PostventaClient from "./PostventaClient";

export default async function PostventaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [compras, { data: recordatorios }, { data: perfiles }] = await Promise.all([
    // Sin .limit() -- PostgREST corta en 1000 filas igual. Con años de
    // ventas acumuladas esto podía superarse en silencio. fetchPaginado()
    // trae la tabla entera.
    fetchPaginado(() => supabase.from("postventa_compras").select("*").order("fecha_venta", { ascending: false })),
    supabase.from("postventa_recordatorios").select("*").eq("estado", "pendiente").order("fecha_vencimiento", { ascending: true }),
    supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
  ]);

  return (
    <PostventaClient
      comprasIniciales={compras || []}
      recordatoriosIniciales={recordatorios || []}
      perfiles={perfiles || []}
      miId={user?.id || ""}
    />
  );
}
