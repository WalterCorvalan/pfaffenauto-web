import { createClient } from "@/lib/supabase2/server";
import { redirect } from "next/navigation";
import ConfiguracionWhatsappClient from "./ConfiguracionWhatsappClient";

export default async function ConfiguracionWhatsappPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/panel-v2/login");

  const { data: perfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).single();
  if (!perfil?.roles?.includes("admin")) {
    return <div className="p-6 text-sm text-slate-500">Solo Admin puede ver la Configuración.</div>;
  }

  return <ConfiguracionWhatsappClient />;
}
