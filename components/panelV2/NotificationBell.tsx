"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import { Bell, Check, ExternalLink } from "lucide-react";
import { TIPO_ICON, TIPO_COLOR, ICONO_DEFECTO, COLOR_DEFECTO } from "./alertaMeta";

interface Alerta {
  id: string; tipo: string; prioridad: string; titulo: string; mensaje: string | null; link: string | null; leida: boolean; created_at: string; contador: number;
}

function tiempoRelativo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export default function NotificationBell({ miId }: { miId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [sinLeer, setSinLeer] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // El contador va aparte de la lista visible (limitada a 8): si hay más de
  // 8 alertas mezcladas entre leídas y no leídas, contar solo sobre las 8
  // más recientes podía mostrar un número más bajo que el real.
  const cargar = async () => {
    if (!miId) return;
    const [{ data }, { count }] = await Promise.all([
      supabase2.from("alertas").select("*").eq("destinatario_id", miId).order("created_at", { ascending: false }).limit(8),
      supabase2.from("alertas").select("id", { count: "exact", head: true }).eq("destinatario_id", miId).eq("leida", false),
    ]);
    setAlertas(data || []);
    setSinLeer(count || 0);
  };

  useEffect(() => { cargar(); }, [miId]);

  useEffect(() => {
    if (!miId) return;
    const canal = supabase2
      .channel(`bell-${miId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "alertas", filter: `destinatario_id=eq.${miId}` }, cargar)
      .subscribe();
    return () => { supabase2.removeChannel(canal); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miId]);

  useEffect(() => {
    if (!open) return;
    const onClickFuera = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, [open]);

  const marcarTodas = async () => {
    setAlertas((prev) => prev.map((a) => ({ ...a, leida: true })));
    setSinLeer(0);
    await supabase2.from("alertas").update({ leida: true }).eq("destinatario_id", miId).eq("leida", false);
  };

  const abrirAlerta = async (a: Alerta) => {
    if (!a.leida) {
      setAlertas((prev) => prev.map((x) => (x.id === a.id ? { ...x, leida: true } : x)));
      setSinLeer((n) => Math.max(0, n - 1));
      await supabase2.from("alertas").update({ leida: true }).eq("id", a.id);
    }
    setOpen(false);
    if (a.link) router.push(a.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 shrink-0" title="Notificaciones">
        <Bell className="w-4 h-4" />
        {sinLeer > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
            {sinLeer > 9 ? "9+" : sinLeer}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/10">
            <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-white">
              <Bell className="w-4 h-4" /> Notificaciones {sinLeer > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-600 text-white">{sinLeer}</span>}
            </span>
            {sinLeer > 0 && <button onClick={marcarTodas} className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600"><Check className="w-3 h-3" /> Marcar todas</button>}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {alertas.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Sin notificaciones.</p>
            ) : (
              alertas.map((a) => {
                const Icon = TIPO_ICON[a.tipo] || ICONO_DEFECTO;
                const color = TIPO_COLOR[a.tipo] || COLOR_DEFECTO;
                return (
                  <button key={a.id} onClick={() => abrirAlerta(a)} className={`w-full flex items-start gap-2.5 px-4 py-3 text-left border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 ${!a.leida ? "bg-slate-50/60 dark:bg-white/[0.03]" : ""}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}><Icon className="w-4 h-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{a.titulo}</span>
                        {a.contador > 1 && <span className="shrink-0 text-[10px] font-bold px-1.5 rounded-full bg-rose-600 text-white">x{a.contador}</span>}
                        {!a.leida && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                      </span>
                      {a.mensaje && <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">{a.mensaje}</span>}
                      <span className="block text-[10px] text-slate-400 mt-0.5">{tiempoRelativo(a.created_at)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <a href="/panel-v2/alertas" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-t border-slate-100 dark:border-white/10">
            Ver Centro de Alertas <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
