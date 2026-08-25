"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Script from "next/script";
import { supabase } from "@/lib/supabase/client";
import { getCanalOrigen } from "@/lib/utm";
import { CreditCard, X, CheckCircle2, Loader2, User, Phone, Mail, ArrowLeft, Search, Car } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

interface VehiculoFinanciable {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number | null;
  precio_publicado_ars: number | null;
  sucursales: { nombre: string } | null;
}

interface SolicitarFinanciacionFormProps {
  // Si se pasa (ej: desde la ficha del auto), se salta el paso de búsqueda.
  vehiculoPreseleccionado?: VehiculoFinanciable;
  className?: string;
  label?: string;
}

const TNA = 0.46;
const PLAZOS = [24, 48, 72];

function calcularCuota(montoAFinanciar: number, plazoMeses: number): number {
  if (montoAFinanciar <= 0) return 0;
  const tasaMensual = TNA / 12;
  const cuotaPura =
    (montoAFinanciar * (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses))) /
    (Math.pow(1 + tasaMensual, plazoMeses) - 1);
  return Math.round(cuotaPura);
}

export default function SolicitarFinanciacionForm({ vehiculoPreseleccionado, className, label = "Solicitar mi crédito" }: SolicitarFinanciacionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Paso: 1 = elegir auto (se salta si viene preseleccionado), 2 = simulación, 3 = preaprobado, 4 = contacto
  const [step, setStep] = useState(vehiculoPreseleccionado ? 2 : 1);
  const [vehiculo, setVehiculo] = useState<VehiculoFinanciable | null>(vehiculoPreseleccionado || null);

  // Paso 1: búsqueda de stock
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<VehiculoFinanciable[]>([]);
  const [buscando, setBuscando] = useState(false);

  // Paso 2: simulación
  const [anticipoPorcentaje, setAnticipoPorcentaje] = useState(50);
  const [meses, setMeses] = useState(48);

  // Paso 3: preaprobado
  const [creditoPreaprobado, setCreditoPreaprobado] = useState<"si" | "no" | null>(null);

  // Paso 4: contacto
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileListo, setTurnstileListo] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // El script de Turnstile puede haber quedado cargado de otra página en la
    // misma sesión (next/script dedupea por src): en ese caso onLoad no vuelve
    // a dispararse acá, así que chequeamos directo si ya está disponible.
    if (window.turnstile) setTurnstileListo(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    if (step !== 4 || !turnstileListo || !turnstileRef.current || !window.turnstile) return;
    if (turnstileWidgetId.current) return;
    turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
  }, [step, turnstileListo]);

  // Buscar en stock real (solo disponibles) mientras el usuario tipea.
  useEffect(() => {
    if (step !== 1) return;
    if (busqueda.trim().length < 2) { setResultados([]); return; }
    setBuscando(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("vehiculos")
        .select("id, marca, modelo, anio, kilometraje, precio_publicado_ars, sucursales!vehiculos_sucursal_id_fkey ( nombre )")
        .eq("estado", "Disponible")
        .or(`marca.ilike.%${busqueda}%,modelo.ilike.%${busqueda}%`)
        .limit(8);
      setResultados((data as any) || []);
      setBuscando(false);
    }, 350);
    return () => clearTimeout(timeout);
  }, [busqueda, step]);

  const precioVehiculo = vehiculo?.precio_publicado_ars || 0;
  const anticipoCliente = (precioVehiculo * anticipoPorcentaje) / 100;
  const montoAFinanciar = precioVehiculo - anticipoCliente;

  const elegirVehiculo = (v: VehiculoFinanciable) => {
    setVehiculo(v);
    setStep(2);
  };

  const cerrar = () => {
    if (loading || success) return;
    setIsOpen(false);
  };

  const reset = () => {
    setStep(vehiculoPreseleccionado ? 2 : 1);
    setVehiculo(vehiculoPreseleccionado || null);
    setBusqueda(""); setResultados([]);
    setAnticipoPorcentaje(50); setMeses(48);
    setCreditoPreaprobado(null);
    setNombre(""); setEmail(""); setTelefono("");
    setTurnstileToken("");
    turnstileWidgetId.current = null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!vehiculo || !nombre || !email || !telefono) return;
    if (!turnstileToken) {
      setError("Completá la verificación anti-spam antes de continuar.");
      return;
    }

    setLoading(true);
    try {
      const cuota = calcularCuota(montoAFinanciar, meses);
      const sucursalNombre = vehiculo.sucursales?.nombre || "Casa Central";
      const response = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstileToken,
          canal_origen: getCanalOrigen(),
          vehiculo_id: vehiculo.id,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          anio: vehiculo.anio,
          kilometraje: vehiculo.kilometraje ?? 0,
          version: `Solicitud de crédito: anticipo $${anticipoCliente.toLocaleString("es-AR")} (${anticipoPorcentaje}%), financia $${montoAFinanciar.toLocaleString("es-AR")} en ${meses} cuotas de $${cuota.toLocaleString("es-AR")} aprox. Crédito preaprobado: ${creditoPreaprobado === "si" ? "Sí" : "No"}.`,
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
          puede_venir_sucursal: false,
          fotos_y_videos: [],
          sucursal_preferida: sucursalNombre,
          tipo_peritaje: "financiacion",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al enviar la solicitud");

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        reset();
      }, 4500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hubo un error al enviar la solicitud. Intentá nuevamente.");
      if (turnstileWidgetId.current && window.turnstile) window.turnstile.reset(turnstileWidgetId.current);
      setTurnstileToken("");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-navy dark:text-white outline-none focus:border-[#0145F2] dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-sky-400/10 transition-all shadow-sm dark:shadow-none";
  const labelClass = "text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5";

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={cerrar}></div>

      <div className="relative bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl w-full max-w-[450px] flex flex-col max-h-[90vh] z-10 overflow-hidden animate-fadeIn">
        <div className="bg-[#0b1329] p-5 relative shrink-0">
          <button onClick={cerrar} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#0145F2]" /> Solicitar Crédito
          </h3>
          <p className="text-[11px] text-sky-200 mt-1 font-medium">
            {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.anio})` : "Elegí el auto que querés financiar"}
          </p>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-50 dark:bg-white/5">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-400/10 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-xl font-black text-navy dark:text-white mb-2">¡Solicitud enviada!</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm">
                Un asesor de {vehiculo?.sucursales?.nombre || "Pfaffen Autos"} te va a contactar a la brevedad para avanzar con tu crédito.
              </p>
            </div>
          ) : (
            <>
              {/* PASO 1: elegir auto del stock */}
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscá por marca o modelo..."
                      className={`${inputClass} pl-11`}
                    />
                  </div>

                  {buscando && (
                    <div className="flex items-center justify-center py-6 text-slate-400 text-xs gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Buscando en stock...
                    </div>
                  )}

                  {!buscando && busqueda.trim().length >= 2 && resultados.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">No encontramos autos disponibles con esa búsqueda.</p>
                  )}

                  <div className="space-y-2">
                    {resultados.map((v) => (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => elegirVehiculo(v)}
                        className="w-full flex items-center gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-3 text-left hover:border-[#0145F2] dark:hover:border-sky-400 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-sky-400/10 flex items-center justify-center shrink-0">
                          <Car className="w-5 h-5 text-[#0145F2] dark:text-sky-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-navy dark:text-white text-xs truncate">{v.marca} {v.modelo} ({v.anio})</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                            {v.precio_publicado_ars ? `$ ${v.precio_publicado_ars.toLocaleString("es-AR")}` : "Consultar precio"} · {v.sucursales?.nombre || "Casa Central"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PASO 2: simulación con precio real del auto elegido */}
              {step === 2 && vehiculo && (
                <div className="space-y-6 animate-fadeIn">
                  {!vehiculoPreseleccionado && (
                    <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-[#0145F2] dark:text-sky-400 flex items-center gap-1 hover:underline">
                      <ArrowLeft className="w-3.5 h-3.5" /> Cambiar auto
                    </button>
                  )}

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Anticipo ({anticipoPorcentaje}%)</label>
                      <span className="text-xl font-black text-navy dark:text-white">$ {anticipoCliente.toLocaleString("es-AR")}</span>
                    </div>
                    <input
                      type="range" min="30" max="80" step="5"
                      value={anticipoPorcentaje}
                      onChange={(e) => setAnticipoPorcentaje(Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-[#0145F2]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-3">Plazo a financiar</label>
                    <div className="grid grid-cols-3 gap-3">
                      {PLAZOS.map((plazo) => (
                        <button
                          key={plazo} type="button" onClick={() => setMeses(plazo)}
                          className={`py-3 rounded-xl text-sm font-black transition-all ${meses === plazo ? "bg-[#0145F2] text-white shadow-lg" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400"}`}
                        >
                          {plazo} cuotas
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Cuota estimada</span>
                    <span className="text-2xl font-black text-[#0145F2] dark:text-sky-300">$ {calcularCuota(montoAFinanciar, meses).toLocaleString("es-AR")}</span>
                  </div>

                  <button
                    type="button"
                    disabled={!precioVehiculo}
                    onClick={() => setStep(3)}
                    className="w-full py-3.5 bg-[#0145F2] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50"
                  >
                    {precioVehiculo ? "Continuar" : "Este auto no tiene precio publicado"}
                  </button>
                </div>
              )}

              {/* PASO 3: crédito preaprobado */}
              {step === 3 && (
                <div className="space-y-5 animate-fadeIn">
                  <button type="button" onClick={() => setStep(2)} className="text-xs font-bold text-[#0145F2] dark:text-sky-400 flex items-center gap-1 hover:underline">
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver
                  </button>
                  <p className="text-sm font-bold text-navy dark:text-white">¿Ya tenés un crédito preaprobado en el Banco Nación?</p>
                  <div className="space-y-2">
                    {(["si", "no"] as const).map((op) => (
                      <button
                        type="button" key={op}
                        onClick={() => setCreditoPreaprobado(op)}
                        className={`w-full p-4 rounded-2xl border text-left font-bold text-xs transition-all ${creditoPreaprobado === op ? "bg-blue-50 dark:bg-sky-400/10 border-[#0145F2] dark:border-sky-400 text-[#0145F2] dark:text-sky-300" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"}`}
                      >
                        {op === "si" ? "Sí, ya está preaprobado" : "No, todavía no lo pedí"}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={!creditoPreaprobado}
                    onClick={() => setStep(4)}
                    className="w-full py-3.5 bg-[#0145F2] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {/* PASO 4: contacto + envío */}
              {step === 4 && (
                <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
                  <button type="button" onClick={() => setStep(3)} className="text-xs font-bold text-[#0145F2] dark:text-sky-400 flex items-center gap-1 hover:underline">
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver
                  </button>

                  <div>
                    <label className={labelClass}><User className="w-3.5 h-3.5" /> Nombre completo</label>
                    <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} placeholder="Ej: Juan Pérez" />
                  </div>
                  <div>
                    <label className={labelClass}><Mail className="w-3.5 h-3.5" /> Email</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="tu@email.com" />
                  </div>
                  <div>
                    <label className={labelClass}><Phone className="w-3.5 h-3.5" /> Celular</label>
                    <input type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputClass} placeholder="Ej: 11 0000 0000" />
                  </div>

                  <div className="flex justify-center">
                    <div ref={turnstileRef} />
                  </div>

                  {error && (
                    <div className="bg-rose-50 dark:bg-rose-400/10 border border-rose-100 dark:border-rose-400/20 text-rose-600 dark:text-rose-300 text-xs font-semibold px-4 py-3 rounded-xl animate-shake">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !turnstileToken}
                    className="w-full py-3.5 bg-[#0145F2] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "Enviando..." : "Enviar solicitud"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" onLoad={() => setTurnstileListo(true)} />
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className || "mt-6 flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 rounded-xl transition-colors active:scale-[0.99]"}
      >
        {label}
        <CreditCard className="w-4 h-4" />
      </button>

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}
