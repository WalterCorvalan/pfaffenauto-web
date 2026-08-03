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
      text: "¡Hola! Soy el Asistente Virtual de Pfaffen Autos 🤖. ¿Qué te gustaría hacer hoy?",
      sender: "bot",
      quickReplies: [
        { label: "🎯 Encontrar mi auto ideal", action: "start_quiz" },
        { label: "🌟 Sorprendeme", action: "sorprendeme" },
        { label: "🤝 Quiero vender mi auto", action: "vender_auto" },
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

    // --- ACCIONES DE INNOVACIÓN ---
    if (text === "sorprendeme") {
      // Busca los últimos 20 autos y elige 1 al azar
      const { data } = await supabase.from("vehiculos").select(`id, marca, modelo, precio_publicado_ars, slug, multimedia_vehiculos(url_archivo)`).in("estado", ["Disponible", "Reservado"]).limit(20);
      if (data && data.length > 0) {
        const randomCar = data[Math.floor(Math.random() * data.length)];
        const mappedCar = {
          id: randomCar.id, marca: randomCar.marca, modelo: randomCar.modelo, precio_publicado_ars: randomCar.precio_publicado_ars, slug: randomCar.slug,
          imagen: randomCar.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"
        };
        return {
          text: "¡Magia pura! 🪄 Cerrá los ojos, acá tenés una unidad destacada al azar que te podría encantar:",
          cars: [mappedCar],
          quickReplies: [
            { label: "🎲 ¡Mostrar otro!", action: "sorprendeme" },
            { label: "🔍 Ver catálogo", action: "catalogo" }
          ]
        };
      }
    }

    if (text === "catalogo") {
      return {
        text: "¡Tenemos muchísimas opciones! Pasate por nuestro catálogo online para ver todo el stock actualizado al instante con fotos HD.",
        links: [{ url: "/catalogo", label: "Abrir Catálogo", icon: "web", external: false }]
      };
    }

    if (text === "vender_auto" || text === "vender") {
      return {
         text: "¡Excelente decisión! 🤝 Compramos tu auto o te ayudamos a venderlo. Podés elegir entre:\n\n• **Consignación Premium:** Lo vendemos por vos y le sacás la máxima rentabilidad.\n• **Venta Directa:** Te lo cotizamos y te llevás el efectivo en el acto.",
         quickReplies: [
           { label: "💵 Cotizar (Venta Directa)", action: "cotizar" },
           { label: "🤝 Consignación Premium", action: "consignar" }
         ]
      };
    }

    if (text === "consignar") {
      return {
         text: "Dejanos tu auto y **despreocupate de todo**. Nosotros nos encargamos de las fotos profesionales, la publicación, mostrarlo seguro en nuestro salón y hacer todos los papeles. 🚘✨",
         links: [{ url: "/consignacion", label: "Quiero Consignar mi Auto", icon: "web" }]
      };
    }

    // --- CUESTIONARIO INTERACTIVO ---
    if (text === "start_quiz") {
      setQuizStep(1);
      return {
        text: "🎯 ¡Genial! Vamos a encontrar tu auto ideal en 2 pasos rápidos.\n\n**Paso 1:** ¿Para qué vas a usar más el auto?",
        quickReplies: [
          { label: "👨‍👩‍👧‍👦 Viajes en familia", action: "quiz_tipo_suv" },
          { label: "💼 Trabajo / Carga", action: "quiz_tipo_utilitario" },
          { label: "🌆 Ciudad / Económico", action: "quiz_tipo_auto" },
        ]
      };
    }

    if (text.startsWith("quiz_tipo_")) {
      const tipo = text.includes("suv") ? "SUV" : text.includes("utilitario") ? "Utilitario" : "Auto";
      setQuizPref((prev) => ({ ...prev, tipo }));
      setQuizStep(2);
      return {
        text: `Anotado: Perfil **${tipo}** 👍.\n\n**Paso 2:** ¿En qué rango de presupuesto te gustaría moverte?`,
        quickReplies: [
          { label: "Hasta $20.000.000", action: "quiz_precio_20m" },
          { label: "Hasta $35.000.000", action: "quiz_precio_35m" },
          { label: "Sin límite / Alta Gama", action: "quiz_precio_max" },
        ]
      };
    }

    if (text.startsWith("quiz_precio_")) {
      const maxPrecio = text.includes("20m") ? 20000000 : text.includes("35m") ? 35000000 : 999000000;
      setQuizStep(null);
      const autosEncontrados = await buscarAutosEnBD(undefined, quizPref.tipo, maxPrecio);

      if (autosEncontrados.length > 0) {
        return {
          text: `🎉 ¡Acá tenés las mejores opciones de nuestro stock que hacen **MATCH** con tu estilo de vida!`,
          cars: autosEncontrados,
          links: [{ url: "/catalogo", label: "Ver catálogo completo", icon: "web", external: false }],
          quickReplies: [{ label: "🔄 Volver a buscar", action: "start_quiz" }]
        };
      } else {
        return {
          text: "Mmm, justo ahora no encontré un auto exacto con esos filtros en la web, ¡pero nuestro equipo te lo consigue a medida!",
          links: [{ url: `https://wa.me/${SUCURSALES_INFO.default.telefono}?text=Hola! Busco un auto a medida.`, label: "Contactar Asesor VIP", icon: "whatsapp", external: true }]
        };
      }
    }

    if (text === "primer_auto" || /\b(primer auto|primeros autos|barato|economico)\b/.test(text)) {
      const autosEconomicos = await buscarAutosEnBD(undefined, undefined, 18000000);
      return {
        text: "Para un **primer auto** te recomiendo unidades ágiles, fáciles de estacionar, de bajo consumo y a muy buen precio. ¡Mirá estas opciones por debajo de los $18M!",
        cars: autosEconomicos,
        links: [{ url: "/catalogo", label: "Ver catálogo completo", icon: "web", external: false }]
      };
    }

    if (text === "marcas" || text === "ver_marcas") {
      return {
        text: `Tenemos unidades increíbles esperando por vos. Podés explorar todas las marcas directamente en nuestra web:`,
        links: [{ url: "/marcas", label: "Explorar por Marcas", icon: "web", external: false }]
      };
    }

    if (text === "cotizar") {
      return {
        text: "¡Excelente! Cotizamos tu auto usado en el acto y lo tomamos como parte de pago. Ingresá tus datos de forma segura en nuestra web:",
        links: [{ url: "/cotizador", label: "Abrir Cotizador Online", icon: "money", external: false }]
      };
    }

    // --- MATRIZ DE INTENCIONES AVANZADAS ---
    const intents = [
      {
        match: /\b(hola|buenas|dia|tarde|noche|que tal|saludos|hey)\b/,
        text: "¡Hola! Soy el asistente virtual de Pfaffen Autos 🤖. Estoy 24/7 acá para ayudarte a buscar modelos, cotizar tu usado o hablar de financiación.",
        quickReplies: [
          { label: "🎯 Encontrar mi auto", action: "start_quiz" },
          { label: "📍 Ver Sucursales", action: "sucursales" }
        ]
      },
      {
        match: /\b(garantia|garantía|seguro|protegida|estado)\b/,
        text: "Todos nuestros autos usados seleccionados cuentan con **Compra Protegida y Garantía**, además de documentación 100% verificada, al día y lista para transferir. Cero sorpresas. 🛡️"
      },
      {
        match: /\b(envio|envios|interior|provincia|mandan|llevan)\b/,
        text: "¡Sí! 🇦🇷 Vendemos y enviamos vehículos a **todo el país**. Coordinamos la logística completa para que el auto llegue a la puerta de tu casa de forma rápida y súper segura."
      },
      {
        match: /\b(moto|motos|plan de ahorro|planes)\b/,
        text: "Tomamos autos usados en parte de pago. Las motos se evalúan caso por caso con gerencia. Te aclaro que **NO tomamos planes de ahorro** ni terrenos. 🏍️"
      },
      {
        match: /\b(requisitos|necesito para financiar|recibo de sueldo|monotributo)\b/,
        text: "Para financiar (Crédito Prendario o Créditos BNA) generalmente vas a necesitar:\n\n• DNI vigente.\n• Servicio a tu nombre.\n• Últimos recibos de sueldo (o constancia de Monotributo/Responsable Inscripto).\n\n¿Te gustaría que un asesor te pre-apruebe el crédito ahora mismo?",
        links: [{ url: `https://wa.me/${SUCURSALES_INFO.default.telefono}?text=Hola, quiero pre-aprobar un crédito prendario.`, label: "Pre-aprobar crédito", icon: "whatsapp", external: true }]
      },
      {
        match: /\b(pago|financiar|financiacion|credito|cuota|bna|tarjeta|prendario|efectivo|transferencia|dolares|usd)\b/,
        text: "💳 **Tenemos excelentes opciones de pago:**\n• Contado (Pesos y Dólares).\n• Permuta (tomamos tu auto usado llave por llave).\n• Créditos Prendarios y línea BNA con tasas exclusivas.",
        links: [{ url: "/catalogo", label: "Buscar mi próximo auto", icon: "web", external: false }]
      },
      {
        match: /\b(dueño|propietario|jefe|quien es el dueño)\b/,
        text: "El fundador y dueño de la concesionaria es **Sergio Pfaffezeller**, quien transmite su enorme pasión por los fierros a todo nuestro equipo comercial día a día. 🚗",
      },
      {
        match: /\b(horario|abierto|atienden|cierran|hora|dias|sabado|domingo)\b/,
        text: "⏰ Nuestros salones están abiertos de **Lunes a Sábados de 9:00 a 19:00 hs**. Los domingos descansamos para arrancar la semana con toda la energía.",
      },
    ];

    for (let intent of intents) {
      if (intent.match.test(text)) {
        return { text: intent.text, quickReplies: intent.quickReplies, links: intent.links as any };
      }
    }

    // --- DETECCIÓN DE SUCURSALES ---
    const esVDM = /\b(villa de mayo|vdm|casa central|adolfo sourdeaux|sourdeaux)\b/.test(text);
    const esTorcuato = /\b(don torcuato|torcuato|tigre|panamericana)\b/.test(text);
    const esOlivos = /\b(olivos|vicente lopez|zona norte)\b/.test(text);

    if (esVDM || esTorcuato || esOlivos || text === "sucursales") {
      if (text === "sucursales") {
        return {
          text: "Nuestras sucursales oficiales 📍:\n\n1️⃣ **Casa Central** (Villa de Mayo)\n2️⃣ **Don Torcuato**\n3️⃣ **Olivos**\n\nElegí la que te quede más cómoda para ver su stock exclusivo o hablar con los chicos del salón:",
          links: [
            { url: "/sucursales/casa-central", label: "Ver Casa Central", icon: "map", external: false },
            { url: "/sucursales/don-torcuato", label: "Ver Don Torcuato", icon: "map", external: false },
            { url: "/sucursales/olivos", label: "Ver Olivos", icon: "map", external: false },
          ]
        };
      }
      let key = "default";
      if (esVDM) key = "vdm";
      if (esTorcuato) key = "torcuato";
      if (esOlivos) key = "olivos";

      const suc = SUCURSALES_INFO[key];
      return {
        text: `¡Genial! Acá tenés el acceso directo a nuestra sucursal **${suc.nombre}**. Podés chusmear qué tienen en el salón hoy o mandarles un mensajito:`,
        links: [
          { url: `/sucursales/${suc.slug}`, label: `Página de la Sucursal`, icon: "web", external: false },
          { url: `https://wa.me/${suc.telefono}`, label: "Mandar WhatsApp", icon: "whatsapp", external: true },
        ],
      };
    }

    // --- BÚSQUEDA LIBRE DE AUTOS (Fallback inteligente) ---
    const autosLibres = await buscarAutosLibre(text);
    if (autosLibres.length > 0) {
      return {
        text: `Buscando en nuestro stock, encontré estas hermosuras que coinciden con tu consulta 🚘:`,
        cars: autosLibres,
        links: [
          { url: `/catalogo?q=${encodeURIComponent(text)}`, label: "Ver todos los resultados", icon: "web", external: false }
        ]
      };
    }

    // Fallback absoluto si nada hace match
    return {
      text: "Te entiendo perfecto. Para darte la información más precisa, te recomiendo usar nuestro buscador o hablar directamente con uno de nuestros asesores humanos:",
      links: [
        { url: "/catalogo", label: "Explorar Catálogo", icon: "web", external: false },
        { url: `https://wa.me/${SUCURSALES_INFO.default.telefono}`, label: "Hablar con un Humano", icon: "whatsapp", external: true },
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
    const typingTime = Math.min(Math.max((botResult.text?.length || 0) * 15, 600), 1500); // Tipeo un poquito más natural

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

  // Easter Egg "Modo Nitro"
  const handleRobotClick = () => {
    const nuevosClicks = clicksRobot + 1;
    setClicksRobot(nuevosClicks);
    if (nuevosClicks >= 3 && !modoNitro) {
      setModoNitro(true);
      setMessages((prev) => [...prev, {
        id: Date.now(),
        text: "🔥 **¡MODO NITRO ACTIVADO!** 🚀\n¡Encontraste el Easter Egg! Cuando hables con tu vendedor, decile el código secreto **#NITROPFAFFEN** para desbloquear un beneficio especial en tu compra.",
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
                    <div className="mt-3 flex gap-2.5 overflow-x-auto w-full pb-2 custom-scrollbar snap-x">
                      {msg.cars.map((car) => (
                        <div
                          key={car.id}
                          onClick={() => { router.push(`/catalogo/${car.slug}`); setIsOpen(false); }}
                          className="min-w-[150px] max-w-[160px] bg-white/60 backdrop-blur-md border border-white rounded-[16px] overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all shrink-0 group cursor-pointer snap-center"
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