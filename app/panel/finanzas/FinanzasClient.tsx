"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { supabase2 } from "@/lib/supabase/client";
import {
  BarChart3, FileText, Receipt, Wallet, Coins, CreditCard, Landmark,
  TrendingDown, TrendingUp, ExternalLink, HandCoins, ScrollText, Handshake,
  ClipboardList, Repeat, SearchCheck, PackageCheck, CheckSquare, Landmark as Afip, BookOpen,
} from "lucide-react";
import MovimientosTab from "./tabs/MovimientosTab";
import CuentasTab from "./tabs/CuentasTab";
import CuotasTab from "./tabs/CuotasTab";
import DevolRegistroTab from "./tabs/DevolRegistroTab";
import PagosDispTab from "./tabs/PagosDispTab";
import TarjetaTab from "./tabs/TarjetaTab";
import RetirosTab from "./tabs/RetirosTab";
import RentabilidadTab from "./tabs/RentabilidadTab";
import RentabilidadVehiculoTab from "./tabs/RentabilidadVehiculoTab";
import ChequesTab from "./tabs/ChequesTab";
import PrestamosTab from "./tabs/PrestamosTab";
import PresupuestoTab from "./tabs/PresupuestoTab";
import RecurrenciasTab from "./tabs/RecurrenciasTab";
import ArqueosTab from "./tabs/ArqueosTab";
import CierreCajaTab from "./tabs/CierreCajaTab";
import ConciliacionTab from "./tabs/ConciliacionTab";
import AfipIvaTab from "./tabs/AfipIvaTab";
import LibrosContablesTab from "./tabs/LibrosContablesTab";
import SenasTab from "./tabs/SenasTab";
import ResumenTab from "./tabs/ResumenTab";
import EgresosCategoriaTab from "./tabs/EgresosCategoriaTab";
import CajaGrandeChicaTab from "./tabs/CajaGrandeChicaTab";
import { fmt, CATEGORIAS_GASTO_FIJO, CATEGORIAS_GASTO_VARIABLE } from "./tabs/shared";

type TabDef = { value: string; label: string; icon: any; disabled?: boolean; externo?: string };
type GrupoDef = { value: string; label: string; tabs: TabDef[] };

// Antes eran 22 tabs sueltos en una sola fila horizontal -- reagrupados en
// 6 secciones (pedido de diseño, sin cambiar qué hace cada tab) para que se
// pueda ubicar cada cosa por su función en vez de tener que escanear toda
// la fila. El value de cada tab no cambió, así que un link a
// /panel/finanzas?tab=X que ya exista en otro módulo sigue funcionando --
// solo cambia bajo qué grupo aparece.
const GRUPOS: GrupoDef[] = [
  { value: "resumen", label: "Resumen", tabs: [{ value: "resumen", label: "Resumen", icon: BarChart3 }] },
  {
    value: "caja-bancos", label: "Caja y bancos", tabs: [
      { value: "movimientos", label: "Movimientos", icon: FileText },
      { value: "caja-grande-chica", label: "Caja Grande/Chica", icon: Wallet },
      { value: "cuentas", label: "Cuentas", icon: Landmark },
      { value: "cheques", label: "Cheques", icon: ScrollText },
    ],
  },
  {
    value: "cobros", label: "Cobros", tabs: [
      { value: "senas", label: "Señas", icon: Coins },
      { value: "cuotas", label: "Cuotas", icon: Wallet },
    ],
  },
  {
    value: "pagos", label: "Pagos", tabs: [
      { value: "devol-registro", label: "Devol. Registro", icon: HandCoins },
      { value: "pagos-disp", label: "Pagos Disp.", icon: Coins },
      { value: "tarjeta", label: "Tarjeta", icon: CreditCard },
      { value: "retiros", label: "Retiros", icon: TrendingDown },
      { value: "comisiones", label: "Comisiones", icon: Receipt, externo: "/panel/comisiones" },
      { value: "prestamos", label: "Préstamos", icon: Handshake },
    ],
  },
  {
    value: "control-cierres", label: "Control y cierres", tabs: [
      { value: "egresos-categoria", label: "Egresos por Categoría", icon: Receipt },
      { value: "arqueos", label: "Arqueos", icon: SearchCheck },
      { value: "cierre-caja", label: "Cierre Caja", icon: PackageCheck },
      { value: "conciliacion", label: "Conciliación", icon: CheckSquare },
      { value: "afip-iva", label: "AFIP/IVA", icon: Afip },
      { value: "libros", label: "Libros Contables", icon: BookOpen },
    ],
  },
  {
    value: "analisis-planificacion", label: "Análisis y planificación", tabs: [
      { value: "rentabilidad-vehiculo", label: "Rentabilidad por vehículo", icon: TrendingUp },
      { value: "rentabilidad", label: "Operatoria del área", icon: TrendingUp },
      { value: "presupuesto", label: "Presupuesto", icon: ClipboardList },
      { value: "recurrencias", label: "Recurrencias", icon: Repeat },
    ],
  },
];

function grupoDeTab(tabValue: string): string {
  return GRUPOS.find((g) => g.tabs.some((t) => t.value === tabValue))?.value || "resumen";
}

export default function FinanzasClient({
  miId, soyAdmin, soyAdminOFinanzas, cuentasIniciales, movimientosIniciales, cierresIniciales,
  cuotasCobrarIniciales, cuotasPagarIniciales, vendedores, clientes, vehiculos, ventas,
  chequesIniciales, pagosDisponiblesIniciales, consumosTarjetaIniciales, retirosIniciales, devolucionesIniciales,
  expedientes, senasActivasPorMoneda,
  prestamosIniciales, presupuestosIniciales, recurrenciasIniciales, generacionesIniciales, arqueosIniciales, cierresDiariosIniciales, miNombre,
  senasIniciales, vehiculosDisponiblesFull, sucursales, veTodasSucursales, miSucursalId, vehiculosTodos,
}: {
  miId: string; soyAdmin: boolean; soyAdminOFinanzas: boolean; cuentasIniciales: any[]; movimientosIniciales: any[]; cierresIniciales: any[];
  cuotasCobrarIniciales: any[]; cuotasPagarIniciales: any[]; vendedores: any[]; clientes: any[]; vehiculos: any[]; ventas: any[];
  chequesIniciales: any[]; pagosDisponiblesIniciales: any[]; consumosTarjetaIniciales: any[]; retirosIniciales: any[]; devolucionesIniciales: any[];
  expedientes: any[]; senasActivasPorMoneda: Record<string, number>;
  prestamosIniciales: any[]; presupuestosIniciales: any[]; recurrenciasIniciales: any[]; generacionesIniciales: any[]; arqueosIniciales: any[]; cierresDiariosIniciales: any[]; miNombre: string;
  senasIniciales: any[]; vehiculosDisponiblesFull: any[]; sucursales: any[]; veTodasSucursales: boolean; miSucursalId: string | null; vehiculosTodos: { id: string; marca: string; modelo: string; anio: number; patente: string | null }[];
}) {
  const [tab, setTabRaw] = useState("resumen");
  const [grupo, setGrupo] = useState("resumen");
  // Cambiar de grupo lleva al primer sub-tab de ese grupo; setTab (usado por
  // ResumenTab para "ir a Cuotas" etc.) también reubica el grupo activo, para
  // que la navegación cruzada entre tabs no deje la barra de grupos desincronizada.
  const setTab = (t: string) => { setTabRaw(t); setGrupo(grupoDeTab(t)); };
  const irAGrupo = (g: string) => { setGrupo(g); const primero = GRUPOS.find((x) => x.value === g)?.tabs[0]; if (primero) setTabRaw(primero.value); };
  const grupoActivo = GRUPOS.find((g) => g.value === grupo) || GRUPOS[0];
  const [cuentas, setCuentas] = useState(cuentasIniciales);
  const [movimientos, setMovimientos] = useState(movimientosIniciales);
  const [cierres, setCierres] = useState(cierresIniciales);
  const [cuotasCobrar, setCuotasCobrar] = useState(cuotasCobrarIniciales);
  const [cuotasPagar, setCuotasPagar] = useState(cuotasPagarIniciales);
  const [cheques, setCheques] = useState(chequesIniciales);
  const [pagosDisponibles, setPagosDisponibles] = useState(pagosDisponiblesIniciales);
  const [consumosTarjeta, setConsumosTarjeta] = useState(consumosTarjetaIniciales);
  const [retiros, setRetiros] = useState(retirosIniciales);
  const [devoluciones, setDevoluciones] = useState(devolucionesIniciales);
  const [prestamos, setPrestamos] = useState(prestamosIniciales);
  const [presupuestos, setPresupuestos] = useState(presupuestosIniciales);
  const [recurrencias, setRecurrencias] = useState(recurrenciasIniciales);
  const [generaciones, setGeneraciones] = useState(generacionesIniciales);
  const [arqueos, setArqueos] = useState(arqueosIniciales);
  const [cierresDiarios, setCierresDiarios] = useState(cierresDiariosIniciales);
  const [senas, setSenas] = useState(senasIniciales);

  // Todo el sector se llenaba una sola vez en el server (page.tsx) y se
  // quedaba estático hasta recargar la página -- si dos personas usan
  // Finanzas al mismo tiempo, una no veía lo que cargaba la otra sin F5.
  // Un canal por tabla, cada uno refetcheando su propia lista completa (con
  // los mismos joins que usa page.tsx) en vez de mergear el payload del
  // evento -- mismo criterio que ExpedientesClient.tsx, para no desincronizar
  // los joins anidados. "cuentas" se refetchea también ante cualquier cambio
  // en movimientos_caja porque el saldo de cada cuenta no es una columna,
  // se calcula en vivo con el RPC saldo_cuenta.
  useEffect(() => {
    const refetchCuentas = async () => {
      const { data: base } = await supabase2.from("cuentas").select("*").eq("activa", true).order("nombre");
      if (!base) return;
      const conSaldo = await Promise.all(base.map(async (c: any) => {
        const { data: saldo } = await supabase2.rpc("saldo_cuenta", { p_cuenta_id: c.id });
        return { ...c, saldo: Number(saldo) || 0 };
      }));
      setCuentas(conSaldo);
    };
    const refetchMovimientos = async () => {
      const { data } = await supabase2
        .from("movimientos_caja")
        .select("*, cuenta:cuentas(nombre, moneda), vehiculo:vehiculo_id ( marca, modelo, anio ), vendedor:vendedor_id ( nombre )")
        .is("deleted_at", null)
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);
      if (data) setMovimientos(data);
    };
    const refetchCheques = async () => {
      const { data } = await supabase2.from("cheques").select("*").order("fecha_cobro", { ascending: false }).limit(300);
      if (data) setCheques(data);
    };
    const refetchCuotasCobrar = async () => {
      const { data } = await supabase2.from("cuotas_cobrar_clientes").select("*, cliente:clientes(nombre)").order("vencimiento");
      if (data) setCuotasCobrar(data);
    };
    const refetchCuotasPagar = async () => {
      const { data } = await supabase2.from("cuotas_pagar_agencia").select("*").order("vencimiento");
      if (data) setCuotasPagar(data);
    };
    const refetchPagos = async () => {
      const { data } = await supabase2.from("pagos_disponibles").select("*").order("fecha", { ascending: false }).limit(300);
      if (data) setPagosDisponibles(data);
    };
    const refetchTarjeta = async () => {
      const { data } = await supabase2.from("consumos_tarjeta").select("*").order("fecha", { ascending: false }).limit(300);
      if (data) setConsumosTarjeta(data);
    };
    const refetchRetiros = async () => {
      const { data } = await supabase2.from("retiros_caja").select("*").order("fecha", { ascending: false }).limit(300);
      if (data) setRetiros(data);
    };
    const refetchDevoluciones = async () => {
      const { data } = await supabase2.from("devoluciones_registro").select("*").order("fecha", { ascending: false }).limit(300);
      if (data) setDevoluciones(data);
    };
    const refetchPrestamos = async () => {
      const { data } = await supabase2.from("prestamos_otorgados").select("*").order("fecha", { ascending: false }).limit(300);
      if (data) setPrestamos(data);
    };
    const refetchPresupuestos = async () => {
      const { data } = await supabase2.from("finanzas_presupuestos").select("*");
      if (data) setPresupuestos(data);
    };
    const refetchRecurrencias = async () => {
      const { data } = await supabase2.from("finanzas_recurrencias").select("*").order("created_at", { ascending: false });
      if (data) setRecurrencias(data);
    };
    const refetchGeneraciones = async () => {
      const { data } = await supabase2.from("finanzas_recurrencias_generaciones").select("*").order("mes", { ascending: false }).limit(500);
      if (data) setGeneraciones(data);
    };
    const refetchArqueos = async () => {
      const { data } = await supabase2.from("finanzas_arqueos").select("*, cuenta:cuentas(nombre), responsable:perfiles(nombre)").order("fecha", { ascending: false }).limit(200);
      if (data) setArqueos(data);
    };
    const refetchCierresDiarios = async () => {
      const { data } = await supabase2
        .from("finanzas_cierres_diarios")
        .select("*, detalle:finanzas_cierres_diarios_detalle(*), cerrado_por_perfil:perfiles!finanzas_cierres_diarios_cerrado_por_fkey(nombre)")
        .order("fecha", { ascending: false })
        .limit(60);
      if (data) setCierresDiarios(data);
    };
    const refetchCierresMensuales = async () => {
      const { data } = await supabase2.from("cierres_mensuales").select("*").order("mes", { ascending: false });
      if (data) setCierres(data);
    };
    const refetchSenas = async () => {
      const { data } = await supabase2.from("senas").select("*, perfiles:vendedor_id ( nombre ), sucursales:sucursal_id ( nombre )").order("created_at", { ascending: false }).limit(100);
      if (data) setSenas(data);
    };

    const canal = supabase2
      .channel(`finanzas-realtime-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cuentas" }, refetchCuentas)
      .on("postgres_changes", { event: "*", schema: "public", table: "movimientos_caja" }, () => { refetchMovimientos(); refetchCuentas(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "cheques" }, refetchCheques)
      .on("postgres_changes", { event: "*", schema: "public", table: "cuotas_cobrar_clientes" }, refetchCuotasCobrar)
      .on("postgres_changes", { event: "*", schema: "public", table: "cuotas_pagar_agencia" }, refetchCuotasPagar)
      .on("postgres_changes", { event: "*", schema: "public", table: "pagos_disponibles" }, refetchPagos)
      .on("postgres_changes", { event: "*", schema: "public", table: "consumos_tarjeta" }, refetchTarjeta)
      .on("postgres_changes", { event: "*", schema: "public", table: "retiros_caja" }, refetchRetiros)
      .on("postgres_changes", { event: "*", schema: "public", table: "devoluciones_registro" }, refetchDevoluciones)
      .on("postgres_changes", { event: "*", schema: "public", table: "prestamos_otorgados" }, refetchPrestamos)
      .on("postgres_changes", { event: "*", schema: "public", table: "finanzas_presupuestos" }, refetchPresupuestos)
      .on("postgres_changes", { event: "*", schema: "public", table: "finanzas_recurrencias" }, refetchRecurrencias)
      .on("postgres_changes", { event: "*", schema: "public", table: "finanzas_recurrencias_generaciones" }, refetchGeneraciones)
      .on("postgres_changes", { event: "*", schema: "public", table: "finanzas_arqueos" }, refetchArqueos)
      .on("postgres_changes", { event: "*", schema: "public", table: "finanzas_cierres_diarios" }, refetchCierresDiarios)
      .on("postgres_changes", { event: "*", schema: "public", table: "cierres_mensuales" }, refetchCierresMensuales)
      .on("postgres_changes", { event: "*", schema: "public", table: "senas" }, refetchSenas)
      .subscribe();

    return () => { supabase2.removeChannel(canal); };
  }, []);

  const totalPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    cuentas.forEach((c) => { map[c.moneda] = (map[c.moneda] || 0) + c.saldo; });
    return map;
  }, [cuentas]);

  // Los tiles dicen "(mes)" -- `movimientos` acá es solo "los últimos 200
  // registros" (para la pestaña Movimientos), no necesariamente todos caen
  // en el mes en curso. Sin este filtro, con suficiente volumen los 200 más
  // recientes pueden no cubrir todo el mes, o traer meses viejos mezclados.
  const movimientosDelMes = useMemo(() => {
    const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
    const inicioMesStr = inicioMes.toISOString().slice(0, 10);
    return movimientos.filter((m) => m.fecha >= inicioMesStr);
  }, [movimientos]);
  // Mismo criterio que cajaPorSucursal más abajo: una transferencia entre
  // cajas propias entra como ingreso en una caja y egreso en la otra --
  // sumarla infla ingresos/egresos brutos sin que sea plata real, y puede
  // distorsionar el neto si las dos patas caen en monedas distintas.
  const ingresosTotales = useMemo(() => {
    const map: Record<string, number> = {};
    movimientosDelMes.filter((m) => m.tipo === "ingreso" && m.estado === "aprobado" && m.tipo_movimiento !== "Transferencia").forEach((m) => { const mo = m.cuenta?.moneda; if (mo) map[mo] = (map[mo] || 0) + Number(m.monto); });
    return map;
  }, [movimientosDelMes]);
  const egresosTotales = useMemo(() => {
    const map: Record<string, number> = {};
    movimientosDelMes.filter((m) => m.tipo === "egreso" && m.estado === "aprobado" && m.tipo_movimiento !== "Transferencia").forEach((m) => { const mo = m.cuenta?.moneda; if (mo) map[mo] = (map[mo] || 0) + Number(m.monto); });
    return map;
  }, [movimientosDelMes]);

  // Semáforo financiero / punto de equilibrio (pedido de la reunión del
  // 22/9): solo cuentan como "gasto" para el equilibrio las categorías que
  // vos mismo clasificaste como fijas o variables -- compra/venta de auto,
  // seña, transferencia y pago/cobro de cuota quedan afuera a propósito,
  // son movimientos de capital/inventario, no gasto operativo (mismo
  // criterio que ya usa RentabilidadTab.tsx para excluir Transferencia).
  const gastosFijosTotales = useMemo(() => {
    const map: Record<string, number> = {};
    movimientosDelMes.filter((m) => m.tipo === "egreso" && m.estado === "aprobado" && CATEGORIAS_GASTO_FIJO.includes(m.tipo_movimiento)).forEach((m) => { const mo = m.cuenta?.moneda; if (mo) map[mo] = (map[mo] || 0) + Number(m.monto); });
    return map;
  }, [movimientosDelMes]);
  const gastosVariablesTotales = useMemo(() => {
    const map: Record<string, number> = {};
    movimientosDelMes.filter((m) => m.tipo === "egreso" && m.estado === "aprobado" && CATEGORIAS_GASTO_VARIABLE.includes(m.tipo_movimiento)).forEach((m) => { const mo = m.cuenta?.moneda; if (mo) map[mo] = (map[mo] || 0) + Number(m.monto); });
    return map;
  }, [movimientosDelMes]);
  const puntoEquilibrioPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    Array.from(new Set([...Object.keys(gastosFijosTotales), ...Object.keys(gastosVariablesTotales)])).forEach((m) => {
      map[m] = (gastosFijosTotales[m] || 0) + (gastosVariablesTotales[m] || 0);
    });
    return map;
  }, [gastosFijosTotales, gastosVariablesTotales]);

  const cuotasPendientesPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    cuotasCobrar.filter((c) => !c.cobrada).forEach((c) => { map[c.moneda] = (map[c.moneda] || 0) + (Number(c.monto) - Number(c.monto_cobrado)); });
    return map;
  }, [cuotasCobrar]);

  const pendientesCobrarStats = useMemo(() => {
    const p = cuotasCobrar.filter((c) => !c.cobrada);
    const hoy = new Date().toISOString().slice(0, 10);
    const en7 = new Date(); en7.setDate(en7.getDate() + 7);
    const en7str = en7.toISOString().slice(0, 10);
    return { vencidas: p.filter((c) => c.vencimiento < hoy).length, porVencer: p.filter((c) => c.vencimiento >= hoy && c.vencimiento <= en7str).length, enFecha: p.filter((c) => c.vencimiento > en7str).length };
  }, [cuotasCobrar]);

  // "Saldos a cobrar" = plata en la calle por señas Activas: lo que falta
  // cobrar de la venta total una vez descontada la seña ya recibida.
  const senasActivasFull = useMemo(() => senas.filter((s: any) => (s.estado || "").toLowerCase() === "activa"), [senas]);
  const saldosACobrarPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    senasActivasFull.forEach((s: any) => {
      const ars = Number(s.venta_ars || 0) - Number(s.sena_ars || 0);
      const usd = Number(s.venta_usd || 0) - Number(s.sena_usd || 0);
      if (ars > 0) map.ARS = (map.ARS || 0) + ars;
      if (usd > 0) map.USD = (map.USD || 0) + usd;
    });
    return map;
  }, [senasActivasFull]);

  // Control de caja por sucursal (este mes): ingresos efectivos (ingresos
  // aprobados de la cuenta de esa sucursal) + saldos a cobrar de las señas
  // activas de esa sucursal.
  const inicioMesActual = new Date(); inicioMesActual.setDate(1); inicioMesActual.setHours(0, 0, 0, 0);
  const cajaPorSucursal = useMemo(() => {
    const porSucursal = new Map<string, { nombre: string; ingresos: Record<string, number>; saldosACobrar: Record<string, number> }>();
    const sucursalPorCuenta = new Map(cuentas.map((c: any) => [c.id, c.sucursal_id]));
    const nombreSucursal = new Map(sucursales.map((s: any) => [s.id, s.nombre]));
    sucursales.forEach((s: any) => porSucursal.set(s.id, { nombre: s.nombre, ingresos: {}, saldosACobrar: {} }));
    movimientos
      .filter((m: any) => m.tipo === "ingreso" && m.estado === "aprobado" && m.tipo_movimiento !== "Transferencia" && new Date(m.fecha) >= inicioMesActual)
      .forEach((m: any) => {
        const sucId = sucursalPorCuenta.get(m.cuenta_id);
        if (!sucId || !porSucursal.has(sucId)) return;
        const moneda = m.cuenta?.moneda;
        if (!moneda) return;
        const entry = porSucursal.get(sucId)!;
        entry.ingresos[moneda] = (entry.ingresos[moneda] || 0) + Number(m.monto);
      });
    senasActivasFull.forEach((s: any) => {
      if (!s.sucursal_id || !porSucursal.has(s.sucursal_id)) return;
      const entry = porSucursal.get(s.sucursal_id)!;
      const ars = Number(s.venta_ars || 0) - Number(s.sena_ars || 0);
      const usd = Number(s.venta_usd || 0) - Number(s.sena_usd || 0);
      if (ars > 0) entry.saldosACobrar.ARS = (entry.saldosACobrar.ARS || 0) + ars;
      if (usd > 0) entry.saldosACobrar.USD = (entry.saldosACobrar.USD || 0) + usd;
    });
    return [...porSucursal.values()];
  }, [cuentas, sucursales, movimientos, senasActivasFull, inicioMesActual]);

  // Historial de Operaciones: ventas + señas en una sola lista, con lo
  // mínimo para buscar por cliente/auto/N° y mostrar en una tabla.
  const historialOperaciones = useMemo(() => {
    const deVentas = ventas
      .filter((v: any) => v.estado === "cerrada")
      .map((v: any) => ({
        id: v.id, tipo: "Venta" as const, numero: v.id.slice(0, 8).toUpperCase(), fecha: v.fecha_cierre,
        vehiculo: [v.vehiculo_marca, v.vehiculo_modelo].filter(Boolean).join(" ") || "—",
        sucursal: v.sucursalNombre || "—",
        persona: v.comprador_nombre || "—",
        monto: Number(v.precio_venta || 0), moneda: v.moneda_venta || "ARS",
        documento: v.codigo_seguimiento ? `/seguimiento/${v.codigo_seguimiento}` : null,
      }));
    const deSenas = senas.map((s: any) => ({
      id: s.id, tipo: "Seña" as const, numero: s.numero ? String(s.numero) : s.id.slice(0, 8).toUpperCase(), fecha: s.fecha,
      vehiculo: [s.marca, s.modelo].filter(Boolean).join(" ") || "—",
      sucursal: s.sucursales?.nombre || "—",
      persona: s.apellido ? `${s.apellido}, ${s.nombre || ""}`.trim() : (s.cliente_nombre || "—"),
      monto: Number(s.sena_ars || s.sena_usd || s.monto || 0), moneda: s.sena_ars ? "ARS" : s.sena_usd ? "USD" : (s.moneda || "ARS"),
      documento: `/panel/senas/imprimir/${s.id}`,
    }));
    return [...deVentas, ...deSenas].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  }, [ventas, senas]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
        <div><h1 className="text-xl font-bold">Administración Financiera</h1><p className="text-sm text-slate-400">Movimientos, saldos por caja, comisiones, presupuestos y cierres.</p></div>
      </div>

      {/* Nivel 1: grupos -- único nivel que usa rojo (identidad de marca).
          Todo lo que esté "adentro" de un tab (sub-filtros, badges de estado)
          usa azul, para que el rojo siga significando "sección activa" y
          nada compita visualmente con él. */}
      <div className="flex items-center gap-1 my-4 overflow-x-auto border-b border-slate-200 dark:border-white/10">
        {GRUPOS.map((g) => (
          <button key={g.value} onClick={() => irAGrupo(g.value)}
            className={`px-3 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${grupo === g.value ? "border-[#E11D2E] text-[#E11D2E]" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
            {g.label}
          </button>
        ))}
      </div>

      {/* Nivel 2: sub-tabs del grupo activo -- azul para no competir con el rojo de arriba */}
      {grupoActivo.tabs.length > 1 && (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-1 mb-4 flex items-center gap-1 overflow-x-auto">
          {grupoActivo.tabs.map((t) => {
            const Icon = t.icon;
            if (t.externo) return <Link key={t.value} href={t.externo} className="px-3 py-1.5 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-[#0145F2]"><Icon className="w-3.5 h-3.5" /> {t.label} <ExternalLink className="w-3 h-3" /></Link>;
            return (
              <button key={t.value} disabled={t.disabled} onClick={() => setTabRaw(t.value)} title={t.disabled ? "Todavía no construido" : undefined}
                className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 rounded-lg transition-colors ${tab === t.value ? "bg-[#0145F2] text-white" : t.disabled ? "text-slate-300 dark:text-slate-600 cursor-not-allowed" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"}`}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
      )}

      {tab === "resumen" && (
        <ResumenTab
          cuentas={cuentas}
          totalPorMoneda={totalPorMoneda}
          ingresosTotales={ingresosTotales}
          egresosTotales={egresosTotales}
          pendientesCobrarStats={pendientesCobrarStats}
          saldosACobrarPorMoneda={saldosACobrarPorMoneda}
          cajaPorSucursal={cajaPorSucursal}
          historialOperaciones={historialOperaciones}
          puntoEquilibrioPorMoneda={puntoEquilibrioPorMoneda}
          setTab={setTab}
        />
      )}

      {tab === "senas" && (
        <SenasTab senas={senas} clientes={clientes} vehiculos={vehiculosDisponiblesFull} vendedores={vendedores} sucursales={sucursales} cuentas={cuentas} />
      )}

      {tab === "movimientos" && (
        <MovimientosTab miId={miId} soyAdmin={soyAdmin} cuentas={cuentas} movimientos={movimientos} setMovimientos={setMovimientos} cierres={cierres} setCierres={setCierres} ventas={ventas} />
      )}

      {tab === "caja-grande-chica" && (
        <CajaGrandeChicaTab miId={miId} soyAdmin={soyAdmin} cuentas={cuentas} setCuentas={setCuentas} movimientos={movimientos} setMovimientos={setMovimientos} sucursales={veTodasSucursales ? sucursales : sucursales.filter((s) => s.id === miSucursalId)} vendedores={vendedores} />
      )}

      {tab === "egresos-categoria" && (
        <EgresosCategoriaTab movimientos={movimientos} setMovimientos={setMovimientos} cuentas={cuentas} sucursales={sucursales} vendedores={vendedores} vehiculosTodos={vehiculosTodos} miId={miId} />
      )}

      {tab === "cuentas" && <CuentasTab cuentas={cuentas} setCuentas={setCuentas} soyAdmin={soyAdmin} />}

      {tab === "cuotas" && (
        <CuotasTab cuotasCobrar={cuotasCobrar} setCuotasCobrar={setCuotasCobrar} cuotasPagar={cuotasPagar} setCuotasPagar={setCuotasPagar} cuentas={cuentas} setCuentas={setCuentas} setMovimientos={setMovimientos} clientes={clientes} vehiculos={vehiculos} vendedores={vendedores} miId={miId} />
      )}

      {tab === "devol-registro" && (
        <DevolRegistroTab devoluciones={devoluciones} setDevoluciones={setDevoluciones} cuentas={cuentas} setCuentas={setCuentas} setMovimientos={setMovimientos} />
      )}

      {tab === "pagos-disp" && (
        <PagosDispTab pagos={pagosDisponibles} setPagos={setPagosDisponibles} cuentas={cuentas} setCuentas={setCuentas} setMovimientos={setMovimientos} expedientes={expedientes} />
      )}

      {tab === "tarjeta" && (
        <TarjetaTab consumos={consumosTarjeta} setConsumos={setConsumosTarjeta} cuentas={cuentas} setCuentas={setCuentas} setMovimientos={setMovimientos} />
      )}

      {tab === "retiros" && (
        <RetirosTab retiros={retiros} setRetiros={setRetiros} cuentas={cuentas} setCuentas={setCuentas} setMovimientos={setMovimientos} />
      )}

      {tab === "cheques" && <ChequesTab cheques={cheques} setCheques={setCheques} cuentas={cuentas} vehiculos0km={vehiculosDisponiblesFull.filter((v: any) => v.condicion === "0km")} />}

      {tab === "rentabilidad-vehiculo" && (
        <RentabilidadVehiculoTab ventas={ventas} />
      )}

      {tab === "rentabilidad" && (
        <RentabilidadTab movimientos={movimientos} senasActivas={senasActivasPorMoneda} cuotasPendientes={cuotasPendientesPorMoneda} />
      )}

      {tab === "prestamos" && (
        <PrestamosTab prestamos={prestamos} setPrestamos={setPrestamos} cuentas={cuentas} setCuentas={setCuentas} setMovimientos={setMovimientos} />
      )}

      {tab === "presupuesto" && (
        <PresupuestoTab presupuestos={presupuestos} setPresupuestos={setPresupuestos} movimientos={movimientos} />
      )}

      {tab === "recurrencias" && (
        <RecurrenciasTab recurrencias={recurrencias} setRecurrencias={setRecurrencias} generaciones={generaciones} setGeneraciones={setGeneraciones} cuentas={cuentas} setCuentas={setCuentas} movimientos={movimientos} setMovimientos={setMovimientos} />
      )}

      {tab === "arqueos" && (
        <ArqueosTab arqueos={arqueos} setArqueos={setArqueos} cuentas={cuentas} miNombre={miNombre} />
      )}

      {tab === "cierre-caja" && (
        <CierreCajaTab cierres={cierresDiarios} setCierres={setCierresDiarios} />
      )}

      {tab === "conciliacion" && <ConciliacionTab movimientos={movimientos} />}

      {tab === "afip-iva" && <AfipIvaTab movimientos={movimientos} setMovimientos={setMovimientos} />}

      {tab === "libros" && <LibrosContablesTab cuentas={cuentas} />}
    </div>
  );
}
