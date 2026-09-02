import { createClient } from "@/lib/supabase2/server";
import FinanzasClient from "./FinanzasClient";

export const metadata = { title: "Finanzas | Pfaffen Autos" };

export default async function FinanzasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const miPerfil = user ? await supabase.from("perfiles").select("id, nombre, roles").eq("id", user.id).single().then((r) => r.data) : null;
  const soyAdminOFinanzas = miPerfil?.roles?.some((r: string) => r === "admin" || r === "finanzas") ?? false;
  const soyAdmin = miPerfil?.roles?.includes("admin") ?? false;

  const [{ data: cuentas }, { data: cierres }, { data: cuotasCobrar }, { data: cuotasPagar }, { data: vendedores }, { data: clientes }, { data: vehiculos }, { data: ventas }, { data: cheques }, { data: pagosDisponibles }, { data: consumosTarjeta }, { data: retiros }, { data: devoluciones }, { data: expedientes }, { data: prestamos }, { data: presupuestos }, { data: recurrencias }, { data: recurrenciasGeneraciones }, { data: arqueos }, { data: cierresDiarios }] = await Promise.all([
    supabase.from("cuentas").select("*").eq("activa", true).order("nombre"),
    supabase.from("cierres_mensuales").select("*").order("mes", { ascending: false }),
    supabase.from("cuotas_cobrar_clientes").select("*, cliente:clientes(nombre)").order("vencimiento"),
    supabase.from("cuotas_pagar_agencia").select("*").order("vencimiento"),
    supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("clientes").select("id, nombre").order("nombre").limit(500),
    supabase.from("vehiculos").select("id, marca, modelo, patente").in("estado", ["disponible", "reservado", "señado"]).order("marca"),
    supabase.from("ventas").select("id, comprador_nombre, vehiculo_marca, vehiculo_modelo").order("created_at", { ascending: false }).limit(300),
    supabase.from("cheques").select("*").order("fecha_cobro", { ascending: false }).limit(300),
    supabase.from("pagos_disponibles").select("*").order("fecha", { ascending: false }).limit(300),
    supabase.from("consumos_tarjeta").select("*").order("fecha", { ascending: false }).limit(300),
    supabase.from("retiros_caja").select("*").order("fecha", { ascending: false }).limit(300),
    supabase.from("devoluciones_registro").select("*").order("fecha", { ascending: false }).limit(300),
    supabase.from("expedientes").select("id, titulo").eq("archivado", false).order("created_at", { ascending: false }).limit(300),
    supabase.from("prestamos_otorgados").select("*").order("fecha", { ascending: false }).limit(300),
    supabase.from("finanzas_presupuestos").select("*"),
    supabase.from("finanzas_recurrencias").select("*").order("created_at", { ascending: false }),
    supabase.from("finanzas_recurrencias_generaciones").select("*").order("mes", { ascending: false }).limit(500),
    supabase.from("finanzas_arqueos").select("*, cuenta:cuentas(nombre), responsable:perfiles(nombre)").order("fecha", { ascending: false }).limit(200),
    supabase.from("finanzas_cierres_diarios").select("*, detalle:finanzas_cierres_diarios_detalle(*), cerrado_por_perfil:perfiles!finanzas_cierres_diarios_cerrado_por_fkey(nombre)").order("fecha", { ascending: false }).limit(60),
  ]);

  const { data: senasActivas } = await supabase.from("senas").select("monto, moneda").eq("estado", "activa");
  const senasActivasPorMoneda: Record<string, number> = {};
  (senasActivas || []).forEach((s) => { if (s.monto) senasActivasPorMoneda[s.moneda] = (senasActivasPorMoneda[s.moneda] || 0) + Number(s.monto); });

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
      chequesIniciales={cheques || []}
      pagosDisponiblesIniciales={pagosDisponibles || []}
      consumosTarjetaIniciales={consumosTarjeta || []}
      retirosIniciales={retiros || []}
      devolucionesIniciales={devoluciones || []}
      expedientes={expedientes || []}
      senasActivasPorMoneda={senasActivasPorMoneda}
      prestamosIniciales={prestamos || []}
      presupuestosIniciales={presupuestos || []}
      recurrenciasIniciales={recurrencias || []}
      generacionesIniciales={recurrenciasGeneraciones || []}
      arqueosIniciales={arqueos || []}
      cierresDiariosIniciales={cierresDiarios || []}
      miNombre={miPerfil?.nombre || ""}
    />
  );
}
