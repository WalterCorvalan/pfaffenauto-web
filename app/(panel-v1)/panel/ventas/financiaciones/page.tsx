import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import FinanciacionesClient from "./FinanciacionesClient";

export default async function FinanciacionesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { data: perfil } = user ? await supabase.from("perfiles").select("rol").eq("id", user.id).maybeSingle() : { data: null };
  if (perfil?.rol !== "admin") redirect("/panel");

  const [{ data: financiacionesRaw }, { data: solicitudes }, { data: cuentas }] = await Promise.all([
    supabase
      .from("financiaciones")
      .select("id, venta_id, tipo, entidad, monto, cuotas, fecha_vencimiento, estado, created_at")
      .order("fecha_vencimiento", { ascending: true }),
    // Solicitudes entrantes: gente que pidió crédito online (aún no compró nada) — tabla cotizaciones
    supabase
      .from("cotizaciones")
      .select("*")
      .eq("tipo_peritaje", "financiacion")
      .order("created_at", { ascending: false }),
    supabase.from("cuentas").select("id, nombre, moneda").eq("activa", true).order("nombre"),
  ]);

  const ventaIds = [...new Set((financiacionesRaw || []).map((f) => f.venta_id).filter(Boolean))];
  const { data: boletos } = ventaIds.length
    ? await supabase.from("boletos_venta").select("id, nombre, apellido, marca, modelo, dominio, sucursal_id, cliente_id, vendedor_id").in("id", ventaIds)
    : { data: [] as any[] };

  const boletosPorId = new Map((boletos || []).map((b) => [b.id, b]));
  const financiaciones = (financiacionesRaw || []).map((f) => ({ ...f, boleto: boletosPorId.get(f.venta_id) || null }));

  return (
    <FinanciacionesClient
      financiacionesIniciales={financiaciones as any}
      solicitudesIniciales={solicitudes || []}
      cuentas={cuentas || []}
    />
  );
}
