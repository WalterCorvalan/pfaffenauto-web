"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DollarSign, Car, TrendingUp, Users, ShoppingCart, CreditCard, Wallet,
  CalendarClock, AlertTriangle, Receipt, FolderKanban, Landmark, SearchCode, EyeOff, Eye,
  Target, LayoutDashboard,
} from "lucide-react";
import CockpitCeoTab from "./CockpitCeoTab";

interface Props {
  miNombre: string; esAdmin: boolean; gananciasOcultas: boolean;
  revenuePorMoneda: Record<string, number>;
  ventasDelMes: number; operacionesDelMes: number;
  stockDisponible: number; stockReservado: number; stockSenado: number; stockVendido: number; stockEnPreparacion: number;
  clientesSinContactar: number;
  cuotasPagarPorMoneda: Record<string, number>;
  saldos: { moneda: string; total: number }[];
  recordatoriosHoy: number; alertasPendientes: number; cotizacionesActivas: number;
  expedientesActivos: number; comisionesPendientes: number; infraccionesPendientes: number; pedidosActivos: number;
  diaDelMes: number; diasEnElMes: number;
  ranking: { vendedor_id: string; nombre: string; ventas_equivalentes: number; consignaciones: number }[];
  gananciaPorMoneda: Record<string, number>;
  consignacionesDelMes: number; ventasMesAnterior: number;
}

function fmtMoneda(n: number, moneda: string) {
  return moneda === "ARS" ? `$ ${Math.round(n).toLocaleString("es-AR")}` : `${moneda} ${Math.round(n).toLocaleString("es-AR")}`;
}
function fmtPorMoneda(map: Record<string, number>) {
  const entradas = Object.entries(map).filter(([, v]) => v > 0);
  if (entradas.length === 0) return "—";
  return entradas.map(([m, v]) => fmtMoneda(v, m)).join(" · ");
}

const TONOS: Record<string, string> = {
  indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
  sky: "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400",
  violet: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

function Tile({ label, valor, icon: Icon, href, color = "indigo", alerta = false, oculto = false }: { label: string; valor: React.ReactNode; icon: any; href?: string; color?: string; alerta?: boolean; oculto?: boolean }) {
  const contenido = (
    <div className={`h-full rounded-2xl p-4 border bg-white dark:bg-white/[0.02] transition-all hover:-translate-y-0.5 hover:shadow-md ${alerta ? "border-rose-200 dark:border-rose-500/30" : "border-slate-200 dark:border-white/5"}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${TONOS[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className={`text-xl font-black text-slate-900 dark:text-white leading-tight ${oculto ? "blur-sm select-none" : ""}`}>{valor}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{label}</p>
    </div>
  );
  return href ? <Link href={href} className="block h-full">{contenido}</Link> : contenido;
}

function SeccionTitulo({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 mt-1">{children}</p>;
}

export default function DashboardClient(props: Props) {
  const [tab, setTab] = useState<"cockpit" | "general">(props.esAdmin ? "cockpit" : "general");
  const [ocultarMontos, setOcultarMontos] = useState(props.gananciasOcultas);
  const saldoUsd = props.saldos.find((s) => s.moneda === "USD")?.total || 0;
  const saldoArs = props.saldos.find((s) => s.moneda === "ARS")?.total || 0;
  const oculto = ocultarMontos || props.gananciasOcultas;
  const hoyLabel = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Hola, {props.miNombre}</h1>
          <p className="text-sm text-slate-400 capitalize">Bienvenido, <span className="font-bold text-slate-500 dark:text-slate-300">{props.miNombre}</span> · {hoyLabel}</p>
        </div>
        <button onClick={() => setOcultarMontos((v) => !v)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
          {ocultarMontos ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} {ocultarMontos ? "Mostrar montos" : "Ocultar montos"}
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10">
        {props.esAdmin && (
          <button onClick={() => setTab("cockpit")} className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === "cockpit" ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            <Target className="w-4 h-4" /> Cockpit CEO
          </button>
        )}
        <button onClick={() => setTab("general")} className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === "general" ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
          <LayoutDashboard className="w-4 h-4" /> Dashboard general
        </button>
      </div>

      {tab === "cockpit" && props.esAdmin ? (
        <CockpitCeoTab
          miNombre={props.miNombre}
          ocultarMontos={oculto}
          diaDelMes={props.diaDelMes}
          diasEnElMes={props.diasEnElMes}
          ventasDelMes={props.ventasDelMes}
          ventasMesAnterior={props.ventasMesAnterior}
          gananciaPorMoneda={props.gananciaPorMoneda}
          consignacionesDelMes={props.consignacionesDelMes}
          ranking={props.ranking}
        />
      ) : (
        <div className="space-y-4">
          <SeccionTitulo>Ventas y clientes</SeccionTitulo>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile label="Revenue del mes" valor={fmtPorMoneda(props.revenuePorMoneda)} icon={DollarSign} color="emerald" oculto={oculto} href="/panel-v2/ventas" />
            <Tile label="Ventas del mes" valor={props.ventasDelMes} icon={ShoppingCart} color="emerald" href="/panel-v2/ventas" />
            <Tile label="Operaciones del mes" valor={props.operacionesDelMes} icon={TrendingUp} color="indigo" href="/panel-v2/ventas" />
            <Tile label="Clientes sin contactar" valor={props.clientesSinContactar} icon={Users} color="amber" alerta={props.clientesSinContactar > 0} href="/panel-v2/clientes" />
          </div>

          <SeccionTitulo>Stock</SeccionTitulo>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile label="Disponible" valor={props.stockDisponible} icon={Car} color="sky" href="/panel-v2/stock" />
            <Tile label="Reservados / Señados" valor={props.stockReservado + props.stockSenado} icon={Car} color="sky" href="/panel-v2/stock" />
            <Tile label="Vendidos (histórico)" valor={props.stockVendido} icon={Car} color="sky" href="/panel-v2/stock" />
            <Tile label="En preparación" valor={props.stockEnPreparacion} icon={Car} color="sky" href="/panel-v2/stock" />
          </div>

          <SeccionTitulo>Finanzas</SeccionTitulo>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile label="Cuotas a pagar (mes)" valor={fmtPorMoneda(props.cuotasPagarPorMoneda)} icon={CreditCard} color="rose" oculto={oculto} href="/panel-v2/finanzas" />
            <Tile label="Balance neto USD" valor={fmtMoneda(saldoUsd, "USD")} icon={Wallet} color="violet" oculto={oculto} href="/panel-v2/finanzas" />
            <Tile label="Balance neto ARS" valor={fmtMoneda(saldoArs, "ARS")} icon={Wallet} color="violet" oculto={oculto} href="/panel-v2/finanzas" />
            <Tile label="Comisiones pendientes" valor={props.comisionesPendientes} icon={DollarSign} color="violet" oculto={oculto} href="/panel-v2/comisiones" />
          </div>

          <SeccionTitulo>Operación</SeccionTitulo>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile label="Recordatorios hoy" valor={props.recordatoriosHoy} icon={CalendarClock} color="indigo" href="/panel-v2/calendario" />
            <Tile label="Alertas pendientes" valor={props.alertasPendientes} icon={AlertTriangle} color="rose" alerta={props.alertasPendientes > 0} />
            <Tile label="Cotizaciones activas" valor={props.cotizacionesActivas} icon={Receipt} color="indigo" href="/panel-v2/cotizaciones" />
            <Tile label="Expedientes activos" valor={props.expedientesActivos} icon={FolderKanban} color="indigo" href="/panel-v2/expedientes" />
            <Tile label="Infracciones pendientes" valor={props.infraccionesPendientes} icon={Landmark} color="rose" alerta={props.infraccionesPendientes > 0} href="/panel-v2/infracciones" />
            <Tile label="Pedidos activos" valor={props.pedidosActivos} icon={SearchCode} color="indigo" href="/panel-v2/pedidos" />
          </div>

          <p className="text-xs text-slate-400 text-center pt-2">Estás en la app nueva. Las secciones completas van migrando de a una.</p>
        </div>
      )}
    </div>
  );
}
