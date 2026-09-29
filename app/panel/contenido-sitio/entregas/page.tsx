import { createClient } from "@/lib/supabase/server";
import EntregasClient from "./EntregasClient";

export default async function EntregasPage() {
  const supabase = await createClient();
  const { data: entregas } = await supabase
    .from("entregas_realizadas")
    .select("*")
    .order("orden", { ascending: true });

  return <EntregasClient entregasIniciales={entregas || []} />;
}
