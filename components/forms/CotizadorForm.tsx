"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Loader2, ChevronDown, X, CalendarDays, CarFront, Gauge, Zap, Check, Settings2, Flame, Fuel,
  Upload, FileVideo, ImageIcon, Building2, Camera, AlertTriangle, MapPin, Clock, Repeat,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EnvioExitoso from "@/components/EnvioExitoso";
import { getCanalOrigen, getUtmRaw } from "@/lib/utm";
import { supabase2 } from "@/lib/supabase/client";
import { calcularOferta } from "@/lib/panel/descuentoPorKm";
import { normalizarMarca } from "@/lib/vehiculos";
import { MARCAS_ARGENTINA, MODELOS_POR_MARCA } from "@/lib/marcasModelos";
import { LOGOS_MARCAS } from "@/lib/marcasLogos";

const marcasDisponibles = MARCAS_ARGENTINA;
const modelosPorMarca = MODELOS_POR_MARCA;
const aniosDisponibles = Array.from({ length: 20 }, (_, i) => 2026 - i);
const combustiblesDisponibles = ["Nafta", "Diésel", "GNC", "Híbrido", "Eléctrico"];
const MIN_FOTOS_SIN_VISITA = 5;
const franjasHorario = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

interface VehiculoObjetivo { id: string; marca: string; modelo: string; precio: number; moneda: "ARS" | "USD" }

// --- COMPONENTES DE UI INTERNOS (mismo sistema visual que ConsignarForm.tsx) ---

function ProgressStepper({ currentStep, totalSteps, labels }: { currentStep: number; totalSteps: number[]; labels: string[] }) {
  return (
    <div className="flex items-start mb-4 lg:mb-10 w-full max-w-sm">
      {totalSteps.map((num, idx) => {
        const isActive = currentStep >= num;
        return (
          <div key={num} className="flex items-start flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 lg:gap-2 w-8">
              <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-[10px] lg:text-xs font-bold shrink-0 transition-colors duration-300 ${isActive ? "bg-[#0145F2] dark:bg-[#0145F2] text-white" : "bg-transparent border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500"}`}>
                {idx + 1}
              </div>
              <span className={`text-[8px] lg:text-[9px] uppercase tracking-widest whitespace-nowrap ${isActive ? "text-slate-700 dark:text-slate-300 font-bold" : "text-slate-400 dark:text-slate-600"}`}>
                {labels[idx]}
              </span>
            </div>
            {idx < totalSteps.length - 1 && (
              <div className={`h-[1px] flex-1 mx-3 mt-3 lg:mt-4 transition-colors duration-300 ${isActive ? "bg-[#0145F2]/50" : "bg-slate-200 dark:bg-slate-800"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConfigField({
  icon: Icon, label, value, isOpen, onClick, children, isCompleted,
}: {
  icon: any; label: string; value: string; isOpen: boolean; onClick: () => void; children: React.ReactNode; isCompleted: boolean;
}) {
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? "col-span-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-[#161e2c] shadow-sm dark:shadow-none" : "border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a] hover:bg-white dark:hover:bg-[#161e2c]"}`}>
      <div onClick={onClick} className="lg:hidden flex flex-col gap-1.5 p-3 cursor-pointer">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest truncate">{label}</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span className={`text-xs font-bold truncate ${value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600"}`}>{value || "Elegir"}</span>
          {isCompleted && !isOpen ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" /> : <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />}
        </div>
      </div>
      <div onClick={onClick} className="hidden lg:flex items-center justify-between p-4 cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" /></div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{label}</span>
            <span className={`text-sm font-bold truncate mt-0.5 ${value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600"}`}>{value || "Seleccionar..."}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isCompleted && !isOpen && <Check className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />}
          <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-3 lg:p-4 pt-0 border-t border-slate-100 dark:border-white/5 mt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
// step 1: vehículo (tiles) | 2: GNC | 2.5: calculando | 3: oferta | 3.5: visita-o-fotos (solo si rechaza la oferta) | 4: contacto

export default function CotizadorForm({ vehiculoObjetivo }: { vehiculoObjetivo?: VehiculoObjetivo } = {}) {
  const [step, setStep] = useState<number>(1);

  // Estados del vehículo
  const [anio, setAnio] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [version, setVersion] = useState("");
  const [km, setKm] = useState("");
  const [combustible, setCombustible] = useState("");
  const [gnc, setGnc] = useState("");
  const [precioEsperado, setPrecioEsperado] = useState("");

  // Oferta instantánea
  const [descuentoPct, setDescuentoPct] = useState<number | null>(null);
  const [precioOferta, setPrecioOferta] = useState<number | null>(null);
  const [acuerdoPrecio, setAcuerdoPrecio] = useState<boolean | null>(null);

  // Peritaje: sucursal o fotos
  const [puedeVenir, setPuedeVenir] = useState<boolean | null>(null);
  const [archivosSubidos, setArchivosSubidos] = useState<{ nombre: string; url: string; tipo: "imagen" | "video" }[]>([]);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState("");
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  const [sucursales, setSucursales] = useState<{ id: string; nombre: string }[]>([]);
  const [sucursalVisita, setSucursalVisita] = useState("");
  const [fechaVisita, setFechaVisita] = useState("");
  const [horarioVisita, setHorarioVisita] = useState("");
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);

  useEffect(() => {
    supabase2.rpc("sucursales_publicas").then(({ data }) => { if (data) setSucursales(data); });
  }, []);
  useEffect(() => {
    if (!sucursalVisita || !fechaVisita) { setHorariosOcupados([]); return; }
    supabase2.rpc("visitas_horarios_ocupados", { p_sucursal: sucursalVisita, p_fecha: fechaVisita }).then(({ data }) => {
      setHorariosOcupados((data || []).map((v: { horario_visita: string }) => v.horario_visita));
    });
  }, [sucursalVisita, fechaVisita]);

  // Estados de Contacto
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");

  // UI States
  const [openDropdown, setOpenDropdown] = useState<string | null>("anio");
  const [busquedaMarca, setBusquedaMarca] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [imageError, setImageError] = useState(false);
  const [fotoStock, setFotoStock] = useState<string | null>(null);

  const formatKm = (value: string) => (value ? Number(value).toLocaleString("es-AR") : "0");
  const marcasFiltradas = marcasDisponibles.filter((m) => m.toLowerCase().includes(busquedaMarca.toLowerCase()));
  const modelosDisponibles = modelosPorMarca[marca] || ["Base", "Full", "Sport", "Standard", "Otro"];

  const validarPaso1 = () => anio && marca && modelo && version && km && combustible && precioEsperado;

  useEffect(() => {
    if (anio && openDropdown === "anio") setOpenDropdown("marca");
    else if (marca && openDropdown === "marca") setOpenDropdown("modelo");
    else if (modelo && openDropdown === "modelo") setOpenDropdown("version");
  }, [anio, marca, modelo]);

  useEffect(() => { setImageError(false); }, [marca, modelo]);

  useEffect(() => {
    if (!marca || !modelo) { setFotoStock(null); return; }
    let cancelado = false;
    supabase2.from("vehiculos").select("fotos, marca, modelo").in("estado", ["disponible", "reservado"]).ilike("modelo", `%${modelo}%`).then(({ data }) => {
      if (cancelado || !data) return;
      const match = data.find((v) => normalizarMarca(v.marca) === normalizarMarca(marca));
      setFotoStock(match?.fotos?.[0] || null);
    });
    return () => { cancelado = true; };
  }, [marca, modelo]);

  // Oferta instantánea: precio que puso el cliente, menos el % de descuento
  // según los km -- con animación de "estamos calculando" antes de revelarla.
  const continuarDesdeGnc = () => {
    const { descuentoPct: pct, oferta } = calcularOferta(Number(precioEsperado), Number(km));
    setDescuentoPct(pct);
    setPrecioOferta(oferta);
    setStep(2.5);
    setTimeout(() => setStep(3), 2200);
  };

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
  const quitarArchivo = (url: string) => setArchivosSubidos((prev) => prev.filter((a) => a.url !== url));

  const validarPasoVisita = () => {
    if (puedeVenir === null) return false;
    if (puedeVenir === false && archivosSubidos.length < MIN_FOTOS_SIN_VISITA) return false;
    if (puedeVenir === true && (!sucursalVisita || !fechaVisita || !horarioVisita)) return false;
    return true;
  };

  const enviarCotizacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorEnvio("");

    if (!nombre.trim() || !apellido.trim() || !email.trim() || !tel.trim()) {
      setErrorEnvio("Por favor completá todos los campos de contacto.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/panel/leads-tasacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canalOrigen: getCanalOrigen(),
          utmSource: getUtmRaw().utm_source,
          utmMedium: getUtmRaw().utm_medium,
          utmCampaign: getUtmRaw().utm_campaign,
          marca, modelo, anio, version, combustible, gnc,
          kilometraje: km,
          precioEsperado, descuentoPct, ofertaCalculada: precioOferta, aceptaOferta: acuerdoPrecio,
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
      setErrorEnvio(error instanceof Error ? error.message : "Hubo un problema. Reintentá.");
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f] flex flex-col">
        <EnvioExitoso color="blue" titulo="¡Cotización enviada!" mensaje="Recibimos los datos de tu vehículo y un asesor comercial se pondrá en contacto a la brevedad.">
          <Link href="/" className="inline-block py-3.5 px-8 bg-[#0145F2] hover:bg-[#0138c9] text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-colors">Volver al inicio</Link>
        </EnvioExitoso>
      </div>
    );
  }

  const logoPath = LOGOS_MARCAS[marca] || `/vehicles/brands/${marca.toLowerCase()}.svg`;
  const carPath = fotoStock || `/vehicles/models/${marca.toLowerCase()}/${modelo.toLowerCase().replace(/ /g, "-")}.webp`;

  // Etapas del stepper visible: 1 vehículo, 2 GNC/oferta, 3 peritaje (solo
  // si rechazó la oferta), 4 contacto -- si aceptó la oferta, se saltea el
  // paso de peritaje entero (no tiene sentido pedir fotos/visita si ya
  // está de acuerdo con el número).
  const stepsVisibles = acuerdoPrecio === true ? [1, 2, 4] : [1, 2, 3, 4];
  const labelsVisibles = acuerdoPrecio === true ? ["VEHÍCULO", "OFERTA", "CONTACTO"] : ["VEHÍCULO", "OFERTA", "PERITAJE", "CONTACTO"];
  const stepperActual = step >= 3.5 ? 3.5 : step;

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#0a0a0f] text-slate-900 dark:text-white flex flex-col lg:flex-row font-sans">

      {/* ================= ZONA IZQUIERDA: PREVIEW DINÁMICA ================= */}
      <div className="w-full lg:w-[55%] h-[38vh] min-h-[300px] lg:h-[calc(100vh-5rem)] lg:sticky lg:top-20 relative bg-slate-100 dark:bg-[#050b14] overflow-hidden shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(1,69,242,0.08),transparent_60%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[20%] bg-[#0145F2]/10 dark:bg-[#0145F2]/20 blur-[100px] rounded-full" />

        <div className="absolute top-4 left-4 right-4 lg:top-6 lg:left-6 lg:right-auto z-20">
          <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pr-24">
            {[{ value: anio, icon: CalendarDays }, { value: marca, icon: CarFront }, { value: modelo, icon: Settings2 }, { value: version, icon: Zap }].filter((item) => item.value).map((item, i) => (
              <div key={i} className="shrink-0 bg-white/70 dark:bg-black/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm dark:shadow-none">
                <item.icon className="w-3 h-3 text-[#0145F2] dark:text-blue-400 shrink-0" />
                <span className="text-[10px] font-bold text-slate-900 dark:text-white truncate max-w-[90px]">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <CarFront className="w-6 h-6 text-[#0145F2] dark:text-blue-400 shrink-0" />
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">{vehiculoObjetivo ? "Tu permuta" : "Cotizá tu vehículo"}</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tasación profesional instantánea</p>
            </div>
          </div>
        </div>

        {vehiculoObjetivo && (
          <div className="absolute top-16 left-4 right-4 lg:top-20 lg:left-6 lg:right-6 z-20">
            <div className="flex items-center gap-2.5 bg-emerald-50/90 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/20 backdrop-blur-md rounded-xl px-3.5 py-2.5">
              <Repeat className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 leading-tight">
                Como parte de pago para el <span className="font-black">{vehiculoObjetivo.marca} {vehiculoObjetivo.modelo}</span>
              </p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {km && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`absolute right-4 lg:right-6 z-20 bg-blue-50/90 dark:bg-blue-900/40 border border-blue-200 dark:border-[#0145F2]/30 backdrop-blur-xl rounded-xl lg:rounded-2xl px-3 py-2 lg:px-5 lg:py-3 flex items-center gap-2 lg:gap-3 shadow-[0_0_30px_rgba(1,69,242,0.12)] dark:shadow-[0_0_30px_rgba(1,69,242,0.3)] ${vehiculoObjetivo ? "top-32 lg:top-24" : "top-16 lg:top-8"}`}>
              <Gauge className="w-4 h-4 lg:w-5 lg:h-5 text-[#0145F2] dark:text-blue-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[8px] lg:text-[9px] font-bold uppercase tracking-widest text-[#0138c9]/70 dark:text-blue-200/70">Kilómetros</span>
                <motion.span key={km} initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} className="text-sm lg:text-lg font-black text-slate-900 dark:text-white leading-none font-mono">
                  {formatKm(km)} <span className="text-xs lg:text-sm font-bold text-[#0145F2] dark:text-blue-300">KM</span>
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-0 flex items-center justify-center px-4 pt-12 pb-14 lg:p-8 lg:pt-0 lg:pb-0">
          <AnimatePresence mode="wait">
            {!marca ? (
              <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(10px)", scale: 0.9 }} className="text-center">
                <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto mb-4 lg:mb-6 bg-white dark:bg-white/5 shadow-sm dark:shadow-none">
                  <Zap className="w-6 h-6 lg:w-8 lg:h-8 text-slate-400 dark:text-slate-600" />
                </div>
                <h3 className="text-lg lg:text-2xl font-black text-slate-700 dark:text-slate-300 tracking-tight px-4">Comenzá tu cotización</h3>
                <p className="text-xs lg:text-sm text-slate-500 mt-2 px-4">Tu vehículo aparecerá en este espacio.</p>
              </motion.div>
            ) : marca && !modelo ? (
              <motion.div key="logo" initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }} transition={{ duration: 0.5 }} className="flex flex-col items-center">
                <div className="relative w-32 h-32 lg:w-48 lg:h-48 flex items-center justify-center">
                  <img src={logoPath} alt={marca} className="max-w-full max-h-full object-contain drop-shadow-2xl" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  <span className="absolute inset-0 flex items-center justify-center text-2xl lg:text-4xl font-black text-slate-900 dark:text-white opacity-10 dark:opacity-20 -z-10 tracking-tighter uppercase">{marca}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div key="car" initial={{ opacity: 0, x: 50, filter: "blur(10px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} transition={{ duration: 0.6, ease: "easeOut" }} className="relative w-full max-w-2xl h-full flex flex-col items-center justify-center">
                {!imageError ? (
                  <img src={carPath} alt={`${marca} ${modelo}`} className="w-full h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10" onError={() => setImageError(true)} />
                ) : (
                  <div className="flex flex-col items-center">
                    <img src={logoPath} alt={marca} className="w-20 h-20 lg:w-32 lg:h-32 object-contain mb-4 lg:mb-8 opacity-70 dark:opacity-50" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    <h2 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter text-center px-4">{marca} {modelo}</h2>
                  </div>
                )}
                <div className="absolute bottom-[8%] lg:bottom-[30%] w-[80%] h-8 bg-black/10 dark:bg-black/60 blur-xl rounded-full" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden lg:flex absolute bottom-6 left-10 right-10 flex-wrap gap-4 z-20">
          {[{ label: "Año", value: anio, icon: CalendarDays }, { label: "Marca", value: marca, icon: CarFront }, { label: "Modelo", value: modelo, icon: Settings2 }, { label: "Versión", value: version, icon: Zap }].map((item, i) => (
            <div key={i} className="flex-1 min-w-[120px] bg-white/70 dark:bg-black/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-sm dark:shadow-none">
              <item.icon className={`w-4 h-4 shrink-0 ${item.value ? "text-[#0145F2] dark:text-blue-400" : "text-slate-400 dark:text-slate-600"}`} />
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">{item.label}</span>
                <span className={`text-xs font-bold truncate ${item.value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600"}`}>{item.value || "—"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= ZONA DERECHA: CONFIGURADOR ================= */}
      <div className="w-full lg:w-[45%] h-auto bg-white dark:bg-[#0a0a0f] flex flex-col items-center pt-2 lg:pt-10 pb-10 px-6 lg:px-12">
        <div className="w-full max-w-md">
          <ProgressStepper currentStep={stepperActual} totalSteps={stepsVisibles} labels={labelsVisibles} />

          <div className="mb-4 lg:mb-8">
            {/* h1 real de la página -- no tenía ninguno (hallazgo de
               auditoría SEO), el título visual era un <h2> suelto. */}
            <h1 className="text-lg lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1 lg:mb-2">{vehiculoObjetivo ? "Cotizá tu permuta" : "Cotizá tu vehículo"}</h1>
            <p className="hidden lg:block text-sm text-slate-500 dark:text-slate-400">
              {step === 1 && "Completá los datos y comenzá a ver tu auto en tiempo real."}
              {step === 2 && "¿Tu auto tiene o tuvo GNC?"}
              {step === 2.5 && "Estamos tasando tu vehículo."}
              {step === 3 && "Esto es lo que te podemos ofrecer."}
              {step === 3.5 && "¿Podés venir a una sucursal?"}
              {step === 4 && "Dejanos tus datos para que un asesor te contacte."}
            </p>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">

              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="grid grid-cols-2 gap-2 lg:block lg:space-y-3">
                  <ConfigField icon={CalendarDays} label="Año" value={anio} isOpen={openDropdown === "anio"} onClick={() => setOpenDropdown(openDropdown === "anio" ? null : "anio")} isCompleted={!!anio}>
                    <div className="grid grid-cols-5 gap-1.5">
                      {aniosDisponibles.map((a) => (
                        <button key={a} onClick={() => { setAnio(String(a)); setOpenDropdown("marca"); }} className={`py-1.5 text-[11px] font-bold rounded-md border transition-all ${anio === String(a) ? "bg-[#0145F2] border-[#0145F2] text-white" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20"}`}>{a}</button>
                      ))}
                    </div>
                  </ConfigField>

                  <ConfigField icon={CarFront} label="Marca" value={marca} isOpen={openDropdown === "marca"} onClick={() => setOpenDropdown(openDropdown === "marca" ? null : "marca")} isCompleted={!!marca}>
                    <input type="text" placeholder="Buscá tu marca..." value={busquedaMarca} onChange={(e) => setBusquedaMarca(e.target.value)} className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-[#0145F2] mb-3" />
                    <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                      {marcasFiltradas.map((m) => (
                        <button key={m} onClick={() => { setMarca(m); setModelo(""); setOpenDropdown("modelo"); setBusquedaMarca(""); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${marca === m ? "bg-[#0145F2] text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"}`}>{m}</button>
                      ))}
                    </div>
                  </ConfigField>

                  <ConfigField icon={Settings2} label="Modelo" value={modelo} isOpen={openDropdown === "modelo"} onClick={() => marca && setOpenDropdown(openDropdown === "modelo" ? null : "modelo")} isCompleted={!!modelo}>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                      {modelosDisponibles.map((mod) => (
                        <button key={mod} onClick={() => { setModelo(mod); setOpenDropdown("version"); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${modelo === mod ? "bg-[#0145F2] text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"}`}>{mod}</button>
                      ))}
                    </div>
                  </ConfigField>

                  <ConfigField icon={Zap} label="Versión" value={version} isOpen={openDropdown === "version"} onClick={() => setOpenDropdown(openDropdown === "version" ? null : "version")} isCompleted={!!version}>
                    <input type="text" placeholder="Ej: 1.0 Turbo Premier..." value={version} onChange={(e) => setVersion(e.target.value)} className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-[#0145F2]" />
                    <button onClick={() => setOpenDropdown("km")} className="mt-3 w-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xs font-bold py-2.5 rounded-lg transition-colors">Confirmar Versión</button>
                  </ConfigField>

                  <ConfigField icon={Gauge} label="Kilómetros" value={km ? formatKm(km) + " km" : ""} isOpen={openDropdown === "km"} onClick={() => setOpenDropdown(openDropdown === "km" ? null : "km")} isCompleted={!!km}>
                    <input type="number" placeholder="Ej: 45000" value={km} onChange={(e) => setKm(e.target.value)} className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-[#0145F2] font-mono" />
                    <button onClick={() => setOpenDropdown("combustible")} className="mt-3 w-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xs font-bold py-2.5 rounded-lg transition-colors">Confirmar Kilometraje</button>
                  </ConfigField>

                  <ConfigField icon={Fuel} label="Combustible" value={combustible} isOpen={openDropdown === "combustible"} onClick={() => setOpenDropdown(openDropdown === "combustible" ? null : "combustible")} isCompleted={!!combustible}>
                    <div className="space-y-1">
                      {combustiblesDisponibles.map((c) => (
                        <button key={c} onClick={() => { setCombustible(c); setOpenDropdown("precio"); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${combustible === c ? "bg-[#0145F2] text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"}`}>{c}</button>
                      ))}
                    </div>
                  </ConfigField>

                  <ConfigField icon={Gauge} label="Precio esperado" value={precioEsperado ? `$ ${formatKm(precioEsperado)}` : ""} isOpen={openDropdown === "precio"} onClick={() => setOpenDropdown(openDropdown === "precio" ? null : "precio")} isCompleted={!!precioEsperado}>
                    <input type="number" placeholder="¿Cuánto esperás por tu auto?" value={precioEsperado} onChange={(e) => setPrecioEsperado(e.target.value)} className="w-full bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-[#0145F2] font-mono" />
                    <button onClick={() => setOpenDropdown(null)} className="mt-3 w-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xs font-bold py-2.5 rounded-lg transition-colors">Confirmar Precio</button>
                  </ConfigField>

                  <div className="col-span-2 pt-3 lg:pt-6">
                    <button onClick={() => setStep(2)} disabled={!validarPaso1()} className="w-full py-4 bg-[#0145F2] hover:bg-[#0145F2] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2">
                      Siguiente Paso <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 mb-4 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver al vehículo
                  </button>
                  <div className="bg-slate-50 dark:bg-[#161e2c] border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6"><Flame className="w-5 h-5 text-amber-500" /><h3 className="font-bold text-slate-900 dark:text-white">¿El vehículo tiene GNC?</h3></div>
                    <div className="space-y-3">
                      {["Sí, tiene GNC", "No, pero tenía antes", "No, nunca tuvo"].map((op) => (
                        <button key={op} onClick={() => setGnc(op)} className={`w-full text-left px-5 py-4 rounded-xl border text-sm font-bold transition-all ${gnc === op ? "bg-blue-50 dark:bg-[#0145F2]/20 border-[#0145F2] text-[#0138c9] dark:text-white" : "bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"}`}>{op}</button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-6">
                    <button onClick={continuarDesdeGnc} disabled={!gnc} className="w-full py-4 bg-[#0145F2] hover:bg-[#0145F2] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2">
                      Ver mi oferta <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2.5 && (
                <motion.div key="step2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-16 flex flex-col items-center text-center space-y-5">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-[#0145F2]/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-[#0145F2] dark:border-blue-400 border-t-transparent animate-spin" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-black text-slate-900 dark:text-white">Analizando el mercado y tasando tu {marca} {modelo}...</p>
                    <p className="text-xs text-slate-400 font-medium">Comparamos contra unidades similares para darte un valor real.</p>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-5">
                  <button onClick={() => setStep(2)} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 mb-2 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver
                  </button>
                  <div className="bg-blue-50 dark:bg-[#0145F2]/10 border border-blue-100 dark:border-[#0145F2]/20 rounded-2xl p-6 text-center space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Oferta estimada</p>
                    <p className="text-3xl font-black text-[#0145F2] dark:text-blue-300">${precioOferta?.toLocaleString("es-AR")}</p>
                  </div>
                  <div className="space-y-3">
                    <button onClick={() => { setAcuerdoPrecio(true); setStep(4); }} className="w-full py-4 bg-[#0145F2] hover:bg-[#0145F2] text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-colors">
                      Estoy de acuerdo con este precio
                    </button>
                    <button onClick={() => { setAcuerdoPrecio(false); setStep(3.5); }} className="w-full py-4 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-black rounded-2xl uppercase tracking-widest text-xs transition-colors">
                      Prefiero un peritaje presencial
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3.5 && (
                <motion.div key="step3.5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
                  <button onClick={() => setStep(3)} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 mb-2 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver
                  </button>

                  {Number(km) > 200000 && (
                    <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 rounded-2xl p-3.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">Por el kilometraje que indicaste, te recomendamos acercarte a una sucursal para un peritaje presencial más preciso.</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <button onClick={() => setPuedeVenir(true)} className={`w-full text-left p-4 rounded-2xl border font-bold text-sm transition-all flex items-center gap-3 ${puedeVenir === true ? "bg-blue-50 dark:bg-[#0145F2]/20 border-[#0145F2] text-[#0138c9] dark:text-white" : "bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"}`}>
                      <Building2 className="w-4 h-4 shrink-0" /> Sí, puedo llevarlo a una sucursal
                    </button>
                    <button onClick={() => setPuedeVenir(false)} className={`w-full text-left p-4 rounded-2xl border font-bold text-sm transition-all flex items-center gap-3 ${puedeVenir === false ? "bg-blue-50 dark:bg-[#0145F2]/20 border-[#0145F2] text-[#0138c9] dark:text-white" : "bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"}`}>
                      <Camera className="w-4 h-4 shrink-0" /> No, prefiero mandar fotos y videos
                    </button>
                  </div>

                  {puedeVenir === true && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Sucursal</label>
                        <select value={sucursalVisita} onChange={(e) => { setSucursalVisita(e.target.value); setHorarioVisita(""); }} className="w-full bg-slate-50 dark:bg-[#161e2c] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#0145F2] cursor-pointer">
                          <option value="">Seleccioná el local</option>
                          {sucursales.map((s) => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Día</label>
                          <input type="date" min={new Date().toISOString().split("T")[0]} value={fechaVisita} onChange={(e) => { setFechaVisita(e.target.value); setHorarioVisita(""); }} className="w-full bg-slate-50 dark:bg-[#161e2c] border border-slate-200 dark:border-white/5 rounded-xl px-3 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#0145F2] dark:[color-scheme:dark]" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Horario</label>
                          <select value={horarioVisita} onChange={(e) => setHorarioVisita(e.target.value)} disabled={!sucursalVisita || !fechaVisita} className="w-full bg-slate-50 dark:bg-[#161e2c] border border-slate-200 dark:border-white/5 rounded-xl px-3 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#0145F2] disabled:opacity-50 cursor-pointer dark:[color-scheme:dark]">
                            <option value="">{!sucursalVisita || !fechaVisita ? "Elegí sucursal y día" : "Elegir..."}</option>
                            {franjasHorario.map((f) => <option key={f} value={f} disabled={horariosOcupados.includes(f)}>{f} {horariosOcupados.includes(f) ? "(ocupado)" : ""}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {puedeVenir === false && (
                    <div className="space-y-3">
                      <input ref={inputArchivoRef} type="file" accept="image/*,video/*" multiple onChange={manejarSeleccionArchivos} className="hidden" id="input-archivos-cotizacion" />
                      <label htmlFor="input-archivos-cotizacion" className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-[#0145F2] dark:hover:border-blue-400 rounded-2xl py-8 cursor-pointer transition-colors bg-slate-50 dark:bg-[#161e2c]">
                        {subiendoArchivo ? <Loader2 className="w-5 h-5 text-[#0145F2] dark:text-blue-400 animate-spin" /> : <Upload className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{subiendoArchivo ? "Subiendo..." : "Tocá para subir fotos o videos"}</span>
                      </label>
                      <p className={`text-xs font-bold ${archivosSubidos.length >= MIN_FOTOS_SIN_VISITA ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>{archivosSubidos.length} / {MIN_FOTOS_SIN_VISITA} fotos mínimas</p>
                      {errorArchivo && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{errorArchivo}</p>}
                      {archivosSubidos.length > 0 && (
                        <div className="space-y-1.5">
                          {archivosSubidos.map((a) => (
                            <div key={a.url} className="flex items-center gap-2 bg-slate-50 dark:bg-[#161e2c] border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                              {a.tipo === "video" ? <FileVideo className="w-3.5 h-3.5 text-[#0145F2] dark:text-blue-400 shrink-0" /> : <ImageIcon className="w-3.5 h-3.5 text-[#0145F2] dark:text-blue-400 shrink-0" />}
                              <span className="truncate flex-1">{a.nombre}</span>
                              <button type="button" onClick={() => quitarArchivo(a.url)} className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 shrink-0"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <button onClick={() => setStep(4)} disabled={!validarPasoVisita() || subiendoArchivo} className="w-full py-4 bg-[#0145F2] hover:bg-[#0145F2] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2">
                      Siguiente Paso <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <button onClick={() => setStep(acuerdoPrecio === true ? 3 : 3.5)} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 mb-6 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver
                  </button>

                  <form onSubmit={enviarCotizacion} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">Nombre</label>
                        <input required type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-slate-50 dark:bg-[#161e2c] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#0145F2] transition-colors" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">Apellido</label>
                        <input required type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} className="w-full bg-slate-50 dark:bg-[#161e2c] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#0145F2] transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">Email</label>
                      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-[#161e2c] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#0145F2] transition-colors" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2">Teléfono Celular</label>
                      <div className="flex gap-2">
                        <div className="bg-slate-100 dark:bg-[#161e2c] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center">+549</div>
                        <input required type="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="11 1234 5678" className="flex-1 bg-slate-50 dark:bg-[#161e2c] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-[#0145F2] transition-colors" />
                      </div>
                    </div>

                    {errorEnvio && (
                      <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4 mt-4">
                        <X className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-600 dark:text-rose-300 font-medium leading-relaxed">{errorEnvio}</p>
                      </div>
                    )}

                    <div className="pt-6">
                      <button type="submit" disabled={loading} className="w-full py-4 bg-[#0145F2] hover:bg-[#0145F2] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2">
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
    </div>
  );
}
