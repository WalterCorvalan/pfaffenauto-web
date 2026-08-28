import { createClient } from "@/lib/supabase2/server";
import TelefonosClient from "./TelefonosClient";

export const metadata = { title: "Teléfonos útiles | Pfaffen Autos" };

export default async function TelefonosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: telefonos } = await supabase
    .from("telefonos_utiles")
    .select("*")
    .order("categoria", { ascending: true })
    .order("nombre", { ascending: true });

  return (
    <TelefonosClient 
      telefonosIniciales={telefonos || []} 
      usuarioActualId={user?.id || ""} 
    />
  );
}