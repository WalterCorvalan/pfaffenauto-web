"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { ArrowLeft, Loader2, ChevronDown, X } from "lucide-react";
import EnvioExitoso from "@/components/EnvioExitoso";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const marcasDisponibles = [
  "Audi", "BAIC", "BMW", "Changan", "Chery", "Chevrolet", "Citroen",
  "Fiat", "Ford", "Honda", "Hyundai", "Jeep", "Mercedes Benz",
  "Nissan", "Peugeot", "Renault", "Toyota", "Volkswagen", "Otro"
];

const modelosPorMarca: Record<string, string[]> = {
  "Chevrolet": ["Cruze", "Equinox", "Joy", "Montana Pick-up", "Onix", "S-10 Pick-up", "Silverado"],
  "Toyota": ["Hilux", "Corolla", "Etios", "Yaris", "SW4", "Corolla Cross"],
  "Volkswagen": ["Gol", "Amarok", "Polo", "T-Cross", "Taos", "Nivus"],
  "Ford": ["Focus", "Ranger", "Fiesta", "EcoSport", "Territory", "Kuga"],
  "Audi": ["A1", "A3", "A4", "Q3", "Q5"],
  "BMW": ["Serie 1", "Serie 3", "X1", "X3", "X5"],
  "Peugeot": ["208", "2008", "3008", "Partner"],
  "Renault": ["Sandero", "Logan", "Duster", "Alaskan", "Kangoo"],
  "Fiat": ["Cronos", "Pulse", "Fastback", "Toro", "Strada"],
  "Jeep": ["Renegade", "Compass", "Commander"],
};

const aniosDisponibles = Array.from({ length: 20 }, (_, i) => 2026 - i);

export default function VenderForm() {
  const [step, setStep] = useState(1);

  // Estados del vehículo
  const [anio, setAnio] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [version, setVersion] = useState("");
  const [km, setKm] = useState("");
  const [gnc, setGnc] = useState("");

  // Estados de Contacto
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");

  // Turnstile (anti-spam gratuito)
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileListo, setTurnstileListo] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  // Controladores de Dropdowns
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [busquedaMarca, setBusquedaMarca] = useState("");

  // Estados de carga/envío
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [segundos, setSegundos] = useState(60);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [shakeError, setShakeError] = useState(0);

  const mostrarError = (msg: string) => {
    setErrorEnvio(msg);
    setShakeError((n) => n + 1);
  };

  useEffect(() => {
    if (segundos > 1) {
      const timer = setInterval(() => {
        setSegundos((prev) => prev - 1);
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [segundos]);

  const marcasFiltradas = marcasDisponibles.filter(m => m.toLowerCase().includes(busquedaMarca.toLowerCase()));
  const modelosDisponibles = modeloPorMarcaSeleccionada(marca);

  function modeloPorMarcaSeleccionada(m: string) {
    return modelosPorMarca[m] || ["Base", "Full", "Sport", "Standard", "Otro"];
  }

  const validarPaso1 = () => {
    return anio && marca && modelo && version && km;
  };

  // Renderiza el widget de Turnstile cuando llegamos al paso de contacto
  useEffect(() => {
    if (step !== 3 || !turnstileListo || !turnstileRef.current || !window.turnstile) return;
    if (turnstileWidgetId.current) return; // ya renderizado

    turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
  }, [step, turnstileListo]);

  // =================================================================
  // ENVIAR SOLICITUD DE VENTA DIRECTA (verificación anti-spam vía Turnstile)
  // =================================================================
  const enviarVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorEnvio("");

    if (!nombre.trim() || !apellido.trim() || !email.trim() || !tel.trim()) {
      mostrarError("Por favor completá todos los campos de contacto.");
      return;
    }
    if (!turnstileToken) {
      mostrarError("Completá la verificación de seguridad antes de continuar.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstileToken,
          marca,
          modelo,
          anio,
          version: `${version} - GNC: ${gnc || 'No'}`,
          gnc,
          kilometraje: km,
          nombre: `${nombre.trim()} ${apellido.trim()}`,
          email: email.trim(),
          telefono: tel.trim(),
          puede_venir_sucursal: true,
          fotos_y_videos: [],
          sucursal_preferida: "Casa Central",
          tipo_peritaje: "venta",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al enviar la solicitud");

      setEnviado(true);
    } catch (error) {
      console.error("Error al enviar venta:", error);
      mostrarError(error instanceof Error ? error.message : "Hubo un problema al procesar tu solicitud. Reintentá.");
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setTurnstileToken("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f] text-slate-900 dark:text-white pt-16 pb-50 relative font-sans overflow-hidden flex flex-col justify-between">

      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/5 dark:bg-orange-400/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-8 relative z-10">

        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6 text-left">
          <div className="space-y-3">
            <span className="bg-orange-50 dark:bg-orange-400/10 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-400/20 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-block shadow-sm dark:shadow-none">
              Venta Directa y Transparente
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light text-navy dark:text-white tracking-tight leading-[1.08]">
              Vendé tu vehículo <br />
              <strong className="font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">al mejor precio.</strong>
            </h1>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 pt-2">
              EFECTIVO INMEDIATO Y TRANSFERENCIA SEGURA
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA: FORMULARIO */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <div className="bg-white/70 dark:bg-white/5 backdrop-blur-2xl border border-white dark:border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-none p-6 md:p-8 w-full max-w-md relative">

            {!enviado && (
              <div className="mb-4">
                <h2 className="text-xl font-black text-navy dark:text-white tracking-tight">
                  {segundos > 1 ? `Iniciá la venta en ${segundos} segundos` : "Ya casi terminás, dale para adelante"}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  {step === 1 && "Ingresá los datos del vehículo que querés vender"}
                  {step === 2 && "¿Tu auto tiene o tuvo GNC?"}
                  {step === 3 && "Necesitamos tus datos para contactarte"}
                </p>
              </div>
            )}

            {!enviado ? (
              <div>
                {/* PASO 1 */}
                {step === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="relative">
                      <div
                        onClick={() => setOpenDropdown(openDropdown === 'anio' ? null : 'anio')}
                        className={`w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border rounded-2xl px-4 py-3.5 text-sm font-semibold flex items-center justify-between cursor-pointer transition-all shadow-sm dark:shadow-none ${anio ? 'text-navy dark:text-white border-slate-300 dark:border-white/20' : 'text-slate-400 dark:text-slate-500 border-white dark:border-white/10'}`}
                      >
                        <span>{anio ? anio : "Seleccioná el año"}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${openDropdown === 'anio' ? 'rotate-180 text-orange-600 dark:text-orange-400' : ''}`} />
                      </div>

                      {openDropdown === 'anio' && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-[#14141c] backdrop-blur-xl border border-white dark:border-white/10 rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto p-1">
                          {aniosDisponibles.map((a) => (
                            <div
                              key={a}
                              onClick={() => { setAnio(String(a)); setOpenDropdown(null); }}
                              className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-400/10 hover:text-orange-700 dark:hover:text-orange-300 rounded-xl cursor-pointer transition-colors"
                            >
                              {a}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <div
                        onClick={() => setOpenDropdown(openDropdown === 'marca' ? null : 'marca')}
                        className={`w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border rounded-2xl px-4 py-3.5 text-sm font-semibold flex items-center justify-between cursor-pointer transition-all shadow-sm dark:shadow-none ${marca ? 'text-navy dark:text-white border-slate-300 dark:border-white/20' : 'text-slate-400 dark:text-slate-500 border-white dark:border-white/10'}`}
                      >
                        <span>{marca ? marca : "Seleccioná la marca"}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${openDropdown === 'marca' ? 'rotate-180 text-orange-600 dark:text-orange-400' : ''}`} />
                      </div>

                      {openDropdown === 'marca' && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-[#14141c] backdrop-blur-xl border border-white dark:border-white/10 rounded-2xl shadow-2xl z-50 p-2">
                          <input
                            type="text"
                            placeholder="Buscá la marca..."
                            value={busquedaMarca}
                            onChange={(e) => setBusquedaMarca(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs font-bold outline-none mb-2"
                            autoFocus
                          />
                          <div className="max-h-44 overflow-y-auto space-y-1">
                            {marcasFiltradas.map((m) => (
                              <div
                                key={m}
                                onClick={() => { setMarca(m); setModelo(""); setOpenDropdown(null); }}
                                className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-400/10 hover:text-orange-700 dark:hover:text-orange-300 rounded-xl cursor-pointer transition-colors"
                              >
                                {m}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <div
                        onClick={() => marca && setOpenDropdown(openDropdown === 'modelo' ? null : 'modelo')}
                        className={`w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border rounded-2xl px-4 py-3.5 text-sm font-semibold flex items-center justify-between transition-all shadow-sm dark:shadow-none ${marca ? 'cursor-pointer text-navy dark:text-white border-slate-300 dark:border-white/20' : 'opacity-60 cursor-not-allowed text-slate-400 dark:text-slate-500 border-white dark:border-white/10'}`}
                      >
                        <span>{modelo ? modelo : "Seleccioná el modelo"}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${openDropdown === 'modelo' ? 'rotate-180 text-orange-600 dark:text-orange-400' : ''}`} />
                      </div>

                      {openDropdown === 'modelo' && marca && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-[#14141c] backdrop-blur-xl border border-white dark:border-white/10 rounded-2xl shadow-2xl z-50 max-h-52 overflow-y-auto p-1">
                          {modelosDisponibles.map((mod) => (
                            <div
                              key={mod}
                              onClick={() => { setModelo(mod); setOpenDropdown(null); }}
                              className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-400/10 hover:text-orange-700 dark:hover:text-orange-300 rounded-xl cursor-pointer transition-colors"
                            >
                              {mod}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Ingresá la versión (Ej: 1.6 MSI...)"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold text-navy dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-all shadow-sm dark:shadow-none"
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        placeholder="Ingresá el kilometraje (Ej: 45000)"
                        value={km}
                        onChange={(e) => setKm(e.target.value)}
                        className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold text-navy dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-all shadow-sm dark:shadow-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={!validarPaso1()}
                        onClick={() => setStep(2)}
                        className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-amber-600 hover:to-orange-500 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-500/20 cursor-pointer active:scale-95"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                )}

                {/* PASO 2 */}
                {step === 2 && (
                  <div className="space-y-6 animate-fadeIn py-2">
                    <div>
                      <button onClick={() => setStep(1)} className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1 mb-2 hover:underline">
                        <ArrowLeft className="w-3.5 h-3.5" /> Volver
                      </button>
                    </div>

                    <div className="space-y-3">
                      {["Sí, tiene GNC", "No, pero tenía antes", "No, nunca tuvo"].map((op) => (
                        <div
                          key={op}
                          onClick={() => setGnc(op)}
                          className={`p-4 rounded-2xl border cursor-pointer font-bold text-xs transition-all shadow-sm dark:shadow-none ${gnc === op ? 'bg-orange-50 dark:bg-orange-400/10 border-orange-500 dark:border-orange-400 text-orange-700 dark:text-orange-300' : 'bg-white/60 dark:bg-white/5 border-white dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'}`}
                        >
                          {op}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={!gnc}
                      onClick={() => setStep(3)}
                      className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-amber-600 hover:to-orange-500 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-500/20 cursor-pointer active:scale-95"
                    >
                      Continuar
                    </button>
                  </div>
                )}

                {/* PASO 3 (Contacto Final + Turnstile) */}
                {step === 3 && (
                  <form onSubmit={enviarVenta} className="space-y-4 animate-fadeIn">
                    <div>
                      <button type="button" onClick={() => setStep(2)} className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1 mb-2 hover:underline">
                        <ArrowLeft className="w-3.5 h-3.5" /> Volver
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Nombre</label>
                      <input
                        type="text"
                        required
                        placeholder="Ingresá tu nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-navy dark:text-white outline-none focus:border-orange-500 dark:focus:border-orange-400 shadow-sm dark:shadow-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Apellido</label>
                      <input
                        type="text"
                        required
                        placeholder="Ingresá tu apellido"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-navy dark:text-white outline-none focus:border-orange-500 dark:focus:border-orange-400 shadow-sm dark:shadow-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Email</label>
                      <input
                        type="email"
                        required
                        placeholder="Ingresá tu correo"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-navy dark:text-white outline-none focus:border-orange-500 dark:focus:border-orange-400 shadow-sm dark:shadow-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Teléfono celular</label>
                      <div className="flex gap-2">
                        <div className="bg-white/80 dark:bg-white/10 border border-white dark:border-white/10 rounded-2xl px-3 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center shadow-sm dark:shadow-none">
                          AR +549
                        </div>
                        <input
                          type="tel"
                          required
                          placeholder="1112345678"
                          value={tel}
                          onChange={(e) => setTel(e.target.value)}
                          className="flex-1 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-navy dark:text-white outline-none focus:border-orange-500 dark:focus:border-orange-400 shadow-sm dark:shadow-none"
                        />
                      </div>
                    </div>

                    <div className="pt-1 flex justify-center">
                      {!turnstileListo && (
                        <span className="text-[10px] text-slate-400 font-medium">Cargando verificación...</span>
                      )}
                      <div ref={turnstileRef} />
                    </div>

                    {errorEnvio && (
                      <div key={shakeError} className="flex items-start gap-2 bg-rose-50 dark:bg-rose-400/10 border border-rose-200 dark:border-rose-400/20 rounded-2xl p-3 animate-fadeIn animate-shake">
                        <X className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium leading-relaxed">{errorEnvio}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !turnstileToken}
                      className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-amber-600 hover:to-orange-500 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                      {loading ? "Enviando..." : "Confirmar Venta"}
                    </button>
                  </form>
                )}

              </div>
            ) : (
              /* ÉXITO */
              <EnvioExitoso
                color="orange"
                titulo="¡Solicitud de venta recibida!"
                mensaje="Hemos registrado tu interés en vender el vehículo y nos comunicaremos en la brevedad para coordinar la tasación y la oferta final."
              >
                <Link href="/" className="inline-block py-3.5 px-8 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20">
                  Volver al inicio
                </Link>
              </EnvioExitoso>
            )}

          </div>
        </div>

      </div>

      <footer className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 py-4 uppercase tracking-widest relative z-10">
        Pfaffen Autos &bull; Todos los derechos reservados
      </footer>

      {/* Cargamos el script de Cloudflare */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onLoad={() => setTurnstileListo(true)}
      />

    </div>
  );
}
