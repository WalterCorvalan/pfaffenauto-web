"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import { CheckCircle2, X, Trash2, AlertTriangle, Info, Clock } from "lucide-react";

interface Alerta {
  id: string;
  tipo: string;
  prioridad: "alta" | "media" | "baja" | "novedad";
  titulo: string;
  mensaje: string | null;
  link: string | null;
  leida: boolean;
  created_at: string;
}

const PRIORIDAD_INFO: Record<string, { label: string; color: string; icono: typeof AlertTriangle }> = {
  alta: { label: "Alta", color: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20", icono: AlertTriangle },
  novedad: { label: "Novedades", color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20", icono: Info },
  media: { label: "Media", color: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20", icono: Clock },
  baja: { label: "Baja", color: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20", icono: Info },
};

export default function AlertasClient({ alertasIniciales }: { alertasIniciales: Alerta[]; miId: string }) {
  const router = useRouter();
  const [alertas, setAlertas] = useState(alertasIniciales);
  const [borrandoTodas, setBorrandoTodas] = useState(false);

  const conteos = useMemo(() => {
    const c = { alta: 0, novedad: 0, media: 0, baja: 0 };
    alertas.forEach((a) => { c[a.prioridad]++; });
    return c;
  }, [alertas]);

  const cerrarAlerta = async (id: string) => {
    setAlertas((prev) => prev.filter((a) => a.id !== id));
    await supabase2.from("alertas").delete().eq("id", id);
  };

  const abrirAlerta = async (a: Alerta) => {
    await supabase2.from("alertas").update({ leida: true }).eq("id", a.id);
    setAlertas((prev) => prev.filter((x) => x.id !== a.id));
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Centro de Alertas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Items que requieren atención, ordenados por prioridad</p>
        </div>
        <div className="flex items-center gap-2">
          {(["alta", "novedad", "media", "baja"] as const).map((p) => {
            const info = PRIORIDAD_INFO[p];
            return (
              <div key={p} className={`text-center px-4 py-2 rounded-xl border ${info.color}`}>
                <p className="text-xl font-black leading-none">{conteos[p]}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide mt-1">{info.label}</p>
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
        <div className="space-y-2">
          {alertas.map((a) => {
            const info = PRIORIDAD_INFO[a.prioridad];
            const Icono = info.icono;
            return (
              <div
                key={a.id}
                onClick={() => a.link && abrirAlerta(a)}
                className={`flex items-start gap-3 bg-white dark:bg-white/[0.02] border rounded-xl p-4 ${a.link ? "cursor-pointer hover:shadow-md" : ""} transition-shadow ${!a.leida ? "border-slate-300 dark:border-white/20" : "border-slate-200 dark:border-white/10"}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${info.color}`}>
                  <Icono className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{a.titulo}</p>
                  {a.mensaje && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.mensaje}</p>}
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(a.created_at).toLocaleString("es-AR")}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); cerrarAlerta(a.id); }} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
