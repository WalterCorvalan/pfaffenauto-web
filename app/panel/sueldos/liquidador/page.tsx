import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LiquidadorClient from "./LiquidadorClient";

export const metadata = { title: "Liquidador de sueldos | Pfaffen Autos" };

export default async function LiquidadorPage() {
  const supabase = await createClient();
  // Sueldos no tenía ningún control de acceso -- ni tienePermiso() en el
  // server, ni chequeo de rol en el cliente. Cualquier usuario logueado
  // entraba por URL directa y veía el sueldo base de todos los empleados
  // (incluido admin), y podía marcar/revertir liquidaciones pagadas --
  // plata real de Tesorería. Solo admin, es el dato más sensible del panel.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/panel/login");
  const { data: miPerfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).single();
  if (!miPerfil?.roles?.includes("admin")) redirect("/panel");

  const { data: empleados } = await supabase
    .from("perfiles")
    .select("id, nombre, roles, categoria_id, categorias_empleado ( id, nombre, sueldo_base, moneda_sueldo, tiene_comision, monto_por_auto_taller, moneda_taller )")
    .eq("activo", true)
    .order("nombre");

  const { data: liquidacionesPrevias } = await supabase
    .from("liquidaciones_sueldo")
    .select("*, perfiles!liquidaciones_sueldo_perfil_id_fkey ( nombre )")
    .order("mes", { ascending: false })
    .limit(30);

  const { data: categorias } = await supabase
    .from("categorias_empleado")
    .select("id, nombre")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  const { data: cuentas } = await supabase
    .from("cuentas")
    .select("id, nombre, moneda")
    .eq("activa", true)
    .order("nombre");

  const empleadosNormalizados = (empleados || []).map((e: any) => ({
    ...e,
    categorias_empleado: Array.isArray(e.categorias_empleado) ? e.categorias_empleado[0] || null : e.categorias_empleado,
  }));

  return <LiquidadorClient empleados={empleadosNormalizados} liquidacionesPrevias={liquidacionesPrevias || []} categorias={categorias || []} cuentas={cuentas || []} />;
}
