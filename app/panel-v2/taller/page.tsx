import { createClient } from "@/lib/supabase2/server";
import TallerClient from "./TallerClient";

export const metadata = { title: "Taller | Pfaffen Autos" };

export default async function TallerPage() {
  // Cambio clave acá: createClient en vez de createServerClient
  const supabase = await createClient();

  const [
    { data: ordenes },
    { data: mecanicos },
    { data: configuracion },
    { data: servicios }
  ] = await Promise.all([
    supabase.from("taller_ordenes").select("*").order("created_at", { ascending: false }),
    supabase.from("taller_mecanicos").select("*").eq("activo", true).order("nombre"),
    supabase.from("taller_config").select("*").single(),
    supabase.from("taller_servicios").select("*").eq("activo", true).order("nombre")
  ]);

  return (
    <TallerClient
      ordenesIniciales={ordenes || []}
      mecanicos={mecanicos || []}
      servicios={servicios || []}
      configuracion={configuracion}
    />
  );
}