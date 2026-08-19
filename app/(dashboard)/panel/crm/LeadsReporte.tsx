"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const ESTADOS_ORDEN = ["Nuevo", "Contactado", "Interesado", "Cliente", "Perdido"];

const CALIFICACION_LABEL: Record<string, string> = {
  caliente: "Caliente",
  tibio: "Tibio",
  frio: "Frío",
};

const CANAL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  webchat: "Web Chat",
  meta: "Meta Ads",
  organico: "Orgánico",
};

// Paleta de colores en formato Hex para Recharts
const CHART_COLORS = {
  primary: "#4f46e5", // indigo-600
  rose: "#f43f5e",    // rose-500
  amber: "#f59e0b",   // amber-500
  emerald: "#10b981", // emerald-500
  sky: "#0ea5e9",     // sky-500
  slate: "#64748b",   // slate-500
};

const ESTADO_COLORS: Record<string, string> = {
  Nuevo: CHART_COLORS.sky,
  Contactado: CHART_COLORS.primary,
  Interesado: CHART_COLORS.amber,
  Cliente: CHART_COLORS.emerald,
  Perdido: CHART_COLORS.rose,
};

const CALIFICACION_COLORS: Record<string, string> = {
  Caliente: CHART_COLORS.rose,
  Tibio: CHART_COLORS.amber,
  Frío: CHART_COLORS.sky,
  "Sin calificar": CHART_COLORS.slate,
};

const ANTIGUEDAD_COLORS: Record<string, string> = {
  "1 a 7 días": CHART_COLORS.emerald,
  "8 a 30 días": CHART_COLORS.amber,
  "Más de 30 días": CHART_COLORS.rose,
};

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

function agrupar(leads: any[], claveFn: (l: any) => string) {
  const conteo = new Map<string, number>();
  for (const lead of leads) {
    const clave = claveFn(lead);
    conteo.set(clave, (conteo.get(clave) || 0) + 1);
  }
  return conteo;
}

function TarjetaKpi({ titulo, valor, porcentaje, alerta }: { titulo: string; valor: number; porcentaje: string; alerta?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-sm border ${alerta ? "bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/50" : "bg-white dark:bg-[#001c55] border-slate-200 dark:border-[#0a2a6b]"}`}>
      <p className={`text-3xl font-black ${alerta ? "text-rose-600 dark:text-rose-400" : "text-indigo-600 dark:text-sky-300"}`}>
        {valor} <span className="text-sm font-bold opacity-60 ml-1">({porcentaje}%)</span>
      </p>
      <p className={`text-[11px] font-bold uppercase tracking-widest mt-2 ${alerta ? "text-rose-500 dark:text-rose-500" : "text-slate-500 dark:text-slate-400"}`}>
        {titulo}
      </p>
      {alerta && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 dark:bg-rose-500/20 rounded-bl-full -mr-8 -mt-8" />}
    </div>
  );
}

// Tooltip personalizado para Recharts adaptado al Dark Mode
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl shadow-xl">
        <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">{payload[0].payload.name}</p>
        <p className="text-indigo-600 dark:text-sky-300 font-bold text-[13px] flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].payload.color || CHART_COLORS.primary }}></span>
          {payload[0].value} leads
        </p>
      </div>
    );
  }
  return null;
};

function GraficoDona({ data, titulo, total }: { data: any[]; titulo: string; total: number }) {
  return (
    <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm p-5 h-[340px] flex flex-col">
      <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 mb-2">{titulo}</h3>
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius="65%" outerRadius="85%" paddingAngle={3} dataKey="value" stroke="none">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS.primary} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Centro de la dona */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-800 dark:text-white">{total}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
        </div>
      </div>
    </div>
  );
}

function GraficoBarras({ data, titulo }: { data: any[]; titulo: string }) {
  return (
    <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm p-5 h-[340px] flex flex-col">
      <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400 mb-4">{titulo}</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8492a6', fontWeight: 600 }} width={110} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS.primary} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TablaRanking({ titulo, filas, total }: { titulo: string; filas: [string, number][]; total: number }) {
  return (
    <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden flex flex-col h-[340px]">
      <div className="p-5 border-b border-slate-100 dark:border-[#0a2a6b] shrink-0">
        <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">{titulo}</h3>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
            {filas.map(([nombre, cantidad]) => (
              <tr key={nombre} className="hover:bg-indigo-50/40 dark:hover:bg-[#00246b] transition-colors group">
                <td className="p-3 pl-5 text-[13px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-sky-300 transition-colors">
                  {nombre}
                </td>
                <td className="p-3 text-right text-[13px] font-black text-slate-900 dark:text-white">{cantidad}</td>
                <td className="p-3 pr-5 text-right text-[12px] font-medium text-slate-400 dark:text-slate-500">
                  {total > 0 ? ((cantidad / total) * 100).toFixed(1) : "0.0"}%
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400 dark:text-slate-500 text-[13px]">
                  Sin datos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function LeadsReporte({ leads }: { leads: any[] }) {
  const total = leads.length;

  // KPIs
  const abiertos = leads.filter((l) => l.estado !== "Cliente" && l.estado !== "Perdido");
  const totalAbiertos = abiertos.length;
  const sinAsignar = abiertos.filter((l) => !l.vendedor_id).length;
  const sinCalificar = abiertos.filter((l) => !l.calificacion).length;
  const sinPrimerContacto = abiertos.filter((l) => (l.estado || "Nuevo") === "Nuevo").length;
  const pct = (n: number) => (totalAbiertos > 0 ? ((n / totalAbiertos) * 100).toFixed(1) : "0.0");

  // Procesamiento de datos para Gráficos
  const { dataEstado, dataCalificacion, dataAntiguedad, dataDueno, dataOrigen, dataSucursal, filasProducto } = useMemo(() => {
    // 1. Estado
    const porEstado = agrupar(leads, (l) => l.estado || "Nuevo");
    const dEstado = ESTADOS_ORDEN.filter((e) => porEstado.has(e)).map((e) => ({
      name: e,
      value: porEstado.get(e)!,
      color: ESTADO_COLORS[e] || CHART_COLORS.slate,
    }));

    // 2. Calificación
    const porCalificacion = agrupar(leads, (l) => CALIFICACION_LABEL[l.calificacion] || "Sin calificar");
    const dCalificacion = Array.from(porCalificacion.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, color: CALIFICACION_COLORS[name] || CHART_COLORS.slate }));

    // 3. Antigüedad
    const porAntiguedad = agrupar(leads, (l) => {
      const dias = Math.floor((Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24));
      if (dias <= 7) return "1 a 7 días";
      if (dias <= 30) return "8 a 30 días";
      return "Más de 30 días";
    });
    const dAntiguedad = ["1 a 7 días", "8 a 30 días", "Más de 30 días"]
      .filter((k) => porAntiguedad.has(k))
      .map((k) => ({ name: k, value: porAntiguedad.get(k)!, color: ANTIGUEDAD_COLORS[k] }));

    // 4. Dueño
    const porDueno = agrupar(leads, (l) => l.perfiles?.nombre || "Sin asignar");
    const dDueno = Array.from(porDueno.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8) // Top 8 vendedores
      .map(([name, value]) => ({ name, value, color: name === "Sin asignar" ? CHART_COLORS.rose : CHART_COLORS.primary }));

    // 5. Origen
    const porOrigen = agrupar(leads, (l) => CANAL_LABEL[l.canal_origen] || l.canal_origen || "Directo");
    const dOrigen = Array.from(porOrigen.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, color: CHART_COLORS.emerald }));

    // 6. Sucursal
    const porSucursal = agrupar(leads, (l) => l.sucursal_preferida || l.vehiculos?.sucursales?.nombre || "Sin especificar");
    const dSucursal = Array.from(porSucursal.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, color: CHART_COLORS.sky }));

    // 7. Producto (Para tabla de ranking)
    const porProducto = agrupar(leads, (l) => (l.vehiculos ? `${l.vehiculos.marca} ${l.vehiculos.modelo}` : "Sin auto vinculado"));
    const dProducto = Array.from(porProducto.entries()).sort((a, b) => b[1] - a[1]);

    return { dataEstado: dEstado, dataCalificacion: dCalificacion, dataAntiguedad: dAntiguedad, dataDueno: dDueno, dataOrigen: dOrigen, dataSucursal: dSucursal, filasProducto: dProducto };
  }, [leads]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
      
      {/* 1. SECCIÓN DE ALERTA RÁPIDA (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto mb-6">
        <TarjetaKpi titulo="Leads Activos" valor={totalAbiertos} porcentaje="100.0" />
        <TarjetaKpi titulo="Sin Asignar" valor={sinAsignar} porcentaje={pct(sinAsignar)} alerta={sinAsignar > 0} />
        <TarjetaKpi titulo="Sin Calificar" valor={sinCalificar} porcentaje={pct(sinCalificar)} alerta={sinCalificar > 0} />
        <TarjetaKpi titulo="Sin Contactar" valor={sinPrimerContacto} porcentaje={pct(sinPrimerContacto)} alerta={sinPrimerContacto > 0} />
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* 2. FILA GRÁFICOS DE DISTRIBUCIÓN (Donas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <GraficoDona data={dataEstado} titulo="Embudo por Estado" total={total} />
          <GraficoDona data={dataCalificacion} titulo="Temperatura (Calificación)" total={total} />
          <GraficoDona data={dataAntiguedad} titulo="Antigüedad de Leads" total={total} />
        </div>

        {/* 3. FILA GRÁFICOS COMPARATIVOS (Barras Horizontales) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <GraficoBarras data={dataDueno} titulo="Rendimiento por Vendedor" />
          <GraficoBarras data={dataOrigen} titulo="Leads por Canal de Origen" />
        </div>

        {/* 4. FILA MIXTA (Barras + Ranking detallado) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <GraficoBarras data={dataSucursal} titulo="Volumen por Sucursal" />
          <TablaRanking titulo="Top Productos de Interés" filas={filasProducto} total={total} />
        </div>
      </div>
    </div>
  );
}