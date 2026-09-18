"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { User, Phone, Send, X, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

interface Favorito {
  id: string;
  marca: string;
  modelo: string;
  slug: string;
}

interface Props {
  isOpen: boolean;
  favoritos: Favorito[];
  onClose: () => void;
}

// Mismo endpoint que BuscadorFallback.tsx (/api/panel/pedidos) -- antes esta
// pantalla armaba un link de WhatsApp con la lista de favoritos, que el
// cliente tenía que mandar a mano y quedaba fuera del panel. Ahora crea un
// pedido real (tabla "pedidos"), visible en /panel/pedidos como cualquier
// otro pedido entrante de la web.
export default function FavoritosPedidoModal({ isOpen, favoritos, onClose }: Props) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileListo, setTurnstileListo] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !turnstileListo || !turnstileRef.current || !window.turnstile) return;
    if (turnstileWidgetId.current) return;

    turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
  }, [isOpen, turnstileListo]);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) {
      setError("Completá tu nombre y teléfono para que podamos comunicarnos con vos.");
      return;
    }
    if (!turnstileToken) {
      setError("Esperá que cargue la verificación anti-spam y volvé a intentar.");
      return;
    }

    setLoading(true);
    setError("");

    const busqueda = favoritos
      .map((f, i) => `${i + 1}. ${f.marca} ${f.modelo} (pfaffencars.com/catalogo/${f.slug})`)
      .join(" · ");

    try {
      const res = await fetch("/api/panel/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnstileToken, nombre, telefono, busqueda: busqueda.slice(0, 200) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar tu pedido.");
      setEnviado(true);
    } catch (err) {
      console.error("Error guardando pedido de favoritos:", err);
      setError("No se pudo enviar tu pedido. Probá de nuevo en unos minutos.");
    } finally {
      setLoading(false);
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setTurnstileToken("");
    }
  };

  const cerrarYResetear = () => {
    setEnviado(false);
    setNombre("");
    setTelefono("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cerrarYResetear}
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white/80 backdrop-blur-2xl border border-white rounded-[28px] p-6 sm:p-8 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative overflow-hidden group text-left z-10"
          >
            <button
              onClick={cerrarYResetear}
              className="absolute top-4 right-4 z-20 p-2 bg-white/50 hover:bg-white text-slate-400 hover:text-navy rounded-full transition-colors border border-white shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute top-0 right-0 w-48 h-48 bg-[#0145F2]/10 blur-[80px] rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>

            {enviado ? (
              <div className="relative z-10 flex flex-col items-center text-center py-6">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center shadow-inner mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-navy tracking-tight mb-1.5">
                  ¡Listo, recibimos tu pedido!
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-sm">
                  Un asesor va a comunicarse con vos para darte más información de {favoritos.length === 1 ? "tu favorito" : "tus favoritos"}.
                </p>
              </div>
            ) : (
              <>
                <div className="relative z-10 mb-6">
                  <h3 className="text-xl sm:text-2xl font-black text-navy tracking-tight mb-1.5 leading-tight pr-6">
                    Consultar por {favoritos.length} {favoritos.length === 1 ? "auto" : "autos"}
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                    Dejanos tus datos y un asesor te contacta con toda la info de tu lista de favoritos.
                  </p>
                </div>

                <form onSubmit={handleEnviar} className="relative z-10 space-y-3 sm:space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="w-full bg-white/70 backdrop-blur-md border border-white shadow-inner rounded-xl pl-11 pr-4 py-3 text-navy text-sm outline-none focus:ring-4 focus:ring-[#0145F2]/10 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Tu teléfono o WhatsApp"
                      className="w-full bg-white/70 backdrop-blur-md border border-white shadow-inner rounded-xl pl-11 pr-4 py-3 text-navy text-sm outline-none focus:ring-4 focus:ring-[#0145F2]/10 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>

                  {error && <p className="text-rose-600 text-xs font-semibold text-center">{error}</p>}

                  <div ref={turnstileRef} className="flex justify-center" />
                  {!turnstileToken && (
                    <p className="text-slate-400 text-[11px] text-center flex items-center justify-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> Cargando verificación anti-spam...
                    </p>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading || !turnstileToken}
                      className="w-full bg-gradient-to-r from-[#0145F2] to-blue-600 hover:from-blue-600 hover:to-sky-500 active:scale-95 text-white font-black text-[11px] sm:text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
                    >
                      {loading ? (
                        <>Enviando... <Loader2 className="w-4 h-4 animate-spin" /></>
                      ) : (
                        <>Enviar pedido <Send className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>

          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" onLoad={() => setTurnstileListo(true)} />
        </div>
      )}
    </AnimatePresence>
  );
}
