import { createClient } from "@/lib/supabase2/server";
import VisitasClient from "./VisitasClient";

export default async function VisitasPage() {
  const supabase = await createClient();

  const [visitasRes, perfilesRes] = await Promise.all([
    supabase.from("visitas").select("*").order("fecha_visita", { ascending: true }).order("horario_visita", { ascending: true }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
  ]);

  return (
    <VisitasClient
      visitasIniciales={visitasRes.data || []}
      perfiles={perfilesRes.data || []}
    />
  );
}
