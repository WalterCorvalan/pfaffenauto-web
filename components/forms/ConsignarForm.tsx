"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { ArrowLeft, Loader2, ChevronDown, X, CalendarDays, CarFront, Gauge, Zap, Check, Settings2, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EnvioExitoso from "@/components/EnvioExitoso";
import { MARCAS_ARGENTINA, MODELOS_POR_MARCA } from "@/lib/marcasModelos";
import { supabase2 } from "@/lib/supabase/client";
import { normalizarMarca } from "@/lib/vehiculos";
import { LOGOS_MARCAS } from "@/lib/marcasLogos";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const marcasDisponibles = MARCAS_ARGENTINA;
const modelosPorMarca = MODELOS_POR_MARCA;
const aniosDisponibles = Array.from({ length: 20 }, (_, i) => 2026 - i);

// --- COMPONENTES DE UI INTERNOS ---

function ProgressStepper({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: "VEHÍCULO" },
    { num: 2, label: "DETALLES" },
    { num: 3, label: "CONTACTO" }
  ];

  return (
    <div className="flex items-start mb-4 lg:mb-10 w-full max-w-sm">
      {steps.map((step, idx) => {
        const isActive = currentStep >= step.num;
        return (
          <div key={step.num} className="flex items-start flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 lg:gap-2 w-8">
              <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-[10px] lg:text-xs font-bold shrink-0 transition-colors duration-300 ${isActive ? "bg-blue-600 dark:bg-blue-500 text-white" : "bg-transparent border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500"}`}>
                {step.num}
              </div>
              <span className={`text-[8px] lg:text-[9px] uppercase tracking-widest whitespace-nowrap ${isActive ? "text-slate-700 dark:text-slate-300 font-bold" : "text-slate-400 dark:text-slate-600"}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-[1px] flex-1 mx-3 mt-3 lg:mt-4 transition-colors duration-300 ${isActive ? "bg-blue-500/50" : "bg-slate-200 dark:bg-slate-800"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConfigField({ 
  icon: Icon, label, value, isOpen, onClick, children, isCompleted 
}: { 
  icon: any, label: string, value: string, isOpen: boolean, onClick: () => void, children: React.ReactNode, isCompleted: boolean 
}) {
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? "border-slate-300 dark:border-slate-600 bg-white dark:bg-[#161e2c] shadow-sm dark:shadow-none" : "border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a] hover:bg-white dark:hover:bg-[#161e2c]"}`}>
      <div onClick={onClick} className="flex items-center justify-between p-4 cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{label}</span>
            <span className={`text-sm font-bold truncate mt-0.5 ${value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600"}`}>
              {value || "Seleccionar..."}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isCompleted && !isOpen && <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />}
          <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-slate-100 dark:border-white/5 mt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

export default function ConsignarForm() {
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

  // Turnstile
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileListo, setTurnstileListo] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  useEffect(() => {
    if (window.turnstile) { setTurnstileListo(true); return; }
    const intervalo = setInterval(() => {
      if (window.turnstile) { setTurnstileListo(true); clearInterval(intervalo); }
    }, 200);
    return () => clearInterval(intervalo);
  }, []);

  // UI States
  const [openDropdown, setOpenDropdown] = useState<string | null>("anio");
  const [busquedaMarca, setBusquedaMarca] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [imageError, setImageError] = useState(false);
  const [fotoStock, setFotoStock] = useState<string | null>(null);

  const formatKm = (value: string) => {
    if (!value) return "0";
    return Number(value).toLocaleString("es-AR");
  };

  const marcasFiltradas = marcasDisponibles.filter(m => m.toLowerCase().includes(busquedaMarca.toLowerCase()));
  const modelosDisponibles = modelosPorMarca[marca] || ["Base", "Full", "Sport", "Standard", "Otro"];

  const validarPaso1 = () => anio && marca && modelo && version && km;

  // Auto-avanzar el acordeón
  useEffect(() => {
    if (anio && openDropdown === "anio") setOpenDropdown("marca");
    else if (marca && openDropdown === "marca") setOpenDropdown("modelo");
    else if (modelo && openDropdown === "modelo") setOpenDropdown("version");
  }, [anio, marca, modelo]);

  // Reset de error de imagen cuando cambia el modelo
  useEffect(() => {
    setImageError(false);
  }, [marca, modelo]);

  // Foto real: si tenemos en stock un vehículo de esta marca/modelo, usamos su
  // primera foto real en vez del placeholder genérico (o el nombre en texto).
  useEffect(() => {
    if (!marca || !modelo) { setFotoStock(null); return; }
    let cancelado = false;
    supabase2
      .from("vehiculos")
      .select("fotos, marca, modelo")
      .in("estado", ["disponible", "reservado"])
      .ilike("modelo", `%${modelo}%`)
      .then(({ data }) => {
        if (cancelado || !data) return;
        const match = data.find((v) => normalizarMarca(v.marca) === normalizarMarca(marca));
        setFotoStock(match?.fotos?.[0] || null);
      });
    return () => { cancelado = true; };
  }, [marca, modelo]);

  useEffect(() => {
    if (step !== 3 || !turnstileListo || !turnstileRef.current || !window.turnstile) return;
    if (turnstileWidgetId.current) return;
    turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
  }, [step, turnstileListo]);

  const enviarConsignacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorEnvio("");

    if (!nombre.trim() || !apellido.trim() || !email.trim() || !tel.trim()) {
      setErrorEnvio("Por favor completá todos los campos de contacto.");
      return;
    }
    if (!turnstileToken) {
      setErrorEnvio("Completá la verificación de seguridad antes de continuar.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/panel/consignaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstileToken, marca, modelo, anio,
          version: `${version}${gnc ? ` - GNC: ${gnc}` : ""}`,
          kilometraje: km,
          nombre: `${nombre.trim()} ${apellido.trim()}`,
          email: email.trim(),
          telefono: tel.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al enviar la solicitud");

      setEnviado(true);
    } catch (error) {
      setErrorEnvio(error instanceof Error ? error.message : "Hubo un problema. Reintentá.");
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setTurnstileToken("");
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f] flex flex-col">
        <EnvioExitoso
          color="emerald"
          titulo="¡Vehículo configurado!"
          mensaje="Hemos recibido tu solicitud de consignación. Nuestro equipo analizará la configuración y se contactará a la brevedad."
        >
          <Link href="/" className="inline-block py-3.5 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-colors">
            Volver al inicio
          </Link>
        </EnvioExitoso>
      </div>
    );
  }

  // Rutas de assets: foto real de stock > asset genérico del modelo > logo/texto.
  // El logo de marca sale del mismo mapa que usa components/Marcas.tsx (home)
  // — así no duplicamos otra lista de logos que se desincronice de esa.
  const logoPath = LOGOS_MARCAS[marca] || `/vehicles/brands/${marca.toLowerCase()}.svg`;
  const carPath = fotoStock || `/vehicles/models/${marca.toLowerCase()}/${modelo.toLowerCase().replace(/ /g, '-')}.webp`;

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#0a0a0f] text-slate-900 dark:text-white flex flex-col lg:flex-row font-sans">

      {/* ================= ZONA IZQUIERDA: PREVIEW DINÁMICA ================= */}
      <div className="w-full lg:w-[55%] h-[38vh] min-h-[300px] lg:h-[calc(100vh-5rem)] lg:sticky lg:top-20 relative bg-slate-100 dark:bg-[#050b14] overflow-hidden shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/5">

        {/* Fondos y luces */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(1,69,242,0.08),transparent_60%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[20%] bg-blue-500/10 dark:bg-blue-500/20 blur-[100px] rounded-full" />

        {/* Header Preview -- en mobile, en vez de un pill fijo tipo
            "Consignación" (no aportaba info nueva) se muestran ahí mismo los
            datos ya cargados (Año/Marca/Modelo/Versión), mismo lenguaje
            visual que el badge de KM. Solo aparece una vez hay algo cargado. */}
        <div className="absolute top-4 left-4 right-4 lg:top-6 lg:left-6 lg:right-auto z-20">
          <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pr-24">
            {[
              { value: anio, icon: CalendarDays },
              { value: marca, icon: CarFront },
              { value: modelo, icon: Settings2 },
              { value: version, icon: Zap },
            ].filter((item) => item.value).map((item, i) => (
              <div key={i} className="shrink-0 bg-white/70 dark:bg-black/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm dark:shadow-none">
                <item.icon className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-[10px] font-bold text-slate-900 dark:text-white truncate max-w-[90px]">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <CarFront className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Tu próximo paso</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">Configurador de Consignación</p>
            </div>
          </div>
        </div>

        {/* Floating KM Badge */}
        <AnimatePresence>
          {km && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-16 right-4 lg:top-8 lg:right-6 z-20 bg-blue-50/90 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-500/30 backdrop-blur-xl rounded-xl lg:rounded-2xl px-3 py-2 lg:px-5 lg:py-3 flex items-center gap-2 lg:gap-3 shadow-[0_0_30px_rgba(1,69,242,0.12)] dark:shadow-[0_0_30px_rgba(1,69,242,0.3)]"
            >
              <Gauge className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[8px] lg:text-[9px] font-bold uppercase tracking-widest text-blue-700/70 dark:text-blue-200/70">Kilómetros</span>
                <motion.span
                  key={km}
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  className="text-sm lg:text-lg font-black text-slate-900 dark:text-white leading-none font-mono"
                >
                  {formatKm(km)} <span className="text-xs lg:text-sm font-bold text-blue-600 dark:text-blue-300">KM</span>
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas Principal */}
        <div className="absolute inset-0 flex items-center justify-center px-4 pt-12 pb-14 lg:p-8 lg:pt-0 lg:pb-0">
          <AnimatePresence mode="wait">
            {!marca ? (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(10px)", scale: 0.9 }}
                className="text-center"
              >
                <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto mb-4 lg:mb-6 bg-white dark:bg-white/5 shadow-sm dark:shadow-none">
                  <Zap className="w-6 h-6 lg:w-8 lg:h-8 text-slate-400 dark:text-slate-600" />
                </div>
                <h3 className="text-lg lg:text-2xl font-black text-slate-700 dark:text-slate-300 tracking-tight px-4">Comenzá tu configuración</h3>
                <p className="text-xs lg:text-sm text-slate-500 mt-2 px-4">Tu vehículo aparecerá en este espacio.</p>
              </motion.div>
            ) : marca && !modelo ? (
              <motion.div 
                key="logo"
                initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }} 
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} 
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center"
              >
                {/* Fallback de logo por si no existe el SVG, mostramos texto */}
                <div className="relative w-32 h-32 lg:w-48 lg:h-48 flex items-center justify-center">
                  <img
                    src={logoPath}
                    alt={marca}
                    className="max-w-full max-h-full object-contain drop-shadow-2xl"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-2xl lg:text-4xl font-black text-slate-900 dark:text-white opacity-10 dark:opacity-20 -z-10 tracking-tighter uppercase">
                    {marca}
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="car"
                initial={{ opacity: 0, x: 50, filter: "blur(10px)" }} 
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} 
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative w-full max-w-2xl h-full flex flex-col items-center justify-center"
              >
                {!imageError ? (
                  <img
                    src={carPath}
                    alt={`${marca} ${modelo}`}
                    className="w-full h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <img
                      src={logoPath}
                      alt={marca}
                      className="w-20 h-20 lg:w-32 lg:h-32 object-contain mb-4 lg:mb-8 opacity-70 dark:opacity-50"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <h2 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter text-center px-4">{marca} {modelo}</h2>
                  </div>
                )}

                {/* Piso/Sombra debajo del auto */}
                <div className="absolute bottom-[8%] lg:bottom-[30%] w-[80%] h-8 bg-black/10 dark:bg-black/60 blur-xl rounded-full" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Bar: Datos recopilados -- solo desktop (en mobile se
            muestran arriba, ver Header Preview). */}
        <div className="hidden lg:flex absolute bottom-6 left-10 right-10 flex-wrap gap-4 z-20">
          {[
            { label: "Año", value: anio, icon: CalendarDays },
            { label: "Marca", value: marca, icon: CarFront },
            { label: "Modelo", value: modelo, icon: Settings2 },
            { label: "Versión", value: version, icon: Zap }
          ].map((item, i) => (
            <div key={i} className="flex-1 min-w-[120px] bg-white/70 dark:bg-black/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-sm dark:shadow-none">
              <item.icon className={`w-4 h-4 shrink-0 ${item.value ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-600"}`} />
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">{item.label}</span>
                <span className={`text-xs font-bold truncate ${item.value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600"}`}>
                  {item.value || "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= ZONA DERECHA: CONFIGURADOR ================= */}
      <div className="w-full lg:w-[45%] h-auto bg-white dark:bg-[#0a0a0f] flex flex-col items-center pt-2 lg:pt-10 pb-10 px-6 lg:px-12">
        <div className="w-full max-w-md">

          <ProgressStepper currentStep={step} />

          <div className="mb-4 lg:mb-8">
            <h2 className="text-lg lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1 lg:mb-2">
              Configurá tu vehículo
            </h2>
            <p className="hidden lg:block text-sm text-slate-500 dark:text-slate-400">
              {step === 1 && "Completá los datos y comenzá a ver tu auto en tiempo real."}
              {step === 2 && "Detalles técnicos adicionales del vehículo."}
              {step === 3 && "Dejanos tus datos para que un asesor te contacte."}
            </p>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              
              {/* --- PASO 1: VEHÍCULO --- */}
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <ConfigField icon={CalendarDays} label="Año" value={anio} isOpen={openDropdown === 'anio'} onClick={() => setOpenDropdown(openDropdown === 'anio' ? null : 'anio')} isCompleted={!!anio}>
                    <div className="grid grid-cols-4 gap-2">
                      {aniosDisponibles.map((a) => (
                        <button key={a} onClick={() => { setAnio(String(a)); setOpenDropdown("marca"); }} className={`py-2 text-xs font-bold rounded-lg border transition-all ${anio === String(a) ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20"}`}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </ConfigField>

                  <ConfigField icon={CarFront} label="Marca" value={marca} isOpen={openDropdown === 'marca'} onClick={() => setOpenDropdown(openDropdown === 'marca' ? null : 'marca')} isCompleted={!!marca}>
                    <input 
                      type="text" placeholder="Buscá tu marca..." value={busquedaMarca} onChange={(e) => setBusquedaMarca(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-blue-500 mb-3"
                    />
                    <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                      {marcasFiltradas.map((m) => (
                        <button key={m} onClick={() => { setMarca(m); setModelo(""); setOpenDropdown("modelo"); setBusquedaMarca(""); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${marca === m ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </ConfigField>

                  <ConfigField icon={Settings2} label="Modelo" value={modelo} isOpen={openDropdown === 'modelo'} onClick={() => marca && setOpenDropdown(openDropdown === 'modelo' ? null : 'modelo')} isCompleted={!!modelo}>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                      {modelosDisponibles.map((mod) => (
                        <button key={mod} onClick={() => { setModelo(mod); setOpenDropdown("version"); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${modelo === mod ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"}`}>
                          {mod}
                        </button>
                      ))}
                    </div>
                  </ConfigField>

                  <ConfigField icon={Zap} label="Versión" value={version} isOpen={openDropdown === 'version'} onClick={() => setOpenDropdown(openDropdown === 'version' ? null : 'version')} isCompleted={!!version}>
                    <input 
                      type="text" placeholder="Ej: 1.0 Turbo Premier..." value={version} onChange={(e) => setVersion(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-blue-500"
                    />
                    <button onClick={() => setOpenDropdown("km")} className="mt-3 w-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                      Confirmar Versión
                    </button>
                  </ConfigField>

                  <ConfigField icon={Gauge} label="Kilómetros" value={km ? formatKm(km) + " km" : ""} isOpen={openDropdown === 'km'} onClick={() => setOpenDropdown(openDropdown === 'km' ? null : 'km')} isCompleted={!!km}>
                    <input
                      type="number" placeholder="Ej: 45000" value={km} onChange={(e) => setKm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-blue-500 font-mono"
                    />
                    <button onClick={() => setOpenDropdown(null)} className="mt-3 w-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                      Confirmar Kilometraje
                    </button>
                  </ConfigField>

                  <div className="pt-6">
                    <button 
                      onClick={() => setStep(2)} disabled={!validarPaso1()}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      Siguiente Paso <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* --- PASO 2: DETALLES --- */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 mb-4 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver al vehículo
                  </button>

                  <div className="bg-slate-50 dark:bg-[#161e2c] border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Flame className="w-5 h-5 text-amber-500" />
                      <h3 className="font-bold text-slate-900 dark:text-white">¿El vehículo tiene GNC?</h3>
                    </div>
                    <div className="space-y-3">
                      {["Sí, tiene GNC", "No, pero tenía antes", "No, nunca tuvo"].map((op) => (
                        <button
                          key={op} onClick={() => setGnc(op)}
                          className={`w-full text-left px-5 py-4 rounded-xl border text-sm font-bold transition-all ${gnc === op ? "bg-blue-50 dark:bg-blue-600/20 border-blue-500 text-blue-700 dark:text-white" : "bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"}`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => setStep(3)} disabled={!gnc}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      Siguiente Paso <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* --- PASO 3: CONTACTO --- */}
              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <button onClick={() => setStep(2)} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 mb-6 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver
                  </button>

                  <form onSubmit={enviarConsignacion} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">Nombre</label>
                        <input required type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full bg-slate-50 dark:bg-[#161e2c] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">Apellido</label>
                        <input required type="text" value={apellido} onChange={e => setApellido(e.target.value)} className="w-full bg-slate-50 dark:bg-[#161e2c] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">Email</label>
                      <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-[#161e2c] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors" />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">Teléfono Celular</label>
                      <div className="flex gap-2">
                        <div className="bg-slate-100 dark:bg-[#161e2c] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center">
                          +549
                        </div>
                        <input required type="tel" value={tel} onChange={e => setTel(e.target.value)} placeholder="11 1234 5678" className="flex-1 bg-slate-50 dark:bg-[#161e2c] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors" />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-center">
                      <div ref={turnstileRef} />
                    </div>

                    {errorEnvio && (
                      <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4 mt-4">
                        <X className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-600 dark:text-rose-300 font-medium leading-relaxed">{errorEnvio}</p>
                      </div>
                    )}

                    <div className="pt-6">
                      <button 
                        type="submit" disabled={loading || !turnstileToken}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {loading ? "Procesando..." : "Finalizar y Enviar"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" onLoad={() => setTurnstileListo(true)} />
    </div>
  );
}