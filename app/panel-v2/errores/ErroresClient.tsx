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
    <div className="flex flex-col h-full w-full overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/5 px-6 py-4 bg-white dark:bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Errores del sistema</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fallas registradas — últimos {errores.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filtroOrigen}
            onChange={(e) => setFiltroOrigen(e.target.value)}
            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
          >
            <option value="todos">Todos los orígenes</option>
            {origenes.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
              <AlertTriangle className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                {errores.length === 0 ? "Sin errores registrados" : "Nada con ese origen"}
              </h3>
              {errores.length === 0 && <p className="text-xs text-slate-500 dark:text-slate-400">Buena señal.</p>}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-white/[0.02]">
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
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                            {e.origen}
                          </span>
                          <span className="text-[10px] text-slate-400">{new Date(e.created_at).toLocaleString("es-AR")}</span>
                        </div>
                        <p className="text-[13px] font-medium text-slate-800 dark:text-slate-100 truncate">{e.mensaje}</p>
                      </div>
                      {e.detalle && (expandido ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />)}
                    </button>
                    {expandido && e.detalle && (
                      <pre className="mt-3 text-[11px] bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-lg p-3 overflow-x-auto text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
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
    </div>
  );
}
