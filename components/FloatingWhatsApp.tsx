"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot } from "lucide-react";

type Message = {
  id: number;
  text: string;
  sender: "bot" | "user";
};

export default function FloatingChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "¡Hola! Bienvenido a Pfaffen Autos 🚘. Soy tu asistente virtual. ¿En qué te puedo ayudar hoy?",
      sender: "bot",
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (pathname?.startsWith("/panel") || pathname?.startsWith("/login")) {
    return null;
  }

  // ================= CEREBRO LOCAL (Reglas y Palabras Clave) =================
  const getBotResponse = (userText: string) => {
    // Normalizamos el texto (minúsculas, sin tildes) para que sea más fácil buscar palabras
    const text = userText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (text.includes("hola") || text.includes("buenas") || text.includes("dia") || text.includes("tarde")) {
      return "¡Hola! ¿Buscás comprar un 0km, un usado, o querés entregar tu auto actual?";
    }
    if (text.includes("precio") || text.includes("cotizar") || text.includes("valor") || text.includes("sale")) {
      return "Podés ver todos los precios actualizados en nuestra sección 'Catálogo'. Si querés cotizar tu usado, nuestros expertos lo tasan en el acto.";
    }
    if (text.includes("horario") || text.includes("abierto") || text.includes("atienden")) {
      return "Nuestras sucursales están abiertas de Lunes a Sábados de 9:00 a 19:00 hs.";
    }
    if (text.includes("sucursal") || text.includes("ubicacion") || text.includes("donde") || text.includes("direccion")) {
      return "Contamos con sucursales en Villa de Mayo, Olivos y Panamericana. ¡Te esperamos!";
    }
    if (text.includes("forma de pago") || text.includes("credito") || text.includes("financiar") || text.includes("cuota")) {
      return "Aceptamos pago al contado, permutas y ofrecemos excelentes planes de financiación. Un asesor puede armarte un plan a medida.";
    }
    if (text.includes("gracias") || text.includes("excelente") || text.includes("ok") || text.includes("dale")) {
      return "¡De nada! Cualquier otra consulta, estoy a tu disposición. 🚘";
    }
    if (text.includes("humano") || text.includes("asesor") || text.includes("persona") || text.includes("vendedor")) {
      return "Si preferís hablar con un asesor comercial, podés enviarnos un WhatsApp al 11 2190-7000.";
    }

    // Respuesta por defecto si no reconoce ninguna palabra clave (El embudo hacia WhatsApp)
    return "Entiendo. Para darte una respuesta más exacta sobre eso, te sugiero que nos escribas a nuestro WhatsApp oficial (11 2190-7000) y un asesor te atenderá enseguida.";
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput("");

    // 1. Mostrar mensaje del usuario
    const newUserMsg: Message = { id: Date.now(), text: userText, sender: "user" };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);

    // 2. Simular que el bot "piensa" (1.5 segundos de demora)
    setTimeout(() => {
      const replyText = getBotResponse(userText);
      const newBotMsg: Message = { id: Date.now() + 1, text: replyText, sender: "bot" };
      setMessages((prev) => [...prev, newBotMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[320px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
            style={{ height: "min(500px, 70vh)" }}
          >
            {/* Cabecera */}
            <div className="bg-[#0055A4] px-4 py-3 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-full">
                  <Bot className="w-5 h-5 text-[#0055A4]" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm leading-tight">Pfaffen Bot</h3>
                  <span className="text-sky-200 text-[10px] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    En línea
                  </span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-4 py-2.5 text-sm rounded-2xl shadow-sm whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-[#0055A4] text-white rounded-tr-sm"
                        : "bg-white border border-gray-100 text-gray-700 rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Indicador de escribiendo */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#0055A4]/60 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-[#0055A4]/60 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-[#0055A4]/60 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Formulario de Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
              <input
                type="text"
                placeholder="Preguntame sobre autos, ubicación..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-[#0055A4] transition-colors placeholder:text-gray-400 text-gray-700"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="bg-[#0055A4] hover:bg-blue-700 disabled:bg-gray-300 text-white p-2.5 rounded-full transition-colors shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante que abre el chat */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#0055A4] text-white p-4 rounded-full shadow-[0_10px_40px_-10px_rgba(0,85,164,0.8)] flex items-center justify-center relative border-[3px] border-white"
      >
        {isOpen ? <X className="w-7 h-7" /> : (
          <>
            <MessageSquare className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
}