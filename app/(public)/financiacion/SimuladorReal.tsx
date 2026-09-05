"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { supabase2 as supabase } from "@/lib/supabase2/client";
import { getCanalOrigen } from "@/lib/utm";
import { CreditCard, CheckCircle2, Loader2, User, Phone, Mail, ArrowLeft, Search, Car } from "lucide-react";

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
  km: number | null;
  precio_publicado_ars: number | null;
  precio_publicado_usd: number | null;
  precio_venta: number | null;
  moneda_venta: "USD" | "ARS" | null;
  sucursales: { nombre: string } | null;
}

// precio_publicado_ars es un campo que carga Marketing para avisos (no todos
// los autos lo tienen) — sin este fallback, un auto sin ese campo cargado
// simulaba financiación sobre $0. Se resuelve con lo mejor disponible: el
// publicado en ARS, si no el publicado en USD convertido, si no el precio de
// venta real convertido (según su moneda).
function resolverPrecioArs(v: VehiculoFinanciable, dolarVenta: number | null): number {
  if (v.precio_publicado_ars) return v.precio_publicado_ars;
  if (v.precio_publicado_usd && dolarVenta) return Math.round(v.precio_publicado_usd * dolarVenta);
  if (v.precio_venta) {
    if (v.moneda_venta === "ARS") return v.precio_venta;
    if (v.moneda_venta === "USD" && dolarVenta) return Math.round(v.precio_venta * dolarVenta);
  }
  return 0;
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

// Simulador real de /financiacion: a diferencia del banner del home (que muestra
// una simulación de referencia sobre un auto ficticio), acá se trabaja siempre
// sobre stock real desde el paso 1 — nada de "vehículo base" inventado.
export default function SimuladorReal() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [step, setStep] = useState(1);
  const [vehiculo, setVehiculo] = useState<VehiculoFinanciable | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<VehiculoFinanciable[]>([]);
  const [buscando, setBuscando] = useState(false);

  const [anticipoPorcentaje, setAnticipoPorcentaje] = useState(50);
  const [meses, setMeses] = useState(48);

  const [creditoPreaprobado, setCreditoPreaprobado] = useState<"si" | "no" | null>(null);
  const [dolarVenta, setDolarVenta] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/dolar-blue").then((r) => r.json()).then((d) => { if (d.venta) setDolarVenta(d.venta); }).catch(() => {});
  }, []);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileListo, setTurnstileListo] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  useEffect(() => {
    if (window.turnstile) setTurnstileListo(true);
  }, []);

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

  // Al entrar al paso 1 mostramos algunos autos ya (destacados) para no dejar
  // la pantalla vacía pidiendo que el usuario escriba primero.
  useEffect(() => {
    if (step !== 1) return;
    setBuscando(true);
    const timeout = setTimeout(async () => {
      let query = supabase
        .from("vehiculos")
        .select("id, marca, modelo, anio, km, precio_publicado_ars, precio_publicado_usd, precio_venta, moneda_venta, sucursales!vehiculos_sucursal_id_fkey ( nombre )")
        .eq("estado", "disponible")
        .limit(6);

      query = busqueda.trim().length >= 2
        ? query.or(`marca.ilike.%${busqueda}%,modelo.ilike.%${busqueda}%`)
        : query.order("destacado", { ascending: false });

      const { data } = await query;
      setResultados((data as any) || []);
      setBuscando(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [busqueda, step]);

  const precioVehiculo = vehiculo ? resolverPrecioArs(vehiculo, dolarVenta) : 0;
  const anticipoCliente = (precioVehiculo * anticipoPorcentaje) / 100;
  const montoAFinanciar = precioVehiculo - anticipoCliente;

  const elegirVehiculo = (v: VehiculoFinanciable) => {
    setVehiculo(v);
    setStep(2);
  };

  const reset = () => {
    setStep(1);
    setVehiculo(null);
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
      const response = await fetch("/api/panel-v2/leads-tasacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstileToken,
          canalOrigen: getCanalOrigen(),
          vehiculoObjetivoId: vehiculo.id,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          anio: vehiculo.anio,
          kilometraje: vehiculo.km ?? 0,
          version: `Solicitud de crédito: anticipo $${anticipoCliente.toLocaleString("es-AR")} (${anticipoPorcentaje}%), financia $${montoAFinanciar.toLocaleString("es-AR")} en ${meses} cuotas de $${cuota.toLocaleString("es-AR")} aprox. Crédito preaprobado: ${creditoPreaprobado === "si" ? "Sí" : "No"}.`,
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
          tipo: "financiacion",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al enviar la solicitud");

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hubo un error al enviar la solicitud. Intentá nuevamente.");
      if (turnstileWidgetId.current && window.turnstile) window.turnstile.reset(turnstileWidgetId.current);
      setTurnstileToken("");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#0145F2] dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-sky-400/10 transition-all";
  const labelClass = "text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5";
  const backLinkClass = "text-xs font-bold text-[#0145F2] dark:text-sky-400 flex items-center gap-1 hover:underline";
  const ctaClass = "w-full bg-[#0145F2] hover:bg-blue-600 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-sm uppercase tracking-widest py-4 rounded-xl transition-all active:scale-95 shadow-xl disabled:opacity-50";

  return (
    <div className="relative bg-white dark:bg-[#0a0a0f] border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 sm:p-10 shadow-2xl overflow-hidden max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#0145F2] dark:text-sky-400" />
          <h2 className="text-xs font-black uppercase tracking-widest text-[#0145F2] dark:text-sky-400">
            {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.anio})` : "Solicitá tu crédito"}
          </h2>
        </div>
        {!success && (
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className={`h-1.5 rounded-full transition-all ${n === step ? "w-5 bg-[#0145F2] dark:bg-sky-400" : n < step ? "w-1.5 bg-[#0145F2]/40 dark:bg-sky-400/50" : "w-1.5 bg-slate-200 dark:bg-white/10"}`} />
            ))}
          </div>
        )}
      </div>

      {success ? (
        <div className="flex flex-col items-center justify-center py-10 text-center animate-fadeIn relative z-10">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-400/10 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">¡Solicitud enviada!</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mb-6">
            Un asesor de {vehiculo?.sucursales?.nombre || "Pfaffen Autos"} te va a contactar a la brevedad para avanzar con tu crédito.
          </p>
          <button
            type="button"
            onClick={reset}
            className="text-xs font-bold text-[#0145F2] dark:text-sky-400 hover:underline"
          >
            Simular otro auto
          </button>
        </div>
      ) : (
        <div className="relative z-10">
          {/* PASO 1: elegir auto del stock */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  autoFocus
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Marca o modelo..."
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-4 text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium outline-none focus:border-[#0145F2] dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-sky-400/10 transition-all"
                />
              </div>

              {buscando && (
                <div className="flex items-center justify-center py-6 text-slate-400 dark:text-slate-500 text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Buscando...
                </div>
              )}

              {!buscando && resultados.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">No encontramos autos disponibles con esa búsqueda.</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {resultados.map((v) => (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => elegirVehiculo(v)}
                    className="w-full flex items-center gap-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 text-left hover:border-[#0145F2] dark:hover:border-sky-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] active:scale-[0.98] transition-all"
                  >
                    <div className="w-11 h-11 rounded-full bg-sky-50 dark:bg-sky-400/10 flex items-center justify-center shrink-0">
                      <Car className="w-5 h-5 text-[#0145F2] dark:text-sky-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-900 dark:text-white text-xs truncate">{v.marca} {v.modelo}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">{v.anio} · {v.sucursales?.nombre || "Casa Central"}</p>
                      <p className="text-xs font-black text-[#0145F2] dark:text-sky-400 mt-0.5">
                        {(() => { const p = resolverPrecioArs(v, dolarVenta); return p > 0 ? `$ ${p.toLocaleString("es-AR")}` : "Consultar precio"; })()}
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
              <button type="button" onClick={() => setStep(1)} className={backLinkClass}>
                <ArrowLeft className="w-3.5 h-3.5" /> Cambiar auto
              </button>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                Precio publicado: $ {precioVehiculo.toLocaleString("es-AR")}
              </div>

              <div>
                <label className={`${labelClass} mb-1`}>Tu Anticipo ({anticipoPorcentaje}%)</label>
                <span className="block text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap mb-2">$ {anticipoCliente.toLocaleString("es-AR")}</span>
                <input
                  type="range" min="30" max="80" step="5"
                  value={anticipoPorcentaje}
                  onChange={(e) => setAnticipoPorcentaje(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-[#0145F2] dark:accent-sky-400"
                />
              </div>

              <div>
                <label className={`${labelClass} mb-3`}>Plazo a financiar</label>
                <div className="grid grid-cols-3 gap-3">
                  {PLAZOS.map((plazo) => (
                    <button
                      key={plazo} type="button" onClick={() => setMeses(plazo)}
                      className={`py-3.5 rounded-2xl text-sm font-black transition-all ${meses === plazo ? "bg-[#0145F2] text-white shadow-[0_0_20px_rgba(1,69,242,0.4)] scale-105" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"}`}
                    >
                      {plazo} cuotas
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-2xl">
                <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-1">Cuota Mensual Estimada</span>
                <span className="block text-3xl font-black text-slate-900 dark:text-white whitespace-nowrap">$ {calcularCuota(montoAFinanciar, meses).toLocaleString("es-AR")}</span>
              </div>

              <button
                type="button"
                disabled={!precioVehiculo}
                onClick={() => setStep(3)}
                className={ctaClass}
              >
                {precioVehiculo ? "Continuar" : "Este auto no tiene precio publicado"}
              </button>
            </div>
          )}

          {/* PASO 3: crédito preaprobado */}
          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <button type="button" onClick={() => setStep(2)} className={backLinkClass}>
                <ArrowLeft className="w-3.5 h-3.5" /> Volver
              </button>
              <p className="text-sm font-bold text-slate-900 dark:text-white">¿Ya tenés un crédito preaprobado en el Banco Nación?</p>
              <div className="space-y-2">
                {(["si", "no"] as const).map((op) => (
                  <button
                    type="button" key={op}
                    onClick={() => setCreditoPreaprobado(op)}
                    className={`w-full p-4 rounded-2xl border text-left font-bold text-xs transition-all ${creditoPreaprobado === op ? "bg-sky-50 dark:bg-sky-400/10 border-[#0145F2] dark:border-sky-400 text-[#0145F2] dark:text-sky-300" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}
                  >
                    {op === "si" ? "Sí, ya está preaprobado" : "No, todavía no lo pedí"}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!creditoPreaprobado}
                onClick={() => setStep(4)}
                className={ctaClass}
              >
                Continuar
              </button>
            </div>
          )}

          {/* PASO 4: contacto + envío */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
              <button type="button" onClick={() => setStep(3)} className={backLinkClass}>
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

              <div className="flex justify-center pt-2">
                <div ref={turnstileRef} />
              </div>

              {error && (
                <div className="bg-rose-50 dark:bg-rose-400/10 border border-rose-200 dark:border-rose-400/20 text-rose-600 dark:text-rose-300 text-xs font-semibold px-4 py-3 rounded-xl animate-shake">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !turnstileToken}
                className={`${ctaClass} flex items-center justify-center gap-2`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Enviando..." : "Enviar solicitud"}
              </button>
            </form>
          )}
        </div>
      )}

      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" onLoad={() => setTurnstileListo(true)} />
    </div>
  );
}
