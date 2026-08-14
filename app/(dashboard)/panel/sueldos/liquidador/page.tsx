import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import LiquidadorClient from "./LiquidadorClient";

export default async function LiquidadorPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: empleados } = await supabase
    .from("perfiles")
    .select("id, nombre, rol, categoria_id, categorias_empleado ( id, nombre, sueldo_base, tiene_comision, monto_por_auto_taller )")
    .order("nombre");

  const { data: liquidacionesPrevias } = await supabase
    .from("liquidaciones_sueldo")
    .select("*, perfiles ( nombre )")
    .order("mes", { ascending: false })
    .limit(30);

  const empleadosNormalizados = (empleados || []).map((e: any) => ({
    ...e,
    categorias_empleado: Array.isArray(e.categorias_empleado) ? e.categorias_empleado[0] || null : e.categorias_empleado,
  }));

  return (
    <LiquidadorClient
      empleados={empleadosNormalizados}
      liquidacionesPrevias={liquidacionesPrevias || []}
    />
  );
}
