import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { puedeVerModulo } from "@/lib/panel/permisosModulos";
import { tienePermiso } from "@/lib/panel/permisos";
import FinanzasClient from "./FinanzasClient";

export const metadata = { title: "Finanzas | Pfaffen Autos" };

export default async function FinanzasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/panel/login");
  // Auditoría de Finanzas del 24/9 (permisos #18): proxy.ts solo exige sesión
  // y layout.tsx solo oculta el ítem del sidebar -- por URL directa cualquier
  // usuario logueado entraba igual. puedeVerModulo() ya existía (mismo
  // criterio que el sidebar, respeta modulos_config/visibilidad_sector) pero
  // no se llamaba desde ningún lado.
  if (!(await puedeVerModulo(supabase, user.id, "finanzas"))) redirect("/panel");

  const miPerfil = user ? await supabase.from("perfiles").select("id, nombre, roles, sucursal_id").eq("id", user.id).single().then((r) => r.data) : null;
  const soyAdminOFinanzas = miPerfil?.roles?.some((r: string) => r === "admin" || r === "finanzas") ?? false;
  const soyAdmin = miPerfil?.roles?.includes("admin") ?? false;
  // Pedido de la reunión del 22/9: cada encargado de sucursal (ej. Lucas en
  // Don Torcuato) solo ve, en Caja Grande/Chica, la sucursal que tiene
  // asignada en su perfil -- "encargado" NO es un rol que vea todo, es
  // por-sucursal como vendedor. Solo admin/finanzas ven todas las cajas.
  const veTodasSucursales = miPerfil?.roles?.some((r: string) => ["admin", "finanzas"].includes(r)) ?? false;
  const miSucursalId = miPerfil?.sucursal_id ?? null;
  // Pedido del 23/9: un encargado (ej. Lucas en Don Torcuato) no ve el resto
  // de Finanzas -- solo Caja Grande/Chica de su propia sucursal, nada más.
  // Un admin/finanzas que ADEMÁS tenga el rol "encargado" sigue viendo todo
  // (veTodasSucursales manda). El branch de abajo (soloCajaSucursal) no
  // solo oculta el resto del módulo en la UI -- corta el fetch server-side
  // para que esos datos ni siquiera lleguen al navegador (ver auditoría de
  // Finanzas del 24/9: antes viajaban igual como props, solo sin render).
  const soloCajaSucursal = !veTodasSucursales && (miPerfil?.roles?.includes("encargado") ?? false);
  // "Ver margen/ganancia" (Configuración > Empresa) decía cubrir "Expedientes,
  // Gestoría, Liquidaciones, Tesorería" pero nunca se chequeaba acá -- Resumen,
  // Rentabilidad por vehículo y AFIP/IVA quedaban visibles sin este gate
  // aunque el admin lo hubiera desactivado para el rol (hallazgo de auditoría).
  const puedeVerLiquidacion = await tienePermiso(supabase, miPerfil, "ver_liquidacion");

  // Un encargado de sucursal solo VE (en la UI) Caja Grande/Chica de su
  // propia sucursal -- pero antes el resto de los datos de Finanzas
  // (cheques, cuotas, ventas, señas, presupuestos, todos los movimientos
  // de TODAS las sucursales) se seguían pidiendo y mandando igual al
  // navegador como props del client component, solo que sin render para
  // ellos. Cualquiera con acceso a las devtools podía inspeccionar ese
  // estado y ver saldos/movimientos de sucursales ajenas -- "no se ve" no
  // es lo mismo que "no viaja". Acá se corta antes: solo se pide lo que
  // ese branch de FinanzasClient (soloCajaSucursal) realmente usa, y
  // recortado a su propia sucursal.
  if (soloCajaSucursal && miSucursalId) {
    const [{ data: cuentasSucursal }, { data: sucursalPropia }, { data: vendedoresSoloCaja }, { data: cuentasOtrasComoDestino }] = await Promise.all([
      supabase.from("cuentas").select("*").eq("activa", true).eq("sucursal_id", miSucursalId).order("nombre"),
      supabase.from("sucursales").select("id, nombre").eq("id", miSucursalId),
      supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
      // Solo como DESTINO para transferir (CajaGrandeChicaTab.tsx: reponer a
      // otra caja grande, o depositar en banco) -- id/nombre/moneda nada
      // más, nunca el saldo real de una cuenta que no es la propia.
      supabase.from("cuentas").select("id, nombre, moneda, tipo, rol_caja, sucursal_id").eq("activa", true).neq("sucursal_id", miSucursalId).or("tipo.eq.Banco,rol_caja.eq.grande"),
    ]);
    const cuentaIds = (cuentasSucursal || []).map((c) => c.id);
    const cuentasConSaldoSucursal = await Promise.all(
      (cuentasSucursal || []).map(async (c) => {
        const { data: saldo } = await supabase.rpc("saldo_cuenta", { p_cuenta_id: c.id });
        return { ...c, saldo: Number(saldo) || 0 };
      })
    );
    // saldo: 0 a propósito -- son solo destinos de transferencia en el
    // dropdown (nunca se les muestra el saldo ahí), no un dato real que
    // haya que calcular para una sucursal ajena.
    const cuentasDestinoAjenas = (cuentasOtrasComoDestino || []).map((c) => ({ ...c, saldo: 0 }));
    const { data: movimientosSucursal } = cuentaIds.length
      ? await supabase.from("movimientos_caja").select("*, cuenta:cuentas(nombre, moneda), vehiculo:vehiculo_id ( marca, modelo, anio ), vendedor:vendedor_id ( nombre )").is("deleted_at", null).in("cuenta_id", cuentaIds).order("fecha", { ascending: false }).order("created_at", { ascending: false }).limit(500)
      : { data: [] as unknown[] };

    return (
      <FinanzasClient
        miId={user?.id || ""} soyAdmin={soyAdmin} soyAdminOFinanzas={soyAdminOFinanzas}
        cuentasIniciales={[...cuentasConSaldoSucursal, ...cuentasDestinoAjenas]} movimientosIniciales={movimientosSucursal || []}
        cierresIniciales={[]} cuotasCobrarIniciales={[]} cuotasPagarIniciales={[]}
        vendedores={vendedoresSoloCaja || []} clientes={[]} vehiculos={[]} ventas={[]}
        chequesIniciales={[]} pagosDisponiblesIniciales={[]} consumosTarjetaIniciales={[]} retirosIniciales={[]} devolucionesIniciales={[]}
        expedientes={[]} senasActivasPorMoneda={{}}
        prestamosIniciales={[]} presupuestosIniciales={[]} recurrenciasIniciales={[]} generacionesIniciales={[]} arqueosIniciales={[]} cierresDiariosIniciales={[]}
        miNombre={miPerfil?.nombre || ""}
        senasIniciales={[]} vehiculosDisponiblesFull={[]} sucursales={sucursalPropia || []}
        veTodasSucursales={veTodasSucursales} soloCajaSucursal={soloCajaSucursal} miSucursalId={miSucursalId} vehiculosTodos={[]}
        puedeVerLiquidacion={puedeVerLiquidacion}
      />
    );
  }

  const [{ data: cuentas }, { data: cierres }, { data: cuotasCobrar }, { data: cuotasPagar }, { data: vendedores }, { data: clientes }, { data: vehiculosEnJuego }, { data: ventas }, { data: cheques }, { data: pagosDisponibles }, { data: consumosTarjeta }, { data: retiros }, { data: devoluciones }, { data: expedientes }, { data: prestamos }, { data: presupuestos }, { data: recurrencias }, { data: recurrenciasGeneraciones }, { data: arqueos }, { data: cierresDiarios }, { data: senas }, { data: sucursales }] = await Promise.all([
    supabase.from("cuentas").select("*").eq("activa", true).order("nombre"),
    supabase.from("cierres_mensuales").select("*").order("mes", { ascending: false }),
    supabase.from("cuotas_cobrar_clientes").select("*, cliente:clientes(nombre)").order("vencimiento"),
    supabase.from("cuotas_pagar_agencia").select("*").order("vencimiento"),
    supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("clientes").select("id, nombre").order("nombre").limit(500),
    // Antes eran 2 queries separadas a "vehiculos" (una angosta con
    // disponible+reservado+señado para Cuotas, otra full-row solo
    // disponible para Señas) -- se pide una sola vez con el superset y
    // cada tab deriva su recorte abajo, sin perder el alcance de ninguna.
    supabase.from("vehiculos").select("*").in("estado", ["disponible", "reservado", "señado"]).order("marca"),
    supabase.from("ventas").select("id, comprador_nombre, vehiculo_marca, vehiculo_modelo, vehiculo_id, precio_venta, moneda_venta, fecha_cierre, estado, vendedor_id, codigo_seguimiento").order("created_at", { ascending: false }).limit(300),
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
    supabase.from("senas").select("*, perfiles:vendedor_id ( nombre ), sucursales:sucursal_id ( nombre )").order("created_at", { ascending: false }).limit(100),
    supabase.from("sucursales").select("id, nombre").order("nombre"),
  ]);

  const vehiculos = (vehiculosEnJuego || []).map((v: any) => ({ id: v.id, marca: v.marca, modelo: v.modelo, patente: v.patente }));
  const vehiculosDisponiblesFull = (vehiculosEnJuego || []).filter((v: any) => v.estado === "disponible");

  // Para Egresos por Categoría (Patentes/Transferencias/Repuestos) hace
  // falta poder elegir CUALQUIER vehículo, no solo el stock disponible --
  // un auto ya vendido también puede tener un gasto de patente pendiente.
  const { data: vehiculosTodos } = await supabase.from("vehiculos").select("id, marca, modelo, anio, patente").order("marca").limit(1000);

  const { data: senasActivas } = await supabase.from("senas").select("monto, moneda").eq("estado", "Activa");
  const senasActivasPorMoneda: Record<string, number> = {};
  (senasActivas || []).forEach((s) => { if (s.monto) senasActivasPorMoneda[s.moneda] = (senasActivasPorMoneda[s.moneda] || 0) + Number(s.monto); });

  // Sucursal de cada venta viene del vehículo (ventas no tiene sucursal_id
  // propia) -- se resuelve aparte porque el vehículo ya puede estar
  // "vendido" y no aparece en la query de stock disponible de más arriba.
  const idsVehiculosVentas = [...new Set((ventas || []).map((v: any) => v.vehiculo_id).filter(Boolean))];
  const { data: vehiculosDeVentas } = idsVehiculosVentas.length
    ? await supabase.from("vehiculos").select("id, sucursal_id, sucursal:sucursal_id ( nombre )").in("id", idsVehiculosVentas)
    : { data: [] as any[] };
  const sucursalPorVehiculo = new Map((vehiculosDeVentas || []).map((v: any) => [v.id, v.sucursal?.nombre || null]));
  const ventasConSucursal = (ventas || []).map((v: any) => ({ ...v, sucursalNombre: v.vehiculo_id ? sucursalPorVehiculo.get(v.vehiculo_id) || null : null }));

  const cuentasConSaldo = await Promise.all(
    (cuentas || []).map(async (c) => {
      const { data: saldo } = await supabase.rpc("saldo_cuenta", { p_cuenta_id: c.id });
      return { ...c, saldo: Number(saldo) || 0 };
    })
  );

  const { data: movimientosRecientes } = await supabase
    .from("movimientos_caja")
    .select("*, cuenta:cuentas(nombre, moneda), vehiculo:vehiculo_id ( marca, modelo, anio ), vendedor:vendedor_id ( nombre )")
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
      ventas={ventasConSucursal}
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
      senasIniciales={senas || []}
      vehiculosDisponiblesFull={vehiculosDisponiblesFull || []}
      sucursales={sucursales || []}
      veTodasSucursales={veTodasSucursales}
      soloCajaSucursal={soloCajaSucursal}
      miSucursalId={miSucursalId}
      vehiculosTodos={vehiculosTodos || []}
      puedeVerLiquidacion={puedeVerLiquidacion}
    />
  );
}
