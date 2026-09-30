import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { puedeVerModulo } from "@/lib/panel/permisosModulos";
import OportunidadesClient from "./OportunidadesClient";

export const metadata = { title: "Oportunidades | Pfaffen Cars" };

export default async function OportunidadesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/panel/login");
  if (!(await puedeVerModulo(supabase, user.id, "oportunidades"))) redirect("/panel");

  return <OportunidadesClient />;
}
