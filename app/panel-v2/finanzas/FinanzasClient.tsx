"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3, FileText, Receipt, Wallet, Coins, CreditCard, Landmark,
  TrendingDown, TrendingUp, ArrowLeftRight, ExternalLink, HandCoins, ScrollText,
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
import { fmt } from "./tabs/shared";

const TABS = [
  { value: "resumen", label: "Resumen", icon: BarChart3 },
  { value: "movimientos", label: "Movimientos", icon: FileText },
  { value: "senas", label: "Señas", icon: Coins, disabled: true },
  { value: "cuotas", label: "Cuotas", icon: Wallet },
  { value: "devol-registro", label: "Devol. Registro", icon: HandCoins },
  { value: "pagos-disp", label: "Pagos Disp.", icon: Coins },
  { value: "tarjeta", label: "Tarjeta", icon: CreditCard },
  { value: "retiros", label: "Retiros", icon: TrendingDown },
  { value: "cheques", label: "Cheques", icon: ScrollText },
  { value: "comisiones", label: "Comisiones", icon: Receipt, externo: "/panel-v2/comisiones" },
  { value: "rentabilidad", label: "Rentabilidad", icon: TrendingUp },
  { value: "cuentas", label: "Cuentas", icon: Landmark },
];

export default function FinanzasClient({
  miId, soyAdmin, soyAdminOFinanzas, cuentasIniciales, movimientosIniciales, cierresIniciales,
  cuotasCobrarIniciales, cuotasPagarIniciales, vendedores, clientes, vehiculos, ventas,
  chequesIniciales, pagosDisponiblesIniciales, consumosTarjetaIniciales, retirosIniciales, devolucionesIniciales,
  expedientes, senasActivasPorMoneda,
}: {
  miId: string; soyAdmin: boolean; soyAdminOFinanzas: boolean; cuentasIniciales: any[]; movimientosIniciales: any[]; cierresIniciales: any[];
  cuotasCobrarIniciales: any[]; cuotasPagarIniciales: any[]; vendedores: any[]; clientes: any[]; vehiculos: any[]; ventas: any[];
  chequesIniciales: any[]; pagosDisponiblesIniciales: any[]; consumosTarjetaIniciales: any[]; retirosIniciales: any[]; devolucionesIniciales: any[];
  expedientes: any[]; senasActivasPorMoneda: Record<string, number>;
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
        <div className="space-y-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">💰 Saldo en cuentas — dinero disponible <span className="font-normal normal-case text-slate-400">Sincronizado con movimientos</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4"><p className="text-[10px] font-bold uppercase text-indigo-500">Total en ARS</p><p className="text-2xl font-black">{fmt(totalPorMoneda.ARS || 0, "ARS")}</p></div>
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4"><p className="text-[10px] font-bold uppercase text-indigo-500">Total en USD</p><p className="text-2xl font-black">{fmt(totalPorMoneda.USD || 0, "USD")}</p></div>
          </div>
          <div className="space-y-1.5">
            {cuentas.map((c) => (
              <button key={c.id} onClick={() => setTab("movimientos")} className="w-full flex items-center justify-between bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 hover:border-rose-300">
                <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-slate-400" /><div className="text-left"><p className="text-sm font-bold">{c.nombre}</p><p className="text-[11px] text-slate-400">{c.tipo} · {c.moneda}</p></div></div>
                <span className="font-mono font-bold text-sm">{fmt(c.saldo, c.moneda)} →</span>
              </button>
            ))}
          </div>

          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-2">📊 Actividad — movimientos acumulados</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4"><p className="text-[10px] font-bold uppercase text-emerald-600 flex items-center justify-between">Ingresos totales <TrendingUp className="w-3.5 h-3.5" /></p>{Object.keys(ingresosTotales).length === 0 ? <p className="text-lg">—</p> : Object.entries(ingresosTotales).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}</div>
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4"><p className="text-[10px] font-bold uppercase text-rose-500 flex items-center justify-between">Egresos totales <TrendingDown className="w-3.5 h-3.5" /></p>{Object.keys(egresosTotales).length === 0 ? <p className="text-lg">—</p> : Object.entries(egresosTotales).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}</div>
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4"><p className="text-[10px] font-bold uppercase text-indigo-600">Balance neto (cuentas)</p><p className="text-lg font-black">{fmt(totalPorMoneda.USD || 0, "USD")}</p><p className="text-lg font-black">{fmt(totalPorMoneda.ARS || 0, "ARS")}</p><p className="text-[10px] text-slate-400">Suma de saldos reales</p></div>
          </div>

          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-2">🧮 Cuotas — estado de cobro</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => setTab("cuotas")} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-left"><p className="text-[10px] font-bold uppercase text-rose-500">⚠ Vencidas</p><p className="text-lg font-black">{pendientesCobrarStats.vencidas}</p><p className="text-[10px] text-slate-400">{pendientesCobrarStats.vencidas === 0 ? "— sin atrasos" : "pendientes con fecha pasada"}</p></button>
            <button onClick={() => setTab("cuotas")} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-left"><p className="text-[10px] font-bold uppercase text-amber-600">🕐 Por vencer</p><p className="text-lg font-black">{pendientesCobrarStats.porVencer}</p><p className="text-[10px] text-slate-400">{pendientesCobrarStats.porVencer === 0 ? "— sin atrasos" : "próximos 7 días"}</p></button>
            <button onClick={() => setTab("cuotas")} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-left"><p className="text-[10px] font-bold uppercase text-emerald-600">✓ En fecha</p><p className="text-lg font-black">{pendientesCobrarStats.enFecha}</p><p className="text-[10px] text-slate-400">a más de 7 días — tranquilo</p></button>
          </div>
        </div>
      )}

      {tab === "movimientos" && (
        <MovimientosTab miId={miId} soyAdmin={soyAdmin} cuentas={cuentas} movimientos={movimientos} setMovimientos={setMovimientos} cierres={cierres} setCierres={setCierres} ventas={ventas} />
      )}

      {tab === "cuentas" && <CuentasTab cuentas={cuentas} setCuentas={setCuentas} soyAdmin={soyAdmin} />}

      {tab === "cuotas" && (
        <CuotasTab cuotasCobrar={cuotasCobrar} setCuotasCobrar={setCuotasCobrar} cuotasPagar={cuotasPagar} setCuotasPagar={setCuotasPagar} cuentas={cuentas} setCuentas={setCuentas} setMovimientos={setMovimientos} clientes={clientes} vehiculos={vehiculos} miId={miId} />
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
    </div>
  );
}
