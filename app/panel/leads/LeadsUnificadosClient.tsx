"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, Radar, MessageCircle, AtSign, Bot, User, Plus, Radio, Building2, ChevronDown, Flame, Trash2, Megaphone } from "lucide-react";
import LeadDetailModal, { CANALES_ORIGEN } from "@/components/panel/conversaciones/LeadDetailModal";
import NuevoLeadManualModal from "./NuevoLeadManualModal";

interface Perfil { id: string; nombre: string; roles: string[] }
interface Sucursal { id: string; nombre: string }
type Origen = "whatsapp" | "instagram" | "rodi" | "manual";
interface LeadNormalizado {
  id: string; origen: Origen; nombre: string; telefono: string | null; vendedor_id: string | null;
  calificacion: string | null; estado_lead: string; canal_origen: string | null; sucursal_id: string | null;
  created_at: string; last_message_at: string | null; esBasura: boolean; ultimaDireccion: "in" | "out" | null;
}

// Un lead caliente que el CLIENTE dejó esperando respuesta 2+ días necesita
// seguimiento urgente -- mismo umbral usado para "lead basura" abajo, para
// no manejar dos números distintos en el mismo módulo.
const DIAS_SIN_RESPUESTA = 2;

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

function diasDesde(iso: string | null) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}
function formatDia(iso: string) {
  const d = new Date(iso);
  const hoy = new Date();
  if (d.toDateString() === hoy.toDateString()) return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export default function LeadsUnificadosClient({ leadsIniciales, vendedores, sucursales, miId }: { leadsIniciales: LeadNormalizado[]; vendedores: Perfil[]; sucursales: Sucursal[]; miId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState(leadsIniciales);
  const [vista, setVista] = useState<"normal" | "sin_respuesta" | "basura">("normal");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroOrigen, setFiltroOrigen] = useState<Origen | "todos">("todos");
  const [filtroCanal, setFiltroCanal] = useState("");
  const [filtroSucursal, setFiltroSucursal] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState<{ id: string; origen: Origen } | null>(null);
  const [showNuevo, setShowNuevo] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);

  useEffect(() => {
    const leadId = searchParams.get("lead");
    const origen = searchParams.get("origen") as Origen | null;
    if (leadId && origen) setSeleccionado({ id: leadId, origen });
  }, [searchParams]);

  const cerrarDetalle = () => {
    setSeleccionado(null);
    if (searchParams.get("lead")) router.replace("/panel/leads");
  };

  // Clasificación derivada -- ninguna de las dos pestañas especiales muta el
  // estado_lead normal (nuevo/asignado/etc), son vistas calculadas sobre los
  // mismos datos. "Lead basura" sí puede venir de un flag persistido
  // (es_basura, un vendedor lo mandó a mano) además de la regla automática.
  const clasificados = useMemo(() => leads.map((l) => {
    const sinContestarDelCliente = l.origen !== "manual" && l.ultimaDireccion === "in" && diasDesde(l.last_message_at) >= DIAS_SIN_RESPUESTA
      && l.estado_lead !== "perdido" && l.estado_lead !== "convertido";
    const sinRespuesta = sinContestarDelCliente && l.calificacion === "caliente" && !l.esBasura;
    const basuraAutomatica = sinContestarDelCliente && (l.calificacion === "frio" || !l.calificacion);
    const esBasuraFinal = l.esBasura || basuraAutomatica;
    return { ...l, sinRespuesta, esBasuraFinal };
  }), [leads]);

  const totalSinRespuesta = useMemo(() => clasificados.filter((l) => l.sinRespuesta).length, [clasificados]);
  const totalBasura = useMemo(() => clasificados.filter((l) => l.esBasuraFinal).length, [clasificados]);

  const filtrados = useMemo(() => {
    let l = clasificados;
    if (vista === "sin_respuesta") l = l.filter((c) => c.sinRespuesta);
    else if (vista === "basura") l = l.filter((c) => c.esBasuraFinal);
    else {
      l = l.filter((c) => !c.esBasuraFinal);
      if (filtroEstado !== "todos") l = l.filter((c) => c.estado_lead === filtroEstado);
    }
    if (filtroOrigen !== "todos") l = l.filter((c) => c.origen === filtroOrigen);
    if (filtroCanal) l = l.filter((c) => c.canal_origen === filtroCanal);
    if (filtroSucursal) l = l.filter((c) => c.sucursal_id === filtroSucursal);
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      l = l.filter((c) => [c.nombre, c.telefono].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return l;
  }, [clasificados, vista, filtroEstado, filtroOrigen, filtroCanal, filtroSucursal, busqueda]);

  const actualizarUno = (id: string, patch: any) => setLeads((prev) => prev.map((c) => (c.id === id ? {
    ...c,
    estado_lead: patch.estado_lead ?? c.estado_lead, calificacion: patch.calificacion ?? c.calificacion,
    vendedor_id: patch.vendedor_id !== undefined ? patch.vendedor_id : c.vendedor_id,
    canal_origen: patch.canal_origen !== undefined ? patch.canal_origen : c.canal_origen,
    sucursal_id: patch.sucursal_id !== undefined ? patch.sucursal_id : c.sucursal_id,
    esBasura: patch.es_basura !== undefined ? patch.es_basura : c.esBasura,
  } : c)));

  const onCreadoManual = (lead: any) => {
    setLeads((prev) => [{ id: lead.id, origen: "manual", nombre: lead.nombre, telefono: lead.telefono, vendedor_id: lead.vendedor_id, calificacion: lead.calificacion, estado_lead: lead.estado_lead || "nuevo", canal_origen: lead.canal_origen, sucursal_id: lead.sucursal_id, created_at: lead.created_at, last_message_at: lead.created_at, esBasura: false, ultimaDireccion: null }, ...prev]);
    setShowNuevo(false);
  };

  const nuevosHoy = leads.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length;
  const sinAsignar = leads.filter((l) => !l.vendedor_id).length;

  const filaClase = (id: string) => seleccionado?.id === id
    ? "bg-rose-50 dark:bg-rose-500/10 border-l-2 border-l-rose-600 dark:border-l-rose-400"
    : "bg-white dark:bg-transparent border-l-2 border-l-transparent hover:bg-slate-50 dark:hover:bg-white/5";

  return (
    <div className="flex w-full h-full text-slate-800 dark:text-slate-200 overflow-hidden">
      {/* COLUMNA 1: BANDEJA — mismo criterio visual que app/panel/whatsapp/ChatClient.tsx
          (sidebar angosta, filas con avatar circular, sticky group headers) para que
          este módulo se sienta como una extensión natural del panel de WhatsApp. */}
      <div className={`w-full md:w-[320px] flex-col bg-white dark:bg-[#111] border-r border-slate-200 dark:border-white/10 shrink-0 ${seleccionado ? "hidden md:flex" : "flex"}`}>
        <div className="p-2.5 border-b border-slate-100 dark:border-white/10 shrink-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5"><Radar className="w-4 h-4 text-[#0145F2]" /> Leads</h1>
            <button onClick={() => setShowNuevo(true)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg shadow-sm"><Plus className="w-3.5 h-3.5" /> Nuevo</button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{leads.length} leads · {nuevosHoy} hoy · {sinAsignar} sin asignar</p>

          <div className="flex gap-1.5">
            <button onClick={() => setVista("sin_respuesta")} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${vista === "sin_respuesta" ? "bg-rose-600 text-white" : "bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"}`}>
              <Flame className="w-3.5 h-3.5" /> Sin respuesta {totalSinRespuesta > 0 && <span className={`text-[9px] font-black px-1 rounded-full ${vista === "sin_respuesta" ? "bg-white/20" : "bg-rose-500 text-white"}`}>{totalSinRespuesta}</span>}
            </button>
            <button onClick={() => setVista("basura")} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${vista === "basura" ? "bg-slate-700 dark:bg-white/20 text-white" : "bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"}`}>
              <Trash2 className="w-3.5 h-3.5" /> Basura {totalBasura > 0 && <span className={`text-[9px] font-black px-1 rounded-full ${vista === "basura" ? "bg-white/20" : "bg-slate-400 text-white"}`}>{totalBasura}</span>}
            </button>
            {vista !== "normal" && <button onClick={() => setVista("normal")} className="shrink-0 px-2 py-1.5 text-[11px] font-bold rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500">✕</button>}
          </div>

          {vista === "normal" && (
            <div className="flex flex-wrap gap-1">
              {ESTADOS.map((e) => (
                <button key={e.value} onClick={() => setFiltroEstado(e.value)} className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${filtroEstado === e.value ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>{e.label}</button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar..." className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xs outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
            </div>
            <button onClick={() => setShowFiltros((v) => !v)} title="Más filtros" className={`shrink-0 p-1.5 rounded-lg transition-colors ${showFiltros ? "bg-slate-800 dark:bg-white/10 text-white" : "bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400"}`}>
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>

          {showFiltros && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setFiltroOrigen("todos")} className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${filtroOrigen === "todos" ? "bg-[#0145F2] border-[#0145F2] text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"}`}>Todos</button>
                {(["whatsapp", "instagram", "rodi", "manual"] as Origen[]).map((o) => (
                  <button key={o} onClick={() => setFiltroOrigen(o)} className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${filtroOrigen === o ? "bg-[#0145F2] border-[#0145F2] text-white" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"}`}>{ORIGEN_LABEL[o]}</button>
                ))}
              </div>
              <div className="relative">
                <Radio className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select value={filtroCanal} onChange={(e) => setFiltroCanal(e.target.value)} className="w-full appearance-none bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-7 pr-6 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 outline-none">
                  <option value="">Todos los canales</option>
                  {CANALES_ORIGEN.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <div className="relative">
                <Building2 className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value)} className="w-full appearance-none bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-7 pr-6 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 outline-none">
                  <option value="">Todas las sucursales</option>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4">
              {vista === "basura" ? <Trash2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" /> : <Radar className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />}
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Sin leads acá</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {vista === "sin_respuesta" ? "Ningún caliente esperando respuesta." : vista === "basura" ? "Nada mandado a basura." : "Sin resultados con estos filtros."}
              </p>
            </div>
          ) : (
            filtrados.map((c) => {
              const Icon = ORIGEN_ICON[c.origen];
              const vendedor = vendedores.find((v) => v.id === c.vendedor_id);
              const iniciales = (c.nombre || "?").substring(0, 2).toUpperCase();
              return (
                <button key={`${c.origen}-${c.id}`} onClick={() => setSeleccionado({ id: c.id, origen: c.origen })} className={`w-full text-left p-3 border-b border-slate-100 dark:border-white/5 transition-all flex gap-2.5 ${filaClase(c.id)}`}>
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-xs">{iniciales}</div>
                    <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#111] ${CALIFICACION_DOT[c.calificacion || ""] || "bg-slate-300"}`} title={c.calificacion || "Sin calificar"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-bold text-[13px] truncate flex items-center gap-1 text-slate-900 dark:text-white">
                        <Icon className={`w-3 h-3 shrink-0 ${ORIGEN_COLOR[c.origen]}`} /> {c.nombre}
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{c.last_message_at ? formatDia(c.last_message_at) : ""}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1.5 mt-0.5">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{vendedor?.nombre || "Sin asignar"}</p>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${ESTADO_COLOR[c.estado_lead] || ESTADO_COLOR.nuevo}`}>{ESTADO_LABEL[c.estado_lead] || "Nuevo"}</span>
                    </div>
                    {c.sinRespuesta && vista !== "sin_respuesta" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded-full mt-1"><Flame className="w-3 h-3" /> Sin responder</span>
                    )}
                    {c.esBasuraFinal && vista !== "basura" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-full mt-1"><Trash2 className="w-3 h-3" /> Basura</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* COLUMNA 2: DETALLE */}
      <div className={`flex-1 flex-col bg-[#f8fafc] dark:bg-[#0a0a0f] ${!seleccionado ? "hidden md:flex" : "flex"}`}>
        {!seleccionado ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2">
            <Megaphone className="w-8 h-8" />
            <p className="text-sm font-medium">Elegí un lead para ver el detalle</p>
          </div>
        ) : (
          <LeadDetailModal
            leadId={seleccionado.id} origen={seleccionado.origen} miId={miId} vendedores={vendedores} sucursales={sucursales}
            onClose={cerrarDetalle} onActualizado={actualizarUno} inline
          />
        )}
      </div>

      {showNuevo && (
        <NuevoLeadManualModal vendedores={vendedores} sucursales={sucursales} miId={miId} onClose={() => setShowNuevo(false)} onCreado={onCreadoManual} />
      )}
    </div>
  );
}
