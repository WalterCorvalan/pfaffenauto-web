"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase2 } from "@/lib/supabase/client";
import { MessageCircle, X, Globe, Users, Plus, Inbox } from "lucide-react";
import FloatingChatWindow from "./FloatingChatWindow";

interface Perfil { id: string; nombre: string }
interface Canal { id: string; tipo: "general" | "directo" | "grupo"; nombre: string | null; par_clave: string | null; created_at: string; otroMiembro?: Perfil }

function nombreCanal(c: Canal) {
  if (c.tipo === "general") return "General";
  if (c.tipo === "grupo") return c.nombre || "Grupo";
  return c.otroMiembro?.nombre || "Usuario";
}

const previewAdjunto = (a: { url: string; nombre: string }[] | null) => (a && a.length > 0 ? `📎 ${a[0].nombre}` : "");

export default function MensajesBubble() {
  const router = useRouter();
  const pathname = usePathname();
  const [miId, setMiId] = useState("");
  const [canales, setCanales] = useState<Canal[]>([]);
  const [ultimoPorCanal, setUltimoPorCanal] = useState<Record<string, { texto: string | null; adjuntos: any[] | null; autor_id: string }>>({});
  const [noLeidosPorCanal, setNoLeidosPorCanal] = useState<Record<string, number>>({});
  const [popupAbierto, setPopupAbierto] = useState(false);
  const [ventanas, setVentanas] = useState<Canal[]>([]);

  useEffect(() => {
    supabase2.auth.getUser().then(({ data }) => setMiId(data.user?.id || ""));
  }, []);

  const cargar = useCallback(async () => {
    if (!miId) return;
    const { data: misMembresias } = await supabase2.from("mensajes_canal_miembros").select("canal_id").eq("perfil_id", miId);
    const idsPropios = (misMembresias || []).map((m) => m.canal_id);
    const { data: canalesRaw } = await supabase2.from("mensajes_canales").select("*").or(`tipo.eq.general,id.in.(${idsPropios.length ? idsPropios.join(",") : "00000000-0000-0000-0000-000000000000"})`);
    const lista = canalesRaw || [];

    const directoIds = lista.filter((c) => c.tipo === "directo").map((c) => c.id);
    let otrosMap: Record<string, Perfil> = {};
    if (directoIds.length) {
      const { data: miembrosDirectos } = await supabase2.from("mensajes_canal_miembros").select("canal_id, perfil:perfiles(id, nombre)").in("canal_id", directoIds).neq("perfil_id", miId);
      (miembrosDirectos || []).forEach((m: any) => { otrosMap[m.canal_id] = m.perfil; });
    }
    const conOtro: Canal[] = lista.map((c) => ({ ...c, otroMiembro: otrosMap[c.id] }));
    conOtro.sort((a, b) => (a.tipo === "general" ? -1 : b.tipo === "general" ? 1 : 0));
    setCanales(conOtro);

    const idsTodos = conOtro.map((c) => c.id);
    if (idsTodos.length === 0) { setNoLeidosPorCanal({}); return; }

    const [{ data: recientes }, { data: lecturasRaw }] = await Promise.all([
      supabase2.from("mensajes").select("id, canal_id, autor_id, texto, adjuntos, created_at").in("canal_id", idsTodos).order("created_at", { ascending: false }).limit(300),
      supabase2.from("mensajes_lecturas").select("canal_id, last_read_at").eq("perfil_id", miId),
    ]);
    const lecturaMap: Record<string, number> = {};
    (lecturasRaw || []).forEach((l) => { lecturaMap[l.canal_id] = new Date(l.last_read_at).getTime(); });

    const ultimos: Record<string, { texto: string | null; adjuntos: any[] | null; autor_id: string }> = {};
    const noLeidos: Record<string, number> = {};
    (recientes || []).forEach((m) => {
      if (!ultimos[m.canal_id]) ultimos[m.canal_id] = { texto: m.texto, adjuntos: m.adjuntos, autor_id: m.autor_id };
      if (m.autor_id !== miId && new Date(m.created_at).getTime() > (lecturaMap[m.canal_id] || 0)) {
        noLeidos[m.canal_id] = (noLeidos[m.canal_id] || 0) + 1;
      }
    });
    setUltimoPorCanal(ultimos);
    setNoLeidosPorCanal(noLeidos);
  }, [miId]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!miId) return;
    const canal = supabase2.channel(`mensajes-bubble-realtime-${miId}-${Math.random().toString(36).slice(2)}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes" }, cargar).subscribe();
    return () => { supabase2.removeChannel(canal); };
  }, [miId, cargar]);

  const totalNoLeidos = Object.values(noLeidosPorCanal).reduce((a, b) => a + b, 0);

  if (pathname === "/panel/mensajes") return null;

  const abrirVentana = (c: Canal) => {
    setPopupAbierto(false);
    setVentanas((prev) => (prev.some((v) => v.id === c.id) ? prev : [...prev, c]));
  };
  const cerrarVentana = (id: string) => setVentanas((prev) => prev.filter((v) => v.id !== id));

  return (
    <>
      {ventanas.map((c, i) => (
        <FloatingChatWindow key={c.id} canal={c} miId={miId} offset={24 + i * 316} onClose={() => cerrarVentana(c.id)} />
      ))}

      <div className="print:hidden hidden md:block fixed bottom-24 right-6 z-40">
        {popupAbierto && (
          <div className="absolute bottom-14 right-0 w-80 bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between px-4 py-3 border-b border-slate-100 dark:border-white/10">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Mensajes</h3>
                <p className="text-[11px] text-slate-400">Tocá un chat para abrirlo en una ventana flotante</p>
              </div>
              <button onClick={() => setPopupAbierto(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {canales.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">Sin conversaciones todavía.</p>
              ) : canales.map((c) => {
                const ultimo = ultimoPorCanal[c.id];
                const n = noLeidosPorCanal[c.id] || 0;
                const preview = ultimo ? (ultimo.texto || previewAdjunto(ultimo.adjuntos) || "Mensaje nuevo") : "Tocá para chatear";
                return (
                  <button key={c.id} onClick={() => abrirVentana(c)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-indigo-500 text-white">
                      {c.tipo === "general" ? <Globe className="w-4 h-4" /> : c.tipo === "grupo" ? <Users className="w-4 h-4" /> : nombreCanal(c).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{nombreCanal(c)}</p>
                      <p className="text-[11px] text-slate-400 truncate">{preview}</p>
                    </div>
                    {n > 0 && <span className="text-[10px] font-bold bg-rose-600 text-white rounded-full px-1.5 py-0.5 shrink-0">{n}</span>}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-slate-100 dark:border-white/10 p-2 space-y-0.5">
              <button onClick={() => { setPopupAbierto(false); router.push("/panel/mensajes"); }} className="w-full flex items-center gap-2 px-2 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg">
                <Plus className="w-4 h-4" /> Mensaje nuevo
              </button>
              <button onClick={() => { setPopupAbierto(false); router.push("/panel/mensajes"); }} className="w-full flex items-center gap-2 px-2 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg">
                <Inbox className="w-4 h-4" /> Ver Mensajes completo
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setPopupAbierto((v) => !v)}
          className="flex w-12 h-12 rounded-full bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 shadow-lg items-center justify-center hover:scale-105 transition-transform relative"
          title="Mensajes"
        >
          <MessageCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          {totalNoLeidos > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
              {totalNoLeidos > 99 ? "99+" : totalNoLeidos}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
