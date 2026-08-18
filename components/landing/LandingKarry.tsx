"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Inter, Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import { ChevronLeft, ChevronRight, X, Menu, Loader2, CheckCircle2 } from "lucide-react";
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
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono" });

const STATS = [
  { value: "121", unit: "HP", label: "Potencia" },
  { value: "1.6", unit: "L", label: "Cilindrada" },
  { value: "1,62", unit: "ton", label: "Carga máx. (CS)" },
  { value: "7", unit: "años", label: "Garantía" },
];

const VERSIONS = KARRY_VERSIONS;

const CHECKLIST = [
  "Motor 1.6L · 121 HP",
  "Dirección asistida",
  "Aire acondicionado",
  "Estructura reforzada para uso intensivo",
  "Soporte técnico y repuestos a nivel nacional",
  "Respaldo de red de concesionarios oficial",
];

const SPECS = [
  { label: "Motor", value: "1.6L · 4 cilindros" },
  { label: "Potencia", value: "121 HP" },
  { label: "Transmisión", value: "Manual" },
  { label: "Carga máx. (CS)", value: "1.620 kg" },
  { label: "Carga máx. (CD)", value: "1.540 kg" },
  { label: "Dirección", value: "Asistida" },
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
    <main className={`${inter.variable} ${barlow.variable} ${mono.variable} font-sans bg-black text-white selection:bg-[#0145F2] selection:text-white relative scroll-smooth`}>

      {/* ================= HEADER FLOTANTE — mismo negro del hero ================= */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-8">
        <div
          className="mx-auto max-w-7xl bg-black/90 backdrop-blur-md rounded-full px-6 flex items-center justify-between text-white shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-white/10 relative"
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <div className="flex items-center gap-3 py-3 md:py-4">
            <Image src="/logo-karry.webp" alt="Karry" width={120} height={28} className="h-6 md:h-7 w-auto object-contain" />
            <Link href="/" className="relative flex items-center border-l border-white/30 pl-3">
              <Image src="/logo.png" alt="Pfaffen Autos" width={100} height={24} className="h-4 sm:h-5 md:h-6 w-auto object-contain brightness-0 invert" />
              <Image src="/r.png" alt="" width={10} height={10} className="absolute -top-1.5 -right-2 h-2 md:h-2.5 w-auto object-contain brightness-0 invert" />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-wider h-full">
            {/* Disparador del Mega Menú */}
            <div 
              className="h-full flex items-center cursor-pointer py-5"
              onMouseEnter={() => setIsMenuOpen(true)}
            >
              <span className="hover:text-gray-300 transition-colors">Modelos ▾</span>
            </div>
            
            <a href="#contacto" className="hover:text-gray-300 transition-colors py-5">Prueba de manejo</a>
            <a href="#institucional" className="hover:text-gray-300 transition-colors py-5">Institucional</a>
            <a href="#contacto" className="hover:text-gray-300 transition-colors py-5">Contacto</a>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4 py-3 md:py-4">
            <a
              href="#contacto"
              className="border border-white hover:bg-white hover:text-black transition-colors rounded-full px-4 sm:px-5 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0"
            >
              Reservá
            </a>
            <button
              onClick={() => setIsMobileNavOpen((v) => !v)}
              className="lg:hidden text-white p-1 shrink-0"
              aria-label="Abrir menú"
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* ================= MEGA MENÚ DESPLEGABLE (IMAGEN 1) ================= */}
          {isMenuOpen && (
            <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-[#111] rounded-xl shadow-2xl border border-white/10 text-white p-6 md:p-8 animate-fadeIn cursor-default">

              {/* Pestañas superiores */}
              <div className="flex justify-between items-center border-b border-white/10 pb-0 mb-6">
                <div className="flex gap-8">
                  <button className="text-[15px] font-bold text-white border-b-2 border-white pb-3">Todos los modelos</button>
                  <button className="text-[15px] font-normal text-slate-400 hover:text-slate-200 pb-3">Vehículos Utilitarios</button>
                  <button className="text-[15px] font-normal text-slate-400 hover:text-slate-200 pb-3">Carga Pesada</button>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-white pb-3">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tarjetas de Vehículos del Menú */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {VERSIONS.map((v) => (
                  <div key={v.code} className="bg-white/5 rounded-lg p-5 flex flex-col justify-between group hover:bg-white/10 transition-colors">
                    <div>
                      <h4 className="font-bold text-[15px] text-white uppercase tracking-tight">{v.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 font-light leading-relaxed">{v.text}</p>
                    </div>

                    <div className="relative py-4 h-32 flex justify-center">
                      <Image src={v.image} alt={v.name} fill sizes="200px" className="object-contain group-hover:scale-105 transition-transform" />
                    </div>

                    <div className="flex items-center gap-2 mt-auto">
                      <a href="#modelos" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center bg-transparent border border-white/20 text-slate-200 hover:border-white/50 text-xs py-1.5 rounded font-medium transition-colors">
                        Conócelo
                      </a>
                      <a href="#contacto" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center bg-transparent border border-white/20 text-slate-200 hover:border-white/50 text-xs py-1.5 rounded font-medium transition-colors">
                        Reservá
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= MENÚ MOBILE ================= */}
          {isMobileNavOpen && (
            <div className="lg:hidden absolute top-[calc(100%+10px)] left-0 w-full bg-[#111] rounded-2xl shadow-2xl border border-white/10 text-white p-5 animate-fadeIn cursor-default flex flex-col gap-1">
              <a href="#modelos" onClick={() => setIsMobileNavOpen(false)} className="px-3 py-3 rounded-xl hover:bg-white/5 font-bold text-sm uppercase tracking-wide">Modelos</a>
              <a href="#contacto" onClick={() => setIsMobileNavOpen(false)} className="px-3 py-3 rounded-xl hover:bg-white/5 font-bold text-sm uppercase tracking-wide">Prueba de manejo</a>
              <a href="#institucional" onClick={() => setIsMobileNavOpen(false)} className="px-3 py-3 rounded-xl hover:bg-white/5 font-bold text-sm uppercase tracking-wide">Institucional</a>
              <a href="#contacto" onClick={() => setIsMobileNavOpen(false)} className="px-3 py-3 rounded-xl hover:bg-white/5 font-bold text-sm uppercase tracking-wide">Contacto</a>
            </div>
          )}
        </div>
      </header>

      {/* ================= HERO — CARRUSEL DE AUTOS ================= */}
      <VehiculosCarousel items={CARRUSEL_KARRY} logoSrc="/logo-karry.webp" logoAlt="Karry" />

      {/* ================= FORMULARIO DE RESERVA ================= */}
      <section id="contacto" className="bg-black py-12 md:py-16 relative border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-10 md:gap-16 items-center">

          <div className="max-w-md">
            <h2 className="text-4xl md:text-5xl uppercase text-white tracking-tight mb-4" style={{ fontFamily: "var(--font-barlow)", fontWeight: 700, lineHeight: 0.95 }}>
              Dejá tus datos y reservá tu Karry
            </h2>
            <p className="text-slate-400 font-medium mb-8 text-base md:text-lg italic">
              Completá el formulario. Te contactamos para confirmar la reserva y los pasos a seguir.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[20px] p-6 sm:p-8 shadow-[0_8px_40px_rgb(0,0,0,0.3)] relative overflow-hidden">
            {enviado ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#25D366] mx-auto" />
                <h3 className="text-lg font-bold text-white">¡Listo!</h3>
                <p className="text-sm text-slate-400">Te abrimos WhatsApp para que confirmes tu reserva con un asesor.</p>
              </div>
            ) : (
              <form onSubmit={enviarReserva} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Nombre</label>
                    <input required type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#0145F2] focus:bg-white/10 transition-colors text-white font-medium placeholder:font-normal placeholder:text-slate-500" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Apellido</label>
                    <input required type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Apellido" className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#0145F2] focus:bg-white/10 transition-colors text-white font-medium placeholder:font-normal placeholder:text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Teléfono / WhatsApp</label>
                  <input required type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Código de área + Número" className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#0145F2] focus:bg-white/10 transition-colors text-white font-medium placeholder:font-normal placeholder:text-slate-500" />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Versión de interés</label>
                  <select value={versionInteres} onChange={(e) => setVersionInteres(e.target.value)} className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#0145F2] focus:bg-white/10 transition-colors text-white font-medium appearance-none cursor-pointer">
                    <option className="bg-black">Cabina Simple (CS)</option>
                    <option className="bg-black">Cabina Doble (CD)</option>
                  </select>
                </div>

                <button type="submit" disabled={enviando} className="w-full bg-[#25D366] hover:bg-[#1fbc59] disabled:opacity-60 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl transition-all shadow-md active:scale-95 mt-6 flex items-center justify-center gap-2">
                  {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Solicitud"}
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* ================= MODELOS DESTACADOS (IMAGEN 2) ================= */}
      <section id="modelos" className="bg-[#0a0a0a] py-12 md:py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <h2 className="text-4xl uppercase text-white tracking-tight" style={{ fontFamily: "var(--font-barlow)", fontWeight: 700 }}>Modelos destacados</h2>
            <a href="#contacto" className="bg-[#0145F2] hover:bg-[#0038c9] text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors shadow-sm">
              Reservar ahora
            </a>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VERSIONS.map((v) => (
              <div key={v.code} className="bg-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-white/10 flex flex-col">

                <Link href={`/karry/${v.slug}`} className="block">
                  {/* Imagen del modelo con dots simulados */}
                  <div className="bg-white/5 h-56 relative flex justify-center items-center p-4">
                    <Image src={v.image} alt={v.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain drop-shadow-md" />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0145F2]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                    </div>
                  </div>
                </Link>

                {/* Contenido de la Tarjeta */}
                <div className="p-6 flex flex-col flex-grow">
                  <Link href={`/karry/${v.slug}`}>
                    <h3 className="text-[17px] font-bold text-white uppercase tracking-tight hover:text-[#0145F2] transition-colors">{v.name}</h3>
                  </Link>
                  <p className="text-[13px] italic text-slate-400 mb-4 mt-1 font-medium">{v.subtitle}</p>

                  {/* Specs sin viñetas, texto limpio como en BYD */}
                  <div className="space-y-1 text-[13px] text-slate-400 font-light mb-8 flex-grow leading-relaxed">
                    {v.specs.map((spec, i) => (
                      <p key={i}>{spec}</p>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-auto">
                    <a href="#contacto" className="bg-[#0145F2] hover:bg-[#0038c9] text-white px-6 py-2 rounded-[10px] font-semibold text-sm transition-colors text-center shadow-sm">
                      Reservar
                    </a>
                    <Link href={`/karry/${v.slug}`} className="bg-transparent border border-white/20 text-white hover:bg-white/5 px-6 py-2 rounded-[10px] font-semibold text-sm transition-colors text-center italic">
                      Ficha
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ESTADÍSTICAS RÁPIDAS ================= */}
      <section className="bg-black py-12 border-b border-white/10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 md:gap-8 px-6 md:divide-x md:divide-white/10">
          {STATS.map((s, index) => (
            <div key={s.label} className={`text-center ${index === 0 ? "" : "md:pl-8"}`}>
              <div className="text-2xl sm:text-3xl md:text-5xl font-medium text-[#0145F2] tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>
                {s.value}
                <span className="ml-1 text-sm md:text-base font-medium text-slate-500">{s.unit}</span>
              </div>
              <div className="mt-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FICHA TÉCNICA E INSTITUCIONAL ================= */}
      <section id="institucional" className="bg-[#0a0a0a] py-12 md:py-20 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-2 gap-10 md:gap-16">

          <div>
            <h2 className="text-4xl uppercase text-white tracking-tight mb-3" style={{ fontFamily: "var(--font-barlow)", fontWeight: 700 }}>Equipamiento de serie</h2>
            <p className="text-slate-400 mb-8 font-medium">Sin extras innecesarios, con lo justo para trabajar todos los días.</p>

            <ul className="space-y-4">
              {CHECKLIST.map((item, i) => (
                <li key={item} className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <span className="text-[#0145F2] font-mono text-sm font-bold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-slate-200 text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-4xl uppercase text-white tracking-tight mb-8" style={{ fontFamily: "var(--font-barlow)", fontWeight: 700 }}>Ficha técnica</h2>
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
              {SPECS.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex items-center justify-between px-6 py-4 border-b border-white/10 last:border-0 ${
                    i % 2 === 0 ? "bg-white/5" : "bg-transparent"
                  }`}
                >
                  <span className="text-sm text-slate-400 font-medium">{s.label}</span>
                  <span className="text-sm font-medium text-white text-right ml-4" style={{ fontFamily: "var(--font-mono)" }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-black py-8 border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-xs text-slate-500 font-medium sm:flex-row">
          <span>© {new Date().getFullYear()} Karry Argentina / Pfaffen Autos</span>
          <span>Precios sujetos a modificación sin previo aviso.</span>
        </div>
      </footer>

      {/* ================= BOTÓN WHATSAPP FLOTANTE ================= */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all z-50 flex items-center justify-center"
        aria-label="Contactar por WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.311.144.359.491 1.205.534 1.293.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.327.101.148.45.716 1.018 1.157.734.568 1.258.744 1.403.832.145.087.231.072.318-.029l.375-.434c.087-.116.173-.087.318-.029l1.446.685c.145.087.231.13.26.202.03.072.03.419-.114.824z"/>
        </svg>
      </a>

    </main>
  );
}