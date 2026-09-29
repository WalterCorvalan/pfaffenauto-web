import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { puedeVerModulo } from "@/lib/panel/permisosModulos";
import { ETAPA_ENTREGA } from "../etapasTaller";
import TallerMovilClient from "./TallerMovilClient";

export const metadata = { title: "Taller (celular) | Pfaffen Cars" };

export default async function TallerMovilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/panel/login");
  if (!(await puedeVerModulo(supabase, user.id, "taller"))) redirect("/panel");

  const [{ data: ordenes }, { data: mecanicos }] = await Promise.all([
    supabase.from("taller_ordenes").select("*").neq("estado", ETAPA_ENTREGA).order("created_at", { ascending: false }),
    supabase.from("taller_mecanicos").select("*").eq("activo", true).order("nombre"),
  ]);

  return <TallerMovilClient ordenesIniciales={ordenes || []} mecanicos={mecanicos || []} />;
}
