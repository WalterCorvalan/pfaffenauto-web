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

  const { data: financiaciones } = await supabase
    .from("financiaciones")
    .select(`
      id, venta_id, tipo, entidad, monto, cuotas, fecha_vencimiento, estado, created_at,
      ventas ( clientes ( nombre, apellido ), vehiculos ( marca, modelo, patente ) )
    `)
    .order("fecha_vencimiento", { ascending: true });

  return <FinanciacionesClient financiacionesIniciales={(financiaciones || []) as any} />;
}
