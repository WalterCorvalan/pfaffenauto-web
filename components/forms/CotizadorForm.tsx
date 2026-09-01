"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { ArrowLeft, Loader2, ChevronDown, CarFront, User, Phone, Upload, X, FileVideo, ImageIcon, Building2, Camera, AlertTriangle, MapPin, CalendarDays, Clock } from "lucide-react";
import EnvioExitoso from "@/components/EnvioExitoso";
import { getCanalOrigen } from "@/lib/utm";
import { supabase2 } from "@/lib/supabase2/client";
import { calcularOferta } from "@/lib/panelV2/descuentoPorKm";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const marcasDisponibles = [
  "Abarth", "Acura", "Agrale", "AION", "Aixam", "Alfa Romeo",
  "Alpine", "AMC", "Anasagasti", "Arcfox", "ARO", "Asia Motors",
  "Aston Martin", "Audi", "Austin", "Austin-Healey", "Autoar", "BAIC",
  "BAW", "Bentley", "BMW", "Borgward", "Brilliance", "Buick",
  "BYD", "Cadillac", "Changan", "Chery", "Chevrolet", "Chrysler",
  "Cisitalia", "Citroen", "Dacia", "Daewoo", "Daihatsu", "Datsun",
  "De Carlo", "DeLorean", "DFSK", "DKW", "Dodge", "Domy",
  "Dongfeng", "DS Automobiles", "Eagle", "FAW", "Ferrari", "Fiat",
  "Fonix", "Ford", "Forthing", "Foton", "FSO / Polonez", "GAC Motor",
  "Galloper", "GAZ", "Geely", "Genesis", "Geo", "GMC",
  "Gonow", "Great Wall", "GreenGo", "GWM", "Hafei", "Hamelbot",
  "Haval", "Heibao", "Hillman", "Honda", "Hummer", "Hyundai",
  "IES", "IKA", "Infiniti", "Innocenti", "Isard", "Isuzu",
  "Iveco", "JAC", "Jaguar", "Jeep", "Jetour", "JMC",
  "JMEV", "Kaiyi", "Karry", "KGM / SsangYong", "Kia", "KYC",
  "Lada", "Lamborghini", "Lancia", "Land Rover", "Leapmotor", "Lexus",
  "Lifan", "Lincoln", "Lotus", "Lynk & Co", "Mahindra", "Maserati",
  "Maxus", "Mazda", "McLaren", "Mercedes Benz", "Mercury", "MG",
  "MINI", "Mitsubishi", "Morris", "Nissan", "NSU", "Oldsmobile",
  "Opel", "ORA", "Pagani", "Peugeot", "Plymouth", "Pontiac",
  "Porsche", "Proton", "Pur Sang", "RAM", "Rambler", "Rastrojero",
  "Rely", "Renault", "Rolls-Royce", "Rover", "Saab", "Santana",
  "SEAT", "Sero Electric", "Shineray", "Siam Di Tella", "Simca", "Škoda",
  "Skywell", "smart", "Soeast", "Subaru", "Suzuki", "SWM",
  "Tank", "Tata", "Tesla", "TITO / Coradir", "Torino", "Toyota",
  "Triumph", "UAZ", "Valiant", "Vauxhall", "Volkswagen", "Volt Motors",
  "Volvo", "Willys", "Wuling", "XEV", "Yuejin", "Zanella Utilitarios",
  "Zastava", "Zotye", "ZX Auto", "Otro"
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

interface VehiculoObjetivo {
  id: string;
  marca: string;
  modelo: string;
  precio: number;
  moneda: "ARS" | "USD";
}

export default function CotizadorForm({ vehiculoObjetivo }: { vehiculoObjetivo?: VehiculoObjetivo } = {}) {
  const [step, setStep] = useState(1);

  // Estados del vehículo
  const [anio, setAnio] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [version, setVersion] = useState("");
  const [km, setKm] = useState("");
  const [gnc, setGnc] = useState("");
  const [precioEsperado, setPrecioEsperado] = useState("");

  // Oferta instantánea: precio que el cliente espera, menos el descuento
  // según los km (escala fija del equipo — antes acá se buscaban
  // comparables de mercado con IA, ya no).
  const [descuentoPct, setDescuentoPct] = useState<number | null>(null);
  const [precioOferta, setPrecioOferta] = useState<number | null>(null);
  const [acuerdoPrecio, setAcuerdoPrecio] = useState<boolean | null>(null);

  // Estado del peritaje (¿puede venir a sucursal, o manda fotos/videos?)
  const [puedeVenir, setPuedeVenir] = useState<boolean | null>(null);
  const [archivosSubidos, setArchivosSubidos] = useState<{ nombre: string; url: string; tipo: "imagen" | "video" }[]>([]);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState("");
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  // Reserva de visita real (cuando puede venir a sucursal) — mismo motor que
  // ya usa /api/panel-v2/visitas.
  const [sucursales, setSucursales] = useState<{ id: string; nombre: string }[]>([]);
  const [sucursalVisita, setSucursalVisita] = useState("");
  const [fechaVisita, setFechaVisita] = useState("");
  const [horarioVisita, setHorarioVisita] = useState("");
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);

  useEffect(() => {
    supabase2.from("sucursales").select("id, nombre").then(({ data }) => { if (data) setSucursales(data); });
  }, []);

  useEffect(() => {
    if (!sucursalVisita || !fechaVisita) { setHorariosOcupados([]); return; }
    supabase2.rpc("visitas_horarios_ocupados", { p_sucursal: sucursalVisita, p_fecha: fechaVisita }).then(({ data }) => {
      setHorariosOcupados((data || []).map((v: { horario_visita: string }) => v.horario_visita));
    });
  }, [sucursalVisita, fechaVisita]);

  const franjasHorario = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

  // Estados de Contacto
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");

  // Turnstile (anti-spam gratuito)
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileListo, setTurnstileListo] = useState(false);
  const [turnstileError, setTurnstileError] = useState(false);
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
    return anio && marca && modelo && version && km && precioEsperado;
  };

  // Oferta instantánea: precio que puso el cliente, menos el % de descuento
  // según los km — sin llamada al servidor, al toque.
  const continuarDesdePaso1 = () => {
    const { descuentoPct: pct, oferta } = calcularOferta(Number(precioEsperado), Number(km));
    setDescuentoPct(pct);
    setPrecioOferta(oferta);
    setStep(1.5);
  };

  // Renderiza el widget de Turnstile cuando llegamos al paso de contacto
  useEffect(() => {
    if (step !== 4 || !turnstileListo || !turnstileRef.current || !window.turnstile) return;
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
  }, [step, turnstileListo]);

  // =================================================================
  // SUBIR FOTOS/VIDEOS (cuando el cliente no puede venir a sucursal)
  // =================================================================
  const subirArchivo = async (file: File) => {
    setErrorArchivo("");
    const esVideo = file.type.startsWith("video/");
    const MAX_MB = 100;
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrorArchivo(`"${file.name}" pesa más de ${MAX_MB}MB, probá con un archivo más liviano.`);
      return;
    }

    setSubiendoArchivo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-cotizacion", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir el archivo");

      setArchivosSubidos((prev) => [...prev, { nombre: file.name, url: data.publicUrl, tipo: esVideo ? "video" : "imagen" }]);
    } catch (err) {
      setErrorArchivo(err instanceof Error ? err.message : "Error al subir el archivo. Reintentá.");
    } finally {
      setSubiendoArchivo(false);
    }
  };

  const manejarSeleccionArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(subirArchivo);
    if (inputArchivoRef.current) inputArchivoRef.current.value = "";
  };

  const quitarArchivo = (url: string) => {
    setArchivosSubidos((prev) => prev.filter((a) => a.url !== url));
  };

  const validarPaso3 = () => {
    if (puedeVenir === null) return false;
    if (puedeVenir === false && archivosSubidos.length === 0) return false;
    if (puedeVenir === true && (!sucursalVisita || !fechaVisita || !horarioVisita)) return false;
    return true;
  };

  // =================================================================
  // ENVIAR COTIZACIÓN (verificación anti-spam vía Turnstile, server-side)
  // =================================================================
  const enviarCotizacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorEnvio("");

    if (!nombre.trim() || !apellido.trim() || !email.trim() || !tel.trim()) {
      mostrarError("Por favor completá todos los campos de contacto.");
      return;
    }
    if (!turnstileToken) {
      mostrarError("Completá la verificación anti-spam antes de continuar.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/panel-v2/leads-tasacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstileToken,
          canalOrigen: getCanalOrigen(),
          marca,
          modelo,
          anio,
          version,
          gnc,
          kilometraje: km,
          precioEsperado,
          descuentoPct,
          ofertaCalculada: precioOferta,
          aceptaOferta: acuerdoPrecio,
          nombre: `${nombre.trim()} ${apellido.trim()}`,
          email: email.trim(),
          telefono: tel.trim(),
          fotosYVideos: archivosSubidos.map((a) => a.url),
          ...(puedeVenir === true ? { visita: { sucursal: sucursalVisita, fecha: fechaVisita, horario: horarioVisita } } : {}),
          ...(vehiculoObjetivo ? { tipo: "permuta", vehiculoObjetivoId: vehiculoObjetivo.id } : {}),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al enviar la cotización");

      setEnviado(true);
    } catch (error) {
      console.error("Error al enviar cotización:", error);
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f] text-slate-900 dark:text-white pt-12 md:pt-16 pb-12 md:pb-50 relative font-sans overflow-hidden flex flex-col justify-between">

      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0145F2]/5 dark:bg-sky-400/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start md:items-center my-0 md:my-auto py-2 md:py-8 relative z-10">

        <div className="lg:col-span-7 flex flex-col justify-center space-y-6 text-left">
          <div className="space-y-3">
            <span className="bg-blue-50 dark:bg-sky-400/10 text-[#0145F2] dark:text-sky-300 border border-blue-100 dark:border-sky-400/20 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-block shadow-sm dark:shadow-none">
              Tasación profesional instantánea
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light text-navy dark:text-white tracking-tight leading-[1.08]">
              Cotiza tu auto de la <br />
              forma <strong className="font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0145F2] to-sky-400">más confiable.</strong>
            </h1>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 pt-2">
              RÁPIDO, SEGURO Y CONVENIENTE
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center w-full">
          <div className="bg-white/70 dark:bg-white/5 backdrop-blur-2xl border border-white dark:border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-none p-6 md:p-8 w-full max-w-md relative">

            {!enviado && vehiculoObjetivo && (
              <div className="mb-4 flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/20 rounded-xl px-3.5 py-2.5">
                <CarFront className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 leading-tight">
                  Cotizando tu auto como parte de pago para el{" "}
                  <span className="font-black">{vehiculoObjetivo.marca} {vehiculoObjetivo.modelo}</span>
                </p>
              </div>
            )}

            {!enviado && (
              <div className="mb-4">
                <h2 className="text-xl font-black text-navy dark:text-white tracking-tight">
                  {segundos > 1 ? `Cotiza tu auto en menos de ${segundos} segundos` : "Ya casi terminás, dale para adelante"}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  {step === 1 && "Ingresá los datos del vehículo"}
                  {step === 1.5 && "Esto es lo que te podemos ofrecer"}
                  {step === 2 && "¿Tu auto tiene o tuvo GNC?"}
                  {step === 3 && "¿Podés venir a una sucursal?"}
                  {step === 4 && "Dejanos tus datos de contacto"}
                </p>
              </div>
            )}

            {!enviado ? (
              <div>
                
                {step === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="relative">
                      <div 
                        onClick={() => setOpenDropdown(openDropdown === 'anio' ? null : 'anio')}
                        className={`w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border rounded-2xl px-4 py-3.5 text-sm font-semibold flex items-center justify-between cursor-pointer transition-all shadow-sm dark:shadow-none ${anio ? 'text-navy dark:text-white border-slate-300 dark:border-white/20' : 'text-slate-400 dark:text-slate-500 border-white dark:border-white/10'}`}
                      >
                        <span>{anio ? anio : "Seleccioná el año"}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${openDropdown === 'anio' ? 'rotate-180 text-[#0145F2] dark:text-sky-300' : ''}`} />
                      </div>

                      {openDropdown === 'anio' && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-[#14141c] backdrop-blur-xl border border-white dark:border-white/10 rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto p-1">
                          {aniosDisponibles.map((a) => (
                            <div
                              key={a}
                              onClick={() => { setAnio(String(a)); setOpenDropdown(null); }}
                              className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-sky-400/10 hover:text-[#0145F2] dark:hover:text-sky-300 rounded-xl cursor-pointer transition-colors"
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
                        <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${openDropdown === 'marca' ? 'rotate-180 text-[#0145F2] dark:text-sky-300' : ''}`} />
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
                                className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-sky-400/10 hover:text-[#0145F2] dark:hover:text-sky-300 rounded-xl cursor-pointer transition-colors"
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
                        <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${openDropdown === 'modelo' ? 'rotate-180 text-[#0145F2] dark:text-sky-300' : ''}`} />
                      </div>

                      {openDropdown === 'modelo' && marca && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-[#14141c] backdrop-blur-xl border border-white dark:border-white/10 rounded-2xl shadow-2xl z-50 max-h-52 overflow-y-auto p-1">
                          {modelosDisponibles.map((mod) => (
                            <div
                              key={mod}
                              onClick={() => { setModelo(mod); setOpenDropdown(null); }}
                              className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-sky-400/10 hover:text-[#0145F2] dark:hover:text-sky-300 rounded-xl cursor-pointer transition-colors"
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
                        className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold text-navy dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#0145F2] dark:focus:border-sky-400 transition-all shadow-sm dark:shadow-none"
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        placeholder="Ingresá el kilometraje (Ej: 45000)"
                        value={km}
                        onChange={(e) => setKm(e.target.value)}
                        className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold text-navy dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#0145F2] dark:focus:border-sky-400 transition-all shadow-sm dark:shadow-none"
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        placeholder="¿Cuánto esperás por tu auto? ($)"
                        value={precioEsperado}
                        onChange={(e) => setPrecioEsperado(e.target.value)}
                        className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-semibold text-navy dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#0145F2] dark:focus:border-sky-400 transition-all shadow-sm dark:shadow-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={!validarPaso1()}
                        onClick={continuarDesdePaso1}
                        className="w-full py-4 bg-gradient-to-r from-[#0145F2] to-blue-600 hover:from-blue-600 hover:to-sky-500 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                      >
                        Continuar
                      </button>
                    </div>

                  </div>
                )}

                {step === 1.5 && (
                  <div className="space-y-5 animate-fadeIn py-2">
                    <div>
                      <button onClick={() => setStep(1)} className="text-xs font-bold text-[#0145F2] flex items-center gap-1 mb-2 hover:underline">
                        <ArrowLeft className="w-3.5 h-3.5" /> Volver
                      </button>
                    </div>

                    <div className="bg-blue-50 dark:bg-sky-400/10 border border-blue-100 dark:border-sky-400/20 rounded-2xl p-5 text-center space-y-1.5">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Oferta estimada</p>
                      <p className="text-3xl font-black text-[#0145F2] dark:text-sky-300">
                        ${precioOferta?.toLocaleString("es-AR")}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Sobre los ${Number(precioEsperado).toLocaleString("es-AR")} que esperás, aplicamos un {descuentoPct}% según los km. El monto final se confirma con un peritaje.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => { setAcuerdoPrecio(true); setStep(2); }}
                        className="w-full py-4 bg-gradient-to-r from-[#0145F2] to-blue-600 hover:from-blue-600 hover:to-sky-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 cursor-pointer active:scale-95"
                      >
                        Estoy de acuerdo con este precio
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAcuerdoPrecio(false); setStep(2); }}
                        className="w-full py-4 bg-white/60 dark:bg-white/5 border border-white dark:border-white/10 text-slate-700 dark:text-slate-300 font-black rounded-2xl uppercase tracking-widest text-xs transition-all cursor-pointer active:scale-95"
                      >
                        Prefiero un peritaje presencial
                      </button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 animate-fadeIn py-2">
                    <div>
                      <button onClick={() => setStep(precioOferta ? 1.5 : 1)} className="text-xs font-bold text-[#0145F2] flex items-center gap-1 mb-2 hover:underline">
                        <ArrowLeft className="w-3.5 h-3.5" /> Volver
                      </button>
                    </div>

                    <div className="space-y-3">
                      {["Sí, tiene GNC", "No, pero tenía antes", "No, nunca tuvo"].map((op) => (
                        <div
                          key={op}
                          onClick={() => setGnc(op)}
                          className={`p-4 rounded-2xl border cursor-pointer font-bold text-xs transition-all shadow-sm dark:shadow-none ${gnc === op ? 'bg-blue-50 dark:bg-sky-400/10 border-[#0145F2] dark:border-sky-400 text-[#0145F2] dark:text-sky-300' : 'bg-white/60 dark:bg-white/5 border-white dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'}`}
                        >
                          {op}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={!gnc}
                      onClick={() => setStep(acuerdoPrecio === true ? 4 : 3)}
                      className="w-full py-4 bg-gradient-to-r from-[#0145F2] to-blue-600 hover:from-blue-600 hover:to-sky-500 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 cursor-pointer active:scale-95"
                    >
                      Continuar
                    </button>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5 animate-fadeIn py-2">
                    <div>
                      <button onClick={() => setStep(2)} className="text-xs font-bold text-[#0145F2] flex items-center gap-1 mb-2 hover:underline">
                        <ArrowLeft className="w-3.5 h-3.5" /> Volver
                      </button>
                    </div>

                    {Number(km) > 200000 && (
                      <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 rounded-2xl p-3.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                          Por el kilometraje que indicaste, te recomendamos acercarte a una sucursal para un peritaje presencial más preciso.
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div
                        onClick={() => setPuedeVenir(true)}
                        className={`p-4 rounded-2xl border cursor-pointer font-bold text-xs transition-all shadow-sm dark:shadow-none flex items-center gap-3 ${puedeVenir === true ? 'bg-blue-50 dark:bg-sky-400/10 border-[#0145F2] dark:border-sky-400 text-[#0145F2] dark:text-sky-300' : 'bg-white/60 dark:bg-white/5 border-white dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'}`}
                      >
                        <Building2 className="w-4 h-4 shrink-0" />
                        Sí, puedo llevarlo a una sucursal para el peritaje
                      </div>
                      <div
                        onClick={() => setPuedeVenir(false)}
                        className={`p-4 rounded-2xl border cursor-pointer font-bold text-xs transition-all shadow-sm dark:shadow-none flex items-center gap-3 ${puedeVenir === false ? 'bg-blue-50 dark:bg-sky-400/10 border-[#0145F2] dark:border-sky-400 text-[#0145F2] dark:text-sky-300' : 'bg-white/60 dark:bg-white/5 border-white dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'}`}
                      >
                        <Camera className="w-4 h-4 shrink-0" />
                        No, prefiero mandar fotos y videos
                      </div>
                    </div>

                    {puedeVenir === true && (
                      <div className="space-y-3 animate-fadeIn">
                        <div className="relative">
                          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Sucursal</label>
                          <select
                            value={sucursalVisita}
                            onChange={(e) => { setSucursalVisita(e.target.value); setHorarioVisita(""); }}
                            className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-navy dark:text-white outline-none focus:border-[#0145F2] dark:focus:border-sky-400 shadow-sm dark:shadow-none cursor-pointer"
                          >
                            <option value="">Seleccioná el local</option>
                            {sucursales.map((s) => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Día</label>
                            <input
                              type="date"
                              min={new Date().toISOString().split("T")[0]}
                              value={fechaVisita}
                              onChange={(e) => { setFechaVisita(e.target.value); setHorarioVisita(""); }}
                              className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-3 py-3 text-xs font-semibold text-navy dark:text-white outline-none focus:border-[#0145F2] dark:focus:border-sky-400 shadow-sm dark:shadow-none dark:[color-scheme:dark]"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Horario</label>
                            <select
                              value={horarioVisita}
                              onChange={(e) => setHorarioVisita(e.target.value)}
                              disabled={!sucursalVisita || !fechaVisita}
                              className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-3 py-3 text-xs font-semibold text-navy dark:text-white outline-none focus:border-[#0145F2] dark:focus:border-sky-400 shadow-sm dark:shadow-none disabled:opacity-50 cursor-pointer dark:[color-scheme:dark]"
                            >
                              <option value="">{!sucursalVisita || !fechaVisita ? "Elegí sucursal y día" : "Elegir..."}</option>
                              {franjasHorario.map((f) => <option key={f} value={f} disabled={horariosOcupados.includes(f)}>{f} {horariosOcupados.includes(f) ? "(ocupado)" : ""}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {puedeVenir === false && (
                      <div className="space-y-3 animate-fadeIn">
                        <input
                          ref={inputArchivoRef}
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={manejarSeleccionArchivos}
                          className="hidden"
                          id="input-archivos-cotizacion"
                        />
                        <label
                          htmlFor="input-archivos-cotizacion"
                          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-[#0145F2] dark:hover:border-sky-400 rounded-2xl py-6 cursor-pointer transition-colors bg-white/50 dark:bg-white/5"
                        >
                          {subiendoArchivo ? (
                            <Loader2 className="w-5 h-5 text-[#0145F2] dark:text-sky-300 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                          )}
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {subiendoArchivo ? "Subiendo..." : "Tocá para subir fotos o videos"}
                          </span>
                        </label>

                        {errorArchivo && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{errorArchivo}</p>
                        )}

                        {archivosSubidos.length > 0 && (
                          <div className="space-y-1.5">
                            {archivosSubidos.map((a) => (
                              <div key={a.url} className="flex items-center gap-2 bg-white/70 dark:bg-white/5 border border-white dark:border-white/10 rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                {a.tipo === "video" ? <FileVideo className="w-3.5 h-3.5 text-[#0145F2] dark:text-sky-300 shrink-0" /> : <ImageIcon className="w-3.5 h-3.5 text-[#0145F2] dark:text-sky-300 shrink-0" />}
                                <span className="truncate flex-1">{a.nombre}</span>
                                <button type="button" onClick={() => quitarArchivo(a.url)} className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 shrink-0">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={!validarPaso3() || subiendoArchivo}
                      onClick={() => setStep(4)}
                      className="w-full py-4 bg-gradient-to-r from-[#0145F2] to-blue-600 hover:from-blue-600 hover:to-sky-500 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 cursor-pointer active:scale-95"
                    >
                      Continuar
                    </button>
                  </div>
                )}

                {step === 4 && (
                  <form onSubmit={enviarCotizacion} className="space-y-4 animate-fadeIn">
                    <div>
                      <button type="button" onClick={() => setStep(acuerdoPrecio === true ? 2 : 3)} className="text-xs font-bold text-[#0145F2] flex items-center gap-1 mb-2 hover:underline">
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
                        className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-navy dark:text-white outline-none focus:border-[#0145F2] dark:focus:border-sky-400 shadow-sm dark:shadow-none"
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
                        className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-navy dark:text-white outline-none focus:border-[#0145F2] dark:focus:border-sky-400 shadow-sm dark:shadow-none"
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
                        className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-navy dark:text-white outline-none focus:border-[#0145F2] dark:focus:border-sky-400 shadow-sm dark:shadow-none"
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
                          className="flex-1 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white dark:border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-navy dark:text-white outline-none focus:border-[#0145F2] dark:focus:border-sky-400 shadow-sm dark:shadow-none"
                        />
                      </div>
                    </div>

                    <div className="pt-1 flex flex-col items-center gap-1.5">
                      <div ref={turnstileRef} />
                      {turnstileError && (
                        <p className="text-[10px] text-rose-500 font-medium text-center max-w-xs">
                          No se pudo cargar la verificación anti-spam. Puede ser un bloqueador de anuncios o un problema temporal — probá recargar la página.
                        </p>
                      )}
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
                      className="w-full py-4 bg-gradient-to-r from-[#0145F2] to-blue-600 hover:from-blue-600 hover:to-sky-500 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? "Enviando..." : "Enviar solicitud de cotización"}
                    </button>
                  </form>
                )}

              </div>
            ) : (
              <EnvioExitoso
                color="blue"
                titulo="¡Cotización enviada!"
                mensaje="Recibimos los datos de tu vehículo y un asesor comercial se pondrá en contacto a la brevedad."
              >
                <Link href="/" className="inline-block py-3.5 px-8 bg-gradient-to-r from-[#0145F2] to-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">
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

      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onLoad={() => setTurnstileListo(true)}
      />
    </div>
  );
}