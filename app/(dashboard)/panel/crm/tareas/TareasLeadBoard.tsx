"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { 
  AlertTriangle, Clock, UserPlus, CheckSquare, Phone, 
  LayoutGrid, Calendar, History, Printer, ChevronLeft, ChevronRight, 
  PieChart as PieChartIcon 
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const CALIFICACIONES = [
  { value: "caliente", label: "Caliente" },
  { value: "tibio", label: "Tibio" },
  { value: "frio", label: "Frío" },
];

// Paleta de colores para gráficos
const CHART_COLORS = {
  primary: "#4f46e5", // indigo-600
  rose: "#f43f5e",    // rose-500
  amber: "#f59e0b",   // amber-500
  emerald: "#10b981", // emerald-500
  sky: "#0ea5e9",     // sky-500
  slate: "#94a3b8",   // slate-400
};

type Vista = "tablero" | "calendario" | "historial" | "metricas";

// ================= COMPONENTES DE GRÁFICOS Y KPIS =================

function TarjetaKpi({ titulo, valor, subtitulo, alerta, color }: { titulo: string; valor: number | string; subtitulo?: string; alerta?: boolean; color?: string }) {
  const colorClass = alerta ? "text-rose-600 dark:text-rose-400" : color ? color : "text-indigo-600 dark:text-sky-300";
  const bgClass = alerta ? "bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/50" : "bg-white dark:bg-[#001c55] border-slate-200 dark:border-[#0a2a6b]";
  
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 shadow-sm border ${bgClass}`}>
      <p className={`text-3xl font-black ${colorClass}`}>
        {valor}
      </p>
      <p className={`text-[11px] font-bold uppercase tracking-widest mt-1 ${alerta ? "text-rose-500 dark:text-rose-500" : "text-slate-500 dark:text-slate-400"}`}>
        {titulo}
      </p>
      {subtitulo && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">{subtitulo}</p>}
      {alerta && <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/10 dark:bg-rose-500/20 rounded-bl-full -mr-4 -mt-4" />}
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl shadow-xl">
        <p className="font-bold text-slate-900 dark:text-white text-[13px] mb-1">{payload[0].payload.name}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="font-bold text-[12px] flex items-center gap-1.5" style={{ color: entry.color }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
            {entry.name === "Pendientes" || entry.name === "Completadas" ? entry.name : "Total"}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ================= COMPONENTE PRINCIPAL =================

export default function TareasLeadBoard({
  tareasIniciales, tareasCompletadas, leadsSinContacto, vendedores,
}: {
  tareasIniciales: any[]; tareasCompletadas: any[]; leadsSinContacto: any[]; vendedores: any[];
}) {
  const [vista, setVista] = useState<Vista>("tablero");
  const [vendedorFiltro, setVendedorFiltro] = useState("");
  const [calificacionFiltro, setCalificacionFiltro] = useState("");

  const filtrarPorVendedorYCalificacion = (lista: any[], getVendedorId: (x: any) => string | null, getCalificacion: (x: any) => string | null) =>
    lista.filter((x) => {
      if (vendedorFiltro && getVendedorId(x) !== vendedorFiltro) return false;
      if (calificacionFiltro && getCalificacion(x) !== calificacionFiltro) return false;
      return true;
    });

  const tareas = useMemo(
    () => filtrarPorVendedorYCalificacion(tareasIniciales, (t) => t.cotizaciones?.vendedor_id, (t) => t.cotizaciones?.calificacion),
    [tareasIniciales, vendedorFiltro, calificacionFiltro]
  );

  const completadas = useMemo(
    () => filtrarPorVendedorYCalificacion(tareasCompletadas, (t) => t.cotizaciones?.vendedor_id, (t) => t.cotizaciones?.calificacion),
    [tareasCompletadas, vendedorFiltro, calificacionFiltro]
  );

  const sinContacto = useMemo(
    () => filtrarPorVendedorYCalificacion(leadsSinContacto, (l) => l.vendedor_id, (l) => l.calificacion),
    [leadsSinContacto, vendedorFiltro, calificacionFiltro]
  );

  const { vencidas, hoy, proximas } = useMemo(() => {
    const ahora = new Date();
    const finHoy = new Date(ahora); finHoy.setHours(23, 59, 59, 999);
    const inicioHoy = new Date(ahora); inicioHoy.setHours(0, 0, 0, 0);
    return {
      vencidas: tareas.filter((t) => new Date(t.fecha_vencimiento) < inicioHoy),
      hoy: tareas.filter((t) => { const f = new Date(t.fecha_vencimiento); return f >= inicioHoy && f <= finHoy; }),
      proximas: tareas.filter((t) => new Date(t.fecha_vencimiento) > finHoy),
    };
  }, [tareas]);

  const TABS: { id: Vista; label: string; icono: React.ReactNode }[] = [
    { id: "tablero", label: "Tablero", icono: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: "calendario", label: "Calendario", icono: <Calendar className="w-3.5 h-3.5" /> },
    { id: "historial", label: "Historial", icono: <History className="w-3.5 h-3.5" /> },
    { id: "metricas", label: "Métricas", icono: <PieChartIcon className="w-3.5 h-3.5" /> },
  ];

  // ================= DATOS PARA GRÁFICOS =================
  const getNombreVendedor = (id: string) => vendedores.find((v: any) => v.id === id)?.nombre || "Sin asignar";

  const { dataTipos, dataCargaVendedores, dataStatus } = useMemo(() => {
    const todas = [...tareas, ...completadas];
    
    // 1. Tipos de Tarea (Dona)
    const conteoTipos = new Map<string, number>();
    todas.forEach(t => {
      const tipo = t.tipo || "Otro";
      conteoTipos.set(tipo, (conteoTipos.get(tipo) || 0) + 1);
    });
    const coloresTipos = [CHART_COLORS.primary, CHART_COLORS.sky, CHART_COLORS.amber, CHART_COLORS.emerald, CHART_COLORS.rose];
    const dataTipos = Array.from(conteoTipos.entries()).map(([name, value], i) => ({
      name, value, color: coloresTipos[i % coloresTipos.length]
    })).sort((a, b) => b.value - a.value);

    // 2. Estado General (Dona)
    const dataStatus = [
      { name: "Completadas", value: completadas.length, color: CHART_COLORS.emerald },
      { name: "Para Hoy / Próximas", value: hoy.length + proximas.length, color: CHART_COLORS.sky },
      { name: "Vencidas", value: vencidas.length, color: CHART_COLORS.rose },
    ].filter(d => d.value > 0);

    // 3. Carga por Vendedor (Barras Apiladas)
    const vendedoresMap = new Map<string, { Pendientes: number, Completadas: number }>();
    tareas.forEach(t => {
      const v = getNombreVendedor(t.cotizaciones?.vendedor_id);
      const data = vendedoresMap.get(v) || { Pendientes: 0, Completadas: 0 };
      data.Pendientes += 1;
      vendedoresMap.set(v, data);
    });
    completadas.forEach(t => {
      const v = getNombreVendedor(t.cotizaciones?.vendedor_id);
      const data = vendedoresMap.get(v) || { Pendientes: 0, Completadas: 0 };
      data.Completadas += 1;
      vendedoresMap.set(v, data);
    });
    const dataCargaVendedores = Array.from(vendedoresMap.entries()).map(([name, data]) => ({
      name,
      Pendientes: data.Pendientes,
      Completadas: data.Completadas,
      Total: data.Pendientes + data.Completadas
    })).sort((a, b) => b.Total - a.Total).slice(0, 8); // Top 8 para no romper el gráfico

    return { dataTipos, dataCargaVendedores, dataStatus };
  }, [tareas, completadas, vencidas, hoy, proximas, vendedores]);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden print:overflow-visible print:h-auto">
      <header className="flex flex-col gap-4 border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
              <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Tareas de Leads</h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Seguimiento comercial de todos los leads, con acceso directo</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={calificacionFiltro}
              onChange={(e) => setCalificacionFiltro(e.target.value)}
              className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200"
            >
              <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Todo grado de interés</option>
              {CALIFICACIONES.map((c) => (<option key={c.value} value={c.value} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{c.label}</option>))}
            </select>
            <select
              value={vendedorFiltro}
              onChange={(e) => setVendedorFiltro(e.target.value)}
              className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200"
            >
              <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Todos los vendedores</option>
              {vendedores.map((v: any) => (<option key={v.id} value={v.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{v.nombre}</option>))}
            </select>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-slate-800 dark:bg-[#00246b] hover:bg-slate-700 dark:hover:bg-[#002a6e] text-white px-3 py-2 rounded-lg text-[12px] font-bold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-slate-100 dark:border-[#0a2a6b] -mb-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setVista(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold border-b-2 transition-colors ${
                vista === t.id
                  ? "border-indigo-600 text-indigo-600 dark:border-sky-400 dark:text-sky-300"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {t.icono} {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar p-6 print:overflow-visible print:bg-white print:p-0">
        
        {/* ================= VISTA TABLERO ================= */}
        {vista === "tablero" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-[1400px] mx-auto">
            <Columna titulo="Tareas vencidas" color="rose" icono={<AlertTriangle className="w-4 h-4 text-white" />} items={vencidas} render={(t) => <TareaCard tarea={t} color="rose" />} />
            <Columna titulo="Tareas del día" color="amber" icono={<Clock className="w-4 h-4 text-white" />} items={hoy} render={(t) => <TareaCard tarea={t} color="amber" />} />
            <Columna titulo="Sin primer contacto" color="sky" icono={<UserPlus className="w-4 h-4 text-white" />} items={sinContacto} render={(l) => <LeadSinContactoCard lead={l} />} />
          </div>
        )}

        {/* ================= VISTA CALENDARIO ================= */}
        {vista === "calendario" && <TareasCalendario tareas={tareas} completadas={completadas} />}

        {/* ================= VISTA HISTORIAL ================= */}
        {vista === "historial" && <TareasHistorial completadas={completadas} />}

        {/* ================= VISTA MÉTRICAS ================= */}
        {vista === "metricas" && (
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <TarjetaKpi titulo="Pendientes (Total)" valor={tareas.length} subtitulo="Para hoy o futuras" />
              <TarjetaKpi titulo="Vencidas" valor={vencidas.length} alerta={vencidas.length > 0} subtitulo="Requieren atención urgente" />
              <TarjetaKpi titulo="Completadas" valor={completadas.length} color="text-emerald-600 dark:text-emerald-400" subtitulo="Histórico de tareas cerradas" />
              <TarjetaKpi titulo="Leads Huérfanos" valor={sinContacto.length} alerta={sinContacto.length > 0} subtitulo="Nuevos leads sin tarea asignada" />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Gráfico de Dona: Estado General */}
              <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm p-5 h-[340px] flex flex-col">
                <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 mb-2">Estado de Tareas</h3>
                <div className="flex-1 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dataStatus} innerRadius="65%" outerRadius="85%" paddingAngle={3} dataKey="value" stroke="none">
                        {dataStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-800 dark:text-white">{tareas.length + completadas.length}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                  </div>
                </div>
              </div>

              {/* Gráfico de Dona: Tipos de Tarea */}
              <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm p-5 h-[340px] flex flex-col">
                <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 mb-2">Distribución por Tipo</h3>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dataTipos} outerRadius="85%" dataKey="value" stroke="none">
                        {dataTipos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Barras: Carga por Vendedor */}
              <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm p-5 h-[340px] flex flex-col col-span-1 md:col-span-3 lg:col-span-1">
                <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 mb-4">Carga por Vendedor</h3>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataCargaVendedores} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8492a6', fontWeight: 600 }} width={80} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                      <Bar dataKey="Pendientes" stackId="a" fill={CHART_COLORS.sky} radius={[0, 0, 0, 0]} barSize={16} />
                      <Bar dataKey="Completadas" stackId="a" fill={CHART_COLORS.emerald} radius={[0, 4, 4, 0]} barSize={16} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ================= COMPONENTES DE VISTAS EXISTENTES =================

const COLOR_HEADER: Record<string, string> = {
  rose: "bg-rose-500", amber: "bg-amber-500", sky: "bg-sky-500",
};

function Columna({ titulo, icono, items, render, color }: { titulo: string; icono: React.ReactNode; items: any[]; render: (item: any) => React.ReactNode; color: string }) {
  return (
    <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-160px)]">
      <div className={`px-4 py-3 flex items-center justify-between shrink-0 ${COLOR_HEADER[color]}`}>
        <h2 className="text-[12px] font-bold text-white flex items-center gap-2">{icono} {titulo}</h2>
        <span className="text-[11px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="p-3 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
        {items.length === 0 ? (
          <p className="text-[12px] text-slate-400 dark:text-slate-500 italic text-center py-6">Sin pendientes.</p>
        ) : (
          items.map((item) => <div key={item.id}>{render(item)}</div>)
        )}
      </div>
    </div>
  );
}

const COLOR_BORDE: Record<string, string> = {
  rose: "border-l-rose-400", amber: "border-l-amber-400", sky: "border-l-sky-400",
};

function TareaCard({ tarea, color }: { tarea: any; color: string }) {
  const lead = tarea.cotizaciones;
  return (
    <Link href={`/panel/crm/${lead?.id}`} className={`block bg-slate-50 dark:bg-[#00246b] hover:bg-white dark:hover:bg-[#002a6e] hover:shadow-sm border border-slate-200 dark:border-[#0a2a6b] border-l-4 rounded-xl p-3 transition-all ${COLOR_BORDE[color]}`}>
      <p className="text-[12px] font-bold text-slate-800 dark:text-white">{tarea.tipo}</p>
      <p className="text-[12px] text-slate-600 dark:text-slate-300 truncate">{lead?.nombre}</p>
      <span className="text-[10px] text-slate-400 dark:text-slate-500">
        {new Date(tarea.fecha_vencimiento).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
      </span>
    </Link>
  );
}

function LeadSinContactoCard({ lead }: { lead: any }) {
  return (
    <Link href={`/panel/crm/${lead.id}`} className="block bg-slate-50 dark:bg-[#00246b] hover:bg-white dark:hover:bg-[#002a6e] hover:shadow-sm border border-slate-200 dark:border-[#0a2a6b] border-l-4 border-l-sky-400 rounded-xl p-3 transition-all">
      <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate">{lead.nombre}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {lead.telefono || "Sin teléfono"}</p>
      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
        Ingresó: {new Date(lead.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
      </span>
    </Link>
  );
}

// ================= CALENDARIO (vista semana) =================

function inicioDeSemana(fecha: Date) {
  const d = new Date(fecha);
  const dia = d.getDay(); // 0=domingo
  const diff = dia === 0 ? -6 : 1 - dia; // arranca lunes
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function TareasCalendario({ tareas, completadas }: { tareas: any[]; completadas: any[] }) {
  const [semanaBase, setSemanaBase] = useState(() => inicioDeSemana(new Date()));
  const todasLasTareas = useMemo(() => [...tareas, ...completadas], [tareas, completadas]);

  const dias = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(semanaBase);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [semanaBase]);

  const tareasPorDia = (dia: Date) => {
    const inicio = new Date(dia); inicio.setHours(0, 0, 0, 0);
    const fin = new Date(dia); fin.setHours(23, 59, 59, 999);
    return todasLasTareas.filter((t) => {
      const f = new Date(t.fecha_vencimiento);
      return f >= inicio && f <= fin;
    }).sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime());
  };

  const colorTarea = (t: any) => {
    if (t.completada) return "bg-slate-400 dark:bg-slate-600";
    if (new Date(t.fecha_vencimiento) < new Date()) return "bg-rose-500";
    return "bg-amber-500";
  };

  const nombreDia = (d: Date) => d.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" }).toUpperCase();

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <div className="flex items-center gap-2">
          <button onClick={() => setSemanaBase((s) => { const n = new Date(s); n.setDate(n.getDate() - 7); return n; })} className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#00246b] hover:bg-slate-200 dark:hover:bg-[#002a6e] text-slate-600 dark:text-slate-300">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setSemanaBase(inicioDeSemana(new Date()))} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#00246b] hover:bg-slate-200 dark:hover:bg-[#002a6e] text-[12px] font-bold text-slate-600 dark:text-slate-300">
            Hoy
          </button>
          <button onClick={() => setSemanaBase((s) => { const n = new Date(s); n.setDate(n.getDate() + 7); return n; })} className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#00246b] hover:bg-slate-200 dark:hover:bg-[#002a6e] text-slate-600 dark:text-slate-300">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
          {dias[0].toLocaleDateString("es-AR", { day: "2-digit", month: "short" })} - {dias[6].toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Vencida</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Pendiente</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" /> Completada</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {dias.map((dia) => {
          const items = tareasPorDia(dia);
          const esHoy = dia.toDateString() === new Date().toDateString();
          return (
            <div key={dia.toISOString()} className={`bg-white dark:bg-[#001c55] border rounded-xl overflow-hidden min-h-[150px] ${esHoy ? "border-indigo-400 dark:border-sky-400 ring-1 ring-indigo-400 dark:ring-sky-400" : "border-slate-200 dark:border-[#0a2a6b]"}`}>
              <div className={`px-2 py-1.5 text-center text-[10px] font-bold ${esHoy ? "bg-indigo-600 text-white" : "bg-slate-50 dark:bg-[#00246b] text-slate-500 dark:text-slate-400"}`}>
                {nombreDia(dia)}
              </div>
              <div className="p-1.5 space-y-1">
                {items.map((t) => (
                  <Link
                    key={t.id}
                    href={`/panel/crm/${t.cotizaciones?.id}`}
                    className={`block ${colorTarea(t)} text-white rounded px-1.5 py-1 text-[10px] leading-tight hover:opacity-90 transition-opacity`}
                  >
                    <div className="font-bold">{new Date(t.fecha_vencimiento).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</div>
                    <div className="truncate">{t.cotizaciones?.nombre || "Lead"}</div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ================= HISTORIAL =================

function TareasHistorial({ completadas }: { completadas: any[] }) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const filtradas = useMemo(() => {
    return completadas.filter((t) => {
      const f = new Date(t.fecha_vencimiento);
      if (desde && f < new Date(`${desde}T00:00:00`)) return false;
      if (hasta && f > new Date(`${hasta}T23:59:59`)) return false;
      return true;
    }).sort((a, b) => new Date(b.fecha_vencimiento).getTime() - new Date(a.fecha_vencimiento).getTime());
  }, [completadas, desde, hasta]);

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 print:hidden">
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Desde</label>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-3 py-1.5 text-[12px] outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200" />
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hasta</label>
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-3 py-1.5 text-[12px] outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200" />
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 sm:ml-auto bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg">
          {filtradas.length} tarea(s) completada(s)
        </span>
      </div>

      <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-800 dark:bg-[#00246b] text-white text-[10px] uppercase tracking-widest font-bold">
                <th className="p-3 pl-4">Fecha</th>
                <th className="p-3">Lead</th>
                <th className="p-3">Tipo</th>
                <th className="p-3 pr-4">Comentario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
              {filtradas.map((t) => (
                <tr key={t.id} className="hover:bg-indigo-50/40 dark:hover:bg-[#00246b] transition-colors">
                  <td className="p-3 pl-4 text-[12px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(t.fecha_vencimiento).toLocaleString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-3 text-[13px] font-bold">
                    <Link href={`/panel/crm/${t.cotizaciones?.id}`} className="text-indigo-600 dark:text-sky-300 hover:underline">
                      {t.cotizaciones?.nombre || "Lead"}
                    </Link>
                  </td>
                  <td className="p-3 text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                    <span className="bg-slate-100 dark:bg-[#00246b] text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">{t.tipo}</span>
                  </td>
                  <td className="p-3 pr-4 text-[12px] text-slate-500 dark:text-slate-400 truncate max-w-xs" title={t.resultado || t.titulo || "—"}>{t.resultado || t.titulo || "—"}</td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-slate-500 text-[13px]">
                    Sin tareas completadas en este rango.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}