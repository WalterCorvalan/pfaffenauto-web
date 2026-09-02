import { createClient } from "@/lib/supabase2/server";
import FinanzasClient from "./FinanzasClient";

export const metadata = { title: "Finanzas | Pfaffen Autos" };

export default async function FinanzasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const miPerfil = user ? await supabase.from("perfiles").select("id, nombre, roles").eq("id", user.id).single().then((r) => r.data) : null;
  const soyAdminOFinanzas = miPerfil?.roles?.some((r: string) => r === "admin" || r === "finanzas") ?? false;
  const soyAdmin = miPerfil?.roles?.includes("admin") ?? false;

  const [{ data: cuentas }, { data: cierres }, { data: cuotasCobrar }, { data: cuotasPagar }, { data: vendedores }, { data: clientes }, { data: vehiculos }, { data: ventas }] = await Promise.all([
    supabase.from("cuentas").select("*").eq("activa", true).order("nombre"),
    supabase.from("cierres_mensuales").select("*").order("mes", { ascending: false }),
    supabase.from("cuotas_cobrar_clientes").select("*, cliente:clientes(nombre)").order("vencimiento"),
    supabase.from("cuotas_pagar_agencia").select("*").order("vencimiento"),
    supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("clientes").select("id, nombre").order("nombre").limit(500),
    supabase.from("vehiculos").select("id, marca, modelo, patente").in("estado", ["disponible", "reservado", "señado"]).order("marca"),
    supabase.from("ventas").select("id, comprador_nombre, vehiculo_marca, vehiculo_modelo").order("created_at", { ascending: false }).limit(300),
  ]);

  const cuentasConSaldo = await Promise.all(
    (cuentas || []).map(async (c) => {
      const { data: saldo } = await supabase.rpc("saldo_cuenta", { p_cuenta_id: c.id });
      return { ...c, saldo: Number(saldo) || 0 };
    })
  );

  const { data: movimientosRecientes } = await supabase
    .from("movimientos_caja")
    .select("*, cuenta:cuentas(nombre, moneda)")
    .is("deleted_at", null)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <FinanzasClient
      miId={user?.id || ""}
      soyAdmin={soyAdmin}
      soyAdminOFinanzas={soyAdminOFinanzas}
      cuentasIniciales={cuentasConSaldo}
      movimientosIniciales={movimientosRecientes || []}
      cierresIniciales={cierres || []}
      cuotasCobrarIniciales={cuotasCobrar || []}
      cuotasPagarIniciales={cuotasPagar || []}
      vendedores={vendedores || []}
      clientes={clientes || []}
      vehiculos={vehiculos || []}
      ventas={ventas || []}
    />
  );
}
