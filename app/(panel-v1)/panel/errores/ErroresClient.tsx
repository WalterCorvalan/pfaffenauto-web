"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Filter, ChevronDown, ChevronUp } from "lucide-react";

interface LogError {
  id: string;
  origen: string;
  mensaje: string;
  detalle: Record<string, unknown> | null;
  created_at: string;
}

export default function ErroresClient({ errores }: { errores: LogError[] }) {
  const [filtroOrigen, setFiltroOrigen] = useState<string>("todos");
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  const origenes = useMemo(() => [...new Set(errores.map((e) => e.origen))].sort(), [errores]);
  const filtrados = filtroOrigen === "todos" ? errores : errores.filter((e) => e.origen === filtroOrigen);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-400/10 border border-rose-100 dark:border-rose-400/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Errores del sistema</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Fallas registradas en las rutas /api — últimos {errores.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <select
            value={filtroOrigen}
            onChange={(e) => setFiltroOrigen(e.target.value)}
            className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] text-[12px] font-bold text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
          >
            <option value="todos">Todos los orígenes</option>
            {origenes.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {filtrados.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
            {errores.length === 0 ? "Sin errores registrados. Buena señal." : "Nada con ese origen."}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#0a2a6b] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl overflow-hidden bg-white dark:bg-[#001c55]">
            {filtrados.map((e) => {
              const expandido = expandidoId === e.id;
              return (
                <div key={e.id} className="p-4">
                  <button
                    type="button"
                    onClick={() => setExpandidoId(expandido ? null : e.id)}
                    className="w-full flex items-start justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 dark:bg-[#00246b] text-slate-500 dark:text-slate-400">
                          {e.origen}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(e.created_at).toLocaleString("es-AR")}
                        </span>
                      </div>
                      <p className="text-[13px] font-medium text-slate-800 dark:text-slate-100 truncate">{e.mensaje}</p>
                    </div>
                    {e.detalle && (expandido ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />)}
                  </button>
                  {expandido && e.detalle && (
                    <pre className="mt-3 text-[11px] bg-slate-50 dark:bg-[#00113a] border border-slate-200 dark:border-[#0a2a6b] rounded-lg p-3 overflow-x-auto text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                      {JSON.stringify(e.detalle, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
