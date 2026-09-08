"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
import { fmt } from "./tabs/shared";

const TABS: { value: string; label: string; icon: any; disabled?: boolean; externo?: string }[] = [
  { value: "resumen", label: "Resumen", icon: BarChart3 },
  { value: "movimientos", label: "Movimientos", icon: FileText },
  { value: "caja-grande-chica", label: "Caja Grande/Chica", icon: Wallet },
  { value: "egresos-categoria", label: "Egresos por Categoría", icon: Receipt },
  { value: "senas", label: "Señas", icon: Coins },
  { value: "cuotas", label: "Cuotas", icon: Wallet },
  { value: "devol-registro", label: "Devol. Registro", icon: HandCoins },
  { value: "pagos-disp", label: "Pagos Disp.", icon: Coins },
  { value: "tarjeta", label: "Tarjeta", icon: CreditCard },
  { value: "retiros", label: "Retiros", icon: TrendingDown },
  { value: "cheques", label: "Cheques", icon: ScrollText },
  { value: "comisiones", label: "Comisiones", icon: Receipt, externo: "/panel-v2/comisiones" },
  { value: "rentabilidad", label: "Rentabilidad", icon: TrendingUp },
  { value: "cuentas", label: "Cuentas", icon: Landmark },
  { value: "prestamos", label: "Préstamos", icon: Handshake },
  { value: "presupuesto", label: "Presupuesto", icon: ClipboardList },
  { value: "recurrencias", label: "Recurrencias", icon: Repeat },
  { value: "arqueos", label: "Arqueos", icon: SearchCheck },
  { value: "cierre-caja", label: "Cierre Caja", icon: PackageCheck },
  { value: "conciliacion", label: "Conciliación", icon: CheckSquare },
  { value: "afip-iva", label: "AFIP/IVA", icon: Afip },
  { value: "libros", label: "Libros Contables", icon: BookOpen },
];

export default function FinanzasClient({
  miId, soyAdmin, soyAdminOFinanzas, cuentasIniciales, movimientosIniciales, cierresIniciales,
  cuotasCobrarIniciales, cuotasPagarIniciales, vendedores, clientes, vehiculos, ventas,
  chequesIniciales, pagosDisponiblesIniciales, consumosTarjetaIniciales, retirosIniciales, devolucionesIniciales,
  expedientes, senasActivasPorMoneda,
  prestamosIniciales, presupuestosIniciales, recurrenciasIniciales, generacionesIniciales, arqueosIniciales, cierresDiariosIniciales, miNombre,
  senasIniciales, vehiculosDisponiblesFull, sucursales, vehiculosTodos,
}: {
  miId: string; soyAdmin: boolean; soyAdminOFinanzas: boolean; cuentasIniciales: any[]; movimientosIniciales: any[]; cierresIniciales: any[];
  cuotasCobrarIniciales: any[]; cuotasPagarIniciales: any[]; vendedores: any[]; clientes: any[]; vehiculos: any[]; ventas: any[];
  chequesIniciales: any[]; pagosDisponiblesIniciales: any[]; consumosTarjetaIniciales: any[]; retirosIniciales: any[]; devolucionesIniciales: any[];
  expedientes: any[]; senasActivasPorMoneda: Record<string, number>;
  prestamosIniciales: any[]; presupuestosIniciales: any[]; recurrenciasIniciales: any[]; generacionesIniciales: any[]; arqueosIniciales: any[]; cierresDiariosIniciales: any[]; miNombre: string;
  senasIniciales: any[]; vehiculosDisponiblesFull: any[]; sucursales: any[]; vehiculosTodos: { id: string; marca: string; modelo: string; anio: number; patente: string | null }[];
}) {
  const [tab, setTab] = useState("resumen");
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
  const [senas] = useState(senasIniciales);

  const totalPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    cuentas.forEach((c) => { map[c.moneda] = (map[c.moneda] || 0) + c.saldo; });
    return map;
  }, [cuentas]);

  const ingresosTotales = useMemo(() => {
    const map: Record<string, number> = {};
    movimientos.filter((m) => m.tipo === "ingreso" && m.estado === "aprobado").forEach((m) => { const mo = m.cuenta?.moneda; if (mo) map[mo] = (map[mo] || 0) + Number(m.monto); });
    return map;
  }, [movimientos]);
  const egresosTotales = useMemo(() => {
    const map: Record<string, number> = {};
    movimientos.filter((m) => m.tipo === "egreso" && m.estado === "aprobado").forEach((m) => { const mo = m.cuenta?.moneda; if (mo) map[mo] = (map[mo] || 0) + Number(m.monto); });
    return map;
  }, [movimientos]);

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
      documento: `/panel-v2/senas/imprimir/${s.id}`,
    }));
    return [...deVentas, ...deSenas].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  }, [ventas, senas]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
        <div><h1 className="text-xl font-bold">Administración Financiera</h1><p className="text-sm text-slate-400">Movimientos, saldos por caja, comisiones, presupuestos y cierres.</p></div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-1 my-4 flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          if (t.externo) return <Link key={t.value} href={t.externo} className="px-3 py-1.5 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600"><Icon className="w-3.5 h-3.5" /> {t.label} <ExternalLink className="w-3 h-3" /></Link>;
          return (
            <button key={t.value} disabled={t.disabled} onClick={() => setTab(t.value)} title={t.disabled ? "Todavía no construido" : undefined}
              className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 rounded-lg transition-colors ${tab === t.value ? "bg-rose-600 text-white" : t.disabled ? "text-slate-300 dark:text-slate-600 cursor-not-allowed" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"}`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

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
        <CajaGrandeChicaTab miId={miId} soyAdmin={soyAdmin} cuentas={cuentas} setCuentas={setCuentas} movimientos={movimientos} setMovimientos={setMovimientos} sucursales={sucursales} vendedores={vendedores} />
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

      {tab === "cheques" && <ChequesTab cheques={cheques} setCheques={setCheques} />}

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
