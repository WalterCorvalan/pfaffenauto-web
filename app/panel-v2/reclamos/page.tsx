import { createClient } from "@/lib/supabase2/server";
import ReclamosClient from "./ReclamosClient";

export default async function ReclamosPage() {
  const supabase = await createClient();

  const [reclamosRes, perfilesRes, miPerfil] = await Promise.all([
    supabase
      .from("reclamos")
      .select("*, asignado:perfiles!reclamos_asignado_a_fkey(id, nombre)")
      .order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true),
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return null;
      const { data } = await supabase.from("perfiles").select("id, nombre, roles").eq("id", user.id).single();
      return data;
    }),
  ]);
  const reclamos = reclamosRes.data;
  const perfiles = perfilesRes.data;

  return (
    <ReclamosClient
      reclamosIniciales={reclamos || []}
      perfiles={perfiles || []}
      miPerfil={miPerfil}
    />
  );
}
