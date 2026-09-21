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
    supabase.from("perfiles").select("roles, ganancias_ocultas").eq("id", user?.id || "").maybeSingle(),
    supabase.from("vehiculos").select("id, marca, modelo, patente").order("marca"),
  ]);

  // "ganancia oculta" es la excepción por-usuario (perfiles.ganancias_ocultas)
  // que ya usan Expedientes/Gestoría/Liquidaciones/Tesorería -- antes acá se
  // chequeaba directo el rol (admin/finanzas), que no deja ocultarle el
  // margen a un finanzas puntual sin sacarle el módulo entero.
  const puedeVerGanancia = !(miPerfil?.ganancias_ocultas ?? false);

  return <InfraccionesClient infraccionesIniciales={infracciones || []} vehiculos={vehiculos || []} puedeVerGanancia={puedeVerGanancia} />;
}
