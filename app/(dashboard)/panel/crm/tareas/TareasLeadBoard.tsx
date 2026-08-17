"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, UserPlus, CheckSquare, Phone } from "lucide-react";

export default function TareasLeadBoard({
  tareasIniciales, leadsSinContacto, vendedores,
}: {
  tareasIniciales: any[]; leadsSinContacto: any[]; vendedores: any[];
}) {
  const [vendedorFiltro, setVendedorFiltro] = useState("");

  const tareas = useMemo(() => {
    if (!vendedorFiltro) return tareasIniciales;
    return tareasIniciales.filter((t) => t.cotizaciones?.vendedor_id === vendedorFiltro);
  }, [tareasIniciales, vendedorFiltro]);

  const sinContacto = useMemo(() => {
    if (!vendedorFiltro) return leadsSinContacto;
    return leadsSinContacto.filter((l) => l.vendedor_id === vendedorFiltro);
  }, [leadsSinContacto, vendedorFiltro]);

  const { vencidas, hoy } = useMemo(() => {
    const ahora = new Date();
    const finHoy = new Date(ahora); finHoy.setHours(23, 59, 59, 999);
    const inicioHoy = new Date(ahora); inicioHoy.setHours(0, 0, 0, 0);
    return {
      vencidas: tareas.filter((t) => new Date(t.fecha_vencimiento) < inicioHoy),
      hoy: tareas.filter((t) => { const f = new Date(t.fecha_vencimiento); return f >= inicioHoy && f <= finHoy; }),
    };
  }, [tareas]);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Tareas de Leads</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Seguimiento comercial de todos los leads, con acceso directo</p>
          </div>
        </div>
        <select
          value={vendedorFiltro}
          onChange={(e) => setVendedorFiltro(e.target.value)}
          className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-200"
        >
          <option value="">Todos los vendedores</option>
          {vendedores.map((v: any) => (<option key={v.id} value={v.id}>{v.nombre}</option>))}
        </select>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-[1400px] mx-auto">
          <Columna titulo="Tareas vencidas" color="rose" icono={<AlertTriangle className="w-4 h-4 text-white" />} items={vencidas} render={(t) => <TareaCard tarea={t} color="rose" />} />
          <Columna titulo="Tareas del día" color="amber" icono={<Clock className="w-4 h-4 text-white" />} items={hoy} render={(t) => <TareaCard tarea={t} color="amber" />} />
          <Columna titulo="Sin primer contacto" color="sky" icono={<UserPlus className="w-4 h-4 text-white" />} items={sinContacto} render={(l) => <LeadSinContactoCard lead={l} />} />
        </div>
      </div>
    </div>
  );
}

const COLOR_HEADER: Record<string, string> = {
  rose: "bg-rose-500", amber: "bg-amber-500", sky: "bg-sky-500",
};

function Columna({ titulo, icono, items, render, color }: { titulo: string; icono: React.ReactNode; items: any[]; render: (item: any) => React.ReactNode; color: string }) {
  return (
    <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl overflow-hidden shadow-sm">
      <div className={`px-4 py-3 flex items-center justify-between ${COLOR_HEADER[color]}`}>
        <h2 className="text-[12px] font-bold text-white flex items-center gap-2">{icono} {titulo}</h2>
        <span className="text-[11px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="p-3 space-y-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
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
      <p className="text-[12px] text-slate-600 dark:text-slate-300">{lead?.nombre}</p>
      <span className="text-[10px] text-slate-400 dark:text-slate-500">
        {new Date(tarea.fecha_vencimiento).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
      </span>
    </Link>
  );
}

function LeadSinContactoCard({ lead }: { lead: any }) {
  return (
    <Link href={`/panel/crm/${lead.id}`} className="block bg-slate-50 dark:bg-[#00246b] hover:bg-white dark:hover:bg-[#002a6e] hover:shadow-sm border border-slate-200 dark:border-[#0a2a6b] border-l-4 border-l-sky-400 rounded-xl p-3 transition-all">
      <p className="text-[12px] font-bold text-slate-800 dark:text-white">{lead.nombre}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.telefono || "Sin teléfono"}</p>
      <span className="text-[10px] text-slate-400 dark:text-slate-500">
        Ingresó: {new Date(lead.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
      </span>
    </Link>
  );
}
