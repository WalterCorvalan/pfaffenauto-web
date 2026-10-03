"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Sparkles, Send, Loader2, X, RotateCcw, ArrowRight, ChevronRight } from "lucide-react";
import { CascadaItem } from "@/components/ui/movimiento";

// "Preguntale al gerente" (Cockpit CEO): tarjeta compacta en el Dashboard + chat a pantalla completa en el celular
// (en computadora, una ventana centrada). Las respuestas vienen de /api/panel/gerente/preguntar.

interface Accion { texto: string; link: string }
interface Mensaje { role: "user" | "assistant"; content: string; acciones?: Accion[] }

const PREGUNTAS_RAPIDAS = [
  "¿Qué debería atacar hoy?",
  "¿Cómo venimos este mes contra el anterior?",
  "¿Cómo creció el patrimonio?",
  "¿Qué leads hay sin contactar?",
  "¿Qué stock está parado?",
  "¿Qué cobros y pagos están vencidos?",
];

// **negrita** dentro de una línea
function conNegrita(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((parte, i) =>
    parte.startsWith("**") && parte.endsWith("**") ? <strong key={i} className="font-bold">{parte.slice(2, -2)}</strong> : <span key={i}>{parte}</span>
  );
}

// Formato mínimo que usa el gerente: párrafos, listas con "- " y **negrita** (sin tablas ni títulos).
function Texto({ contenido }: { contenido: string }) {
  const bloques: ReactNode[] = [];
  let lista: string[] = [];
  const cerrarLista = () => {
    if (lista.length) { bloques.push(<ul key={`l${bloques.length}`} className="list-disc pl-4 space-y-1 my-1.5">{lista.map((it, i) => <li key={i}>{conNegrita(it)}</li>)}</ul>); lista = []; }
  };
  contenido.split("\n").forEach((linea) => {
    const t = linea.trim();
    if (/^[-•*]\s+/.test(t)) lista.push(t.replace(/^[-•*]\s+/, ""));
    else { cerrarLista(); if (t) bloques.push(<p key={`p${bloques.length}`} className="my-1">{conNegrita(t)}</p>); }
  });
  cerrarLista();
  return <>{bloques}</>;
}

export default function GerenteChat() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [pregunta, setPregunta] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const finRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [mensajes, cargando, abierto]);
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    window.addEventListener("keydown", alTeclear);
    // En el celular el fondo no tiene que scrollear mientras el chat está abierto.
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", alTeclear); document.body.style.overflow = antes; };
  }, [abierto]);

  // La caja de escribir crece con el texto (hasta 5 renglones).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [pregunta, abierto]);

  const enviar = async (texto: string) => {
    const limpio = texto.trim();
    if (!limpio || cargando) return;
    const nuevo: Mensaje[] = [...mensajes, { role: "user", content: limpio }];
    setMensajes(nuevo);
    setPregunta("");
    setAbierto(true);
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/panel/gerente/preguntar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: limpio, historial: nuevo.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo responder.");
      setMensajes((prev) => [...prev, { role: "assistant", content: data.reply, acciones: data.acciones || [] }]);
    } catch (e: any) {
      setError(e.message || "Error al preguntar.");
    } finally {
      setCargando(false);
    }
  };

  const nuevaConversacion = () => { setMensajes([]); setError(""); setPregunta(""); };

  return (
    <>
      {/* Tarjeta del Dashboard */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-indigo-700 via-violet-700 to-indigo-900 text-white">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></div>
          <div className="min-w-0">
            <p className="font-black">Preguntale al gerente</p>
            <p className="text-xs text-indigo-200">Mira los números de hoy y te dice qué conviene hacer. Solo con datos del CRM (sin precios de mercado).</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto sm:flex-wrap -mx-1 px-1 pb-1 mb-3">
          {PREGUNTAS_RAPIDAS.slice(0, 4).map((p, i) => (
            <CascadaItem key={p} i={i} className="shrink-0"><button onClick={() => enviar(p)} disabled={cargando} className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold disabled:opacity-50 whitespace-nowrap">{p}</button></CascadaItem>
          ))}
        </div>

        <button onClick={() => { setAbierto(true); setTimeout(() => inputRef.current?.focus(), 100); }} className="w-full flex items-center justify-between gap-2 rounded-xl bg-white text-slate-500 px-4 py-3 text-sm text-left">
          <span className="truncate">{mensajes.length > 0 ? "Seguir la conversación…" : "Escribí tu pregunta…"}</span>
          <ChevronRight className="w-4 h-4 shrink-0 text-indigo-500" />
        </button>
      </div>

      {/* Chat: pantalla completa en el celular, ventana en computadora */}
      {abierto && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[90] flex md:items-center md:justify-center bg-black/50 md:p-6" onClick={(e) => { if (e.target === e.currentTarget) setAbierto(false); }}>
          <div className="flex flex-col w-full h-full md:h-[min(85vh,760px)] md:max-w-2xl md:rounded-2xl overflow-hidden bg-white dark:bg-[#0f0f14] shadow-2xl">
            <div className="shrink-0 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-700 to-violet-700 text-white">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="font-black leading-tight">El gerente</p>
                <p className="text-[11px] text-indigo-200 leading-tight">Datos del CRM al día de hoy</p>
              </div>
              {mensajes.length > 0 && (
                <button onClick={nuevaConversacion} title="Nueva conversación" aria-label="Nueva conversación" className="p-2 rounded-lg hover:bg-white/15"><RotateCcw className="w-4 h-4" /></button>
              )}
              <button onClick={() => setAbierto(false)} title="Cerrar" aria-label="Cerrar" className="p-2 rounded-lg hover:bg-white/15"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 bg-slate-50 dark:bg-[#0a0a0f]">
              {mensajes.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Preguntame lo que quieras sobre el negocio: ventas, stock, leads, caja, cobros, patrimonio o vendedores.</p>
                  <div className="flex flex-col gap-2">
                    {PREGUNTAS_RAPIDAS.map((p, i) => (
                      <CascadaItem key={p} i={i}><button onClick={() => enviar(p)} className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-indigo-300">{p}</button></CascadaItem>
                    ))}
                  </div>
                </div>
              )}

              {mensajes.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${m.role === "user" ? "bg-indigo-600 text-white rounded-br-md" : "bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-bl-md"}`}>
                    {m.role === "assistant" ? <Texto contenido={m.content} /> : <p className="whitespace-pre-wrap">{m.content}</p>}
                    {m.acciones && m.acciones.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {m.acciones.map((a) => (
                          <Link key={a.link + a.texto} href={a.link} onClick={() => setAbierto(false)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-200 text-xs font-bold hover:bg-indigo-100">
                            {a.texto} <ArrowRight className="w-3 h-3" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {cargando && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Mirando los números…</div>
                </div>
              )}
              {error && <p className="text-xs text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}
              <div ref={finRef} />
            </div>

            <div className="shrink-0 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] p-2.5 sm:p-3 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={pregunta}
                  onChange={(e) => setPregunta(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); enviar(pregunta); } }}
                  placeholder="Escribí tu pregunta…"
                  rows={1}
                  className="flex-1 min-w-0 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white px-4 py-2.5 text-[15px] outline-none resize-none max-h-[120px] placeholder:text-slate-400"
                />
                <button onClick={() => enviar(pregunta)} disabled={cargando || !pregunta.trim()} aria-label="Enviar" className="shrink-0 w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center disabled:opacity-40">
                  {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.querySelector(".panel-v2-root") ?? document.body
      )}
    </>
  );
}
