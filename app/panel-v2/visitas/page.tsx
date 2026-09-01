import { createClient } from "@/lib/supabase2/server";
import VisitasClient from "./VisitasClient";

export default async function VisitasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [visitasRes, perfilesRes, sucursalesRes, vehiculosRes, clientesRes] = await Promise.all([
    supabase.from("visitas").select("*").order("fecha_visita", { ascending: true }).order("horario_visita", { ascending: true }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    supabase.from("sucursales").select("id, nombre").order("nombre"),
    supabase.from("vehiculos").select("id, marca, modelo, patente").eq("estado", "disponible").order("marca"),
    supabase.from("clientes").select("id, nombre, telefono").order("nombre"),
  ]);

  return (
    <VisitasClient
      visitasIniciales={visitasRes.data || []}
      perfiles={perfilesRes.data || []}
      sucursales={sucursalesRes.data || []}
      vehiculos={vehiculosRes.data || []}
      clientes={clientesRes.data || []}
      miId={user?.id || ""}
    />
  );
}
