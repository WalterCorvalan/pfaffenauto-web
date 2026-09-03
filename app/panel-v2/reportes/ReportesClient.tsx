"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { BarChart3, ChevronLeft, ChevronRight, Trophy, Clock, FolderKanban, Ticket, Wrench, Loader2, Lock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

interface Props {
  miId: string; miNombre: string; soyAdmin: boolean; soyFinanzas: boolean; soyVentas: boolean; mesInicial: string;
  rankingInicial: any[]; premios: any[]; rankingVelocidadInicial: any[]; operacionesPorVendedorInicial: any[];
  origenLeadsInicial: any[]; embudoComercialInicial: any; expedientesResumenInicial: any; expedientesPorEstado: any[];
  infraccionesResumenInicial: any; tallerFacturacionInicial: any; ventasPorMes: any[]; ventasPorMarca: any[];
  topClientes: any[]; clientesPorVendedor: any[]; cotizacionesResumen: any; cotizacionesPorEstado: any[];
  cotizacionesPorVendedor: any[]; stockPorEstado: any[]; stockPorMarca: any[]; infraccionesPorMes: any[];
  servicePosventaInicial: any;
}

const ESTADO_COT_LABEL: Record<string, string> = { pendiente: "Pendiente", aprobada: "Aprobada", rechazada: "Rechazada" };
const ESTADO_EXP_LABEL: Record<string, string> = { abierto: "En proceso", cerrado: "Finalizado" };

function fmtMoneda(n: number, moneda: string) {
  return moneda === "ARS" ? `$ ${Math.round(n).toLocaleString("es-AR")}` : `${moneda} ${Math.round(n).toLocaleString("es-AR")}`;
}

function Card({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
      <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">{Icon && <Icon className="w-4 h-4 text-slate-400" />} {title}</p>
      {children}
    </div>
  );
}

function BarRow({ label, valor, max, color = "bg-indigo-500" }: { label: string; valor: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((valor / max) * 100)) : 0;
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-600 dark:text-slate-300 truncate">{label}</span>
        <span className="font-bold text-slate-800 dark:text-white shrink-0 ml-2">{valor}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatTile({ label, valor, tono = "" }: { label: string; valor: React.ReactNode; tono?: string }) {
  return (
    <div className={`rounded-xl p-4 border ${tono || "bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/5"}`}>
      <p className="text-2xl font-black text-slate-900 dark:text-white">{valor}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function SeccionRestringida({ titulo }: { titulo: string }) {
  return (
    <div className="bg-white dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-5 flex items-center gap-2 text-slate-400">
      <Lock className="w-4 h-4" />
      <p className="text-xs font-bold">{titulo} — visible solo para Finanzas / Admin.</p>
    </div>
  );
}

export default function ReportesClient(props: Props) {
  const { miId, miNombre, premios, soyAdmin, soyFinanzas } = props;
  const puedeVerFinanzas = soyAdmin || soyFinanzas;
  const [mesOffset, setMesOffset] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [ranking, setRanking] = useState(props.rankingInicial);
  const [rankingVelocidad, setRankingVelocidad] = useState(props.rankingVelocidadInicial);
  const [operacionesPorVendedor, setOperacionesPorVendedor] = useState(props.operacionesPorVendedorInicial);
  const [origenLeads, setOrigenLeads] = useState(props.origenLeadsInicial);
  const [embudoComercial, setEmbudoComercial] = useState(props.embudoComercialInicial);
  const [expedientesResumen, setExpedientesResumen] = useState(props.expedientesResumenInicial);
  const [infraccionesResumen, setInfraccionesResumen] = useState(props.infraccionesResumenInicial);
  const [tallerFacturacion, setTallerFacturacion] = useState(props.tallerFacturacionInicial);

  const hoy = new Date();
  const mesBase = useMemo(() => new Date(hoy.getFullYear(), hoy.getMonth() + mesOffset, 1), [mesOffset]);
  const mesLabel = mesBase.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const mesStr = `${mesBase.getFullYear()}-${String(mesBase.getMonth() + 1).padStart(2, "0")}-01`;
  const desde = mesStr;
  const hasta = new Date(mesBase.getFullYear(), mesBase.getMonth() + 1, 0).toISOString().slice(0, 10);

  const cargarMes = async (offset: number) => {
    setMesOffset(offset);
    setCargando(true);
    const base = new Date(hoy.getFullYear(), hoy.getMonth() + offset, 1);
    const d = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-01`;
    const h = new Date(base.getFullYear(), base.getMonth() + 1, 0).toISOString().slice(0, 10);
    const [r1, r2, r3, r4, r5, r6, r7] = await Promise.all([
      supabase2.rpc("ranking_ventas", { p_desde: d, p_hasta: h }),
      supabase2.rpc("reportes_ranking_velocidad", { p_mes: d }),
      supabase2.rpc("reportes_operaciones_por_vendedor", { p_mes: d }),
      supabase2.rpc("reportes_origen_leads", { p_mes: d }),
      supabase2.rpc("reportes_embudo_comercial", { p_mes: d }),
      supabase2.rpc("reportes_expedientes_resumen", { p_mes: d }),
      supabase2.rpc("reportes_infracciones_resumen", { p_mes: d }),
    ]);
    const [r8] = await Promise.all([supabase2.rpc("reportes_taller_facturacion", { p_mes: d })]);
    setRanking(r1.data || []);
    setRankingVelocidad(r2.data || []);
    setOperacionesPorVendedor(r3.data || []);
    setOrigenLeads(r4.data || []);
    setEmbudoComercial((r5.data || [])[0] || { clientes: 0, cotizaciones: 0, ventas: 0 });
    setExpedientesResumen((r6.data || [])[0] || { total: 0, activos: 0, cerrados: 0, vencidos: 0 });
    setInfraccionesResumen((r7.data || [])[0] || { total: 0, pendientes: 0, pagadas: 0, ganancia_total: 0 });
    setTallerFacturacion((r8.data || [])[0] || { facturado_cobrado: 0, ots_cobradas: 0, ots_generadas: 0 });
    setCargando(false);
  };

  const proximoBono = (consig: number) => {
    const siguiente = [...premios].filter((p) => p.consignaciones_min != null).sort((a, b) => a.consignaciones_min - b.consignaciones_min).find((p) => p.consignaciones_min > consig);
    if (!siguiente) return null;
    return `${siguiente.consignaciones_min - consig} para USD ${siguiente.premio_usd}`;
  };

  const maxVentasVendedor = Math.max(1, ...operacionesPorVendedor.map((v: any) => Number(v.ventas_mes) || 0));
  const maxLeads = Math.max(1, ...origenLeads.map((v: any) => Number(v.cantidad) || 0));
  const maxMarca = Math.max(1, ...props.ventasPorMarca.map((v: any) => Number(v.ventas_ponderadas) || 0));
  const maxClientesVend = Math.max(1, ...props.clientesPorVendedor.map((v: any) => Number(v.clientes) || 0));
  const maxCotVend = Math.max(1, ...props.cotizacionesPorVendedor.map((v: any) => Number(v.cotizaciones) || 0));
  const maxStockMarca = Math.max(1, ...props.stockPorMarca.map((v: any) => Number(v.cantidad) || 0));

  // Nunca mezclar ARS y USD en el mismo eje/serie — se pivotea a una
  // columna por moneda en vez de sumar todo en un solo "monto".
  const ventasPorMesChart = useMemo(() => {
    const porMes = new Map<string, { mes: string; ARS: number; USD: number }>();
    [...props.ventasPorMes].reverse().forEach((v: any) => {
      const label = new Date(v.mes).toLocaleDateString("es-AR", { month: "short", year: "2-digit", timeZone: "UTC" });
      const fila = porMes.get(label) || { mes: label, ARS: 0, USD: 0 };
      if (v.moneda_venta === "ARS") fila.ARS += Number(v.monto);
      else if (v.moneda_venta === "USD") fila.USD += Number(v.monto);
      porMes.set(label, fila);
    });
    return Array.from(porMes.values());
  }, [props.ventasPorMes]);
  const infraccionesPorMesChart = [...props.infraccionesPorMes].reverse().map((v: any) => ({ mes: new Date(v.mes).toLocaleDateString("es-AR", { month: "short", year: "2-digit", timeZone: "UTC" }), cantidad: Number(v.cantidad) }));

  const ESTADO_STOCK_LABEL: Record<string, string> = { disponible: "Disponibles", reservado: "Reservados", "señado": "Señados", vendido: "Vendidos", en_preparacion: "En prep." };
  const ESTADO_STOCK_COLOR: Record<string, string> = { disponible: "bg-emerald-500", reservado: "bg-blue-500", "señado": "bg-amber-500", vendido: "bg-indigo-500", en_preparacion: "bg-sky-500" };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /> Reportes y Análisis</h1>
        <p className="text-sm text-slate-400">Vista completa — todos los módulos.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1.5">
          <button onClick={() => cargarMes(mesOffset - 1)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-bold text-slate-800 dark:text-white capitalize px-2 min-w-[140px] text-center">{mesLabel}</span>
          <button onClick={() => cargarMes(mesOffset + 1)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"><ChevronRight className="w-4 h-4" /></button>
        </div>
        {mesOffset !== 0 && <button onClick={() => cargarMes(0)} className="px-3 py-2 text-xs font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-300">Volver al mes actual</button>}
        {cargando && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>

      {/* Competencia del mes */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-700 to-violet-700 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Competencia del mes</p>
            <p className="text-lg font-black capitalize">{mesLabel}</p>
          </div>
          <Trophy className="w-6 h-6 text-indigo-200" />
        </div>
        <div className="bg-white/10 rounded-xl overflow-hidden mb-3">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-indigo-200">
                <th className="px-3 py-2 font-bold">Vendedor</th>
                <th className="px-3 py-2 font-bold text-right">Ventas mes</th>
                <th className="px-3 py-2 font-bold text-right">Consig. mes</th>
                <th className="px-3 py-2 font-bold text-right">Bono</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r: any, i: number) => (
                <tr key={r.vendedor_id} className={i % 2 === 0 ? "bg-white/5" : ""}>
                  <td className="px-3 py-2 font-bold">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "•"} {r.nombre}{r.vendedor_id === miId ? " (vos)" : ""}</td>
                  <td className="px-3 py-2 text-right font-mono">{Number(r.ventas_equivalentes)}</td>
                  <td className="px-3 py-2 text-right font-mono">{r.consignaciones}</td>
                  <td className="px-3 py-2 text-right text-indigo-200 text-xs">{proximoBono(r.consignaciones) || "¡Máximo!"}</td>
                </tr>
              ))}
              {ranking.length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-center text-indigo-200 text-xs">Sin vendedores activos.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {premios.filter((p) => p.consignaciones_min != null).map((p: any) => (
            <div key={p.id} className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-lg">{p.emoji}</p>
              <p className="text-sm font-black">USD {p.premio_usd}</p>
              <p className="text-[10px] text-indigo-200">{p.consignaciones_min} consig.</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking de velocidad */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-teal-700 to-cyan-800 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal-200">Ranking de velocidad</p>
            <p className="text-lg font-black capitalize">{mesLabel}</p>
          </div>
          <Clock className="w-6 h-6 text-teal-200" />
        </div>
        {rankingVelocidad.length === 0 ? (
          <p className="text-center text-teal-200 text-xs py-4">Sin leads asignados este mes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-teal-200">
                  <th className="px-3 py-2 font-bold">Vendedor</th>
                  <th className="px-3 py-2 font-bold text-right">Tiempo medio</th>
                  <th className="px-3 py-2 font-bold text-right">% &lt;1h</th>
                  <th className="px-3 py-2 font-bold text-right">Contactados</th>
                  <th className="px-3 py-2 font-bold text-right">Sin contactar</th>
                  <th className="px-3 py-2 font-bold text-right">Soltados</th>
                </tr>
              </thead>
              <tbody>
                {rankingVelocidad.map((r: any, i: number) => (
                  <tr key={r.vendedor_id} className={i % 2 === 0 ? "bg-white/5" : ""}>
                    <td className="px-3 py-2 font-bold">{r.vendedor_nombre}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.tiempo_medio_minutos != null ? `${r.tiempo_medio_minutos}m` : "—"}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.pct_bajo_1h != null ? `${r.pct_bajo_1h}%` : "—"}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.contactados}</td>
                    <td className={`px-3 py-2 text-right font-mono ${r.sin_contactar > 0 ? "text-rose-300 font-bold" : ""}`}>{r.sin_contactar}</td>
                    <td className={`px-3 py-2 text-right font-mono ${r.soltados > 0 ? "text-rose-300 font-bold" : ""}`}>{r.soltados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {puedeVerFinanzas ? (
          <Card title="Volumen de Ventas por Mes">
            {/* ARS y USD nunca comparten eje — escalas totalmente distintas. */}
            <div className="grid grid-cols-2 gap-3">
              {(["ARS", "USD"] as const).map((moneda) => (
                <div key={moneda}>
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">{moneda}</p>
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ventasPorMesChart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/10" />
                        <XAxis dataKey="mes" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={30} tickFormatter={(v) => new Intl.NumberFormat("es-AR", { notation: "compact" }).format(v)} />
                        <Tooltip formatter={(v: any) => [fmtMoneda(Number(v), moneda), moneda]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Bar dataKey={moneda} fill={moneda === "ARS" ? "#6366f1" : "#10b981"} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : <SeccionRestringida titulo="Volumen de Ventas por Mes" />}

        <Card title="Operaciones por Vendedor">
          {operacionesPorVendedor.map((v: any) => <BarRow key={v.vendedor_id} label={v.vendedor_nombre} valor={Number(v.ventas_mes)} max={maxVentasVendedor} />)}
          {operacionesPorVendedor.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Sin datos.</p>}
        </Card>

        <Card title="Ventas por Marca">
          {props.ventasPorMarca.map((v: any) => <BarRow key={v.marca} label={v.marca} valor={Number(v.ventas_ponderadas)} max={maxMarca} color="bg-violet-500" />)}
          {props.ventasPorMarca.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Sin ventas cerradas todavía.</p>}
        </Card>

        <Card title="Origen de Leads">
          {origenLeads.map((v: any) => <BarRow key={v.origen} label={v.origen} valor={Number(v.cantidad)} max={maxLeads} color="bg-sky-500" />)}
          {origenLeads.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Sin leads nuevos este mes.</p>}
        </Card>

        {puedeVerFinanzas ? (
          <Card title="Top 10 Clientes">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead><tr className="text-slate-400 uppercase text-[10px]"><th className="py-1">#</th><th className="py-1">Cliente</th><th className="py-1 text-right">Ops</th><th className="py-1 text-right">USD</th><th className="py-1 text-right">ARS</th></tr></thead>
                <tbody>
                  {props.topClientes.map((c: any, i: number) => (
                    <tr key={c.cliente_id} className="border-t border-slate-50 dark:border-white/5">
                      <td className="py-1.5 text-slate-400">{i + 1}</td>
                      <td className="py-1.5 font-bold text-slate-700 dark:text-slate-200">{c.nombre}</td>
                      <td className="py-1.5 text-right font-mono">{c.compras}</td>
                      <td className="py-1.5 text-right font-mono text-emerald-600">{Number(c.monto_usd) > 0 ? fmtMoneda(Number(c.monto_usd), "USD") : "—"}</td>
                      <td className="py-1.5 text-right font-mono text-emerald-600">{Number(c.monto_ars) > 0 ? fmtMoneda(Number(c.monto_ars), "ARS") : "—"}</td>
                    </tr>
                  ))}
                  {props.topClientes.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-slate-400">Sin ventas cerradas todavía.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        ) : <SeccionRestringida titulo="Top 10 Clientes" />}

        <Card title="Clientes por Vendedor">
          {props.clientesPorVendedor.map((v: any) => <BarRow key={v.vendedor_id} label={v.vendedor_nombre} valor={Number(v.clientes)} max={maxClientesVend} color="bg-fuchsia-500" />)}
        </Card>

        <Card title="Embudo Comercial">
          <BarRow label="Clientes" valor={Number(embudoComercial.clientes)} max={Math.max(1, Number(embudoComercial.clientes))} color="bg-indigo-500" />
          <BarRow label="Cotizaciones" valor={Number(embudoComercial.cotizaciones)} max={Math.max(1, Number(embudoComercial.clientes))} color="bg-amber-500" />
          <BarRow label="Ventas" valor={Number(embudoComercial.ventas)} max={Math.max(1, Number(embudoComercial.clientes))} color="bg-emerald-500" />
        </Card>
      </div>

      {/* Service / posventa */}
      <div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3"><Wrench className="w-4 h-4 text-slate-400" /> Service (posventa)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Embudo de service">
            <div className="grid grid-cols-4 gap-2 mb-2">
              <StatTile label="Oportunidades" valor={props.servicePosventaInicial.oportunidades} />
              <StatTile label="Contactadas" valor={`${props.servicePosventaInicial.contactadas} · ${props.servicePosventaInicial.pct_contactadas || 0}%`} tono="bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20" />
              <StatTile label="Aceptaron" valor={`0 · 0%`} tono="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" />
              <StatTile label="Con OT" valor={props.servicePosventaInicial.con_ot} tono="bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20" />
            </div>
            <p className="text-[11px] text-slate-400">Se contactó al {props.servicePosventaInicial.pct_contactadas || 0}% de los compradores.</p>
          </Card>
          {puedeVerFinanzas ? (
            <Card title="Facturación de taller originada en ventas">
              <div className="grid grid-cols-3 gap-2 mb-2">
                <StatTile label="Facturado (cobrado)" valor={tallerFacturacion.facturado_cobrado > 0 ? fmtMoneda(Number(tallerFacturacion.facturado_cobrado), "ARS") : "—"} tono="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" />
                <StatTile label="OTs cobradas" valor={tallerFacturacion.ots_cobradas} />
                <StatTile label="OTs generadas" valor={tallerFacturacion.ots_generadas} />
              </div>
              <p className="text-[11px] text-slate-400">Plata que entró al taller por service vendido tras la compra (cierra el círculo showroom → taller).</p>
            </Card>
          ) : <SeccionRestringida titulo="Facturación de taller" />}
        </div>
      </div>

      {/* Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Stock por Estado">
          {props.stockPorEstado.map((v: any) => (
            <div key={v.estado} className="flex items-center gap-2 text-xs mb-1.5 last:mb-0">
              <span className={`w-2.5 h-2.5 rounded-full ${ESTADO_STOCK_COLOR[v.estado] || "bg-slate-400"}`} />
              <span className="text-slate-600 dark:text-slate-300 flex-1">{ESTADO_STOCK_LABEL[v.estado] || v.estado}</span>
              <span className="font-bold text-slate-800 dark:text-white">{v.cantidad}</span>
            </div>
          ))}
        </Card>
        <Card title="Stock por Marca">
          {props.stockPorMarca.map((v: any) => <BarRow key={v.marca} label={v.marca} valor={Number(v.cantidad)} max={maxStockMarca} color="bg-indigo-500" />)}
        </Card>
      </div>

      {/* Cotizaciones */}
      <div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3"><Ticket className="w-4 h-4 text-slate-400" /> Cotizaciones</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatTile label="Total generadas" valor={props.cotizacionesResumen.total_generadas} />
          <StatTile label="Aprobadas" valor={props.cotizacionesResumen.aprobadas} tono="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" />
          <StatTile label="En revisión" valor={props.cotizacionesResumen.en_revision} tono="bg-slate-50 dark:bg-white/5" />
          <StatTile label="Tasa conversión" valor={`${props.cotizacionesResumen.tasa_conversion_pct || 0}%`} tono="bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Pipeline">
            {props.cotizacionesPorEstado.map((v: any) => <BarRow key={v.estado} label={ESTADO_COT_LABEL[v.estado] || v.estado} valor={Number(v.cantidad)} max={Math.max(1, props.cotizacionesResumen.total_generadas)} color={v.estado === "aprobada" ? "bg-emerald-500" : v.estado === "rechazada" ? "bg-rose-500" : "bg-slate-400"} />)}
          </Card>
          <Card title="Cotizaciones por Vendedor">
            {props.cotizacionesPorVendedor.map((v: any) => <BarRow key={v.vendedor_id} label={v.vendedor_nombre} valor={Number(v.cotizaciones)} max={maxCotVend} color="bg-indigo-500" />)}
          </Card>
        </div>
      </div>

      {/* Expedientes */}
      <div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3"><FolderKanban className="w-4 h-4 text-slate-400" /> Expedientes</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatTile label="Total" valor={expedientesResumen.total} />
          <StatTile label="Activos" valor={expedientesResumen.activos} tono="bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20" />
          <StatTile label="Cerrados/transferidos" valor={expedientesResumen.cerrados} tono="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" />
          <StatTile label="Vencidos" valor={expedientesResumen.vencidos} tono={expedientesResumen.vencidos > 0 ? "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20" : ""} />
        </div>
        <Card title="Distribución por Estado">
          {props.expedientesPorEstado.map((v: any) => <BarRow key={v.estado} label={ESTADO_EXP_LABEL[v.estado] || v.estado} valor={Number(v.cantidad)} max={Math.max(1, ...props.expedientesPorEstado.map((x: any) => Number(x.cantidad)))} color="bg-indigo-500" />)}
        </Card>
      </div>

      {/* Infracciones — incluye montos de ganancia, solo Finanzas/Admin */}
      {puedeVerFinanzas ? (
        <div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3">🚦 Infracciones</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatTile label="Total registradas" valor={infraccionesResumen.total} />
            <StatTile label="Pendientes" valor={infraccionesResumen.pendientes} tono="bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20" />
            <StatTile label="Pagadas" valor={infraccionesResumen.pagadas} tono="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" />
            <StatTile label="Ganancia total" valor={fmtMoneda(Number(infraccionesResumen.ganancia_total) || 0, "ARS")} tono="bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20" />
          </div>
          <Card title="Infracciones por Mes">
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={infraccionesPorMesChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/10" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="cantidad" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      ) : (
        <SeccionRestringida titulo="Infracciones" />
      )}
    </div>
  );
}
