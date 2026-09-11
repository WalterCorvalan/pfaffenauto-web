import { createClient } from "@/lib/supabase/server";
import ExpedientesClient from "./ExpedientesClient";

export default async function ExpedientesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Igual que Ventas -- se pagina a los últimos 6 meses en vez de traer
  // todo el historial completo (con la venta anidada entera) en cada carga.
  const desde6Meses = new Date();
  desde6Meses.setMonth(desde6Meses.getMonth() - 6);

  const [expedientesRes, perfilesRes, miPerfil, gastosRes] = await Promise.all([
    supabase
      .from("expedientes")
      .select("*, venta:ventas(*)")
      .gte("created_at", desde6Meses.toISOString())
      .order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    user ? supabase.from("perfiles").select("id, nombre, roles, ganancias_ocultas").eq("id", user.id).single().then((r) => r.data) : Promise.resolve(null),
    supabase.from("expediente_gastos").select("expediente_id, monto, moneda, a_cargo_de"),
  ]);

  // Por moneda -- expediente_gastos permite ARS y USD, sumarlos juntos daba
  // un número sin sentido (mismo bug ya corregido en Tesorería esta sesión).
  const gastosPorExpediente: Record<string, { vendedor: Record<string, number>; comprador: Record<string, number> }> = {};
  for (const g of gastosRes.data || []) {
    if (!gastosPorExpediente[g.expediente_id]) gastosPorExpediente[g.expediente_id] = { vendedor: {}, comprador: {} };
    const bucket = gastosPorExpediente[g.expediente_id];
    if (g.a_cargo_de === "vendedor") bucket.vendedor[g.moneda] = (bucket.vendedor[g.moneda] || 0) + Number(g.monto);
    if (g.a_cargo_de === "comprador") bucket.comprador[g.moneda] = (bucket.comprador[g.moneda] || 0) + Number(g.monto);
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
