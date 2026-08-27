"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface Message {
  role: "user" | "assistant";
  content: string;
  link?: string | null;
}

const MENSAJE_INICIAL: Message = {
  role: "assistant",
  content: "¡Hola! Soy el asistente virtual de Pfaffen Autos. Contame qué auto estás buscando y te cuento si lo tenemos en stock.",
};

export default function FloatingChatbot() {
  const pathname = usePathname();
  const enDetalleVehiculo = pathname?.startsWith("/catalogo/") ?? false;

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([MENSAJE_INICIAL]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const limpiarChat = () => {
    setMessages([MENSAJE_INICIAL]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const texto = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: texto }]);
    setLoading(true);

    try {
      const historialParaApi = [...messages, { role: "user" as const, content: texto }]
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historialParaApi }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || data.error || "Perdón, no pude responder. Probá de nuevo." },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Perdón, hubo un error de conexión. Probá de nuevo en un momento." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed ${enDetalleVehiculo ? "bottom-24 lg:bottom-6" : "bottom-6"} right-4 lg:right-6 z-[60] font-sans`}>
      {/* Botón flotante para abrir/cerrar */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); trackEvent("abrir_chat_ia"); }}
          className="bg-[#0145F2] hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 group cursor-pointer border-2 border-white/20"
          aria-label="Abrir chat de asistencia"
        >
          <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"></span>
        </button>
      )}

      {/* Ventana del Chat */}
      {isOpen && (
        <div className="bg-white border border-slate-200 w-[90vw] sm:w-[380px] h-[520px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
          {/* Cabecera del Chat */}
          <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0145F2] flex items-center justify-center text-white shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm tracking-wide">
                  Pfaffen Asistente
                </h3>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>{" "}
                  En línea
                </span>
              </div>
            </div>

            {/* Controles: Limpiar y Cerrar */}
            <div className="flex items-center gap-2">
              <button
                onClick={limpiarChat}
                className="text-slate-400 hover:text-white text-[10px] font-bold uppercase px-2 py-1 rounded hover:bg-white/10 transition-colors"
                title="Borrar historial"
              >
                Limpiar
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cuerpo de los mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 custom-scrollbar">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 items-end ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-[#0145F2]/10 text-[#0145F2] flex items-center justify-center shrink-0 mb-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="max-w-[80%] flex flex-col gap-2">
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-[#0145F2] text-white rounded-br-none font-medium"
                        : "bg-white text-slate-800 rounded-bl-none border border-slate-100"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.link && (
                    <a
                      href={m.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center bg-[#0145F2] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
                    >
                      Ver ficha completa
                    </a>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mb-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 items-end justify-start">
                <div className="w-7 h-7 rounded-full bg-[#0145F2]/10 text-[#0145F2] flex items-center justify-center shrink-0 mb-1">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white p-3.5 rounded-2xl rounded-bl-none border border-slate-100 text-xs text-slate-400 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de envío */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu consulta..."
              className="flex-1 bg-slate-100 border border-transparent focus:border-[#0145F2] focus:bg-white text-xs px-4 py-3 rounded-xl outline-none transition-all text-slate-800 placeholder:text-slate-400 font-medium"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#0145F2] hover:bg-blue-700 disabled:opacity-40 text-white p-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
