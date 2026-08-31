import { createClient } from "@/lib/supabase2/server";
import InfraccionesClient from "./InfraccionesClient";

export const metadata = { title: "Infracciones | Pfaffen Autos" };

export default async function InfraccionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: infracciones }, { data: miPerfil }, { data: vehiculos }] = await Promise.all([
    supabase.from("infracciones").select("*").order("fecha", { ascending: false }).limit(300),
    supabase.from("perfiles").select("roles").eq("id", user?.id || "").maybeSingle(),
    supabase.from("vehiculos").select("id, marca, modelo, patente").order("marca"),
  ]);

  const puedeVerGanancia = !!miPerfil?.roles?.some((r: string) => r === "admin" || r === "finanzas");

  return <InfraccionesClient infraccionesIniciales={infracciones || []} vehiculos={vehiculos || []} puedeVerGanancia={puedeVerGanancia} />;
}
