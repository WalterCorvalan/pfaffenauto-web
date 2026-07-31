"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, X, Send, ExternalLink, ChevronRight, 
  Car, Compass, DollarSign, Sparkles, Flame, MapPin, Phone
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type CarCard = {
  id: string;
  marca: string;
  modelo: string;
  precio_publicado_ars: number;
  slug: string;
  imagen: string;
};

type LinkAction = {
  url: string;
  label: string;
  external?: boolean;
  icon?: "whatsapp" | "web" | "map" | "money";
};

type Message = {
  id: number;
  text: string;
  sender: "bot" | "user";
  links?: LinkAction[];
  cars?: CarCard[];
  quickReplies?: { label: string; action: string }[];
};

// Info extendida de sucursales
const SUCURSALES_INFO: Record<string, { nombre: string; telefono: string; slug: string }> = {
  vdm: { nombre: "Casa Central (Villa de Mayo)", telefono: "5491137564398", slug: "casa-central" },
  torcuato: { nombre: "Don Torcuato", telefono: "5491157998065", slug: "don-torcuato" },
  olivos: { nombre: "Olivos", telefono: "5491156520726", slug: "olivos" },
  default: { nombre: "Atención General", telefono: "5491121907000", slug: "" },
};

// Función para parsear texto con asteriscos a negritas de React
const formatMessageText = (text: string): ReactNode[] => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-black text-navy">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

export default function FloatingChatbot() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [marcaConsultada, setMarcaConsultada] = useState<string | null>(null);
  const [marcasDisponiblesDB, setMarcasDisponiblesDB] = useState<string[]>([]);
  
  // Easter Egg "Modo Nitro"
  const [modoNitro, setModoNitro] = useState(false);
  const [clicksRobot, setClicksRobot] = useState(0);

  // Cuestionario Interactivo
  const [quizStep, setQuizStep] = useState<number | null>(null);
  const [quizPref, setQuizPref] = useState<{ tipo?: string; presupuesto?: number }>({});

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "¡Hola! Soy el Asistente Virtual de Pfaffen Autos 🤖. ¿Qué te gustaría explorar hoy?",
      sender: "bot",
      quickReplies: [
        { label: "🌱 Mi primer auto", action: "primer_auto" },
        { label: "🎲 Test Auto Ideal", action: "start_quiz" },
        { label: "💵 Cotizar usado", action: "cotizar" },
        { label: "📍 Sucursales", action: "sucursales" },
      ]
    },
  ]);

  useEffect(() => {
    const fetchMarcas = async () => {
      const { data } = await supabase.from("vehiculos").select("marca").in("estado", ["Disponible", "Reservado"]);
      if (data) {
        const marcasUnicas = Array.from(new Set(data.map((item) => item.marca.trim())));
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

  if (pathname?.startsWith("/panel") || pathname?.startsWith("/login")) return null;

  // ================= BÚSQUEDAS EN BD =================
  const buscarAutosEnBD = async (marca?: string, tipo?: string, maxPrecio?: number): Promise<CarCard[]> => {
    let query = supabase.from("vehiculos").select(`id, marca, modelo, precio_publicado_ars, slug, multimedia_vehiculos(url_archivo)`).in("estado", ["Disponible", "Reservado"]).limit(4);
    if (marca) query = query.ilike("marca", `%${marca}%`);
    if (tipo) query = query.ilike("tipo", `%${tipo}%`);
    if (maxPrecio) query = query.lte("precio_publicado_ars", maxPrecio);
    const { data } = await query;
    if (!data) return [];
    return data.map((v: any) => ({
      id: v.id, marca: v.marca, modelo: v.modelo, precio_publicado_ars: v.precio_publicado_ars, slug: v.slug,
      imagen: v.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg",
    }));
  };

  const buscarAutosLibre = async (busqueda: string): Promise<CarCard[]> => {
    const words = busqueda.split(" ").filter(w => w.length > 2).slice(0, 2);
    if (words.length === 0) return [];
    let orQuery = words.map(w => `marca.ilike.%${w}%,modelo.ilike.%${w}%`).join(",");
    const { data } = await supabase.from("vehiculos").select(`id, marca, modelo, precio_publicado_ars, slug, multimedia_vehiculos(url_archivo)`).in("estado", ["Disponible", "Reservado"]).or(orQuery).limit(4);
    if (!data) return [];
    return data.map((v: any) => ({
      id: v.id, marca: v.marca, modelo: v.modelo, precio_publicado_ars: v.precio_publicado_ars, slug: v.slug,
      imagen: v.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg",
    }));
  };

  // ================= CEREBRO IA =================
  const getBotResponse = async (userText: string): Promise<Partial<Message>> => {
    const text = userText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // --- ACCIONES RÁPIDAS ---
    if (text === "start_quiz") {
      setQuizStep(1);
      return {
        text: "🎯 ¡Genial! Vamos a encontrar tu auto ideal en 2 pasos rápidos.\n\n**Paso 1:** ¿Qué tipo de vehículo estás buscando?",
        quickReplies: [
          { label: "🏙️ Auto Urbano / Sedán", action: "quiz_tipo_auto" },
          { label: "🚙 SUV / 4x4", action: "quiz_tipo_suv" },
          { label: "📦 Utilitario", action: "quiz_tipo_utilitario" },
        ]
      };
    }

    if (text.startsWith("quiz_tipo_")) {
      const tipo = text.includes("suv") ? "SUV" : text.includes("utilitario") ? "Utilitario" : "Auto";
      setQuizPref((prev) => ({ ...prev, tipo }));
      setQuizStep(2);
      return {
        text: `Anotado: **${tipo}** 👍.\n\n**Paso 2:** ¿En qué rango de presupuesto te gustaría moverte?`,
        quickReplies: [
          { label: "Hasta $20.000.000", action: "quiz_precio_20m" },
          { label: "Hasta $35.000.000", action: "quiz_precio_35m" },
          { label: "Más de $35.000.000", action: "quiz_precio_max" },
        ]
      };
    }

    if (text.startsWith("quiz_precio_")) {
      const maxPrecio = text.includes("20m") ? 20000000 : text.includes("35m") ? 35000000 : 999000000;
      setQuizStep(null);
      const autosEncontrados = await buscarAutosEnBD(undefined, quizPref.tipo, maxPrecio);

      if (autosEncontrados.length > 0) {
        return {
          text: `🎉 ¡Acá tenés las mejores opciones de nuestro stock que hacen **MATCH** con tus preferencias!`,
          cars: autosEncontrados,
          links: [{ url: "/catalogo", label: "Ver catálogo completo", icon: "web", external: false }],
          quickReplies: [{ label: "🔄 Reintentar", action: "start_quiz" }]
        };
      } else {
        return {
          text: "No encontré un auto exacto con esos filtros ahora mismo, ¡pero nuestro equipo te lo consigue a medida!",
          links: [{ url: `https://wa.me/${SUCURSALES_INFO.default.telefono}?text=Hola! Busco un auto a medida.`, label: "Contactar Asesor", icon: "whatsapp", external: true }]
        };
      }
    }

    if (text === "primer_auto" || /\b(primer auto|primeros autos|barato|economico)\b/.test(text)) {
      const autosEconomicos = await buscarAutosEnBD(undefined, undefined, 18000000);
      return {
        text: "Para un **primer auto** te recomiendo unidades ágiles, fáciles de mantener y a muy buen precio (seleccioné opciones por debajo de los **$18.000.000**). ¡Mirá estas bellezas!",
        cars: autosEconomicos,
        links: [{ url: "/catalogo", label: "Ver catálogo completo", icon: "web", external: false }]
      };
    }

    if (text === "marcas" || text === "ver_marcas") {
      return {
        text: `Tenemos unidades increíbles esperando por vos. Podés explorar todas las marcas directamente en nuestra web:`,
        links: [{ url: "/marcas", label: "Ver todas las Marcas", icon: "web", external: false }]
      };
    }

    if (text === "cotizar") {
      return {
        text: "¡Excelente! Cotizamos tu auto usado en el acto y lo tomamos como parte de pago. Ingresá tus datos de forma segura acá:",
        links: [{ url: "/cotizador", label: "Abrir Cotizador Online", icon: "money", external: false }]
      };
    }

    // --- DETECCIÓN DE SUCURSALES ---
    const esVDM = /\b(villa de mayo|vdm|casa central|adolfo sourdeaux|sourdeaux)\b/.test(text);
    const esTorcuato = /\b(don torcuato|torcuato|tigre|panamericana)\b/.test(text);
    const esOlivos = /\b(olivos|vicente lopez|zona norte)\b/.test(text);

    if (esVDM || esTorcuato || esOlivos || text === "sucursales") {
      if (text === "sucursales") {
        return {
          text: "Nuestras sucursales oficiales 📍:\n\n1️⃣ **Casa Central** (Villa de Mayo)\n2️⃣ **Don Torcuato**\n3️⃣ **Olivos**\n\nPodés visitar las páginas de cada sucursal para ver su stock exclusivo:",
          links: [
            { url: "/sucursales/casa-central", label: "Casa Central", icon: "map", external: false },
            { url: "/sucursales/don-torcuato", label: "Don Torcuato", icon: "map", external: false },
            { url: "/sucursales/olivos", label: "Olivos", icon: "map", external: false },
          ]
        };
      }
      let key = "default";
      if (esVDM) key = "vdm";
      if (esTorcuato) key = "torcuato";
      if (esOlivos) key = "olivos";

      const suc = SUCURSALES_INFO[key];
      return {
        text: `¡Genial! Acá tenés todo lo que necesitás de la sucursal **${suc.nombre}**. Podés ver los autos que tienen en salón o hablarles directo:`,
        links: [
          { url: `/sucursales/${suc.slug}`, label: `Página de Sucursal`, icon: "web", external: false },
          { url: `https://wa.me/${suc.telefono}`, label: "WhatsApp", icon: "whatsapp", external: true },
        ],
      };
    }

    // --- BÚSQUEDA LIBRE DE AUTOS ---
    const autosLibres = await buscarAutosLibre(text);
    if (autosLibres.length > 0) {
      return {
        text: `Buscando en nuestro stock, encontré estas opciones que coinciden con tu consulta 🚘:`,
        cars: autosLibres,
        links: [
          { url: `/catalogo?q=${encodeURIComponent(text)}`, label: "Ver todos los resultados", icon: "web", external: false }
        ]
      };
    }

    // --- MATRIZ DE INTENCIONES NUEVAS ---
    const intents = [
      {
        match: /\b(hola|buenas|dia|tarde|noche|que tal|saludos)\b/,
        text: "¡Hola! Soy el asistente virtual de Pfaffen Autos 🤖. Podés preguntarme por modelos en stock, financiación o buscar tu primer auto.",
        quickReplies: [
          { label: "🌱 Primer Auto", action: "primer_auto" },
          { label: "📍 Sucursales", action: "sucursales" }
        ]
      },
      {
        match: /\b(dueño|propietario|jefe|quien es el dueño)\b/,
        text: "El fundador y dueño de la concesionaria es **Sergio Pfaffezeller**, quien transmite su pasión por los autos a todo nuestro equipo todos los días. 🚗",
      },
      {
        match: /\b(encargado|encargados|gerente|responsable)\b/,
        text: "Nuestros encargados están siempre dispuestos a ayudarte para que tengas la mejor experiencia: **Lucas** lidera en la sucursal de Don Torcuato y **Gabriel** en Olivos.",
      },
      {
        match: /\b(vendedor|vendedores|comercial|asesor|con quien hablo)\b/,
        text: "Contamos con un equipo de asesores geniales. Elegí la sucursal que te quede más cerca y contactanos por WhatsApp; ¡ahí mismo tu vendedor se presentará con su nombre y te atenderá de 10!",
        quickReplies: [
          { label: "📍 Ver Sucursales", action: "sucursales" }
        ]
      },
      {
        match: /\b(horario|abierto|atienden|cierran|hora|dias|sabado|domingo)\b/,
        text: "⏰ Atendemos de **Lunes a Sábados de 9:00 a 19:00 hs**. Los domingos descansamos para arrancar la semana con todo.",
      },
      {
        match: /\b(pago|financiar|financiacion|credito|cuota|bna|tarjeta|prendario|efectivo|transferencia|dolares|usd)\b/,
        text: "💳 **Opciones de Pago:**\n• Contado (Pesos y Dólares).\n• Permuta (tomamos tu usado).\n• Créditos Prendarios y línea BNA.",
        links: [{ url: "/catalogo", label: "Ir al Catálogo", icon: "web", external: false }]
      },
    ];

    for (let intent of intents) {
      if (intent.match.test(text)) {
        return { text: intent.text, quickReplies: intent.quickReplies, links: intent.links as any };
      }
    }

    // Fallback
    return {
      text: "Te entiendo. Podés usar nuestro buscador de la web o contactarte con un asesor real para que te despeje todas las dudas:",
      links: [
        { url: "/catalogo", label: "Explorar Catálogo", icon: "web", external: false },
        { url: `https://wa.me/${SUCURSALES_INFO.default.telefono}`, label: "Hablar con Asesor", icon: "whatsapp", external: true },
      ]
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const userText = (textToSend || input).trim();
    if (!userText || isTyping) return;

    setInput("");
    setMessages((prev) => [...prev, { id: Date.now(), text: userText, sender: "user" }]);
    setIsTyping(true);

    const botResult = await getBotResponse(userText);
    const typingTime = Math.min(Math.max((botResult.text?.length || 0) * 12, 600), 1800);

    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        text: botResult.text || "",
        sender: "bot",
        links: botResult.links,
        cars: botResult.cars,
        quickReplies: botResult.quickReplies,
      }]);
      setIsTyping(false);
    }, typingTime);
  };

  // Easter Egg
  const handleRobotClick = () => {
    const nuevosClicks = clicksRobot + 1;
    setClicksRobot(nuevosClicks);
    if (nuevosClicks >= 3 && !modoNitro) {
      setModoNitro(true);
      setMessages((prev) => [...prev, {
        id: Date.now(),
        text: "🔥 **¡MODO NITRO ACTIVADO!** 🚀\n¡Descubriste el secreto! Decile a tu vendedor el código **#NITROPFAFFEN** para un beneficio exclusivo.",
        sender: "bot",
      }]);
    }
  };

  const renderLinkIcon = (type?: string) => {
    switch(type) {
      case "whatsapp": return <Phone className="w-3.5 h-3.5" />;
      case "web": return <Compass className="w-3.5 h-3.5" />;
      case "map": return <MapPin className="w-3.5 h-3.5" />;
      case "money": return <DollarSign className="w-3.5 h-3.5" />;
      default: return <ExternalLink className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`mb-4 w-[330px] sm:w-[390px] bg-white/70 backdrop-blur-3xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] border border-white/60 overflow-hidden flex flex-col transition-all ${
              modoNitro ? "ring-4 ring-amber-400/80 shadow-amber-500/30" : ""
            }`}
            style={{ height: "min(560px, 78vh)" }}
          >
            {/* Cabecera (Glass) */}
            <div 
              onClick={handleRobotClick}
              className={`px-4 py-3.5 flex items-center justify-between border-b border-white/50 z-10 cursor-pointer select-none transition-colors ${
                modoNitro ? "bg-amber-500/40 backdrop-blur-md" : "bg-white/40 backdrop-blur-md"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full border relative ${modoNitro ? 'bg-amber-100 border-amber-300' : 'bg-blue-50 border-blue-200'}`}>
                  <Bot className={`w-5 h-5 ${modoNitro ? 'text-amber-600' : 'text-[#0145F2]'}`} />
                  {modoNitro && <Flame className="w-3.5 h-3.5 text-orange-500 absolute -top-1 -right-1 animate-bounce" />}
                </div>
                <div>
                  <h3 className={`font-black text-sm leading-tight ${modoNitro ? 'text-amber-900' : 'text-navy'}`}>
                    {modoNitro ? "Pfaffen AI • Turbo 🔥" : "Pfaffen Assistant"}
                  </h3>
                  <span className="text-gray-500 text-[10px] font-bold tracking-wide flex items-center gap-1 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> En línea
                  </span>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="text-gray-400 hover:text-navy p-1 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-transparent to-slate-50/30 flex flex-col gap-4 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[88%] px-4 py-3 text-xs sm:text-sm shadow-sm whitespace-pre-wrap leading-relaxed backdrop-blur-md ${
                    msg.sender === "user" 
                      ? "bg-[#0145F2]/90 border border-blue-400/30 text-white rounded-[20px] rounded-tr-[4px] font-medium" 
                      : "bg-white/80 border border-white text-slate-700 rounded-[20px] rounded-tl-[4px]"
                  }`}>
                    {/* Renderizamos el texto parseando los asteriscos */}
                    {formatMessageText(msg.text)}
                  </div>

                  {/* CARDS DE AUTOS (Glass) */}
                  {msg.cars && msg.cars.length > 0 && (
                    <div className="mt-3 flex gap-2.5 overflow-x-auto w-full pb-2 custom-scrollbar">
                      {msg.cars.map((car) => (
                        <div
                          key={car.id}
                          onClick={() => { router.push(`/catalogo/${car.slug}`); setIsOpen(false); }}
                          className="min-w-[150px] max-w-[160px] bg-white/60 backdrop-blur-md border border-white rounded-[16px] overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all shrink-0 group cursor-pointer"
                        >
                          <div className="h-20 bg-slate-100/50 overflow-hidden relative mix-blend-multiply">
                            <img src={car.imagen} alt={car.modelo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="p-2.5">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">{car.marca}</span>
                            <h4 className="text-xs font-black text-navy truncate uppercase">{car.modelo}</h4>
                            <span className="text-xs font-black text-[#0145F2] block mt-1">
                              $ {car.precio_publicado_ars?.toLocaleString("es-AR")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CHIPS / SUGERENCIAS RÁPIDAS (Glass) */}
                  {msg.quickReplies && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.quickReplies.map((qr, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(qr.action)}
                          className="bg-white/60 backdrop-blur-md hover:bg-white border border-white text-[#0145F2] text-[10px] font-black tracking-wide uppercase px-3 py-1.5 rounded-full shadow-sm transition-all active:scale-95"
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ENLACES INTERNOS / EXTERNOS (Glass) */}
                  {msg.links && (
                    <div className="mt-2 flex flex-col gap-1.5 w-full items-start">
                      {msg.links.map((link, idx) => (
                        link.external ? (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 font-bold text-[11px] px-4 py-2.5 rounded-[12px] shadow-sm transition-all active:scale-95 border backdrop-blur-md ${
                              link.icon === "whatsapp" 
                                ? "bg-emerald-500/90 hover:bg-emerald-600 text-white border-emerald-400/50" 
                                : "bg-white/60 hover:bg-white text-navy border-white"
                            }`}
                          >
                            {renderLinkIcon(link.icon)} {link.label}
                          </a>
                        ) : (
                          <button
                            key={idx}
                            onClick={() => { router.push(link.url); setIsOpen(false); }}
                            className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md hover:bg-white border border-white text-[#0145F2] font-bold text-[11px] px-4 py-2.5 rounded-[12px] shadow-sm transition-all active:scale-95 text-left"
                          >
                            {renderLinkIcon(link.icon)} {link.label}
                          </button>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Indicador de escribiendo */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/60 backdrop-blur-md border border-white px-4 py-3 rounded-[20px] rounded-tl-[4px] shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Texto (Glass) */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 bg-white/40 backdrop-blur-xl border-t border-white/60 flex items-center gap-2">
              <input
                type="text"
                placeholder="Escribí tu consulta..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-white/70 border border-white rounded-full px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-blue-300 focus:bg-white transition-all placeholder:text-gray-400 text-navy font-medium shadow-inner"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="bg-[#0145F2] hover:bg-blue-600 disabled:bg-gray-300 text-white p-2.5 rounded-full transition-all shrink-0 shadow-md active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTÓN FLOTANTE (Glass) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-[0_8px_32px_0_rgba(1,69,242,0.3)] flex items-center justify-center relative border border-white/40 z-50 transition-all backdrop-blur-xl ${
          modoNitro ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white" : "bg-[#0145F2]/90 text-white"
        }`}
      >
        {isOpen ? (
          <X className="w-7 h-7" />
        ) : (
          <>
            <Bot className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-400 border border-white/50"></span>
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
}