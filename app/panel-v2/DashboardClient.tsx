"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DollarSign, Car, TrendingUp, Users, ShoppingCart, CreditCard, Wallet,
  CalendarClock, AlertTriangle, Receipt, FolderKanban, Landmark, SearchCode, EyeOff, Eye,
} from "lucide-react";

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
}

function fmtMoneda(n: number, moneda: string) {
  return moneda === "ARS" ? `$ ${Math.round(n).toLocaleString("es-AR")}` : `${moneda} ${Math.round(n).toLocaleString("es-AR")}`;
}
function fmtPorMoneda(map: Record<string, number>) {
  const entradas = Object.entries(map).filter(([, v]) => v > 0);
  if (entradas.length === 0) return "—";
  return entradas.map(([m, v]) => fmtMoneda(v, m)).join(" · ");
}

function Tile({ label, valor, icon: Icon, href, tono = "", oculto = false }: { label: string; valor: React.ReactNode; icon: any; href?: string; tono?: string; oculto?: boolean }) {
  const contenido = (
    <div className={`rounded-2xl p-4 border bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-colors ${tono}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <Icon className="w-4 h-4 text-slate-300 dark:text-slate-600" />
      </div>
      <p className={`text-xl font-black text-slate-900 dark:text-white ${oculto ? "blur-sm select-none" : ""}`}>{valor}</p>
    </div>
  );
  return href ? <Link href={href}>{contenido}</Link> : contenido;
}

export default function DashboardClient(props: Props) {
  const [ocultarMontos, setOcultarMontos] = useState(props.gananciasOcultas);
  const saldoUsd = props.saldos.find((s) => s.moneda === "USD")?.total || 0;
  const saldoArs = props.saldos.find((s) => s.moneda === "ARS")?.total || 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Hola, {props.miNombre}</h1>
          <p className="text-sm text-slate-400">Bienvenido — resumen del día.</p>
        </div>
        <button onClick={() => setOcultarMontos((v) => !v)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-300">
          {ocultarMontos ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} {ocultarMontos ? "Mostrar montos" : "Ocultar montos"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Revenue del mes" valor={fmtPorMoneda(props.revenuePorMoneda)} icon={DollarSign} oculto={ocultarMontos || props.gananciasOcultas} href="/panel-v2/ventas" />
        <Tile label="Ventas del mes" valor={props.ventasDelMes} icon={ShoppingCart} href="/panel-v2/ventas" />
        <Tile label="Operaciones del mes" valor={props.operacionesDelMes} icon={TrendingUp} href="/panel-v2/ventas" />
        <Tile label="Clientes sin contactar" valor={props.clientesSinContactar} icon={Users} href="/panel-v2/clientes" tono={props.clientesSinContactar > 0 ? "border-amber-200 dark:border-amber-500/30" : ""} />

        <Tile label="Stock disponible" valor={props.stockDisponible} icon={Car} href="/panel-v2/stock" />
        <Tile label="Reservados / Señados" valor={props.stockReservado + props.stockSenado} icon={Car} href="/panel-v2/stock" />
        <Tile label="Vendidos (histórico)" valor={props.stockVendido} icon={Car} href="/panel-v2/stock" />
        <Tile label="En preparación" valor={props.stockEnPreparacion} icon={Car} href="/panel-v2/stock" />

        <Tile label="Cuotas a pagar (mes)" valor={fmtPorMoneda(props.cuotasPagarPorMoneda)} icon={CreditCard} oculto={ocultarMontos || props.gananciasOcultas} href="/panel-v2/finanzas" />
        <Tile label="Balance neto USD" valor={fmtMoneda(saldoUsd, "USD")} icon={Wallet} oculto={ocultarMontos || props.gananciasOcultas} href="/panel-v2/finanzas" />
        <Tile label="Balance neto ARS" valor={fmtMoneda(saldoArs, "ARS")} icon={Wallet} oculto={ocultarMontos || props.gananciasOcultas} href="/panel-v2/finanzas" />
        <Tile label="Recordatorios hoy" valor={props.recordatoriosHoy} icon={CalendarClock} href="/panel-v2/calendario" />

        <Tile label="Alertas pendientes" valor={props.alertasPendientes} icon={AlertTriangle} tono={props.alertasPendientes > 0 ? "border-rose-200 dark:border-rose-500/30" : ""} />
        <Tile label="Cotizaciones activas" valor={props.cotizacionesActivas} icon={Receipt} href="/panel-v2/cotizaciones" />
        <Tile label="Expedientes activos" valor={props.expedientesActivos} icon={FolderKanban} href="/panel-v2/expedientes" />
        <Tile label="Comisiones pendientes" valor={props.comisionesPendientes} icon={DollarSign} oculto={ocultarMontos || props.gananciasOcultas} href="/panel-v2/comisiones" />

        <Tile label="Infracciones pendientes" valor={props.infraccionesPendientes} icon={Landmark} href="/panel-v2/infracciones" tono={props.infraccionesPendientes > 0 ? "border-rose-200 dark:border-rose-500/30" : ""} />
        <Tile label="Pedidos activos" valor={props.pedidosActivos} icon={SearchCode} href="/panel-v2/pedidos" />
      </div>

      <p className="text-xs text-slate-400 text-center pt-4">Estás en la app nueva. Cockpit CEO y el asistente "Preguntale al gerente" todavía no están construidos.</p>
    </div>
  );
}
