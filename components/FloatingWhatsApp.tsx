"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Message = {
  id: number;
  text: string;
  sender: "bot" | "user";
  linkWhatsApp?: { url: string; label: string };
};

// Teléfonos de asesores por sucursal
const SUCURSALES_WHATSAPP: Record<string, { nombre: string; telefono: string }> = {
  vdm: { nombre: "Villa de Mayo (Casa Central)", telefono: "5491137564398" },
  torcuato: { nombre: "Don Torcuato", telefono: "5491157998065" },
  olivos: { nombre: "Olivos", telefono: "5491156520726" },
  default: { nombre: "Atención General", telefono: "5491121907000" },
};

export default function FloatingChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estado para recordar la marca buscada en la conversación actual
  const [marcaConsultada, setMarcaConsultada] = useState<string | null>(null);
  
  // Lista de marcas disponibles en la BD
  const [marcasDisponiblesDB, setMarcasDisponiblesDB] = useState<string[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "¡Hola! Bienvenido a Pfaffen Autos 🚘. Soy tu asistente virtual. ¿En qué te puedo ayudar hoy?",
      sender: "bot",
    },
  ]);

  // Cargar marcas con stock activo de Supabase al montar
  useEffect(() => {
    const fetchMarcas = async () => {
      const { data } = await supabase
        .from("vehiculos")
        .select("marca")
        .in("estado", ["Disponible", "Reservado"]);

      if (data) {
        const marcasUnicas = Array.from(
          new Set(data.map((item) => item.marca.trim()))
        );
        setMarcasDisponiblesDB(marcasUnicas);
      }
    };

    fetchMarcas();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (pathname?.startsWith("/panel") || pathname?.startsWith("/login")) {
    return null;
  }

  // ================= CEREBRO IA CON RECONOCIMIENTO DE MARCAS Y SUCURSALES =================
  const getBotResponse = (
    userText: string
  ): { reply: string; linkWhatsApp?: { url: string; label: string } } => {
    const text = userText
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // 1. Detección de Selección de Sucursal si previamente consultó por un auto/marca
    const esVDM = /\b(villa de mayo|vdm|casa central|adolfo sourdeaux|sourdeaux)\b/.test(text);
    const esTorcuato = /\b(don torcuato|torcuato|tigre|panamericana)\b/.test(text);
    const esOlivos = /\b(olivos|vicente lopez|zona norte)\b/.test(text);

    if (esVDM || esTorcuato || esOlivos) {
      let keySucursal = "default";
      if (esVDM) keySucursal = "vdm";
      if (esTorcuato) keySucursal = "torcuato";
      if (esOlivos) keySucursal = "olivos";

      const sucursalData = SUCURSALES_WHATSAPP[keySucursal];
      const marcaTexto = marcaConsultada ? ` de ${marcaConsultada}` : "";

      const mensajeWA = `¡Hola! Vengo desde el chat de la web. Me interesa consultar por stock y modelos${marcaTexto} disponibles en la Sucursal ${sucursalData.nombre}.`;
      const urlWA = `https://wa.me/${sucursalData.telefono}?text=${encodeURIComponent(mensajeWA)}`;

      return {
        reply: `¡Genial! Podés coordinar una visita o consultar el stock actualizado directamente con un asesor de la Sucursal ${sucursalData.nombre}. Tocá el botón de abajo para ir al WhatsApp:`,
        linkWhatsApp: {
          url: urlWA,
          label: `Hablar con Sucursal ${sucursalData.nombre}`,
        },
      };
    }

    // 2. Comprobar si el usuario pregunta por alguna marca de autos (ej: "tienen ford", "busco toyota", "chevrolet")
    const marcaEncontrada = marcasDisponiblesDB.find((marca) =>
      text.includes(marca.toLowerCase())
    );

    if (marcaEncontrada) {
      setMarcaConsultada(marcaEncontrada);
      return {
        reply: `¡Sí! Tenemos unidades disponibles de ${marcaEncontrada} en stock 🚘.\n\n¿En qué sucursal te gustaría consultar? Contamos con:\n1️⃣ Villa de Mayo (Casa Central)\n2️⃣ Don Torcuato\n3️⃣ Olivos\n\nContestame con el nombre de la sucursal que te quede más cómoda y te conecto directo por WhatsApp.`,
      };
    }

    // Si menciona marcas populares pero no tenemos stock actualmente en la BD
    const marcasPopulares = ["ford", "toyota", "chevrolet", "volkswagen", "fiat", "renault", "peugeot", "audi", "bmw", "jeep", "nissan", "citroen", "honda", "hyundai", "mercedes"];
    const mencionaMarcaSinStock = marcasPopulares.find((m) => text.includes(m));

    if (mencionaMarcaSinStock) {
      const marcaFormateada = mencionaMarcaSinStock.toUpperCase();
      return {
        reply: `Por el momento no contamos con unidades disponibles de ${marcaFormateada} en nuestro stock online.\n\nPodés dejarnos tus datos en el formulario de la web para que te avisemosapenas ingrese uno, o bien contactar a nuestro equipo para pedirlo a medida.`,
      };
    }

    // 3. Matriz de respuestas generales
    const intents = [
      {
        match: /\b(hola|buenas|dia|tarde|noche|que tal|saludos)\b/,
        reply: "¡Hola! Soy el asistente virtual de Pfaffen Autos ✨. ¿En qué te puedo ayudar hoy? Podés preguntarme si tenemos alguna marca específica, financiación o sucursales.",
      },
      {
        match: /\b(donde|ubicacion|sucursal|sucursales|direccion|queda|zona|lugar|encontrar)\b/,
        reply: "Tenemos 3 sucursales estratégicas:\n📍 Casa Central (Villa de Mayo)\n📍 Don Torcuato (Tigre)\n📍 Olivos (Vicente López)\n\n¿Cuál te queda más cerca para comunicarte con un asesor?",
      },
      {
        match: /\b(horario|abierto|atienden|cierran|hora|dias|fines de semana|sabado|domingo)\b/,
        reply: "Nuestras sucursales están abiertas de Lunes a Sábados de 9:00 a 19:00 hs. Los domingos permanecemos cerrados.",
      },
      {
        match: /\b(pago|financiar|financiacion|credito|cuota|bna|tarjeta|prendario|efectivo|transferencia|dolares|usd)\b/,
        reply: "Ofrecemos múltiples facilidades de pago:\n• Contado (ARS y USD).\n• Permuta (tomamos tu usado).\n• Financiación Prendaria y línea Créditos BNA.\n\n¿Querés que te derive con un asesor para armar un plan de cuotas a medida?",
      },
      {
        match: /\b(vender|cotizar|entregar|usado|toman|parte de pago|tasar|tasacion|consignar|consignacion)\b/,
        reply: "¡Sí, por supuesto! 🚗 Tomamos tu auto usado o lo recibimos en consignación para venderlo por vos. Podés ingresar a la sección 'Cotizar' o 'Consignar' en el menú principal para iniciar la tasación.",
      },
      {
        match: /\b(precio|sale|cuesta|valor|catalogo|stock|modelos|0km|usados)\b/,
        reply: "Podés consultar todo nuestro catálogo con fotos y precios actualizados en la sección 'Catálogo' de la web. O decime qué marca estás buscando y te confirmo si la tenemos.",
      },
      {
        match: /\b(humano|asesor|persona|vendedor|hablar con|numero|whatsapp|contacto|telefono|llamar)\b/,
        reply: "¡Claro! ¿Hacia qué sucursal preferís que te derive? (Villa de Mayo, Don Torcuato u Olivos).",
      },
      {
        match: /\b(gracias|excelente|ok|dale|buenisimo|perfecto|genial|listo|chau|adios)\b/,
        reply: "¡Es un placer ayudarte! Cualquier otra duda, estoy a tu disposición. 🚘",
      },
    ];

    for (let intent of intents) {
      if (intent.match.test(text)) {
        return { reply: intent.reply };
      }
    }

    // Fallback general
    return {
      reply: "Entiendo. Para brindarte información más detallada, podés indicarnos en qué sucursal te gustaría ser atendido (Villa de Mayo, Don Torcuato u Olivos) o escribirnos por WhatsApp.",
      linkWhatsApp: {
        url: `https://wa.me/${SUCURSALES_WHATSAPP.default.telefono}?text=${encodeURIComponent("¡Hola Pfaffen Autos! Vengo desde el chat de la web y quisiera hacer una consulta.")}`,
        label: "Hablar con un Asesor",
      },
    };
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

    // 2. Generar respuesta
    const botResult = getBotResponse(userText);
    const typingTime = Math.min(Math.max(botResult.reply.length * 15, 700), 2200);

    setTimeout(() => {
      const newBotMsg: Message = {
        id: Date.now() + 1,
        text: botResult.reply,
        sender: "bot",
        linkWhatsApp: botResult.linkWhatsApp,
      };
      setMessages((prev) => [...prev, newBotMsg]);
      setIsTyping(false);
    }, typingTime);
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
            style={{ height: "min(520px, 75vh)" }}
          >
            {/* Cabecera */}
            <div className="bg-gradient-to-r from-navy to-[#0145F2] px-4 py-3 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm leading-tight">Pfaffen AI Assistant</h3>
                  <span className="text-sky-200 text-[10px] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    En línea
                  </span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[85%] px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-[#0145F2] text-white rounded-2xl rounded-tr-sm"
                        : "bg-white border border-gray-100 text-gray-700 rounded-2xl rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Botón interactivo a WhatsApp si la respuesta lo incluye */}
                  {msg.linkWhatsApp && (
                    <a
                      href={msg.linkWhatsApp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 border border-emerald-500"
                    >
                      {msg.linkWhatsApp.label}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}

              {/* Indicador de escribiendo */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#0145F2]/60 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-[#0145F2]/60 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-[#0145F2]/60 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Formulario de Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
              <input
                type="text"
                placeholder="Escribí tu consulta..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#0145F2] focus:bg-white transition-all placeholder:text-gray-400 text-gray-700"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="bg-[#0145F2] hover:bg-blue-700 disabled:bg-gray-300 text-white p-2.5 rounded-full transition-all shrink-0 shadow-sm active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-navy text-white p-4 rounded-full shadow-[0_10px_40px_-10px_rgba(15,41,62,0.8)] flex items-center justify-center relative border-[3px] border-white z-50 group"
      >
        {isOpen ? (
          <X className="w-7 h-7" />
        ) : (
          <>
            <MessageSquare className="w-7 h-7 group-hover:text-sky-300 transition-colors" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0145F2] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white"></span>
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
}