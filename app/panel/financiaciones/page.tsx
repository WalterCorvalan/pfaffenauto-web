import { createClient } from "@/lib/supabase2/server";
import FinanciacionesClient from "./FinanciacionesClient";

export const metadata = { title: "Financiaciones | Pfaffen Autos" };

export default async function FinanciacionesPage() {
  const supabase = await createClient();

  const { data: solicitudes } = await supabase
    .from("leads_tasacion")
    .select("*")
    .eq("tipo", "financiacion")
    .order("created_at", { ascending: false });

  return <FinanciacionesClient solicitudesIniciales={solicitudes || []} />;
}
