"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Filter, Search, Bot, MessageCircle, LayoutGrid, List, BarChart3 } from "lucide-react";
import LeadDetailModal from "./LeadDetailModal";

interface Perfil { id: string; nombre: string; roles: string[] }

const ESTADOS: { value: string; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "nuevo", label: "Nuevos" },
  { value: "asignado", label: "Contactados" },
  { value: "calificando", label: "Interesados" },
  { value: "convertido", label: "Clientes" },
  { value: "perdido", label: "Perdidos" },
];

const ESTADO_COLOR: Record<string, string> = {
  nuevo: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  asignado: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  calificando: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  convertido: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  perdido: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};
const ESTADO_LABEL: Record<string, string> = { nuevo: "Nuevo", asignado: "Contactado", calificando: "Interesado", convertido: "Cliente", perdido: "Perdido" };
const KANBAN_COLS = ["nuevo", "asignado", "calificando", "convertido", "perdido"];

const CALIFICACION_DOT: Record<string, string> = { caliente: "bg-rose-500", tibio: "bg-amber-500", frio: "bg-slate-300" };

function Donut({ segments, size = 88 }: { segments: { valor: number; color: string }[]; size?: number }) {
  const total = segments.reduce((a, s) => a + s.valor, 0) || 1;
  const r = 34, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg viewBox="0 0 88 88" width={size} height={size}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" className="text-slate-100 dark:text-white/10" strokeWidth="10" />
      {segments.map((s, i) => {
        const frac = s.valor / total;
        const dash = frac * c;
        const el = <circle key={i} cx="44" cy="44" r={r} fill="none" stroke={s.color} strokeWidth="10" strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-acc} transform="rotate(-90 44 44)" />;
        acc += dash;
        return el;
      })}
    </svg>
  );
}

function Bar({ label, valor, max, color }: { label: string; valor: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 shrink-0 truncate text-slate-500 dark:text-slate-400">{label}</span>
      <div className="flex-1 h-4 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} /></div>
      <span className="w-6 shrink-0 text-right font-bold">{valor}</span>
    </div>
  );
}

export default function LeadsTab({ conversacionesIniciales, vendedores, miId }: { conversacionesIniciales: any[]; vendedores: Perfil[]; miId: string }) {
  const [conversaciones, setConversaciones] = useState(conversacionesIniciales);
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState<"grid" | "kanban" | "reportes">("grid");
  const [detalle, setDetalle] = useState<{ id: string; origen: "whatsapp" | "instagram" } | null>(null);

  const filtrados = useMemo(() => {
    let l = conversaciones;
    if (filtro !== "todos") l = l.filter((c) => (c.estado_lead || "nuevo") === filtro);
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      l = l.filter((c) => [c.whatsapp_contactos?.nombre_perfil, c.whatsapp_contactos?.telefono, c.vendedor?.nombre].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return l;
  }, [conversaciones, filtro, busqueda]);

  const reasignar = async (conversacionId: string, vendedorId: string) => {
    const nuevoId = vendedorId || null;
    await supabase2.from("whatsapp_conversaciones").update({ vendedor_id: nuevoId }).eq("id", conversacionId);
    const vendedor = vendedores.find((v) => v.id === nuevoId) || null;
    setConversaciones((prev) => prev.map((c) => (c.id === conversacionId ? { ...c, vendedor_id: nuevoId, vendedor, estado_lead: nuevoId ? (c.estado_lead === "nuevo" ? "asignado" : c.estado_lead) : c.estado_lead } : c)));
  };

  const moverKanban = async (conversacionId: string, nuevoEstado: string) => {
    setConversaciones((prev) => prev.map((c) => (c.id === conversacionId ? { ...c, estado_lead: nuevoEstado } : c)));
    await supabase2.from("whatsapp_conversaciones").update({ estado_lead: nuevoEstado }).eq("id", conversacionId);
  };

  const actualizarUno = (id: string, patch: any) => setConversaciones((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const reportes = useMemo(() => {
    const total = conversaciones.length || 1;
    const porEstado = KANBAN_COLS.map((e) => conversaciones.filter((c) => (c.estado_lead || "nuevo") === e).length);
    const porCalif = ["caliente", "tibio", "frio"].map((c) => conversaciones.filter((x) => x.calificacion === c).length);
    const sinCalif = conversaciones.filter((c) => !c.calificacion).length;
    const porVendedor: Record<string, number> = {};
    conversaciones.forEach((c) => { const n = c.vendedor?.nombre || "Sin asignar"; porVendedor[n] = (porVendedor[n] || 0) + 1; });
    const maxVend = Math.max(1, ...Object.values(porVendedor));
    const ahora = Date.now();
    const antiguedad = { reciente: 0, media: 0, vieja: 0 };
    conversaciones.forEach((c) => {
      const dias = (ahora - new Date(c.created_at || c.last_message_at).getTime()) / 86400000;
      if (dias <= 7) antiguedad.reciente++; else if (dias <= 30) antiguedad.media++; else antiguedad.vieja++;
    });
    return { total, porEstado, porCalif, sinCalif, porVendedor, maxVend, antiguedad };
  }, [conversaciones]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {ESTADOS.map((e) => (
            <button key={e.value} onClick={() => setFiltro(e.value)} className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${filtro === e.value ? "bg-rose-600 text-white" : "bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"}`}>
              {e.label}
            </button>
          ))}
        </div>
        <div className="flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-0.5">
          <button onClick={() => setVista("grid")} title="Grilla" className={`p-1.5 rounded-md ${vista === "grid" ? "bg-white dark:bg-white/10 shadow-sm" : "text-slate-400"}`}><List className="w-3.5 h-3.5" /></button>
          <button onClick={() => setVista("kanban")} title="Kanban" className={`p-1.5 rounded-md ${vista === "kanban" ? "bg-white dark:bg-white/10 shadow-sm" : "text-slate-400"}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
          <button onClick={() => setVista("reportes")} title="Reportes" className={`p-1.5 rounded-md ${vista === "reportes" ? "bg-white dark:bg-white/10 shadow-sm" : "text-slate-400"}`}><BarChart3 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {vista !== "reportes" && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, teléfono, vendedor..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none" />
          </div>
        </div>
      )}

      {vista === "reportes" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4"><p className="text-2xl font-black">{reportes.total}</p><p className="text-[10px] font-bold uppercase text-slate-400">Leads activos</p></div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4"><p className="text-2xl font-black">{conversaciones.filter((c) => !c.vendedor_id).length}</p><p className="text-[10px] font-bold uppercase text-slate-400">Sin asignar</p></div>
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4"><p className="text-2xl font-black text-rose-600">{reportes.sinCalif}</p><p className="text-[10px] font-bold uppercase text-rose-500">Sin calificar</p></div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4"><p className="text-2xl font-black">{conversaciones.filter((c) => c.unread_count > 0).length}</p><p className="text-[10px] font-bold uppercase text-slate-400">Sin contactar</p></div>

          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-2 self-start">Embudo por estado</p>
            <div className="relative"><Donut segments={KANBAN_COLS.map((e, i) => ({ valor: reportes.porEstado[i], color: ["#3b82f6", "#f59e0b", "#6366f1", "#10b981", "#f43f5e"][i] }))} /><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-lg font-black">{reportes.total}</span><span className="text-[9px] text-slate-400">TOTAL</span></div></div>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-2 self-start">Temperatura</p>
            <div className="relative"><Donut segments={[{ valor: reportes.porCalif[0], color: "#f43f5e" }, { valor: reportes.porCalif[1], color: "#f59e0b" }, { valor: reportes.porCalif[2], color: "#94a3b8" }, { valor: reportes.sinCalif, color: "#e2e8f0" }]} /><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-lg font-black">{reportes.total}</span><span className="text-[9px] text-slate-400">TOTAL</span></div></div>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-2 self-start">Antigüedad</p>
            <div className="relative"><Donut segments={[{ valor: reportes.antiguedad.reciente, color: "#10b981" }, { valor: reportes.antiguedad.media, color: "#f59e0b" }, { valor: reportes.antiguedad.vieja, color: "#f43f5e" }]} /><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-lg font-black">{reportes.total}</span><span className="text-[9px] text-slate-400">TOTAL</span></div></div>
          </div>

          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 col-span-2">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-3">Rendimiento por vendedor</p>
            <div className="space-y-2">{Object.entries(reportes.porVendedor).map(([n, v]) => <Bar key={n} label={n} valor={v} max={reportes.maxVend} color="#6366f1" />)}</div>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 col-span-2">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-3">Top vehículos de interés</p>
            <div className="space-y-1.5">
              {Object.entries(conversaciones.reduce((acc: Record<string, number>, c) => { if (c.vehiculo_id) acc[c.vehiculo_id] = (acc[c.vehiculo_id] || 0) + 1; return acc; }, {})).length === 0
                ? <p className="text-xs text-slate-400 italic">Sin vehículos vinculados todavía.</p>
                : <p className="text-xs text-slate-400 italic">Ver detalle en cada lead.</p>}
            </div>
          </div>
        </div>
      )}

      {vista === "grid" && (
        filtrados.length === 0 ? (
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 flex flex-col items-center justify-center text-center">
            <Bot className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Sin leads de WhatsApp{filtro !== "todos" ? "" : " todavía"}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtrados.map((c) => (
              <div key={c.id} onClick={() => setDetalle({ id: c.id, origen: "whatsapp" })} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 cursor-pointer hover:border-rose-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${CALIFICACION_DOT[c.calificacion] || "bg-slate-300"}`} />
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.whatsapp_contactos?.nombre_perfil || c.whatsapp_contactos?.telefono || "Sin nombre"}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${ESTADO_COLOR[c.estado_lead] || ESTADO_COLOR.nuevo}`}>{ESTADO_LABEL[c.estado_lead] || "Nuevo"}</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{c.whatsapp_contactos?.telefono}</p>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <MessageCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select value={c.vendedor_id || ""} onChange={(e) => reasignar(c.id, e.target.value)} className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none">
                    <option value="">Sin asignar</option>
                    {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {vista === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {KANBAN_COLS.map((col) => {
            const leads = filtrados.filter((c) => (c.estado_lead || "nuevo") === col);
            return (
              <div key={col} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData("text/plain"); if (id) moverKanban(id, col); }}
                className="flex flex-col min-w-[260px] w-[260px] shrink-0 bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                <div className="px-3 py-2.5 flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 bg-slate-100/50 dark:bg-white/5">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">{ESTADO_LABEL[col]}</span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-white/10 px-1.5 py-0.5 rounded-full">{leads.length}</span>
                </div>
                <div className="p-2 flex flex-col gap-2 min-h-[120px] flex-1 overflow-y-auto max-h-[60vh]">
                  {leads.map((c) => (
                    <div key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)} onClick={() => setDetalle({ id: c.id, origen: "whatsapp" })}
                      className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-rose-300">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.whatsapp_contactos?.nombre_perfil || c.whatsapp_contactos?.telefono || "Sin nombre"}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{c.vendedor?.nombre || "Sin asignar"}</p>
                    </div>
                  ))}
                  {leads.length === 0 && <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-lg min-h-[60px]"><span className="text-[10px] text-slate-400 font-bold uppercase">Mover aquí</span></div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {vista !== "reportes" && (
        <p className="text-[11px] text-slate-400 mt-5">Los leads se crean automáticamente al recibir cada mensaje en WhatsApp. El round-robin asigna inicialmente al vendedor; desde acá podés reasignar manualmente.</p>
      )}

      {detalle && (
        <LeadDetailModal leadId={detalle.id} origen={detalle.origen} miId={miId} vendedores={vendedores} onClose={() => setDetalle(null)} onActualizado={actualizarUno} />
      )}
    </div>
  );
}
