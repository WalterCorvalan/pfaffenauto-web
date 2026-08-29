import { createClient } from "@/lib/supabase2/server";
import GestoriaClient from "./GestoriaClient";

export default async function GestoriaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [expedientesRes, perfilesRes, miPerfil] = await Promise.all([
    supabase.from("expedientes").select("*, venta:ventas(*)").eq("archivado", false).eq("es_reventa", false).order("fecha_apertura", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    user ? supabase.from("perfiles").select("id, nombre, roles, ganancias_ocultas").eq("id", user.id).single().then((r) => r.data) : Promise.resolve(null),
  ]);

  const expedientes = expedientesRes.data || [];
  const ids = expedientes.map((e) => e.id);

  const [hitosRes, checklistRes] = await Promise.all([
    ids.length ? supabase.from("expediente_hitos").select("*").in("expediente_id", ids).order("orden") : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("expediente_checklist").select("*").in("expediente_id", ids).order("parte,orden") : Promise.resolve({ data: [] }),
  ]);

  const hitosPorExpediente: Record<string, any[]> = {};
  for (const h of hitosRes.data || []) (hitosPorExpediente[h.expediente_id] ||= []).push(h);

  const checklistPorExpediente: Record<string, any[]> = {};
  for (const c of checklistRes.data || []) (checklistPorExpediente[c.expediente_id] ||= []).push(c);

  const soyAdmin = miPerfil?.roles?.includes("admin") ?? false;
  const puedeOperacionCaida = miPerfil?.roles?.some((r: string) => r === "admin" || r === "finanzas") ?? false;
  const puedeVerLiquidacion = miPerfil?.roles?.some((r: string) => ["admin", "finanzas", "gestoria"].includes(r)) ?? false;

  return (
    <GestoriaClient
      expedientesIniciales={expedientes}
      hitosPorExpediente={hitosPorExpediente}
      checklistPorExpediente={checklistPorExpediente}
      perfiles={perfilesRes.data || []}
      miId={user?.id || ""}
      soyAdmin={soyAdmin}
      puedeOperacionCaida={puedeOperacionCaida}
      puedeVerLiquidacion={puedeVerLiquidacion}
      gananciasOcultas={miPerfil?.ganancias_ocultas ?? false}
    />
  );
}
