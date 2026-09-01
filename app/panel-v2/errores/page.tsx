import { createClient } from "@/lib/supabase2/server";
import ErroresClient from "./ErroresClient";

export const metadata = { title: "Errores del sistema | Pfaffen Autos" };

export default async function ErroresPage() {
  const supabase = await createClient();

  const { data: errores } = await supabase
    .from("logs_errores")
    .select("id, origen, mensaje, detalle, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return <ErroresClient errores={(errores || []) as any} />;
}
