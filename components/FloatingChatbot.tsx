"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function FloatingChatbot() {
  const pathname = usePathname();
  const enDetalleVehiculo = pathname?.startsWith("/catalogo/") ?? false;

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  // ========================================================
  // NUEVO: Estado para saber en qué parte del flujo estamos
  // ========================================================
  const [chatStep, setChatStep] = useState<string>("MENU");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ================= 1. CARGAR MEMORIA =================
  useEffect(() => {
    const chatGuardado = localStorage.getItem("pfaffen_chat_memory");
    const pasoGuardado = localStorage.getItem("pfaffen_chat_step");
    
    if (chatGuardado && pasoGuardado) {
      setMessages(JSON.parse(chatGuardado));
      setChatStep(pasoGuardado);
    } else {
      setMessages([
        {
          role: "assistant",
          content: "¡Hola! Soy el asistente virtual de Pfaffen Autos. ¿En qué te puedo ayudar hoy? Escribí el número de la opción:\n\n1️⃣ Comprar\n2️⃣ Consignar\n3️⃣ Vender\n4️⃣ Seguros",
        },
      ]);
    }
  }, []);

  // ================= 2. GUARDAR MEMORIA =================
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("pfaffen_chat_memory", JSON.stringify(messages));
      localStorage.setItem("pfaffen_chat_step", chatStep);
    }
    if (isOpen) scrollToBottom();
  }, [messages, chatStep, isOpen]);

  // ================= 3. CEREBRO: FLUJO DEL MAPA MENTAL =================
  const procesarMensaje = (textoUsuario: string, currentStep: string) => {
    const t = textoUsuario.toLowerCase();

    // Salida de emergencia: Si el usuario quiere volver a empezar
    if (t.includes("menu") || t.includes("volver") || t.includes("inicio") || t.includes("hola")) {
      return {
        reply: "Volvimos al inicio. Escribí el número de la opción:\n\n1️⃣ Comprar\n2️⃣ Consignar\n3️⃣ Vender\n4️⃣ Seguros",
        nextStep: "MENU"
      };
    }

    switch (currentStep) {
      // ----------------- MENÚ PRINCIPAL -----------------
      case "MENU":
        if (t.includes("1") || t.includes("comprar")) return { reply: "¡Genial! ¿Estás buscando un vehículo NUEVO (0KM) o un USADO?", nextStep: "COMPRAR_TIPO" };
        if (t.includes("2") || t.includes("consignar")) return { reply: "Excelente. Para consignar tu auto y obtener la mayor rentabilidad, por favor pasame: Marca, Modelo, Año, Kilometraje y qué idea de precio tenés.", nextStep: "CONSIGNAR_DATOS" };
        if (t.includes("3") || t.includes("vender")) return { reply: "Para vender tu auto de forma directa y al instante, decime: Marca, Modelo, Año, Kilómetros y el precio pretendido.", nextStep: "VENDER_DATOS" };
        if (t.includes("4") || t.includes("seguro")) return { reply: "Para cotizar tu seguro con las mejores coberturas, necesito que me pases: Marca, Modelo, Año, KM y la localidad de guarda del vehículo.", nextStep: "SEGUROS_DATOS" };
        
        return { reply: "Por favor, elegí una opción válida (1, 2, 3 o 4) o escribí 'Menu' para reiniciar.", nextStep: "MENU" };

      // ----------------- RAMA 1: COMPRAR -----------------
      case "COMPRAR_TIPO":
        if (t.includes("usado")) return { reply: "¿Qué auto estás buscando o qué presupuesto tenés? (Ej: 'Un 5 puertas por 15 millones')", nextStep: "COMPRAR_USADO_CUAL" };
        if (t.includes("nuevo") || t.includes("0km")) return { reply: "¿Qué marca y modelo de 0KM estás buscando?", nextStep: "COMPRAR_NUEVO_CUAL" };
        return { reply: "Por favor indicame si buscás un 'Nuevo' o un 'Usado'.", nextStep: "COMPRAR_TIPO" };

      // USADO
      case "COMPRAR_USADO_CUAL":
        return { reply: "¡Anotado! Si lo tenemos en stock te lo mostraremos enseguida, y si está por ingresar, generaremos un pedido. ¿Qué forma de pago tenés pensada? (Efectivo, Permuta o Crédito)", nextStep: "COMPRAR_USADO_PAGO" };
      case "COMPRAR_USADO_PAGO":
        if (t.includes("credito") || t.includes("crédito") || t.includes("cuotas")) return { reply: "Para evaluar tu crédito en el acto, por favor pasame tu número de CUIL.", nextStep: "COMPRAR_USADO_CUIL" };
        return { reply: "¡Perfecto! Ya derivé tu consulta al vendedor de la sucursal para que te asesore con el stock y el pago. En breve te responde por este medio.", nextStep: "FIN" };
      case "COMPRAR_USADO_CUIL":
        return { reply: "Gracias. Un asesor revisará tu perfil crediticio y te contactará con las opciones de financiación disponibles. ¡Hablamos pronto!", nextStep: "FIN" };

      // NUEVO
      case "COMPRAR_NUEVO_CUAL":
        return { reply: "Si lo tenemos físico te asignaremos un asesor. Si no, trabajamos con todas las marcas y modelos a pedido.\n¿Cómo tenés pensado abonarlo? ¿Entregás un usado en parte de pago?", nextStep: "COMPRAR_NUEVO_PAGO" };
      case "COMPRAR_NUEVO_PAGO":
        if (t.includes("usado") || t.includes("permuta") || t.includes("entrego") || t.includes("si")) return { reply: "¡Bárbaro! Por favor pasame: Marca, Modelo, Año y Kilómetros de tu auto actual.", nextStep: "COMPRAR_NUEVO_USADO_DATOS" };
        return { reply: "¡Anotado! Ya asigné a tu vendedor para que te pase las cotizaciones del 0KM. En unos minutos te escribe.", nextStep: "FIN" };
      case "COMPRAR_NUEVO_USADO_DATOS":
        return { reply: "Perfecto. Le paso todos estos datos a Gabriel y Sergio, nuestros especialistas en 0KM con permuta. Ellos te contactarán enseguida con los números finos.", nextStep: "FIN" };

      // ----------------- RAMA 2: CONSIGNAR -----------------
      case "CONSIGNAR_DATOS":
        return { reply: "¡Gracias por los datos! ¿De qué zona sos? Tenemos sucursales en Villa de Mayo y Don Torcuato.", nextStep: "CONSIGNAR_ZONA" };
      case "CONSIGNAR_ZONA":
        // NOTA: Olivos eliminado de la lógica.
        if (t.includes("villa") || t.includes("mayo")) return { reply: "¡Genial! Gabriel de la sucursal Villa de Mayo se va a poner en contacto con vos para coordinar la consignación.", nextStep: "FIN" };
        if (t.includes("torcuato")) return { reply: "¡Genial! Lucas de la sucursal Don Torcuato te va a escribir a la brevedad para coordinar la revisión.", nextStep: "FIN" };
        return { reply: "¡Anotado! Derivaremos tu consulta al asesor más cercano a tu zona. ¡En breve nos comunicamos!", nextStep: "FIN" };

      // ----------------- RAMA 3: VENDER -----------------
      case "VENDER_DATOS":
        return { reply: "¡Excelente! ¿De qué zona sos? (Villa de Mayo o Don Torcuato)", nextStep: "VENDER_ZONA" };
      case "VENDER_ZONA":
        return { reply: "¡Anotado! Ya le pasé los datos de tu auto al equipo de compras de tu zona. Te van a hablar para hacerte una oferta en efectivo. ¡Gracias!", nextStep: "FIN" };

      // ----------------- RAMA 4: SEGUROS -----------------
      case "SEGUROS_DATOS":
        return { reply: "Con esa info ya podemos cotizar. Un vendedor exclusivo de seguros se va a contactar con vos en los próximos minutos para pasarte las mejores opciones. ¡Saludos!", nextStep: "FIN" };

      // ----------------- FINALIZADO -----------------
      case "FIN":
        return { reply: "Tu consulta ya está en manos de un asesor humano que te va a responder por esta misma vía. Si querés hacer una consulta nueva, escribí la palabra 'Menu'.", nextStep: "FIN" };

      default:
        return { reply: "No te entendí bien. Escribí 'Menu' para volver a ver las opciones.", nextStep: "MENU" };
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setLoading(true);

    // Procesamos la lógica del diagrama de flujo
    setTimeout(() => {
      const { reply, nextStep } = procesarMensaje(userMessage, chatStep);
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
      setChatStep(nextStep); // Avanzamos al siguiente paso del embudo
      setLoading(false);
    }, 1200);
  };

  const limpiarChat = () => {
    const msgInicial: Message[] = [{
      role: "assistant",
      content: "Historial borrado. ¡Hola de nuevo!\n\n1️⃣ Comprar\n2️⃣ Consignar\n3️⃣ Vender\n4️⃣ Seguros",
    }];
    setMessages(msgInicial);
    setChatStep("MENU");
    localStorage.setItem("pfaffen_chat_memory", JSON.stringify(msgInicial));
    localStorage.setItem("pfaffen_chat_step", "MENU");
  };

  return (
    <div className={`fixed ${enDetalleVehiculo ? "bottom-24 lg:bottom-6" : "bottom-6"} right-4 lg:right-6 z-[60] font-sans`}>
      {/* Botón flotante para abrir/cerrar */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
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
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-[#0145F2] text-white rounded-br-none font-medium"
                      : "bg-white text-slate-800 rounded-bl-none border border-slate-100"
                  }`}
                >
                  {m.content}
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