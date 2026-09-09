import { createClient } from "@/lib/supabase2/server";
import ExpedientesClient from "./ExpedientesClient";

export default async function ExpedientesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [expedientesRes, perfilesRes, miPerfil, gastosRes] = await Promise.all([
    supabase
      .from("expedientes")
      .select("*, venta:ventas(*)")
      .order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    user ? supabase.from("perfiles").select("id, nombre, roles, ganancias_ocultas").eq("id", user.id).single().then((r) => r.data) : Promise.resolve(null),
    supabase.from("expediente_gastos").select("expediente_id, monto, a_cargo_de"),
  ]);

  const gastosPorExpediente: Record<string, { vendedor: number; comprador: number }> = {};
  for (const g of gastosRes.data || []) {
    if (!gastosPorExpediente[g.expediente_id]) gastosPorExpediente[g.expediente_id] = { vendedor: 0, comprador: 0 };
    if (g.a_cargo_de === "vendedor") gastosPorExpediente[g.expediente_id].vendedor += Number(g.monto);
    if (g.a_cargo_de === "comprador") gastosPorExpediente[g.expediente_id].comprador += Number(g.monto);
  }

  return (
    <ExpedientesClient
      expedientesIniciales={expedientesRes.data || []}
      perfiles={perfilesRes.data || []}
      miId={user?.id || ""}
      miPerfil={miPerfil}
      gastosPorExpediente={gastosPorExpediente}
    />
  );
}
