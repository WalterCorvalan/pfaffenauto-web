"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CarFront, User, ArrowRight, CalendarClock } from "lucide-react";
import { ESTADOS_TRAMITE } from "@/lib/tramites";

interface Tramite {
  id: string;
  tipo_tramite: string;
  estado: string;
  fecha_ingreso: string;
  fecha_estimada_fin: string | null;
  proxima_tarea: string | null;
  proxima_fecha: string | null;
  modalidad: string;
  realizado_por: string | null;
  vehiculos: { marca: string; modelo: string; patente: string | null } | { marca: string; modelo: string; patente: string | null }[] | null;
  boletos_venta: { nombre: string; apellido: string; numero: number | null } | { nombre: string; apellido: string; numero: number | null }[] | null;
  perfiles: { nombre: string } | { nombre: string }[] | null;
}

function uno<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] || null : v;
}

const ESTADO_COLOR: Record<string, string> = {
  "Nuevo": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-[#002a6e] dark:text-sky-300 dark:border-[#0a2a6b]",
  "Pendiente de documentación": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-[#002a6e] dark:text-amber-300 dark:border-[#0a2a6b]",
  "Listo para iniciar": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-[#002a6e] dark:text-amber-300 dark:border-[#0a2a6b]",
  "Iniciado": "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-[#002a6e] dark:text-indigo-300 dark:border-[#0a2a6b]",
  "En curso": "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-[#002a6e] dark:text-indigo-300 dark:border-[#0a2a6b]",
  "Esperando pago o respuesta": "bg-orange-50 text-orange-700 border-orange-200 dark:bg-[#002a6e] dark:text-orange-300 dark:border-[#0a2a6b]",
  "Finalizado": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#002a6e] dark:text-emerald-300 dark:border-[#0a2a6b]",
  "Listo para retirar": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#002a6e] dark:text-emerald-300 dark:border-[#0a2a6b]",
  "Entregado": "bg-slate-100 text-slate-500 border-slate-200 dark:bg-[#00246b] dark:text-slate-400 dark:border-[#0a2a6b]",
};

type Filtro = "activos" | "todos" | string;

export default function TramitesClient({ tramitesIniciales }: { tramitesIniciales: Tramite[]; responsables: { id: string; nombre: string | null }[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("activos");

  const conteos = useMemo(() => {
    const c: Record<string, number> = {};
    tramitesIniciales.forEach((t) => { c[t.estado] = (c[t.estado] || 0) + 1; });
    return c;
  }, [tramitesIniciales]);

  const activos = tramitesIniciales.filter((t) => t.estado !== "Entregado").length;

  const filtrados = useMemo(() => {
    let lista = tramitesIniciales;
    if (filtro === "activos") lista = lista.filter((t) => t.estado !== "Entregado");
    else if (filtro !== "todos") lista = lista.filter((t) => t.estado === filtro);

    if (!query.trim()) return lista;
    const q = query.trim().toLowerCase();
    return lista.filter((t) => {
      const v = uno(t.vehiculos);
      const b = uno(t.boletos_venta);
      const texto = `${v?.marca || ""} ${v?.modelo || ""} ${v?.patente || ""} ${b?.nombre || ""} ${b?.apellido || ""}`.toLowerCase();
      return texto.includes(q);
    });
  }, [tramitesIniciales, query, filtro]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#001c55] shrink-0 flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar patente, marca o cliente..."
            className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setFiltro("activos")}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border whitespace-nowrap transition-colors ${filtro === "activos" ? "bg-[#0145F2] border-[#0145F2] text-white" : "bg-white dark:bg-[#00246b] border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400 hover:bg-slate-50"}`}
          >
            Activos <span className={`ml-1 px-1.5 py-0.5 rounded-md ${filtro === "activos" ? "bg-white/20" : "bg-slate-100 dark:bg-[#002a6e]"}`}>{activos}</span>
          </button>
          <button
            onClick={() => setFiltro("todos")}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border whitespace-nowrap transition-colors ${filtro === "todos" ? "bg-[#0145F2] border-[#0145F2] text-white" : "bg-white dark:bg-[#00246b] border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400 hover:bg-slate-50"}`}
          >
            Todos <span className={`ml-1 px-1.5 py-0.5 rounded-md ${filtro === "todos" ? "bg-white/20" : "bg-slate-100 dark:bg-[#002a6e]"}`}>{tramitesIniciales.length}</span>
          </button>
          {ESTADOS_TRAMITE.map((e) => conteos[e] ? (
            <button
              key={e}
              onClick={() => setFiltro(e)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border whitespace-nowrap transition-colors ${filtro === e ? "bg-[#0145F2] border-[#0145F2] text-white" : "bg-white dark:bg-[#00246b] border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400 hover:bg-slate-50"}`}
            >
              {e} <span className={`ml-1 px-1.5 py-0.5 rounded-md ${filtro === e ? "bg-white/20" : "bg-slate-100 dark:bg-[#002a6e]"}`}>{conteos[e]}</span>
            </button>
          ) : null)}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-3">
          {filtrados.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-[#0a2a6b] rounded-2xl bg-white dark:bg-[#001c55]">
              <Search className="w-10 h-10 text-slate-300 mb-3" />
              <h3 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Sin trámites en esta vista</h3>
              <p className="text-slate-500 text-xs mt-1">Cambiá el filtro o esperá nuevas ventas.</p>
            </div>
          )}
          {filtrados.map((t) => {
            const v = uno(t.vehiculos);
            const b = uno(t.boletos_venta);
            const resp = uno(t.perfiles);
            return (
              <button
                key={t.id}
                onClick={() => router.push(`/panel/ventas/gestoria/tramites/${t.id}`)}
                className="w-full text-left flex items-center justify-between gap-4 bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-4 shadow-sm hover:border-indigo-300 dark:hover:border-sky-400/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
                    <CarFront className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm bg-slate-100 dark:bg-[#00246b] text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-md tracking-widest">{v?.patente || "S/P"}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.tipo_tramite}</span>
                      {b?.numero && <span className="text-xs text-slate-400 dark:text-slate-500">Venta N° {b.numero}</span>}
                    </div>
                    <p className="text-[14px] font-bold text-slate-900 dark:text-white mt-1 truncate">{v?.marca} {v?.modelo}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {b && (
                        <span className="text-[12px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3" /> {b.nombre} {b.apellido}
                        </span>
                      )}
                      {resp && (
                        <span className="text-[12px] text-indigo-500 dark:text-sky-400 flex items-center gap-1">Resp: {resp.nombre}</span>
                      )}
                      {t.proxima_tarea && (
                        <span className="text-[12px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" /> {t.proxima_tarea}{t.proxima_fecha ? ` — ${t.proxima_fecha}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${ESTADO_COLOR[t.estado] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {t.estado}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
