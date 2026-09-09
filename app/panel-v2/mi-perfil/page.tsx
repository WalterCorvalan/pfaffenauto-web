import { createClient } from "@/lib/supabase2/server";
import PerfilClient from "./PerfilClient";

export const metadata = { title: "Mi Perfil | Pfaffen Autos" };

export default async function MiPerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <PerfilClient miId={user?.id || ""} />;
}
