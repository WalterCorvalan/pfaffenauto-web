"use client";

import Link from "next/link";
import {
  DollarSign, Car, TrendingUp, Users, ShoppingCart, CreditCard, Wallet,
  CalendarClock, AlertTriangle, Receipt, FolderKanban, Landmark, SearchCode,
  Trophy, Building2, Key, ListChecks, Flame, Clock, ClipboardList, Wrench,
  Ticket, TrendingDown, Activity, BarChart3,
} from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import TablaResponsiva, { type ColumnaTabla } from "@/components/panelV2/TablaResponsiva";

interface Props {
  esAdmin: boolean; ocultarMontos: boolean;
  revenuePorMoneda: Record<string, number>;
  ventasDelMes: number; operacionesDelMes: number;
  stockDisponible: number; stockReservado: number; stockSenado: number; stockVendido: number; stockEnPreparacion: number;
  clientesSinContactar: number;
  cuotasPagarPorMoneda: Record<string, number>;
  saldos: { moneda: string; total: number }[];
  recordatoriosHoy: number; alertasPendientes: number; cotizacionesActivas: number;
  expedientesActivos: number; comisionesPendientes: number; infraccionesPendientes: number; pedidosActivos: number;
  ranking: { vendedor_id: string; nombre: string; ventas_equivalentes: number; consignaciones: number }[];
  clientesIngresadosHoy: number; canalTop: string | null;
  eventosProximos: { id: string; titulo: string; fecha: string }[];
  vencidos: number; venceHoy: number; venceProx7d: number;
  ingresosPorMoneda: Record<string, number>; egresosPorMoneda: Record<string, number>; netoPorMoneda: Record<string, number>;
  topIngresos: Record<string, number>; topEgresos: Record<string, number>;
  cuentas: { id: string; nombre: string; moneda: string; saldo_inicial: number }[];
  visitasHoy: { id: string; nombre_cliente: string; vehiculo_marca: string | null; vehiculo_modelo: string | null; horario_visita: string | null }[];
  pedidosConMatch: { id: string; marca: string; modelo: string; nombre_cliente: string }[];
  ultimasOperaciones: { id: string; vehiculo_marca: string; vehiculo_modelo: string; comprador_nombre: string | null; precio_venta: number; moneda_venta: string; estado: string; fecha_cierre: string | null; vendedorNombre: string }[];
  stockEstancado: number; tareasVencidas: number; postventaPendiente: number;
  ticketPromedioPorMoneda: Record<string, number>;
  top10Gastos: { concepto: string; categoria: string; fecha: string; monto: number; moneda: string }[];
  gastosAtipicos: { categoria: string; montoMes: number; promedioHistorico: number; moneda: string }[];
  ventasPorMes6: { mes: string; cantidad: number }[];
  proyeccionCaja: {
    saldos: { moneda: string; total: number }[];
    aCobrarPorMoneda: Record<string, number>; aPagarPorMoneda: Record<string, number>; resultadoPorMoneda: Record<string, number>;
    topEntrada: { id: string; label: string; monto: number; moneda: string } | null;
    topSalidas: { id: string; label: string; monto: number; moneda: string }[];
    cantidadEntradas: number; cantidadSalidas: number;
  };
  miPerformance: {
    ventas: number; consignaciones: number;
    tierActual: string | null; tierEmoji: string | null; ventasParaSiguiente: number | null; siguienteTier: string | null;
    premioSiguiente: { faltan: number; meta: number; premioUsd: number | null } | null;
  };
  cuotasPagarResumen: { totalPorMoneda: Record<string, number>; cantidadDelMes: number; vencidas: number };
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

export default function DashboardGeneralTab(props: Props) {
  const saldoUsd = props.saldos.find((s) => s.moneda === "USD")?.total || 0;
  const saldoArs = props.saldos.find((s) => s.moneda === "ARS")?.total || 0;

  return (
    <div className="space-y-4">
      <SeccionTitulo>Lo urgente hoy</SeccionTitulo>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Leads sin atender" valor={props.clientesSinContactar} icon={Flame} color="rose" alerta={props.clientesSinContactar > 0} href="/panel-v2/clientes" />
        <Tile label="Stock con 30+ días" valor={props.stockEstancado} icon={Clock} color="amber" alerta={props.stockEstancado > 0} href="/panel-v2/stock" />
        <Tile label="Tareas vencidas" valor={props.tareasVencidas} icon={ClipboardList} color="rose" alerta={props.tareasVencidas > 0} href="/panel-v2/tareas" />
        <Tile label="Postventa pendiente" valor={props.postventaPendiente} icon={Wrench} color="violet" alerta={props.postventaPendiente > 0} href="/panel-v2/postventa" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Tile label="Autos vendidos (mes)" valor={props.ventasDelMes} icon={Car} color="indigo" href="/panel-v2/ventas" />
        <Tile label="Ticket promedio" valor={fmtPorMoneda(props.ticketPromedioPorMoneda)} icon={Ticket} color="indigo" oculto={props.ocultarMontos} href="/panel-v2/ventas" />
        <Tile label="Ingresos por ventas" valor={fmtPorMoneda(props.revenuePorMoneda)} icon={TrendingUp} color="emerald" oculto={props.ocultarMontos} href="/panel-v2/finanzas" />
        <Tile label="Egresos totales" valor={fmtPorMoneda(props.egresosPorMoneda)} icon={TrendingDown} color="rose" oculto={props.ocultarMontos} href="/panel-v2/finanzas" />
        <Tile label="Neto del mes" valor={fmtPorMoneda(props.netoPorMoneda)} icon={Activity} color="violet" oculto={props.ocultarMontos} href="/panel-v2/finanzas" />
      </div>

      <div className="rounded-2xl p-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center"><Users className="w-4 h-4" /></div>
          <div>
            <p className="text-lg font-black text-slate-900 dark:text-white">{props.clientesIngresadosHoy}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Clientes que ingresaron hoy{props.canalTop ? ` · mayoría por ${props.canalTop}` : ""}</p>
          </div>
        </div>
        <Link href="/panel-v2/clientes" className="text-xs font-bold text-rose-600 hover:underline">Ver más →</Link>
      </div>

      <SeccionTitulo>Ventas y clientes</SeccionTitulo>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Revenue del mes" valor={fmtPorMoneda(props.revenuePorMoneda)} icon={DollarSign} color="emerald" oculto={props.ocultarMontos} href="/panel-v2/ventas" />
        <Tile label="Ventas del mes" valor={props.ventasDelMes} icon={ShoppingCart} color="emerald" href="/panel-v2/ventas" />
        <Tile label="Operaciones del mes" valor={props.operacionesDelMes} icon={TrendingUp} color="indigo" href="/panel-v2/ventas" />
        <Tile label="Clientes sin contactar" valor={props.clientesSinContactar} icon={Users} color="amber" alerta={props.clientesSinContactar > 0} href="/panel-v2/clientes" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {props.esAdmin && props.ranking.length > 0 && (
          <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 flex items-center gap-1.5"><Trophy className="w-4 h-4" /> Top vendedores del mes</p>
              <Link href="/panel-v2/comisiones" className="text-xs font-bold text-white/80 hover:underline shrink-0">Ver más →</Link>
            </div>
            <div className="space-y-1.5">
              {props.ranking.slice(0, 5).map((r, i) => (
                <div key={r.vendedor_id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/10">
                  <span className="text-sm font-bold">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}°`} {r.nombre}</span>
                  <span className="text-xs text-indigo-100 shrink-0">{r.ventas_equivalentes} ventas · {r.consignaciones} consig.</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
          <p className="text-sm font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-indigo-500" /> Ventas — últimos 6 meses</p>
          <p className="text-[11px] text-slate-400 mb-2">Cantidad de ventas cerradas por mes</p>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={props.ventasPorMes6}>
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [String(v ?? 0), "Ventas"]} labelStyle={{ color: "#0f172a" }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="cantidad" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-2xl p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
          <p className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-indigo-500" /> Visitas en showroom hoy</p>
          {props.visitasHoy.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Sin visitas confirmadas para hoy.</p>
          ) : (
            <div className="space-y-1.5">
              {props.visitasHoy.map((v) => (
                <div key={v.id} className="flex justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-200">{v.nombre_cliente}{v.vehiculo_marca ? ` — ${v.vehiculo_marca} ${v.vehiculo_modelo || ""}` : ""}</span>
                  <span className="text-slate-400">{v.horario_visita || ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
          <p className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5"><Key className="w-4 h-4 text-indigo-500" /> Pedidos con auto disponible</p>
          {props.pedidosConMatch.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Sin matches pendientes de avisar.</p>
          ) : (
            <div className="space-y-1.5">
              {props.pedidosConMatch.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-200">{p.marca} {p.modelo}</span>
                  <span className="text-slate-400">Pidió: {p.nombre_cliente}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
        <p className="text-sm font-bold text-slate-800 dark:text-white mb-3">Últimas {props.ultimasOperaciones.length} operaciones</p>
        {props.ultimasOperaciones.length === 0 ? (
          <p className="py-4 text-center text-slate-400 text-xs">Sin operaciones todavía.</p>
        ) : (
          <TablaResponsiva<typeof props.ultimasOperaciones[number]>
            filas={props.ultimasOperaciones}
            keyExtractor={(v) => v.id}
            encabezadoMobile={(v) => <p className="font-bold text-slate-700 dark:text-slate-200">{v.vehiculo_marca} {v.vehiculo_modelo}</p>}
            columnas={
              [
                { key: "vehiculo", header: "Vehículo", cell: (v) => `${v.vehiculo_marca} ${v.vehiculo_modelo}`, claseTd: "font-bold text-slate-700 dark:text-slate-200", ocultarEnMobile: true },
                { key: "cliente", header: "Cliente", cell: (v) => v.comprador_nombre || "—", claseTd: "text-slate-500" },
                { key: "precio", header: "Precio", cell: (v) => fmtMoneda(Number(v.precio_venta), v.moneda_venta), claseTd: `text-right font-mono font-bold text-indigo-600 ${props.ocultarMontos ? "blur-sm select-none" : ""}` },
                { key: "estado", header: "Estado", cell: (v) => <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-[10px] font-bold">{v.estado}</span> },
                { key: "vendedor", header: "Vendedor", cell: (v) => v.vendedorNombre, claseTd: "text-slate-500" },
                { key: "fecha", header: "Fecha", cell: (v) => v.fecha_cierre ? new Date(`${v.fecha_cierre}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—", claseTd: "text-slate-400" },
              ] as ColumnaTabla<typeof props.ultimasOperaciones[number]>[]
            }
          />
        )}
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
        <Tile label="Cuotas a pagar (mes)" valor={fmtPorMoneda(props.cuotasPagarPorMoneda)} icon={CreditCard} color="rose" oculto={props.ocultarMontos} href="/panel-v2/finanzas" />
        <Tile label="Balance neto USD" valor={fmtMoneda(saldoUsd, "USD")} icon={Wallet} color="violet" oculto={props.ocultarMontos} href="/panel-v2/finanzas" />
        <Tile label="Balance neto ARS" valor={fmtMoneda(saldoArs, "ARS")} icon={Wallet} color="violet" oculto={props.ocultarMontos} href="/panel-v2/finanzas" />
        <Tile label="Comisiones pendientes" valor={props.comisionesPendientes} icon={DollarSign} color="violet" oculto={props.ocultarMontos} href="/panel-v2/comisiones" />
      </div>

      <div className="rounded-2xl p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
        <p className="text-sm font-bold text-slate-800 dark:text-white mb-3">Cash Flow del mes</p>
        {/* Ingresos/Egresos/Neto ya están en la tira "Lo urgente hoy" de
            arriba -- acá solo el detalle que no entra en una tile. */}
        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Saldos por caja ({props.cuentas.length})</p>
        <div className="space-y-1">
          {props.cuentas.slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">{c.nombre}</span>
              <span className={`font-mono font-bold text-slate-800 dark:text-white ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtMoneda(Number(c.saldo_inicial), c.moneda)}</span>
            </div>
          ))}
        </div>
        {(Object.keys(props.topIngresos).length > 0 || Object.keys(props.topEgresos).length > 0) && (
          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
            <div>
              <p className="text-[10px] font-bold uppercase text-emerald-600 mb-1">Top ingresos</p>
              {Object.entries(props.topIngresos).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => (
                <div key={k} className="flex justify-between text-[11px] text-slate-500"><span className="truncate">{k}</span><span className={`font-mono ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>{Math.round(v).toLocaleString("es-AR")}</span></div>
              ))}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-rose-600 mb-1">Top egresos</p>
              {Object.entries(props.topEgresos).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => (
                <div key={k} className="flex justify-between text-[11px] text-slate-500"><span className="truncate">{k}</span><span className={`font-mono ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>{Math.round(v).toLocaleString("es-AR")}</span></div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Los 10 gastos más caros del mes</p>
        {props.top10Gastos.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4">Sin egresos registrados este mes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
                  <th className="py-1.5 pr-2">Concepto</th>
                  <th className="py-1.5 pr-2">Categoría</th>
                  <th className="py-1.5 pr-2">Fecha</th>
                  <th className="py-1.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {props.top10Gastos.map((g, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-2 text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{g.concepto}</td>
                    <td className="py-1.5 pr-2 text-slate-500">{g.categoria}</td>
                    <td className="py-1.5 pr-2 text-slate-400">{new Date(`${g.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" })}</td>
                    <td className={`py-1.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400 ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtMoneda(g.monto, g.moneda)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={`rounded-2xl p-5 border ${props.gastosAtipicos.length > 0 ? "bg-rose-50/40 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20" : "bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/5"}`}>
        <p className="text-[11px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-1"><AlertTriangle className="w-3.5 h-3.5" /> Gastos atípicos — más del doble del promedio de su categoría</p>
        <p className="text-[11px] text-slate-400 mb-3">Comparado contra el promedio histórico de los últimos 6 meses de cada categoría.</p>
        {props.gastosAtipicos.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4">Ningún gasto se salió del promedio este mes. 🎉</p>
        ) : (
          <div className="space-y-1.5">
            {props.gastosAtipicos.map((g) => (
              <div key={g.categoria} className="flex items-center justify-between text-xs bg-white dark:bg-white/5 rounded-lg px-3 py-2">
                <span className="font-bold text-slate-700 dark:text-slate-200">{g.categoria}</span>
                <span className={`font-mono ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>
                  <span className="font-bold text-rose-600">{fmtMoneda(g.montoMes, g.moneda)}</span>
                  <span className="text-slate-400"> · prom. {fmtMoneda(g.promedioHistorico, g.moneda)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
          <p className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5"><CalendarClock className="w-4 h-4 text-indigo-500" /> Agenda — próximos 7 días</p>
          {props.eventosProximos.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Sin eventos próximos.</p>
          ) : (
            <div className="space-y-1.5">
              {props.eventosProximos.slice(0, 6).map((e) => (
                <div key={e.id} className="flex justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-200 truncate">{e.titulo}</span>
                  <span className="text-slate-400 shrink-0 ml-2">{new Date(e.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
          <p className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5"><ListChecks className="w-4 h-4 text-indigo-500" /> Próximas entregas y vencimientos</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className={`text-xl font-black ${props.vencidos > 0 ? "text-rose-600" : "text-slate-900 dark:text-white"}`}>{props.vencidos}</p><p className="text-[10px] font-bold uppercase text-slate-400">Vencidos</p></div>
            <div><p className="text-xl font-black text-amber-600">{props.venceHoy}</p><p className="text-[10px] font-bold uppercase text-slate-400">Hoy</p></div>
            <div><p className="text-xl font-black text-indigo-600">{props.venceProx7d}</p><p className="text-[10px] font-bold uppercase text-slate-400">Próx. 7d</p></div>
          </div>
        </div>
      </div>

      <SeccionTitulo>Proyección de caja</SeccionTitulo>
      <div className="rounded-2xl p-5 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><Wallet className="w-4 h-4 text-amber-500" /> Proyección de caja</p>
          <Link href="/panel-v2/finanzas" className="text-xs font-bold text-amber-600 hover:underline shrink-0">Ver más →</Link>
        </div>
        <p className="text-[11px] text-slate-400 mb-3">{props.proyeccionCaja.cantidadEntradas} entradas · {props.proyeccionCaja.cantidadSalidas} salidas previstas</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="rounded-xl p-3 bg-slate-50 dark:bg-white/5">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Saldo actual</p>
            <p className={`text-sm font-black text-slate-900 dark:text-white ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtPorMoneda(Object.fromEntries(props.proyeccionCaja.saldos.map((s) => [s.moneda, s.total])))}</p>
          </div>
          <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-500/10">
            <p className="text-[10px] font-bold uppercase text-emerald-600 mb-1">↘ A cobrar</p>
            <p className={`text-sm font-black text-emerald-700 dark:text-emerald-400 ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtPorMoneda(props.proyeccionCaja.aCobrarPorMoneda)}</p>
          </div>
          <div className="rounded-xl p-3 bg-rose-50 dark:bg-rose-500/10">
            <p className="text-[10px] font-bold uppercase text-rose-600 mb-1">↗ A pagar</p>
            <p className={`text-sm font-black text-rose-700 dark:text-rose-400 ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtPorMoneda(props.proyeccionCaja.aPagarPorMoneda)}</p>
          </div>
          <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-500/10">
            <p className="text-[10px] font-bold uppercase text-emerald-600 mb-1">↗ Resultado</p>
            <p className={`text-sm font-black text-emerald-700 dark:text-emerald-400 ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtPorMoneda(props.proyeccionCaja.resultadoPorMoneda)}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl p-3 border border-emerald-100 dark:border-emerald-500/20">
            <p className="text-[10px] font-bold uppercase text-emerald-600 mb-2">↑ Entradas previstas · Top 1</p>
            {props.proyeccionCaja.topEntrada ? (
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-200 truncate">{props.proyeccionCaja.topEntrada.label}</span>
                <span className={`font-mono font-bold text-emerald-600 shrink-0 ml-2 ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtMoneda(props.proyeccionCaja.topEntrada.monto, props.proyeccionCaja.topEntrada.moneda)}</span>
              </div>
            ) : <p className="text-xs text-slate-400">Sin entradas previstas.</p>}
          </div>
          <div className="rounded-xl p-3 border border-rose-100 dark:border-rose-500/20">
            <p className="text-[10px] font-bold uppercase text-rose-600 mb-2">↓ Salidas previstas · Top {props.proyeccionCaja.topSalidas.length}</p>
            {props.proyeccionCaja.topSalidas.length === 0 ? <p className="text-xs text-slate-400">Sin salidas previstas.</p> : (
              <div className="space-y-1">
                {props.proyeccionCaja.topSalidas.map((s) => (
                  <div key={s.id} className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-200 truncate">{s.label}</span>
                    <span className={`font-mono font-bold text-rose-600 shrink-0 ml-2 ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtMoneda(s.monto, s.moneda)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-3">Mismos números que la pantalla x Cobrar/Pagar — a cobrar: saldo pendiente de señas activas; a pagar: comisiones pendientes y cuotas a pagar de este mes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl p-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-slate-800 dark:text-white">Mi Performance</p>
            <Link href="/panel-v2/mis-ventas" className="text-xs font-bold text-amber-600 hover:underline shrink-0">Ver más →</Link>
          </div>
          {props.miPerformance.tierActual ? (
            <>
              <p className="text-base font-black text-slate-900 dark:text-white mb-1">{props.miPerformance.tierEmoji} {props.miPerformance.tierActual}</p>
              <p className="text-[11px] text-slate-400">{props.miPerformance.ventas} ventas · comisión base</p>
              {props.miPerformance.siguienteTier && (
                <>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden my-2">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${props.miPerformance.ventas + (props.miPerformance.ventasParaSiguiente || 0) > 0 ? Math.min(100, (props.miPerformance.ventas / (props.miPerformance.ventas + (props.miPerformance.ventasParaSiguiente || 0))) * 100) : 0}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-2">
                    <span>{props.miPerformance.ventas} ventas</span>
                    <span>{props.miPerformance.ventas + (props.miPerformance.ventasParaSiguiente || 0)} ventas</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{props.miPerformance.ventasParaSiguiente} ventas para "{props.miPerformance.siguienteTier}"</p>
                </>
              )}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/10 pt-2 mt-2">
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Consignaciones del mes</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{props.miPerformance.consignaciones}</p>
              </div>
              {props.miPerformance.premioSiguiente && (
                <p className="text-[10px] text-amber-600 mt-1">{props.miPerformance.premioSiguiente.faltan} consig. para {props.miPerformance.premioSiguiente.premioUsd ? `USD ${props.miPerformance.premioSiguiente.premioUsd}` : "el próximo premio"}</p>
              )}
            </>
          ) : <p className="text-xs text-slate-400 py-4 text-center">Sin datos de performance todavía.</p>}
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">Cash Flow del mes</p>
              <p className="text-[10px] text-slate-400">{Object.keys(props.topIngresos).length + Object.keys(props.topEgresos).length} movimientos · admin/finanzas</p>
            </div>
            <Link href="/panel-v2/finanzas" className="text-xs font-bold text-violet-600 hover:underline shrink-0">Ver más →</Link>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-500/10 text-center">
              <p className="text-[9px] font-bold uppercase text-emerald-600">Ingresos</p>
              <p className={`text-xs font-black text-emerald-700 dark:text-emerald-400 ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtPorMoneda(props.ingresosPorMoneda)}</p>
            </div>
            <div className="rounded-lg p-2 bg-rose-50 dark:bg-rose-500/10 text-center">
              <p className="text-[9px] font-bold uppercase text-rose-600">Egresos</p>
              <p className={`text-xs font-black text-rose-700 dark:text-rose-400 ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtPorMoneda(props.egresosPorMoneda)}</p>
            </div>
            <div className="rounded-lg p-2 bg-violet-50 dark:bg-violet-500/10 text-center">
              <p className="text-[9px] font-bold uppercase text-violet-600">Neto</p>
              <p className={`text-xs font-black text-violet-700 dark:text-violet-400 ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtPorMoneda(props.netoPorMoneda)}</p>
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Saldos por cuenta · {props.cuentas.length}</p>
          {props.cuentas.slice(0, 2).map((c) => (
            <div key={c.id} className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-500">{c.nombre}</span>
              <span className={`font-mono font-bold text-slate-700 dark:text-slate-300 ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtMoneda(Number(c.saldo_inicial), c.moneda)}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">Cuotas a pagar — este mes</p>
              <p className="text-[10px] text-slate-400">{props.cuotasPagarResumen.cantidadDelMes} cuotas del mes</p>
            </div>
            <Link href="/panel-v2/mi-espacio?tab=cuotas-pagar" className="text-xs font-bold text-emerald-600 hover:underline shrink-0">Ver más →</Link>
          </div>
          <div className={`flex items-center justify-between rounded-lg px-3 py-2 mb-3 ${props.cuotasPagarResumen.vencidas > 0 ? "bg-rose-50 dark:bg-rose-500/10" : "bg-emerald-50 dark:bg-emerald-500/10"}`}>
            <span className={`text-xs font-bold ${props.cuotasPagarResumen.vencidas > 0 ? "text-rose-600" : "text-slate-500"}`}>{props.cuotasPagarResumen.vencidas > 0 ? `${props.cuotasPagarResumen.vencidas} cuota${props.cuotasPagarResumen.vencidas === 1 ? "" : "s"} vencida${props.cuotasPagarResumen.vencidas === 1 ? "" : "s"}` : "Sin cuotas vencidas"}</span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${props.cuotasPagarResumen.vencidas > 0 ? "text-rose-600" : "text-emerald-600"}`}>{props.cuotasPagarResumen.vencidas > 0 ? "Atención" : "Al día"}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-2.5 bg-slate-50 dark:bg-white/5 text-center">
              <p className={`text-sm font-black text-slate-900 dark:text-white ${props.ocultarMontos ? "blur-sm select-none" : ""}`}>{fmtPorMoneda(props.cuotasPagarResumen.totalPorMoneda) === "—" ? "—" : fmtPorMoneda(props.cuotasPagarResumen.totalPorMoneda)}</p>
              <p className="text-[9px] font-bold uppercase text-slate-400">Total del mes</p>
            </div>
            <div className="rounded-xl p-2.5 bg-slate-50 dark:bg-white/5 text-center">
              <p className="text-sm font-black text-slate-900 dark:text-white">{props.cuotasPagarResumen.cantidadDelMes}</p>
              <p className="text-[9px] font-bold uppercase text-slate-400">{props.cuotasPagarResumen.vencidas} vencidas</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center pt-2">Estás en la app nueva. Las secciones completas van migrando de a una.</p>
    </div>
  );
}
