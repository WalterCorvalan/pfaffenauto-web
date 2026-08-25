"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Script from "next/script";
import { CalendarDays, X, CheckCircle2, Loader2, MapPin, Clock, CarFront, User, Phone } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

interface AgendarVisitaFormProps {
  auto: any;
  isMobile?: boolean;
}

export default function AgendarVisitaForm({ auto, isMobile = false }: AgendarVisitaFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha, setFecha] = useState("");
  const [horario, setHorario] = useState("10:00");

  // Turnstile (anti-spam)
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileListo, setTurnstileListo] = useState(false);
  const [turnstileError, setTurnstileError] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  const sucursalNombre = auto?.sucursales?.nombre || "Casa Central";
  const autoNombre = `${auto.marca} ${auto.modelo}`;

  // Para asegurar que el Portal solo se renderice en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // No confiamos solo en el onLoad del <Script>: si otra tarjeta del stock ya
  // insertó el mismo script de Turnstile antes, next/script dedupea el tag y
  // este onLoad puede no disparar — con un poll alcanza igual una vez que
  // window.turnstile está disponible.
  useEffect(() => {
    if (!isOpen || turnstileListo) return;
    if (window.turnstile) { setTurnstileListo(true); return; }
    const intervalo = setInterval(() => {
      if (window.turnstile) {
        setTurnstileListo(true);
        clearInterval(intervalo);
      }
    }, 300);
    return () => clearInterval(intervalo);
  }, [isOpen, turnstileListo]);

  // Renderiza el widget de Turnstile cuando se abre el modal
  useEffect(() => {
    if (!isOpen || success || !turnstileListo || !turnstileRef.current || !window.turnstile) return;
    if (turnstileWidgetId.current) return; // ya renderizado

    turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
      callback: (token: string) => { setTurnstileToken(token); setTurnstileError(false); },
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": (code: string) => {
        setTurnstileToken("");
        setTurnstileError(true);
        console.error("[turnstile] error-callback:", code, "— probable causa: el dominio actual no está autorizado para este sitekey en el dashboard de Cloudflare.");
      },
    });
  }, [isOpen, success, turnstileListo]);

  // Bloquear el scroll de fondo cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nombre || !telefono || !fecha || !horario) return;
    if (!turnstileToken) {
      setError("Completá la verificación anti-spam antes de continuar.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/visitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstileToken,
          vehiculo_id: auto.id,
          nombre_cliente: nombre.trim(),
          telefono_cliente: telefono.trim(),
          fecha_visita: fecha,
          horario_visita: horario,
          sucursal: sucursalNombre,
          vendedor_id: auto?.vendedor_asignado_id || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al agendar la visita");

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setNombre(""); setTelefono(""); setFecha(""); setHorario("10:00");
        setTurnstileToken("");
        turnstileWidgetId.current = null;
      }, 4000);

    } catch (err) {
      console.error("Error al agendar:", err);
      setError(err instanceof Error ? err.message : "Hubo un error al agendar la visita. Intentá nuevamente.");
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setTurnstileToken("");
    } finally {
      setLoading(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Fondo oscuro desenfocado */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={() => !loading && !success && setIsOpen(false)}
      ></div>
      
      {/* Tarjeta del Modal Centrada */}
      <div className="relative bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl w-full max-w-[450px] flex flex-col max-h-[90vh] z-10 overflow-hidden animate-fadeIn">
        
        {/* Header del Modal */}
        <div className="bg-[#0b1329] p-5 relative shrink-0">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#0145F2]" /> Agendar Visita
          </h3>
          <p className="text-[11px] text-sky-200 mt-1 font-medium">Reservá tu turno para ver la unidad en persona.</p>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-50 dark:bg-white/5">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-400/10 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-xl font-black text-navy dark:text-white mb-2">¡Turno Confirmado!</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm">
                Te esperamos el <strong>{fecha.split('-').reverse().join('/')}</strong> a las <strong>{horario} hs</strong> en <strong>Sucursal {sucursalNombre}</strong>. Un asesor te contactará para reconfirmar.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Resumen del auto a ver */}
              <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-3 flex items-center gap-3 shadow-sm dark:shadow-none">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-sky-400/10 flex items-center justify-center shrink-0">
                  <CarFront className="w-5 h-5 text-[#0145F2] dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Unidad de interés</p>
                  <p className="font-black text-navy dark:text-white text-xs">{autoNombre}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-bold">
                    <MapPin className="w-2.5 h-2.5 text-[#0145F2] dark:text-sky-400" /> {sucursalNombre}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><User className="w-3.5 h-3.5"/> Nombre completo</label>
                  <input
                    type="text" required autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-navy dark:text-white outline-none focus:border-[#0145F2] dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-sky-400/10 transition-all shadow-sm dark:shadow-none"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> Celular</label>
                  <input
                    type="tel" required autoComplete="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-navy dark:text-white outline-none focus:border-[#0145F2] dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-sky-400/10 transition-all shadow-sm dark:shadow-none"
                    placeholder="Ej: 11 0000 0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5"/> Día</label>
                  <input 
                    type="date" required min={minDate} value={fecha} onChange={(e) => setFecha(e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-xs font-semibold text-navy dark:text-white outline-none focus:border-[#0145F2] dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-sky-400/10 transition-all shadow-sm dark:shadow-none cursor-pointer dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Hora aprox.</label>
                  <select 
                    required value={horario} onChange={(e) => setHorario(e.target.value)}
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-xs font-semibold text-navy dark:text-white outline-none focus:border-[#0145F2] dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-sky-400/10 transition-all shadow-sm dark:shadow-none cursor-pointer dark:[color-scheme:dark]"
                  >
                    <option value="09:00">09:00 hs (Mañana)</option>
                    <option value="10:00">10:00 hs</option>
                    <option value="11:00">11:00 hs</option>
                    <option value="12:00">12:00 hs</option>
                    <option value="14:00">14:00 hs (Tarde)</option>
                    <option value="15:00">15:00 hs</option>
                    <option value="16:00">16:00 hs</option>
                    <option value="17:00">17:00 hs</option>
                    <option value="18:00">18:00 hs</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <div ref={turnstileRef} />
                {turnstileError && (
                  <p className="text-rose-500 text-[11px] font-semibold text-center max-w-xs">
                    No se pudo cargar la verificación anti-spam. Puede ser un bloqueador de anuncios o un problema temporal — probá recargar la página.
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-rose-50 dark:bg-rose-400/10 border border-rose-100 dark:border-rose-400/20 text-rose-600 dark:text-rose-300 text-xs font-semibold px-4 py-3 rounded-xl animate-shake">
                  {error}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !turnstileToken}
                  className="flex-[2] py-3.5 bg-[#0145F2] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Agendando..." : "Confirmar Visita"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onLoad={() => setTurnstileListo(true)}
      />
    </div>
  );

  return (
    <>
      {/* BOTÓN DISPARADOR (Se adapta perfecto a PC y Móvil) */}
      <button
        onClick={() => setIsOpen(true)}
        className={
          isMobile
            ? "w-full h-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-navy dark:text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-sm dark:shadow-none hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            : "block w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-navy dark:text-white font-black text-xs uppercase tracking-widest text-center py-4 rounded-2xl shadow-sm dark:shadow-none hover:bg-slate-50 dark:hover:bg-white/10 hover:border-blue-200 dark:hover:border-sky-400/30 hover:text-[#0145F2] dark:hover:text-sky-300 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 group"
        }
      >
        <CalendarDays className={`transition-transform ${isMobile ? "w-4 h-4 text-[#0145F2]" : "w-4 h-4 text-[#0145F2] group-hover:scale-110"}`} />
        <span>Agendar {isMobile ? "" : "Visita"}</span>
      </button>

      {/* RENDERIZAMOS EL MODAL USANDO UN PORTAL */}
      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}