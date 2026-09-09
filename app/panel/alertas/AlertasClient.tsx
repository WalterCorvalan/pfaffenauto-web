"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import { CheckCircle2, X, Trash2, ChevronDown, ArrowRight } from "lucide-react";
import { TIPO_ICON, TIPO_COLOR, TIPO_VER, ICONO_DEFECTO, COLOR_DEFECTO } from "@/components/panelV2/alertaMeta";

interface Alerta {
  id: string;
  tipo: string;
  prioridad: "alta" | "media" | "baja" | "novedad";
  titulo: string;
  mensaje: string | null;
  link: string | null;
  leida: boolean;
  created_at: string;
  contador: number;
}

const PRIORIDAD_INFO: Record<string, { label: string; dot: string; badge: string }> = {
  alta: { label: "Prioridad alta", dot: "bg-rose-500", badge: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300" },
  novedad: { label: "Novedades", dot: "bg-emerald-500", badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" },
  media: { label: "Media", dot: "bg-amber-500", badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300" },
  baja: { label: "Baja", dot: "bg-blue-500", badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300" },
};
const ORDEN = ["alta", "novedad", "media", "baja"] as const;


export default function AlertasClient({ alertasIniciales }: { alertasIniciales: Alerta[]; miId: string }) {
  const router = useRouter();
  const [alertas, setAlertas] = useState(alertasIniciales);
  const [borrandoTodas, setBorrandoTodas] = useState(false);
  const [colapsadas, setColapsadas] = useState<Set<string>>(new Set());

  const conteos = useMemo(() => {
    const c = { alta: 0, novedad: 0, media: 0, baja: 0 };
    alertas.forEach((a) => { c[a.prioridad]++; });
    return c;
  }, [alertas]);

  const grupos = useMemo(() => {
    const g: Record<string, Alerta[]> = { alta: [], novedad: [], media: [], baja: [] };
    alertas.forEach((a) => g[a.prioridad].push(a));
    return g;
  }, [alertas]);

  const marcarLeida = async (a: Alerta) => {
    if (a.leida) return;
    setAlertas((prev) => prev.map((x) => (x.id === a.id ? { ...x, leida: true } : x)));
    await supabase2.from("alertas").update({ leida: true }).eq("id", a.id);
  };

  const cerrarAlerta = async (id: string) => {
    setAlertas((prev) => prev.filter((a) => a.id !== id));
    await supabase2.from("alertas").delete().eq("id", id);
  };

  const irAlLink = (a: Alerta) => {
    marcarLeida(a);
    if (a.link) router.push(a.link);
  };

  const borrarTodas = async () => {
    if (!confirm(`¿Borrar las ${alertas.length} alertas? No se puede deshacer.`)) return;
    setBorrandoTodas(true);
    const ids = alertas.map((a) => a.id);
    setAlertas([]);
    await supabase2.from("alertas").delete().in("id", ids);
    setBorrandoTodas(false);
  };

  const toggleColapsada = (p: string) => setColapsadas((prev) => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Centro de Alertas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Items que requieren atención, ordenados por prioridad</p>
        </div>
        <div className="flex items-center gap-2">
          {ORDEN.map((p) => {
            const info = PRIORIDAD_INFO[p];
            return (
              <div key={p} className={`text-center px-4 py-2 rounded-xl ${info.badge}`}>
                <p className="text-xl font-black leading-none">{conteos[p]}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide mt-1">{p === "alta" ? "Alta" : info.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="flex justify-end mb-3">
          <button onClick={borrarTodas} disabled={borrandoTodas} className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" /> Borrar todas
          </button>
        </div>
      )}

      {alertas.length === 0 ? (
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl py-16 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="font-bold text-slate-700 dark:text-slate-200">Todo en orden</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No hay alertas pendientes en este momento.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {ORDEN.map((p) => {
            const info = PRIORIDAD_INFO[p];
            const items = grupos[p];
            const abierta = !colapsadas.has(p);
            return (
              <div key={p}>
                <button onClick={() => toggleColapsada(p)} className="flex items-center gap-2 mb-2">
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${abierta ? "" : "-rotate-90"}`} />
                  <span className={`w-2 h-2 rounded-full ${info.dot}`} />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{p === "alta" ? "PRIORIDAD ALTA" : info.label.toUpperCase()}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">{items.length}</span>
                </button>

                {abierta && (
                  items.length === 0 ? (
                    <p className="text-xs text-slate-400 italic pl-6">Sin alertas de {p === "alta" ? "prioridad alta" : info.label.toLowerCase()}.</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((a) => {
                        const Icon = TIPO_ICON[a.tipo] || ICONO_DEFECTO;
                        const color = TIPO_COLOR[a.tipo] || COLOR_DEFECTO;
                        return (
                          <div key={a.id} className={`flex items-start gap-3 rounded-xl p-4 border ${info.badge} border-transparent`}>
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}><Icon className="w-4 h-4" /></span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  {a.titulo}
                                  {a.contador > 1 && <span className="text-[10px] font-bold px-1.5 rounded-full bg-rose-600 text-white shrink-0">x{a.contador}</span>}
                                </p>
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${info.badge}`}>{p === "novedad" ? "Novedad" : info.label}</span>
                              </div>
                              {a.mensaje && <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{a.mensaje}</p>}
                              {a.link && (
                                <button onClick={() => irAlLink(a)} className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline mt-1.5">
                                  {TIPO_VER[a.tipo] || "Ver más"} <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <button onClick={() => cerrarAlerta(a.id)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-colors shrink-0"><X className="w-4 h-4" /></button>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
