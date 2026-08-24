"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Inter, Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import { ChevronRight, X, Menu, Loader2, CheckCircle2, Phone } from "lucide-react";
import { KARRY_VERSIONS } from "@/lib/karry-versions";
import VehiculosCarousel from "./VehiculosCarousel";

const IMAGENES_CARRUSEL_KARRY: Record<string, string> = {
  "cabina-simple": "/Karry-cabina-simple/Karry-cabina-simple.png",
  "cabina-doble": "/Karry-cabina-doble/Karry-cabina-doble.png",
};

const CARRUSEL_KARRY = KARRY_VERSIONS.map((v, i) => ({
  src: IMAGENES_CARRUSEL_KARRY[v.slug] || v.image,
  bg: ["#0145F2", "#0B2E8C"][i % 2],
  panel: ["#3A6BD6", "#284EA3"][i % 2],
  name: v.name,
  subtitle: v.subtitle,
  href: `/karry/${v.slug}`,
  load: v.load,
}));

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-barlow" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-mono" });

const STATS = [
  { value: "121", unit: "HP", label: "Potencia" },
  { value: "1.6", unit: "L", label: "Cilindrada" },
  { value: "1,62", unit: "ton", label: "Carga máx. (CS)" },
  { value: "7", unit: "años", label: "Garantía Oficial" },
];

const VERSIONS = KARRY_VERSIONS;

const CHECKLIST = [
  "Motor 1.6L · 121 HP",
  "Dirección asistida",
  "Aire acondicionado",
  "Estructura reforzada para uso intensivo",
  "Soporte técnico y repuestos a nivel nacional",
  "Respaldo de red de concesionarios oficial Pfaffen",
];

const SPECS = [
  { label: "Motor", value: "1.6L · 4 cilindros" },
  { label: "Potencia", value: "121 HP" },
  { label: "Transmisión", value: "Manual 5 Vel." },
  { label: "Carga máx. (CS)", value: "1.620 kg" },
  { label: "Carga máx. (CD)", value: "1.540 kg" },
  { label: "Dirección", value: "Electrónicamente Asistida" },
  { label: "Garantía", value: "7 años / 100.000 km" },
  { label: "Uso recomendado", value: "Logística, reparto, servicio técnico" },
];

const WHATSAPP_LINK =
  "https://wa.me/5491121907000?text=Hola%2C%20quiero%20cotizar%20la%20Karry%20Pick%20Up";

export default function LandingKarry() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // ================= FORMULARIO DE RESERVA =================
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [versionInteres, setVersionInteres] = useState("Cabina Simple (CS)");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviarReserva = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !apellido.trim() || !telefono.trim()) return;

    setEnviando(true);
    const mensaje = encodeURIComponent(
      `Hola, quiero reservar la Karry Pick Up.\nNombre: ${nombre} ${apellido}\nTeléfono: ${telefono}\nVersión de interés: ${versionInteres}`
    );
    window.open(`https://wa.me/5491121907000?text=${mensaje}`, "_blank", "noopener,noreferrer");
    setEnviado(true);
    setEnviando(false);
  };

  return (
    <main className={`${inter.variable} ${barlow.variable} ${mono.variable} font-sans bg-[#030303] text-white selection:bg-[#0145F2] selection:text-white relative scroll-smooth`}>

      {/* ================= HEADER FLOTANTE (Dynamic Island Style) ================= */}
      <header className="fixed top-4 left-0 right-0 z-[70] px-4 md:px-6 flex justify-center">
        <div
          className="w-full max-w-5xl bg-black/60 backdrop-blur-2xl rounded-full px-6 flex items-center justify-between text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/10 transition-all duration-300 relative"
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <div className="flex items-center gap-3 py-3 md:py-4">
            <Image src="/logo-karry.webp" alt="Karry" width={130} height={31} className="h-7 md:h-9 w-auto object-contain" />
            <div className="h-5 w-[1px] bg-white/20 mx-1"></div>
            <Link href="/" className="relative flex items-center group">
              <Image src="/logo.png" alt="Pfaffen Autos" width={90} height={20} className="h-4 sm:h-5 md:h-5 w-auto object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />
              <Image src="/r.png" alt="" width={8} height={8} className="absolute -top-1 -right-2 h-2 w-auto object-contain brightness-0 invert opacity-80" />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.15em] h-full">
            <div 
              className="h-full flex items-center cursor-pointer py-5 text-slate-300 hover:text-white transition-colors"
              onMouseEnter={() => setIsMenuOpen(true)}
            >
              Modelos <span className="ml-1 text-[8px]">▼</span>
            </div>
            <a href="#historia" className="text-slate-300 hover:text-white transition-colors py-5">Historia</a>
            <a href="#institucional" className="text-slate-300 hover:text-white transition-colors py-5">Ficha Técnica</a>
          </nav>

          <div className="flex items-center gap-3 py-3 md:py-4">
            <a
              href="#contacto"
              className="bg-white text-black hover:bg-gray-200 transition-colors rounded-full px-5 py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] shrink-0"
            >
              Reservar
            </a>
            <button
              onClick={() => setIsMobileNavOpen((v) => !v)}
              className="lg:hidden text-white p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0"
              aria-label="Abrir menú"
            >
              {isMobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* ================= MEGA MENÚ DESPLEGABLE ================= */}
          {isMenuOpen && (
            <div className="absolute top-[calc(100%+16px)] left-0 w-full z-50 isolate bg-[#0a0a0a] rounded-[2rem] shadow-2xl border border-white/10 text-white p-8 animate-fadeIn cursor-default overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0145F2]/20 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-8 relative z-10">
                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Todos los modelos Karry</h4>
                <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
                {VERSIONS.map((v, i) => {
                  const accent = ["#0145F2", "#0B2E8C"][i % 2];
                  return (
                    <div
                      key={v.code}
                      className="relative bg-white/[0.04] rounded-2xl p-6 flex flex-col justify-between group hover:bg-white/[0.07] border border-white/5 hover:border-white/10 transition-all overflow-hidden"
                    >
                      <div
                        className="absolute inset-x-0 top-0 h-[3px]"
                        style={{ background: accent }}
                      />

                      <div>
                        <h4 className="font-black text-xl text-white uppercase tracking-tight">{v.name}</h4>
                        <p className="text-[13px] text-slate-400 mt-1.5 font-medium leading-relaxed">{v.subtitle}</p>
                      </div>

                      <div className="relative py-4 h-44 flex justify-center items-center">
                        <div
                          className="absolute w-36 h-36 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"
                          style={{ background: accent }}
                        />
                        <Image src={v.image} alt={v.name} fill sizes="300px" className="relative object-contain group-hover:scale-105 transition-transform duration-500" />
                      </div>

                      <div className="flex items-center gap-3 mt-auto pt-2">
                        <Link href={`/karry/${v.slug}`} onClick={() => setIsMenuOpen(false)} className="flex-1 text-center bg-white/10 hover:bg-white/20 text-white text-[11px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-colors">
                          Ver Ficha
                        </Link>
                        <a
                          href="#contacto"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex-1 text-center text-white text-[11px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-colors"
                          style={{ background: accent }}
                        >
                          Reservar
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= MENÚ MOBILE ================= */}
          {isMobileNavOpen && (
            <div className="lg:hidden absolute top-[calc(100%+12px)] left-0 w-full bg-[#0a0a0a]/95 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/10 text-white p-4 animate-fadeIn flex flex-col gap-2">
              <a href="#modelos" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-4 rounded-2xl hover:bg-white/10 font-black text-xs uppercase tracking-[0.15em]">Modelos</a>
              <a href="#historia" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-4 rounded-2xl hover:bg-white/10 font-black text-xs uppercase tracking-[0.15em]">Historia</a>
              <a href="#institucional" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-4 rounded-2xl hover:bg-white/10 font-black text-xs uppercase tracking-[0.15em]">Ficha Técnica</a>
              <a href="#contacto" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-4 rounded-2xl bg-[#0145F2] hover:bg-blue-600 text-center font-black text-xs uppercase tracking-[0.15em] mt-2">Reservar / Contacto</a>
            </div>
          )}
        </div>
      </header>

      {/* ================= HERO — CARRUSEL DE AUTOS ================= */}
      <VehiculosCarousel items={CARRUSEL_KARRY} logoSrc="/logo-karry.webp" logoAlt="Karry" />

      {/* ================= ESTADÍSTICAS RÁPIDAS (Estilo Apple) ================= */}
      <section className="bg-[#030303] py-20 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="mx-auto grid max-w-6xl grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12 md:gap-8 px-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center group">
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tighter mb-2 group-hover:scale-105 transition-transform" style={{ fontFamily: "var(--font-barlow)" }}>
                {s.value}
                <span className="ml-1.5 text-lg md:text-2xl font-medium text-slate-500">{s.unit}</span>
              </div>
              <div className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FORMULARIO DE RESERVA (Glassmorphism) ================= */}
      <section id="contacto" className="bg-[#0a0a0a] py-20 md:py-32 relative border-b border-white/5 overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-[#0145F2]/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 md:gap-20 items-center relative z-10">
          
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-6">
              <Phone className="w-3 h-3" /> Contacto Directo
            </span>
            <h2 className="text-5xl md:text-6xl lg:text-7xl uppercase text-white tracking-tighter mb-6 leading-[0.9]" style={{ fontFamily: "var(--font-barlow)", fontWeight: 700 }}>
              RESERVÁ <br/> <span className="text-[#0145F2]">TU KARRY.</span>
            </h2>
            <p className="text-slate-400 font-medium text-base md:text-lg leading-relaxed max-w-md">
              Completá tus datos para asegurar tu unidad. Un asesor oficial de Pfaffen Autos se pondrá en contacto para coordinar la entrega o prueba de manejo.
            </p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Brillo sutil interno */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3" />

            {enviado ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">¡Solicitud recibida!</h3>
                <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">Te estamos redirigiendo a WhatsApp para finalizar la reserva con un asesor.</p>
              </div>
            ) : (
              <form onSubmit={enviarReserva} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] mb-2 block">Nombre</label>
                    <input required type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Juan" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-white/30 focus:bg-white/10 transition-all text-white text-sm placeholder:text-slate-600" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] mb-2 block">Apellido</label>
                    <input required type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Ej. Pérez" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-white/30 focus:bg-white/10 transition-all text-white text-sm placeholder:text-slate-600" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] mb-2 block">Teléfono Móvil</label>
                  <input required type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej. 11 2345 6789" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-white/30 focus:bg-white/10 transition-all text-white text-sm placeholder:text-slate-600" />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] mb-2 block">Versión de interés</label>
                  <select value={versionInteres} onChange={(e) => setVersionInteres(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-white/30 focus:bg-white/10 transition-all text-white text-sm appearance-none cursor-pointer">
                    <option className="bg-[#111]">Cabina Simple (CS)</option>
                    <option className="bg-[#111]">Cabina Doble (CD)</option>
                  </select>
                </div>

                <button type="submit" disabled={enviando} className="w-full bg-white hover:bg-slate-200 disabled:bg-white/20 disabled:text-slate-500 text-black font-black uppercase tracking-[0.15em] text-xs py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] mt-4 flex items-center justify-center gap-2">
                  {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Iniciar Solicitud"}
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* ================= MODELOS DESTACADOS ================= */}
      <section id="modelos" className="bg-[#030303] py-20 md:py-32 px-6 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-16">
            <h2 className="text-4xl md:text-5xl uppercase text-white tracking-tighter mb-4" style={{ fontFamily: "var(--font-barlow)", fontWeight: 700 }}>Catálogo de Modelos</h2>
            <p className="text-slate-400 font-medium max-w-xl">La herramienta perfecta para tu negocio. Elegí la configuración que mejor se adapte a tu carga de trabajo.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {VERSIONS.map((v) => (
              <div key={v.code} className="bg-white/5 rounded-[2rem] overflow-hidden border border-white/10 flex flex-col group hover:bg-white/[0.07] transition-all duration-500">

                <Link href={`/karry/${v.slug}`} className="block relative pt-12 pb-6 px-6 bg-gradient-to-b from-white/5 to-transparent">
                  {/* Etiqueta de versión */}
                  <span className="absolute top-6 left-6 text-[10px] font-black text-white/50 uppercase tracking-widest">{v.code}</span>
                  
                  <div className="relative h-48 flex justify-center items-center">
                    <Image src={v.image} alt={v.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-700 ease-out" />
                  </div>
                </Link>

                <div className="p-8 flex flex-col flex-grow">
                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{v.name}</h3>
                    <p className="text-[13px] text-slate-400 mt-2 font-medium leading-relaxed">{v.subtitle}</p>
                  </div>

                  <div className="space-y-3 mb-8 flex-grow">
                    {v.specs.slice(0, 3).map((spec, i) => (
                      <div key={i} className="flex items-center gap-3 text-[13px] text-slate-300 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0145F2]" />
                        {spec}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-auto">
                    <Link href={`/karry/${v.slug}`} className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors text-center">
                      Ver Ficha
                    </Link>
                    <a href="#contacto" className="flex-1 bg-[#0145F2] hover:bg-blue-600 text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors text-center shadow-lg shadow-blue-500/20">
                      Reservar
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HISTORIA & FICHA TÉCNICA (Editorial) ================= */}
      <section id="historia" className="bg-[#0a0a0a] py-20 md:py-32 border-b border-white/5 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px] pointer-events-none translate-y-1/3 translate-x-1/3" />
        
        <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-12 gap-16 md:gap-24 relative z-10">

          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
              El Respaldo
            </span>
            <h2 className="text-4xl md:text-5xl uppercase text-white tracking-tighter mb-8 leading-[1.1]" style={{ fontFamily: "var(--font-barlow)", fontWeight: 700 }}>
              Karry en Argentina, por Pfaffen Autos.
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6">
              Karry es la marca de utilitarios del Chery Group, creada para dominar el segmento de carga liviana y logística de última milla. 
            </p>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Como concesionario oficial, Pfaffen Autos garantiza unidades 0KM, servicio técnico especializado y un stock de repuestos originales para que tu herramienta de trabajo nunca se detenga.
            </p>
          </div>

          <div id="institucional" className="lg:col-span-7 bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-sm">
            <h3 className="text-xl font-black text-white mb-8 tracking-tight">Especificaciones Técnicas (Serie)</h3>
            
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
              {SPECS.map((s) => (
                <div key={s.label} className="border-b border-white/5 pb-4">
                  <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{s.label}</span>
                  <span className="block text-sm text-white font-medium" style={{ fontFamily: "var(--font-mono)" }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#030303] py-12 border-t border-white/5 relative z-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 text-[11px] font-bold uppercase tracking-widest text-slate-600 sm:flex-row">
          <span>© {new Date().getFullYear()} Karry / Pfaffen Autos</span>
          <span className="text-center sm:text-right">Concesionario Oficial. Precios sujetos a modificación.</span>
        </div>
      </footer>

      {/* ================= BOTÓN WHATSAPP FLOTANTE ================= */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-2xl shadow-green-500/20 hover:scale-110 active:scale-95 transition-all z-50 flex items-center justify-center border border-green-400/30"
        aria-label="Contactar por WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.311.144.359.491 1.205.534 1.293.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.327.101.148.45.716 1.018 1.157.734.568 1.258.744 1.403.832.145.087.231.072.318-.029l.375-.434c.087-.116.173-.087.318-.029l1.446.685c.145.087.231.13.26.202.03.072.03.419-.114.824z"/>
        </svg>
      </a>

    </main>
  );
}