import { createClient } from "@/lib/supabase/server";
import FinanciacionesClient from "./FinanciacionesClient";

export const metadata = { title: "Financiaciones | Pfaffen Autos" };

export default async function FinanciacionesPage() {
  const supabase = await createClient();

  const [{ data: solicitudes }, { data: staff }] = await Promise.all([
    supabase.from("leads_tasacion").select("*").eq("tipo", "financiacion").order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
  ]);

  return <FinanciacionesClient solicitudesIniciales={solicitudes || []} staff={staff || []} />;
}
