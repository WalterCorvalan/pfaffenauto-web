"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import { Search, Send, Bot, Check, Info, ChevronRight, PanelRight, Megaphone } from "lucide-react";

interface Perfil { id: string; nombre: string; roles: string[] }

export default function RodiBandeja({ conversacionesIniciales, vendedores }: { conversacionesIniciales: any[]; vendedores: Perfil[] }) {
  const [conversaciones, setConversaciones] = useState(conversacionesIniciales);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "no-leidas">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [panelAbierto, setPanelAbierto] = useState(true);
  const [notasLocales, setNotasLocales] = useState("");
  const [guardandoNotas, setGuardandoNotas] = useState(false);
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("conversacion");
    if (id) setSeleccionada(id);
  }, [searchParams]);

  useEffect(() => { mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes]);

  useEffect(() => {
    if (!seleccionada) return;
    setLoading(true);
    supabase2.from("rodi_mensajes").select("*").eq("conversacion_id", seleccionada).order("created_at", { ascending: true }).then(({ data }) => {
      setMensajes(data || []);
      setLoading(false);
    });
    supabase2.from("rodi_conversaciones").select("notas, unread_count").eq("id", seleccionada).single().then(({ data }) => {
      if (data) { setNotasLocales(data.notas || ""); }
      if (data?.unread_count > 0) {
        supabase2.from("rodi_conversaciones").update({ unread_count: 0 }).eq("id", seleccionada).then(() => {
          setConversaciones((prev) => prev.map((c) => (c.id === seleccionada ? { ...c, unread_count: 0 } : c)));
        });
      }
    });

    const canal = supabase2
      .channel(`rodi_mensajes:${seleccionada}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rodi_mensajes", filter: `conversacion_id=eq.${seleccionada}` }, (payload) => {
        setMensajes((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]));
      })
      .subscribe();
    return () => { supabase2.removeChannel(canal); };
  }, [seleccionada]);

  const conversacionActiva = conversaciones.find((c) => c.id === seleccionada);

  const enviarMensajeManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !seleccionada) return;
    const texto = nuevoMensaje.trim();
    setNuevoMensaje("");
    const optimista = { id: crypto.randomUUID(), conversacion_id: seleccionada, direccion: "out", texto, ai_generado: false, created_at: new Date().toISOString() };
    setMensajes((prev) => [...prev, optimista]);
    await supabase2.from("rodi_mensajes").insert({ conversacion_id: seleccionada, direccion: "out", texto, ai_generado: false });
    await supabase2.from("rodi_conversaciones").update({ ai_habilitada: false, last_message_at: new Date().toISOString() }).eq("id", seleccionada);
    setConversaciones((prev) => prev.map((c) => (c.id === seleccionada ? { ...c, ai_habilitada: false } : c)));
  };

  const toggleIA = async () => {
    if (!conversacionActiva) return;
    const nuevoValor = !conversacionActiva.ai_habilitada;
    setConversaciones((prev) => prev.map((c) => (c.id === conversacionActiva.id ? { ...c, ai_habilitada: nuevoValor } : c)));
    await supabase2.from("rodi_conversaciones").update({ ai_habilitada: nuevoValor }).eq("id", conversacionActiva.id);
  };

  const guardarNotas = async () => {
    if (!seleccionada) return;
    setGuardandoNotas(true);
    try { await supabase2.from("rodi_conversaciones").update({ notas: notasLocales }).eq("id", seleccionada); } finally { setGuardandoNotas(false); }
  };

  const reasignarVendedor = async (vendedorId: string) => {
    if (!seleccionada) return;
    const nuevoId = vendedorId || null;
    await supabase2.from("rodi_conversaciones").update({ vendedor_id: nuevoId }).eq("id", seleccionada);
    const vendedor = vendedores.find((v) => v.id === nuevoId) || null;
    setConversaciones((prev) => prev.map((c) => (c.id === seleccionada ? { ...c, vendedor_id: nuevoId, vendedor } : c)));
  };

  const formatDate = (d: string) => new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const formatDay = (d: string) => {
    const dif = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (dif === 0) return "Hoy";
    if (dif === 1) return "Ayer";
    return `${dif} días`;
  };

  const filtradas = conversaciones.filter((c) => {
    if (filtro === "no-leidas" && !(c.unread_count > 0)) return false;
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      if (!([c.nombre_contacto, c.telefono_contacto, c.email_contacto].filter(Boolean).join(" ").toLowerCase().includes(q))) return false;
    }
    return true;
  });
  const noLeidasTotal = conversaciones.filter((c) => c.unread_count > 0).length;
  const colorCalificacion = (c: string | null) => (c === "caliente" ? "bg-rose-500" : c === "tibio" ? "bg-amber-500" : "bg-slate-300");

  return (
    <div className="flex w-full h-full text-slate-800 dark:text-slate-200">
      <div className={`w-full md:w-[320px] flex-col bg-white dark:bg-[#111] border-r border-slate-200 dark:border-white/10 shrink-0 ${seleccionada ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-slate-100 dark:border-white/10 shrink-0">
          <h2 className="text-[15px] font-bold mb-3">Bandeja <span className="text-sm font-normal text-slate-400">{conversaciones.length}</span></h2>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar conversación..." className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-sm outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setFiltro("todas")} className={`px-3 py-1 text-xs font-semibold rounded-full ${filtro === "todas" ? "bg-slate-800 dark:bg-white/10 text-white" : "bg-white dark:bg-transparent border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>Todas {conversaciones.length}</button>
            <button onClick={() => setFiltro("no-leidas")} className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${filtro === "no-leidas" ? "bg-slate-800 dark:bg-white/10 text-white" : "bg-white dark:bg-transparent border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>No leídas <span className="text-[10px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-full">{noLeidasTotal}</span></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filtradas.length === 0 && <p className="text-center text-xs text-slate-400 py-8">Sin conversaciones.</p>}
          {filtradas.map((c) => {
            const isActive = seleccionada === c.id;
            const iniciales = (c.nombre_contacto || "Visitante").substring(0, 2).toUpperCase();
            return (
              <button key={c.id} onClick={() => setSeleccionada(c.id)} className={`w-full text-left p-3.5 border-b border-slate-100 dark:border-white/5 flex gap-3 ${isActive ? "bg-emerald-50 dark:bg-emerald-500/10 border-l-2 border-l-emerald-700" : "hover:bg-slate-50 dark:hover:bg-white/5 border-l-2 border-l-transparent"}`}>
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-sm">{iniciales}</div>
                  <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#111] ${colorCalificacion(c.calificacion)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="font-bold text-sm truncate">{c.nombre_contacto || "Visitante anónimo"}</span>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">{c.last_message_at ? formatDay(c.last_message_at) : ""}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate">{c.vendedor?.nombre ? `Asignado a ${c.vendedor.nombre}` : "Sin asignar"}</p>
                    {c.unread_count > 0 && <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full shrink-0">{c.unread_count}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-[#F0F2F5] dark:bg-[#0A0A0A] relative ${!seleccionada ? "hidden md:flex" : "flex"}`}>
        {!seleccionada ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400"><p className="text-sm font-medium">Elige una conversación para ver el hilo</p></div>
        ) : (
          <>
            <div className="h-[60px] bg-white dark:bg-[#111] border-b border-slate-200 dark:border-white/10 flex justify-between items-center px-6 shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center font-bold text-white text-xs">{(conversacionActiva?.nombre_contacto || "V").substring(0, 2).toUpperCase()}</div>
                <div>
                  <h3 className="font-bold text-[15px] leading-tight">{conversacionActiva?.nombre_contacto || "Visitante anónimo"}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{[conversacionActiva?.telefono_contacto, conversacionActiva?.email_contacto].filter(Boolean).join(" · ") || conversacionActiva?.origen_pagina}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="md:hidden text-emerald-700 text-sm font-bold" onClick={() => setSeleccionada(null)}>Atrás</button>
                {!panelAbierto && <button onClick={() => setPanelAbierto(true)} className="hidden lg:flex p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md"><PanelRight className="w-5 h-5" /></button>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 custom-scrollbar">
              {loading ? <div className="flex justify-center py-4"><span className="text-xs text-slate-400">Cargando...</span></div> : mensajes.map((m) => {
                const out = m.direccion === "out";
                return (
                  <div key={m.id} className={`flex ${out ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] lg:max-w-[60%] flex flex-col ${out ? "items-end" : "items-start"}`}>
                      <div className={`rounded-[10px] px-3.5 py-2 text-[14px] shadow-sm border bg-white dark:bg-[#111] border-slate-200 dark:border-white/10 ${out ? "rounded-tr-none" : "rounded-tl-none"}`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{m.texto}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                          {out && m.ai_generado && <Bot className="w-3 h-3 text-slate-400" />}
                          <span className="text-[10px] text-slate-400 font-medium">{formatDate(m.created_at)}</span>
                          {out && <Check className="w-3.5 h-3.5 text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={mensajesEndRef} />
            </div>

            <div className="p-4 bg-[#F0F2F5] dark:bg-[#0A0A0A]">
              <p className="max-w-4xl mx-auto text-[10px] text-slate-400 mb-1.5 px-1">Este mensaje queda guardado para cuando el visitante vuelva a escribir — no se le manda en vivo (no hay push a un navegador desconectado).</p>
              <form onSubmit={enviarMensajeManual} className="flex items-center gap-3 max-w-4xl mx-auto bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1.5 shadow-sm">
                <input type="text" value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} placeholder="Escribí una respuesta manual..." className="flex-1 bg-transparent px-3 py-2 text-[15px] outline-none" autoComplete="off" />
                <button type="submit" disabled={!nuevoMensaje.trim()} className="bg-emerald-700 hover:bg-emerald-800 text-white p-2.5 rounded-lg disabled:opacity-40 shrink-0"><Send className="w-4 h-4" /></button>
              </form>
            </div>
          </>
        )}
      </div>

      {seleccionada && panelAbierto && (
        <div className="w-[300px] bg-white dark:bg-[#111] border-l border-slate-200 dark:border-white/10 flex-col hidden lg:flex shrink-0">
          <div className="h-[60px] p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Detalles</h3>
            <button onClick={() => setPanelAbierto(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-600 text-xl font-bold flex items-center justify-center text-white mb-3">{(conversacionActiva?.nombre_contacto || "V").substring(0, 2).toUpperCase()}</div>
              <h3 className="font-bold text-lg">{conversacionActiva?.nombre_contacto || "Visitante anónimo"}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{[conversacionActiva?.telefono_contacto, conversacionActiva?.email_contacto].filter(Boolean).join(" · ") || "Sin datos"}</p>
              {conversacionActiva?.origen_pagina && (
                <div className="mt-3 flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-sky-300 text-[11px] font-bold px-2.5 py-1 rounded-full max-w-full">
                  <Megaphone className="w-3 h-3 shrink-0" /> <span className="truncate">{conversacionActiva.origen_pagina}</span>
                </div>
              )}
            </div>

            <div className="p-6 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold">IA en esta conversación</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{conversacionActiva?.ai_habilitada ? "Activada" : "Pausada"}</p>
                </div>
                <button type="button" onClick={toggleIA} className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${conversacionActiva?.ai_habilitada ? "bg-emerald-700 justify-end" : "bg-slate-300 dark:bg-white/10 justify-start"}`}>
                  <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </button>
              </div>
              {conversacionActiva?.handoff_at && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 rounded-lg flex gap-2">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    <p>El visitante pidió hablar con una persona.</p>
                    {conversacionActiva.handoff_resumen && <p className="mt-1 font-semibold">{conversacionActiva.handoff_resumen}</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-b border-slate-200 dark:border-white/10">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Vendedor asignado</h4>
              <select value={conversacionActiva?.vendedor_id || ""} onChange={(e) => reasignarVendedor(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-medium outline-none">
                <option value="">Sin asignar</option>
                {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </div>

            <div className="p-6">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Notas</h4>
              <textarea value={notasLocales} onChange={(e) => setNotasLocales(e.target.value)} placeholder="Notas internas sobre este contacto..." className="w-full h-32 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-[13px] outline-none resize-none custom-scrollbar" />
              <button onClick={guardarNotas} disabled={guardandoNotas} className="mt-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold px-4 py-2 rounded-lg">
                {guardandoNotas ? "Guardando..." : "Guardar notas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
