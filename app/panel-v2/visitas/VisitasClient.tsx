"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { CalendarCheck, CarFront, MapPin, Clock, User, CheckCircle2, XCircle, CalendarClock, MessageSquareText, Users, Loader2 } from "lucide-react";
import { fmtFechaLocal, hoyLocalISO } from "@/lib/panelV2/fechas";

interface Perfil { id: string; nombre: string; roles: string[] }

const BADGE_ESTADO: Record<string, string> = {
  Pendiente: "bg-amber-500 text-white border-amber-500",
  Confirmada: "bg-indigo-500 text-white border-indigo-500",
  "Asistió": "bg-emerald-500 text-white border-emerald-500",
  Cancelada: "bg-rose-500 text-white border-rose-500",
};
const BORDE_ESTADO: Record<string, string> = {
  Pendiente: "border-t-amber-400",
  Confirmada: "border-t-indigo-400",
  "Asistió": "border-t-emerald-400",
  Cancelada: "border-t-rose-400",
};

function EstadoSelector({ visitaId, estadoActual, onCambiado }: { visitaId: string; estadoActual: string; onCambiado: (v: any) => void }) {
  const [loading, setLoading] = useState(false);
  const cambiar = async (nuevo: string) => {
    if (nuevo === estadoActual) return;
    setLoading(true);
    const { data } = await supabase2.from("visitas").update({ estado: nuevo }).eq("id", visitaId).select().single();
    setLoading(false);
    if (data) onCambiado(data);
  };
  return (
    <div className="relative flex-1">
      <select value={estadoActual} disabled={loading} onChange={(e) => cambiar(e.target.value)}
        className={`w-full text-white text-[11px] font-bold uppercase tracking-widest rounded-lg px-2.5 py-1.5 outline-none appearance-none cursor-pointer pr-6 disabled:opacity-50 shadow-sm border ${BADGE_ESTADO[estadoActual] || "bg-slate-400 border-slate-400"}`}>
        <option value="Pendiente">Pendiente</option>
        <option value="Confirmada">Confirmada</option>
        <option value="Asistió">Asistió</option>
        <option value="Cancelada">Cancelada</option>
      </select>
      {loading && <Loader2 className="w-3 h-3 text-white animate-spin absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />}
    </div>
  );
}

function VendedorSelector({ visitaId, vendedorActualId, perfiles, onCambiado }: { visitaId: string; vendedorActualId: string | null; perfiles: Perfil[]; onCambiado: (v: any) => void }) {
  const [loading, setLoading] = useState(false);
  const cambiar = async (nuevo: string) => {
    setLoading(true);
    const { data } = await supabase2.from("visitas").update({ vendedor_id: nuevo || null }).eq("id", visitaId).select().single();
    setLoading(false);
    if (data) onCambiado(data);
  };
  return (
    <div className="relative flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
      <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
      <select defaultValue={vendedorActualId || ""} disabled={loading} onChange={(e) => cambiar(e.target.value)}
        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-700 dark:text-slate-200 rounded-md pl-1.5 pr-6 py-1 outline-none appearance-none cursor-pointer disabled:opacity-50">
        <option value="">Sin vendedor</option>
        {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
      </select>
      {loading && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />}
    </div>
  );
}

export default function VisitasClient({ visitasIniciales, perfiles }: { visitasIniciales: any[]; perfiles: Perfil[] }) {
  const [visitas, setVisitas] = useState(visitasIniciales);
  const perfilMap = useMemo(() => Object.fromEntries(perfiles.map((p) => [p.id, p.nombre])), [perfiles]);

  const actualizarUna = (v: any) => setVisitas((prev) => prev.map((x) => (x.id === v.id ? { ...x, ...v } : x)));

  const hoy = hoyLocalISO();
  const proximas = visitas.filter((v) => v.fecha_visita >= hoy && v.estado !== "Cancelada");
  const pasadas = visitas.filter((v) => v.fecha_visita < hoy || v.estado === "Cancelada");

  const total = visitas.length;
  const asistieron = visitas.filter((v) => v.estado === "Asistió").length;
  const canceladas = visitas.filter((v) => v.estado === "Cancelada").length;
  const pendientes = visitas.filter((v) => v.estado === "Pendiente" || v.estado === "Confirmada").length;

  const Tarjeta = ({ v }: { v: any }) => (
    <div className={`bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 border-t-4 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md transition-all ${BORDE_ESTADO[v.estado] || "border-t-slate-300"}`}>
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${BADGE_ESTADO[v.estado] || "bg-slate-400 text-white border-slate-400"}`}>{v.estado}</span>
        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {fmtFechaLocal(v.fecha_visita)} · {v.horario_visita}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
          {v.nombre_cliente.substring(0, 2).toUpperCase()}
        </div>
        <h3 className="font-bold text-[14px] text-slate-900 dark:text-white truncate">{v.nombre_cliente}</h3>
      </div>

      <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3 rounded-lg mb-4 flex-1 space-y-2.5">
        <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="font-medium truncate">{v.sucursal}</span>
        </div>
        <VendedorSelector visitaId={v.id} vendedorActualId={v.vendedor_id} perfiles={perfiles} onCambiado={actualizarUna} />
        <div className="flex items-center gap-2 text-[11px]">
          <CarFront className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          {v.vehiculo_marca ? (
            <span className="font-semibold text-indigo-700 dark:text-sky-300 truncate">{v.vehiculo_marca} {v.vehiculo_modelo} {v.vehiculo_patente ? `(${v.vehiculo_patente})` : ""}</span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic">Visita general (sin auto)</span>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2 mt-auto">
        <EstadoSelector visitaId={v.id} estadoActual={v.estado} onCambiado={actualizarUna} />
        <a href={`https://wa.me/${v.telefono_cliente.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
          className="bg-green-50 dark:bg-white/5 hover:bg-green-100 dark:hover:bg-white/10 text-green-600 dark:text-green-300 p-1.5 rounded-md transition-colors shrink-0" title="Contactar por WhatsApp">
          <MessageSquareText className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </a>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><CalendarCheck className="w-5 h-5 text-rose-600" /> Agenda de Citas</h1>
          <p className="text-sm text-slate-400">Visitas reservadas por clientes desde la web</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-600 dark:text-slate-300"><Users className="w-3.5 h-3.5" /> {total} Total</div>
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-700 dark:text-amber-300"><CalendarClock className="w-3.5 h-3.5" /> {pendientes} Por venir</div>
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> {asistieron} Asistieron</div>
          <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2.5 py-1 rounded-md text-[11px] font-bold text-rose-700 dark:text-rose-300"><XCircle className="w-3.5 h-3.5" /> {canceladas} Canceladas</div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Citas Próximas</h2>
          <span className="bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{proximas.length}</span>
        </div>
        {proximas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {proximas.map((v) => <Tarjeta key={v.id} v={v} />)}
          </div>
        ) : (
          <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-slate-400 text-sm">No hay citas próximas agendadas.</div>
        )}
      </div>

      {pasadas.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Historial</h2>
            <span className="bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{pasadas.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-70 hover:opacity-100 transition-opacity">
            {pasadas.map((v) => <Tarjeta key={v.id} v={v} />)}
          </div>
        </div>
      )}
    </div>
  );
}
