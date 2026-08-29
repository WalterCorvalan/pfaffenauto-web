"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Filter, Search, Bot, MessageCircle } from "lucide-react";

interface Perfil { id: string; nombre: string; roles: string[] }

const ESTADOS: { value: string; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "asignado", label: "Asignados" },
  { value: "calificando", label: "Calificando" },
  { value: "nuevo", label: "Nuevos" },
  { value: "convertido", label: "Convertidos" },
  { value: "perdido", label: "Perdidos" },
];

const ESTADO_COLOR: Record<string, string> = {
  nuevo: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  asignado: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  calificando: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  convertido: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  perdido: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

const CALIFICACION_DOT: Record<string, string> = { caliente: "bg-rose-500", tibio: "bg-amber-500", frio: "bg-slate-300" };

export default function LeadsTab({ conversacionesIniciales, vendedores }: { conversacionesIniciales: any[]; vendedores: Perfil[] }) {
  const [conversaciones, setConversaciones] = useState(conversacionesIniciales);
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    let l = conversaciones;
    if (filtro !== "todos") l = l.filter((c) => c.estado_lead === filtro);
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

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        {ESTADOS.map((e) => (
          <button key={e.value} onClick={() => setFiltro(e.value)} className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${filtro === e.value ? "bg-rose-600 text-white" : "bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"}`}>
            {e.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, teléfono, vehículo, último mensaje..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none" />
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 flex flex-col items-center justify-center text-center">
          <Bot className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Sin leads de WhatsApp{filtro !== "todos" ? "" : " todavía"}.</p>
          {filtro === "todos" && (
            <p className="text-xs text-slate-400 mt-1 max-w-sm">Cuando llegue un mensaje nuevo por WhatsApp, se va a atender y va a aparecer acá. El round-robin asigna inicialmente al vendedor; desde acá podés reasignar.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtrados.map((c) => (
            <div key={c.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${CALIFICACION_DOT[c.calificacion] || "bg-slate-300"}`} />
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.whatsapp_contactos?.nombre_perfil || c.whatsapp_contactos?.telefono || "Sin nombre"}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${ESTADO_COLOR[c.estado_lead] || ESTADO_COLOR.nuevo}`}>{c.estado_lead || "nuevo"}</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">{c.whatsapp_contactos?.telefono}</p>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select value={c.vendedor_id || ""} onChange={(e) => reasignar(c.id, e.target.value)} className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none">
                  <option value="">Sin asignar</option>
                  {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-400 mt-5 flex items-center gap-1.5">
        Los leads se crean automáticamente al recibir cada mensaje en WhatsApp. El round-robin asigna inicialmente al vendedor según el agente; desde acá podés reasignar manualmente.
      </p>
    </div>
  );
}
