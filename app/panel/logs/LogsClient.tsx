"use client";

import { useMemo, useState } from "react";
import { History, ShoppingCart, Wallet, Filter, ArrowRight } from "lucide-react";

interface Cambio {
  id: string;
  tabla: string;
  registro_id: string | null;
  campo_modificado: string | null;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  usuario_id: string | null;
  fecha_cambio: string;
  perfiles: { nombre: string } | null;
  contexto: { descripcion: string; persona: string | null } | null;
}

const TABLA_LABEL: Record<string, string> = {
  ventas: "Venta",
  senas: "Seña",
};

export default function LogsClient({ cambios }: { cambios: Cambio[] }) {
  const [filtroTabla, setFiltroTabla] = useState<string>("todos");
  const [filtroUsuario, setFiltroUsuario] = useState<string>("todos");

  const tablas = useMemo(() => [...new Set(cambios.map((c) => c.tabla))], [cambios]);
  const usuarios = useMemo(() => {
    const map = new Map<string, string>();
    cambios.forEach((c) => { if (c.usuario_id) map.set(c.usuario_id, c.perfiles?.nombre || "Desconocido"); });
    return [...map.entries()];
  }, [cambios]);

  const filtrados = cambios.filter((c) =>
    (filtroTabla === "todos" || c.tabla === filtroTabla) &&
    (filtroUsuario === "todos" || c.usuario_id === filtroUsuario)
  );

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#141414] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-white/10 px-6 py-4 bg-white dark:bg-white/[0.02] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
            <History className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Registro de Cambios</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Quién modificó qué — últimos {cambios.length} cambios</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <select
            value={filtroTabla}
            onChange={(e) => setFiltroTabla(e.target.value)}
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[12px] font-bold text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
          >
            <option value="todos">Todas las tablas</option>
            {tablas.map((t) => (<option key={t} value={t}>{TABLA_LABEL[t] || t}</option>))}
          </select>
          <select
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[12px] font-bold text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
          >
            <option value="todos">Todos los usuarios</option>
            {usuarios.map(([id, nombre]) => (<option key={id} value={id}>{nombre}</option>))}
          </select>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#141414] custom-scrollbar">
        <div className="max-w-[1200px] mx-auto">
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {filtrados.map((c) => (
                <div key={c.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    {c.tabla === "ventas" ? <ShoppingCart className="w-4 h-4 text-indigo-600 dark:text-indigo-300" /> : <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                      {c.perfiles?.nombre || "Sistema"}
                      <span className="font-normal text-slate-500 dark:text-slate-400"> modificó </span>
                      {c.campo_modificado || "un registro"}
                      {c.contexto && (
                        <span className="font-normal text-slate-500 dark:text-slate-400">
                          {" "}en {TABLA_LABEL[c.tabla] || c.tabla.toLowerCase()} {c.contexto.descripcion}
                          {c.contexto.persona ? ` (${c.contexto.persona})` : ""}
                        </span>
                      )}
                    </p>
                    {(c.valor_anterior || c.valor_nuevo) && (
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {c.valor_anterior && <span className="line-through decoration-rose-400/60">{c.valor_anterior}</span>}
                        {c.valor_anterior && c.valor_nuevo && <ArrowRight className="w-3 h-3 shrink-0" />}
                        {c.valor_nuevo && <span className="font-bold text-slate-700 dark:text-slate-200">{c.valor_nuevo}</span>}
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                      {new Date(c.fecha_cambio).toLocaleString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
              {filtrados.length === 0 && (
                <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                  Sin cambios registrados con este filtro.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
