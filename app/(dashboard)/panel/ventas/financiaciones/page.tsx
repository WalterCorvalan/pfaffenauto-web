import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import FinanciacionesClient from "./FinanciacionesClient";

export default async function FinanciacionesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: financiacionesRaw } = await supabase
    .from("financiaciones")
    .select("id, venta_id, tipo, entidad, monto, cuotas, fecha_vencimiento, estado, created_at")
    .order("fecha_vencimiento", { ascending: true });

  const ventaIds = [...new Set((financiacionesRaw || []).map((f) => f.venta_id).filter(Boolean))];
  const { data: boletos } = ventaIds.length
    ? await supabase.from("boletos_venta").select("id, nombre, apellido, marca, modelo, dominio").in("id", ventaIds)
    : { data: [] as any[] };

  const boletosPorId = new Map((boletos || []).map((b) => [b.id, b]));
  const financiaciones = (financiacionesRaw || []).map((f) => ({ ...f, boleto: boletosPorId.get(f.venta_id) || null }));

  return <FinanciacionesClient financiacionesIniciales={financiaciones as any} />;
}
