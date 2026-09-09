import { createClient } from "@/lib/supabase2/server";
import AlertasClient from "./AlertasClient";

export default async function AlertasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: alertas } = await supabase
    .from("alertas")
    .select("*")
    .eq("destinatario_id", user?.id || "")
    .order("created_at", { ascending: false });

  return <AlertasClient alertasIniciales={alertas || []} miId={user?.id || ""} />;
}
