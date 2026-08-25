"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Bell, Check, CheckCheck, Users, ClipboardList, Car, MessageCircle, FileText, Bell as BellIcon } from "lucide-react";

interface Notificacion {
  id: string;
  mensaje: string;
  link: string | null;
  leida: boolean;
  created_at: string;
  seccion: string | null;
}

export default function NotificacionesBell({ seccion }: { seccion?: string }) {
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [posicion, setPosicion] = useState({ top: 0, left: 0 });
  const botonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let canal: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      let query = supabase
        .from("notificaciones")
        .select("id, mensaje, link, leida, created_at, seccion")
        .eq("perfil_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (seccion) query = query.eq("seccion", seccion);
      const { data } = await query;
      setNotificaciones(data || []);

      // Nombre único por instancia: el componente se monta varias veces en simultáneo
      // (header mobile + sidebar desktop + bells de cada módulo), y Supabase reutiliza
      // el channel si el nombre se repite, lo que tira "cannot add callbacks after subscribe()".
      canal = supabase
        .channel(`notificaciones-${user.id}-${seccion || "todas"}-${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notificaciones", filter: `perfil_id=eq.${user.id}` },
          (payload) => {
            const nueva = payload.new as Notificacion;
            if (seccion && nueva.seccion !== seccion) return;
            setNotificaciones((prev) => [nueva, ...prev]);
          }
        )
        .subscribe();
    };
    init();

    return () => {
      if (canal) supabase.removeChannel(canal);
    };
  }, [seccion]);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const ANCHO_PANEL = 320;

  const abrirONo = () => {
    if (!abierto && botonRef.current) {
      const r = botonRef.current.getBoundingClientRect();
      const left = Math.min(r.left, window.innerWidth - ANCHO_PANEL - 12);
      setPosicion({ top: r.bottom + 8, left: Math.max(12, left) });
    }
    setAbierto((v) => !v);
  };

  const marcarLeida = async (n: Notificacion) => {
    setNotificaciones((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
    await supabase.from("notificaciones").update({ leida: true }).eq("id", n.id);
    if (n.link) {
      setAbierto(false);
      router.push(n.link);
    }
  };

  const marcarTodasLeidas = async () => {
    const idsNoLeidas = notificaciones.filter((n) => !n.leida).map((n) => n.id);
    if (idsNoLeidas.length === 0) return;
    setNotificaciones((prev) => prev.map((x) => ({ ...x, leida: true })));
    await supabase.from("notificaciones").update({ leida: true }).in("id", idsNoLeidas);
  };

  const iconoSeccion = (s: string | null) => {
    switch (s) {
      case "crm":
        return Users;
      case "tareas":
        return ClipboardList;
      case "stock":
      case "comprar":
        return Car;
      case "chat":
        return MessageCircle;
      case "peritajes":
      case "presupuestos":
        return FileText;
      default:
        return BellIcon;
    }
  };

  const etiquetaGrupo = (fecha: Date) => {
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    const mismodia = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    if (mismodia(fecha, hoy)) return "Hoy";
    if (mismodia(fecha, ayer)) return "Ayer";
    return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  };

  const grupos: { etiqueta: string; items: Notificacion[] }[] = [];
  for (const n of notificaciones) {
    const etiqueta = etiquetaGrupo(new Date(n.created_at));
    const grupo = grupos.find((g) => g.etiqueta === etiqueta);
    if (grupo) grupo.items.push(n);
    else grupos.push({ etiqueta, items: [n] });
  }

  if (!userId) return null;

  return (
    <div className="relative">
      <button
        type="button"
        ref={botonRef}
        onClick={abrirONo}
        className="relative text-slate-600 dark:text-slate-300 p-2 hover:bg-slate-100 dark:hover:bg-[#0a2a6b] rounded-lg transition-colors"
        title="Notificaciones"
      >
        <Bell className="w-4 h-4" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white dark:border-[#001c55]">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setAbierto(false)} />
          <div
            style={{ top: posicion.top, left: posicion.left }}
            className="fixed w-80 max-h-[70vh] overflow-y-auto bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-xl shadow-xl z-[101] custom-scrollbar"
          >
            <div className="px-4 py-3 border-b border-slate-100 dark:border-[#0a2a6b] flex items-center justify-between sticky top-0 bg-white dark:bg-[#001c55] z-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Notificaciones</span>
              {noLeidas > 0 ? (
                <button
                  type="button"
                  onClick={marcarTodasLeidas}
                  className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" /> Marcar todas
                </button>
              ) : (
                <span className="text-[10px] text-slate-400">al día</span>
              )}
            </div>
            {notificaciones.length === 0 ? (
              <p className="text-[12px] text-slate-400 italic text-center py-8 px-4">Sin notificaciones.</p>
            ) : (
              grupos.map((g) => (
                <div key={g.etiqueta}>
                  <div className="px-4 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-50/60 dark:bg-[#001640]">
                    {g.etiqueta}
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                    {g.items.map((n) => {
                      const Icono = iconoSeccion(n.seccion);
                      return (
                        <button
                          key={n.id}
                          onClick={() => marcarLeida(n)}
                          className={`group w-full text-left px-4 py-3 flex items-start gap-2.5 border-l-2 hover:bg-slate-50 dark:hover:bg-[#00246b] transition-colors ${
                            !n.leida
                              ? "border-l-indigo-500 bg-indigo-50/50 dark:bg-[#002a6e]/50"
                              : "border-l-transparent"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              !n.leida
                                ? "bg-indigo-500 text-white"
                                : "bg-slate-100 dark:bg-[#0a2a6b] text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            <Icono className="w-3 h-3" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-[12px] ${!n.leida ? "font-bold text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>{n.mensaje}</p>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          {!n.leida && (
                            <Check className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 dark:text-slate-600 dark:group-hover:text-sky-400 shrink-0 mt-1 transition-colors" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
