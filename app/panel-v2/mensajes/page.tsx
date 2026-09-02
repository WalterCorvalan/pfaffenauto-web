import { createClient } from "@/lib/supabase2/server";
import MensajesClient from "./MensajesClient";

export const metadata = { title: "Mensajes | Pfaffen Autos" };

export default async function MensajesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [miPerfil, { data: staff }] = await Promise.all([
    user ? supabase.from("perfiles").select("id, nombre").eq("id", user.id).single().then((r) => r.data) : Promise.resolve(null),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
  ]);

  return (
    <MensajesClient
      miId={user?.id || ""}
      miNombre={miPerfil?.nombre || "Yo"}
      staff={(staff || []).filter((p) => p.id !== user?.id)}
    />
  );
}
