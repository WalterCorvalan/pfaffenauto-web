import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { puedeVerModulo } from "@/lib/panel/permisosModulos";
import TallerClient from "./TallerClient";

export const metadata = { title: "Taller | Pfaffen Cars" };

export default async function TallerPage() {
  // Cambio clave acá: createClient en vez de createServerClient
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/panel/login");
  // Esta página no tenía NINGÚN control de acceso (ni sesión) -- mismo
  // hallazgo que la auditoría de Finanzas (permisos #18), pero acá era peor
  // porque ni siquiera pedía estar logueado. puedeVerModulo() ya existía y
  // respeta modulos_config/visibilidad_sector (ver ROL_A_SECTOR en
  // permisosModulos.ts, ya tenía el mapeo taller->taller armado de antes).
  if (!(await puedeVerModulo(supabase, user.id, "taller"))) redirect("/panel");

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