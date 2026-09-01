"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { Search, User, Phone, CarFront, Send, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

interface BuscadorFallbackProps {
  isOpen: boolean;
  onClose: () => void;
  busquedaPrevia?: string;
}

export default function BuscadorFallback({ isOpen, onClose, busquedaPrevia = "" }: BuscadorFallbackProps) {
  const [busqueda, setBusqueda] = useState(busquedaPrevia);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Turnstile (anti-spam gratuito) — mismo patrón que el resto de los forms públicos.
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileListo, setTurnstileListo] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  // Actualizar el estado interno si cambia la búsqueda previa desde afuera
  useEffect(() => {
    setBusqueda(busquedaPrevia);
  }, [busquedaPrevia]);

  useEffect(() => {
    if (!isOpen || !turnstileListo || !turnstileRef.current || !window.turnstile) return;
    if (turnstileWidgetId.current) return; // ya renderizado

    turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
  }, [isOpen, turnstileListo]);

  const handleAvisame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busqueda.trim() || !nombre.trim() || !telefono.trim()) {
      setError("Completá todos los campos para que podamos comunicarnos con vos.");
      return;
    }
    if (!turnstileToken) {
      setError("Esperá que cargue la verificación anti-spam y volvé a intentar.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/panel-v2/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turnstileToken, nombre, telefono, busqueda }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar tu pedido.");
    } catch (err) {
      console.error("Error guardando pedido:", err);
      setError("No se pudo enviar tu pedido. Igual te abrimos WhatsApp para que nos escribas directo.");
    } finally {
      setLoading(false);
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setTurnstileToken("");
    }

    // Abrir WhatsApp con el mensaje prearmado
    const numeroOficial = "5491121907000";
    const mensaje = `¡Hola Pfaffen Autos! 🚘\nNo encontré el auto que buscaba en la web y necesito ayuda.\n\n*Me llamo:* ${nombre}\n*Mi teléfono es:* ${telefono}\n*Estoy buscando:* ${busqueda}\n\n¡Espero su contacto!`;
    const waLink = `https://wa.me/${numeroOficial}?text=${encodeURIComponent(mensaje)}`;

    window.open(waLink, "_blank");

    setBusqueda("");
    setNombre("");
    setTelefono("");
    onClose();
  };

  const tituloDinamico = busquedaPrevia 
    ? `Vimos que buscabas "${busquedaPrevia}" y no lo encontraste` 
    : "¿No encontraste lo que buscabas?";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-white/50 hover:bg-white text-slate-400 hover:text-navy rounded-full transition-colors border border-white shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute top-0 right-0 w-48 h-48 bg-[#0145F2]/10 blur-[80px] rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-400/10 blur-[60px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center sm:items-start sm:flex-row gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                 <Search className="w-6 h-6 text-[#0145F2] opacity-80" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-black text-navy tracking-tight mb-1.5 leading-tight pr-4">
                  {tituloDinamico}
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                  Dejanos tus datos. Te ayudamos a conseguir la unidad exacta que necesitás, sin compromiso.
                </p>
              </div>
            </div>

            <form onSubmit={handleAvisame} className="relative z-10 space-y-3 sm:space-y-4">
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

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CarFront className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="¿Qué vehículo estás buscando?"
                  className="w-full bg-white/70 backdrop-blur-md border border-white shadow-inner rounded-xl pl-11 pr-4 py-3 text-navy text-sm outline-none focus:ring-4 focus:ring-[#0145F2]/10 transition-all placeholder:text-slate-400 font-medium"
                />
              </div>

              {error && <p className="text-rose-600 text-xs font-semibold text-center">{error}</p>}

              <div ref={turnstileRef} className="flex justify-center" />

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !turnstileToken}
                  className="w-full bg-gradient-to-r from-[#0145F2] to-blue-600 hover:from-blue-600 hover:to-sky-500 active:scale-95 text-white font-black text-[11px] sm:text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
                >
                  {loading ? (
                    <>Guardando... <Loader2 className="w-4 h-4 animate-spin" /></>
                  ) : (
                    <>Contáctenme <Send className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" onLoad={() => setTurnstileListo(true)} />
        </div>
      )}
    </AnimatePresence>
  );
}