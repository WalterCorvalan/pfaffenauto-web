import { createClient } from "@/lib/supabase/server";
import InfraccionesClient from "./InfraccionesClient";

export const metadata = { title: "Infracciones | Pfaffen Autos" };

export default async function InfraccionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const desde6Meses = new Date();
  desde6Meses.setMonth(desde6Meses.getMonth() - 6);

  const [{ data: infracciones }, { data: miPerfil }, { data: vehiculos }] = await Promise.all([
    supabase.from("infracciones").select("*").gte("fecha", desde6Meses.toISOString().split("T")[0]).order("fecha", { ascending: false }),
    supabase.from("perfiles").select("roles").eq("id", user?.id || "").maybeSingle(),
    supabase.from("vehiculos").select("id, marca, modelo, patente").order("marca"),
  ]);

  const puedeVerGanancia = !!miPerfil?.roles?.some((r: string) => r === "admin" || r === "finanzas");

  return <InfraccionesClient infraccionesIniciales={infracciones || []} vehiculos={vehiculos || []} puedeVerGanancia={puedeVerGanancia} />;
}
