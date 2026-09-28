import { createClient } from "@/lib/supabase/server";
import FinanciacionesClient from "./FinanciacionesClient";

export const metadata = { title: "Financiaciones | Pfaffen Cars" };

export default async function FinanciacionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const miPerfil = user ? await supabase.from("perfiles").select("roles").eq("id", user.id).maybeSingle().then((r) => r.data) : null;
  const roles: string[] = miPerfil?.roles || [];
  // Pedido de la reunión del 22/9: una solicitud de financiación le llega
  // solo al vendedor asignado al auto (o al sorteado al azar si no tenía
  // uno, ver app/api/panel/leads-tasacion/route.ts) -- admin/encargado/
  // finanzas siguen viendo todas, para supervisar y administrar tasas.
  const veTodo = roles.some((r) => ["admin", "encargado", "finanzas"].includes(r));
  const esAdminOFinanzas = roles.some((r) => r === "admin" || r === "finanzas");

  let query = supabase.from("leads_tasacion").select("*").eq("tipo", "financiacion").order("created_at", { ascending: false });
  if (!veTodo && user) query = query.eq("vendedor_id", user.id);

  const [{ data: solicitudes }, { data: staff }] = await Promise.all([
    query,
    supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
  ]);

  return <FinanciacionesClient solicitudesIniciales={solicitudes || []} staff={staff || []} esAdminOFinanzas={esAdminOFinanzas} />;
}
