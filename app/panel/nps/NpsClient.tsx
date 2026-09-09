"use client";

import { useState } from "react";
import { Smile, Send, Plus, BarChart3, TrendingUp, TrendingDown, Star, MessageSquare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import EnviarEncuestaModal from "./EnviarEncuestaModal";
import CargarRespuestaModal from "./CargarRespuestaModal";

const CONTEXTOS: Record<string, string> = {
  "post-venta": "Post-Venta",
  "post-visita": "Post-Visita",
  "post-entrega": "Post-Entrega",
  "post-cotizacion": "Post-Cotización"
};

export default function NpsClient({
  esAdminORecepcion,
  respuestasIniciales,
  configuracion,
  vendedores,
  clientes,
  miId
}: {
  esAdminORecepcion: boolean;
  respuestasIniciales: any[];
  configuracion: any;
  vendedores: any[];
  clientes: any[];
  miId: string;
}) {
  const [modalEnviar, setModalEnviar] = useState(false);
  const [modalCargar, setModalCargar] = useState(false);
  const [filtroTiempo, setFiltroTiempo] = useState<"mes" | "año" | "historico">("historico");

  // Filtrar respuestas por tiempo
  const ahora = new Date();
  const respuestasFiltradas = respuestasIniciales.filter((r) => {
    if (filtroTiempo === "historico") return true;
    const fecha = new Date(r.created_at);
    if (filtroTiempo === "mes") return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    if (filtroTiempo === "año") return fecha.getFullYear() === ahora.getFullYear();
    return true;
  });

  // Cálculos NPS
  const total = respuestasFiltradas.length;
  const promotores = respuestasFiltradas.filter(r => r.puntaje >= 9).length;
  const pasivos = respuestasFiltradas.filter(r => r.puntaje >= 7 && r.puntaje <= 8).length;
  const detractores = respuestasFiltradas.filter(r => r.puntaje <= 6).length;

  const pctPromotores = total > 0 ? (promotores / total) * 100 : 0;
  const pctDetractores = total > 0 ? (detractores / total) * 100 : 0;
  const npsScore = Math.round(pctPromotores - pctDetractores);
  
  const promedio = total > 0 ? (respuestasFiltradas.reduce((acc, r) => acc + r.puntaje, 0) / total).toFixed(1) : "0.0";

  // Gráfico: Agrupar por puntaje (0 a 10)
  const chartData = Array.from({ length: 11 }, (_, i) => ({
    puntaje: i.toString(),
    cantidad: respuestasFiltradas.filter(r => r.puntaje === i).length,
    color: i >= 9 ? "#10b981" : i >= 7 ? "#f59e0b" : "#f43f5e"
  }));

  // Ranking Vendedores
  const ranking = vendedores.map(v => {
    const respuestasVend = respuestasFiltradas.filter(r => r.vendedor_id === v.id);
    const tot = respuestasVend.length;
    const prom = respuestasVend.filter(r => r.puntaje >= 9).length;
    const det = respuestasVend.filter(r => r.puntaje <= 6).length;
    const nps = tot > 0 ? Math.round(((prom / tot) * 100) - ((det / tot) * 100)) : 0;
    const avg = tot > 0 ? (respuestasVend.reduce((acc, r) => acc + r.puntaje, 0) / tot).toFixed(1) : "0.0";
    return { ...v, total: tot, nps, avg };
  }).filter(v => v.total > 0).sort((a, b) => b.nps - a.nps);

  return (
    <div className="animate-fadeIn space-y-6 max-w-[1200px] mx-auto p-4 md:p-6">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#111] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
            <Smile className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">NPS & Satisfacción</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Net Promoter Score y métricas de calidad</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-lg mr-2 border border-slate-200 dark:border-white/5">
            {["mes", "año", "historico"].map((f) => (
              <button key={f} onClick={() => setFiltroTiempo(f as any)} className={`px-3 py-1.5 text-[11px] font-bold rounded-md capitalize transition-colors ${filtroTiempo === f ? "bg-white dark:bg-[#222] text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                {f}
              </button>
            ))}
          </div>

          {esAdminORecepcion && (
            <button onClick={() => setModalEnviar(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-sm px-4 py-2 rounded-xl transition-colors shadow-sm">
              <Send className="w-4 h-4" /> Enviar por WhatsApp
            </button>
          )}
          <button onClick={() => setModalCargar(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Cargar Respuesta
          </button>
        </div>
      </header>

      {/* DASHBOARD NUMÉRICO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">NPS Score</span>
          <div className="flex items-end gap-2 mt-1">
            <span className={`text-4xl font-black font-mono ${npsScore > 50 ? "text-emerald-600 dark:text-emerald-400" : npsScore > 0 ? "text-amber-500" : "text-rose-600 dark:text-rose-400"}`}>
              {npsScore}
            </span>
            <span className="text-xs text-slate-400 mb-1.5">/ 100</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Promotores (9-10)</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{promotores}</span>
            <span className="text-sm font-bold text-emerald-600/50 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">{pctPromotores.toFixed(0)}%</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Pasivos (7-8)</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-amber-700 dark:text-amber-400">{pasivos}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Detractores (0-6)</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-rose-700 dark:text-rose-400">{detractores}</span>
            <span className="text-sm font-bold text-rose-600/50 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md">{pctDetractores.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Distribución de Puntajes
            </h3>
            <span className="text-sm font-bold bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300">
              Promedio: {promedio} <Star className="w-3 h-3 inline text-amber-500 mb-0.5" />
            </span>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="puntaje" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} allowDecimals={false} />
                <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", backgroundColor: "#1e293b", color: "#fff" }} />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RANKING VENDEDORES */}
        {esAdminORecepcion && (
          <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Ranking Vendedores</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {ranking.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">No hay respuestas suficientes.</p>
              ) : (
                ranking.map((v, i) => (
                  <div key={v.id} className="flex items-center justify-between p-3 border-b border-slate-50 dark:border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-700" : i === 2 ? "bg-orange-100 text-orange-800" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"}`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-800 dark:text-white leading-none">{v.nombre}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{v.total} encuestas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-[14px] font-bold ${v.nps > 50 ? "text-emerald-600 dark:text-emerald-400" : v.nps > 0 ? "text-amber-500" : "text-rose-600 dark:text-rose-400"}`}>{v.nps}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">NPS</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* HISTORIAL DE RESPUESTAS */}
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Últimas Respuestas
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="p-4 pl-6 whitespace-nowrap">Fecha</th>
                <th className="p-4 whitespace-nowrap">Cliente</th>
                <th className="p-4 whitespace-nowrap">Contexto</th>
                <th className="p-4 whitespace-nowrap">Comentario</th>
                <th className="p-4 pr-6 text-right whitespace-nowrap">Puntaje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {respuestasFiltradas.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 text-sm">Sin respuestas en este período.</td></tr>
              ) : (
                respuestasFiltradas.slice(0, 50).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="p-4 pl-6 text-[12px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("es-AR")}
                    </td>
                    <td className="p-4">
                      <p className="text-[13px] font-bold text-slate-800 dark:text-white">{r.clientes?.nombre || "Anónimo"}</p>
                      {esAdminORecepcion && r.perfiles?.nombre && <p className="text-[10px] text-slate-400 mt-0.5">Vend: {r.perfiles.nombre}</p>}
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300">
                        {CONTEXTOS[r.contexto] || r.contexto}
                      </span>
                    </td>
                    <td className="p-4 text-[12px] text-slate-600 dark:text-slate-300 max-w-sm truncate">
                      {r.comentario ? `"${r.comentario}"` : <span className="text-slate-400 italic">Sin comentario</span>}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-[13px] text-white shadow-sm ${r.puntaje >= 9 ? "bg-emerald-500" : r.puntaje >= 7 ? "bg-amber-500" : "bg-rose-500"}`}>
                        {r.puntaje}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalEnviar && <EnviarEncuestaModal clientes={clientes} configuracion={configuracion} miId={miId} onClose={() => setModalEnviar(false)} />}
      {modalCargar && <CargarRespuestaModal clientes={clientes} vendedores={vendedores} esAdminORecepcion={esAdminORecepcion} miId={miId} onClose={() => { setModalCargar(false); window.location.reload(); }} />}
    </div>
  );
}