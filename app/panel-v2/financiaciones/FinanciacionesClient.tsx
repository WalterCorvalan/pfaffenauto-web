"use client";

import { useMemo, useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { CreditCard, Search, Filter, Clock, MessageSquareText } from "lucide-react";

const ESTADO_LABEL: Record<string, string> = { nuevo: "Nuevo", en_gestion: "En gestión", descartado: "Descartado" };
const ESTADO_STYLES: Record<string, string> = {
  nuevo: "bg-blue-500 text-white border-blue-500",
  en_gestion: "bg-amber-500 text-white border-amber-500",
  descartado: "bg-rose-500 text-white border-rose-500",
};

export default function FinanciacionesClient({ solicitudesIniciales }: { solicitudesIniciales: any[] }) {
  const [solicitudes, setSolicitudes] = useState(solicitudesIniciales);
  const [filtroEstado, setFiltroEstado] = useState("nuevo");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => ({
    nuevo: solicitudes.filter((s) => s.estado === "nuevo").length,
    en_gestion: solicitudes.filter((s) => s.estado === "en_gestion").length,
    descartado: solicitudes.filter((s) => s.estado === "descartado").length,
    todos: solicitudes.length,
  }), [solicitudes]);

  const filtradas = useMemo(() => {
    let lista = filtroEstado === "todos" ? solicitudes : solicitudes.filter((s) => s.estado === filtroEstado);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      lista = lista.filter((s) => [s.nombre, s.telefono, s.marca, s.modelo].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return lista;
  }, [solicitudes, filtroEstado, query]);

  const cambiarEstado = async (id: string, estado: string) => {
    setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, estado } : s)));
    const { error } = await supabase2.from("leads_tasacion").update({ estado }).eq("id", id);
    if (error) alert("No se pudo actualizar el estado.");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/5 px-6 py-4 bg-white dark:bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Financiaciones</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Solicitudes de crédito desde la web (home y detalle de auto)</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-6 pt-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente, marca, modelo..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0 hidden md:block" />
          {["nuevo", "en_gestion", "descartado", "todos"].map((est) => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors ${filtroEstado === est ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"}`}
            >
              {est === "todos" ? "Todos" : ESTADO_LABEL[est]}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filtroEstado === est ? "bg-white/20" : "bg-slate-100 dark:bg-white/10"}`}>{counts[est as keyof typeof counts]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#141414]">
        {filtradas.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white dark:bg-white/[0.02]">
            <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Sin solicitudes</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Con este filtro no se encontraron resultados.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-slate-100 dark:border-white/10">
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Vehículo</th>
                    <th className="px-4 py-3">Detalle del plan</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 w-px"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {filtradas.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">{(s.nombre || "?").substring(0, 2).toUpperCase()}</div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{s.nombre}</p>
                            <p className="text-[11px] text-slate-400">{s.telefono}{s.email ? ` · ${s.email}` : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-slate-700 dark:text-slate-200 font-medium">
                        {[s.marca, s.modelo, s.anio].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400 max-w-xs truncate" title={s.version || ""}>{s.version || "—"}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(s.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</td>
                      <td className="px-4 py-3">
                        <select
                          value={s.estado}
                          onChange={(e) => cambiarEstado(s.id, e.target.value)}
                          className={`text-[10px] font-bold uppercase tracking-widest rounded-lg px-2 py-1.5 outline-none cursor-pointer border ${ESTADO_STYLES[s.estado]}`}
                        >
                          <option value="nuevo" className="bg-white text-slate-900">Nuevo</option>
                          <option value="en_gestion" className="bg-white text-slate-900">En gestión</option>
                          <option value="descartado" className="bg-white text-slate-900">Descartado</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 w-px">
                        {s.telefono && (
                          <a
                            href={`https://wa.me/${s.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${s.nombre}! Te contactamos de Pfaffen Autos por tu solicitud de financiación${s.marca ? ` para el ${s.marca} ${s.modelo || ""}`.trim() : ""}.`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-md transition-colors inline-flex"
                            title="Contactar por WhatsApp"
                          >
                            <MessageSquareText className="w-4 h-4" strokeWidth={2.5} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
