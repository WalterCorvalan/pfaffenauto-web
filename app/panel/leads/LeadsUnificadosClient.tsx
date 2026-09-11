"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, Radar, MessageCircle, AtSign, Bot, User, Plus, Radio, Building2, ChevronDown } from "lucide-react";
import LeadDetailModal, { CANALES_ORIGEN } from "../whatsapp/LeadDetailModal";
import NuevoLeadManualModal from "./NuevoLeadManualModal";

interface Perfil { id: string; nombre: string; roles: string[] }
interface Sucursal { id: string; nombre: string }
type Origen = "whatsapp" | "instagram" | "rodi" | "manual";
interface LeadNormalizado {
  id: string; origen: Origen; nombre: string; telefono: string | null; vendedor_id: string | null;
  calificacion: string | null; estado_lead: string; canal_origen: string | null; sucursal_id: string | null;
  created_at: string; last_message_at: string | null;
}

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
const CALIFICACION_DOT: Record<string, string> = { caliente: "bg-rose-500", tibio: "bg-amber-500", frio: "bg-slate-300" };

const ORIGEN_ICON: Record<Origen, any> = { whatsapp: MessageCircle, instagram: AtSign, rodi: Bot, manual: User };
const ORIGEN_LABEL: Record<Origen, string> = { whatsapp: "WhatsApp", instagram: "Instagram", rodi: "Rodi", manual: "Manual" };
const ORIGEN_COLOR: Record<Origen, string> = {
  whatsapp: "text-emerald-600 dark:text-emerald-400", instagram: "text-pink-600 dark:text-pink-400",
  rodi: "text-indigo-600 dark:text-indigo-400", manual: "text-slate-500 dark:text-slate-400",
};

export default function LeadsUnificadosClient({ leadsIniciales, vendedores, sucursales, miId }: { leadsIniciales: LeadNormalizado[]; vendedores: Perfil[]; sucursales: Sucursal[]; miId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState(leadsIniciales);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroOrigen, setFiltroOrigen] = useState<Origen | "todos">("todos");
  const [filtroCanal, setFiltroCanal] = useState("");
  const [filtroSucursal, setFiltroSucursal] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState<{ id: string; origen: Origen } | null>(null);
  const [showNuevo, setShowNuevo] = useState(false);

  useEffect(() => {
    const leadId = searchParams.get("lead");
    const origen = searchParams.get("origen") as Origen | null;
    if (leadId && origen) setDetalle({ id: leadId, origen });
  }, [searchParams]);

  const cerrarDetalle = () => {
    setDetalle(null);
    if (searchParams.get("lead")) router.replace("/panel/leads");
  };

  const filtrados = useMemo(() => {
    let l = leads;
    if (filtroEstado !== "todos") l = l.filter((c) => c.estado_lead === filtroEstado);
    if (filtroOrigen !== "todos") l = l.filter((c) => c.origen === filtroOrigen);
    if (filtroCanal) l = l.filter((c) => c.canal_origen === filtroCanal);
    if (filtroSucursal) l = l.filter((c) => c.sucursal_id === filtroSucursal);
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      l = l.filter((c) => [c.nombre, c.telefono].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return l;
  }, [leads, filtroEstado, filtroOrigen, filtroCanal, filtroSucursal, busqueda]);

  const actualizarUno = (id: string, patch: any) => setLeads((prev) => prev.map((c) => (c.id === id ? { ...c, estado_lead: patch.estado_lead ?? c.estado_lead, calificacion: patch.calificacion ?? c.calificacion, vendedor_id: patch.vendedor_id !== undefined ? patch.vendedor_id : c.vendedor_id, canal_origen: patch.canal_origen !== undefined ? patch.canal_origen : c.canal_origen, sucursal_id: patch.sucursal_id !== undefined ? patch.sucursal_id : c.sucursal_id } : c)));

  const onCreadoManual = (lead: any) => {
    setLeads((prev) => [{ id: lead.id, origen: "manual", nombre: lead.nombre, telefono: lead.telefono, vendedor_id: lead.vendedor_id, calificacion: lead.calificacion, estado_lead: lead.estado_lead || "nuevo", canal_origen: lead.canal_origen, sucursal_id: lead.sucursal_id, created_at: lead.created_at, last_message_at: lead.created_at }, ...prev]);
    setShowNuevo(false);
  };

  const nuevosHoy = leads.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length;
  const sinAsignar = leads.filter((l) => !l.vendedor_id).length;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Radar className="w-5 h-5 text-rose-600" /> Leads</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{leads.length} leads · {nuevosHoy} nuevos hoy · {sinAsignar} sin asignar</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowNuevo(true)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"><Plus className="w-3.5 h-3.5" /> Nuevo lead</button>
            </div>
          </div>

          {/* TABS DE ESTADO */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {ESTADOS.map((e) => (
              <button key={e.value} onClick={() => setFiltroEstado(e.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filtroEstado === e.value ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>{e.label}</button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1"><Filter className="w-3 h-3" /> Origen:</span>
              <button onClick={() => setFiltroOrigen("todos")} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${filtroOrigen === "todos" ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"}`}>Todos</button>
              {(["whatsapp", "instagram", "rodi", "manual"] as Origen[]).map((o) => (
                <button key={o} onClick={() => setFiltroOrigen(o)} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${filtroOrigen === o ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"}`}>{ORIGEN_LABEL[o]}</button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="relative">
                <Radio className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select value={filtroCanal} onChange={(e) => setFiltroCanal(e.target.value)} className="appearance-none bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-7 pr-6 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 outline-none">
                  <option value="">Todos los canales</option>
                  {CANALES_ORIGEN.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <div className="relative">
                <Building2 className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value)} className="appearance-none bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-7 pr-6 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 outline-none">
                  <option value="">Todas las sucursales</option>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre o teléfono..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
          </div>

          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
              <Radar className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Sin resultados</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sin leads {filtroEstado !== "todos" || filtroOrigen !== "todos" ? "con estos filtros" : "todavía"}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtrados.map((c) => {
                const Icon = ORIGEN_ICON[c.origen];
                const vendedor = vendedores.find((v) => v.id === c.vendedor_id);
                return (
                  <div key={`${c.origen}-${c.id}`} onClick={() => setDetalle({ id: c.id, origen: c.origen })} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 cursor-pointer hover:border-rose-300 dark:hover:border-rose-500/40 transition-colors">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${CALIFICACION_DOT[c.calificacion || ""] || "bg-slate-300"}`} />
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.nombre}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${ESTADO_COLOR[c.estado_lead] || ESTADO_COLOR.nuevo}`}>{ESTADO_LABEL[c.estado_lead] || "Nuevo"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5"><Icon className={`w-3.5 h-3.5 shrink-0 ${ORIGEN_COLOR[c.origen]}`} /> {ORIGEN_LABEL[c.origen]}{c.telefono ? ` · ${c.telefono}` : ""}</p>
                    {c.canal_origen && <p className="text-[11px] text-slate-400">Canal: {c.canal_origen}</p>}
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{vendedor?.nombre || "Sin asignar"}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {detalle && (
        <LeadDetailModal leadId={detalle.id} origen={detalle.origen} miId={miId} vendedores={vendedores} sucursales={sucursales} onClose={cerrarDetalle} onActualizado={actualizarUno} />
      )}
      {showNuevo && (
        <NuevoLeadManualModal vendedores={vendedores} sucursales={sucursales} miId={miId} onClose={() => setShowNuevo(false)} onCreado={onCreadoManual} />
      )}
    </div>
  );
}
