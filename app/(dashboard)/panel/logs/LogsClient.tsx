"use client";

import { useMemo, useState } from "react";
import { History, Car, User, Filter, ArrowRight } from "lucide-react";

interface Cambio {
  id: string;
  tabla: string;
  registro_id: string | null;
  campo_modificado: string | null;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  usuario_id: string | null;
  created_at: string;
  perfiles: { nombre: string } | null;
  vehiculo: { marca: string; modelo: string; patente: string | null } | null;
}

const TABLA_LABEL: Record<string, string> = {
  vehiculos: "Vehículo",
  boletos_venta: "Venta",
  senas: "Seña",
  presupuestos: "Presupuesto",
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
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <History className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
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
            className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] text-[12px] font-bold text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
          >
            <option value="todos" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Todas las tablas</option>
            {tablas.map((t) => (<option key={t} value={t} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{TABLA_LABEL[t] || t}</option>))}
          </select>
          <select
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
            className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] text-[12px] font-bold text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
          >
            <option value="todos" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Todos los usuarios</option>
            {usuarios.map(([id, nombre]) => (<option key={id} value={id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{nombre}</option>))}
          </select>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1200px] mx-auto">
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
              {filtrados.map((c) => (
                <div key={c.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-[#00246b] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-[#002a6e] flex items-center justify-center shrink-0 mt-0.5">
                    {c.tabla === "vehiculos" ? <Car className="w-4 h-4 text-indigo-600 dark:text-sky-300" /> : <User className="w-4 h-4 text-indigo-600 dark:text-sky-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white">
                      {c.perfiles?.nombre || "Sistema"}
                      <span className="font-normal text-slate-500 dark:text-slate-400"> modificó </span>
                      {c.campo_modificado || "un registro"}
                      {c.vehiculo && (
                        <span className="font-normal text-slate-500 dark:text-slate-400"> en {c.vehiculo.marca} {c.vehiculo.modelo} {c.vehiculo.patente ? `(${c.vehiculo.patente})` : ""}</span>
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
                      {new Date(c.created_at).toLocaleString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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
