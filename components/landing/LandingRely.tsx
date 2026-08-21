"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { RELY_VERSIONS } from "@/lib/rely-versions";
import VehiculosCarousel from "./VehiculosCarousel";

const IMAGENES_CARRUSEL_RELY: Record<string, string> = {
  comfort: "/Rely-confort/Rely-confort.png",
  luxury: "/Rely-deluxe/Rely-deluxe.png",
  limited: "/Rely-Limited/Rely-limited.png",
};

const CARRUSEL_RELY = RELY_VERSIONS.map((v, i) => ({
  src: IMAGENES_CARRUSEL_RELY[v.slug] || v.image,
  bg: ["#F26B1D", "#C9560F", "#A6470C"][i % 3],
  panel: ["#F68E4F", "#DB763A", "#C0632B"][i % 3],
  name: v.name,
  subtitle: v.subtitle,
  href: `/rely/${v.slug}`,
  load: v.load,
}));

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

const STATS = [
  { value: "161", unit: "CV", label: "Potencia máx." },
  { value: "420", unit: "Nm", label: "Torque máx." },
  { value: "1.000", unit: "kg", label: "Capacidad de carga" },
  { value: "5", unit: "años", label: "Garantía" },
];

const VERSIONS = RELY_VERSIONS;

const CHECKLIST = [
  "Motor 2.3L turbodiésel · 161 CV",
  "Tracción 4×4 (2H / 4H / 4L)",
  "Frenado autónomo de emergencia",
  "Crucero adaptativo",
  "Estructura reforzada para uso intensivo",
  "Respaldo de red de concesionarios oficial",
];

const SPECS = [
  { label: "Motor", value: "2.3L turbodiésel · 4 cil." },
  { label: "Potencia", value: "161 CV @ 3.500 rpm" },
  { label: "Torque", value: "420 Nm @ 1.500–2.500 rpm" },
  { label: "Transmisión", value: "Manual 6 vel. / Automática 8 vel." },
  { label: "Tracción", value: "4×4 (2H / 4H / 4L)" },
  { label: "Capacidad de carga", value: "1.000 kg" },
  { label: "Garantía", value: "5 años / 200.000 km" },
  { label: "Uso recomendado", value: "Trabajo pesado, ruta y ciudad" },
];

const WHATSAPP_LINK =
  "https://wa.me/5491121907000?text=Hola%2C%20quiero%20cotizar%20la%20Rely%20R8";

export default function LandingRely() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <main className={`${inter.variable} font-sans bg-black text-white selection:bg-[#F26B1D] selection:text-white relative scroll-smooth`}>

      {/* ================= HEADER FLOTANTE — mismo negro del hero ================= */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-8">
        <div
          className="mx-auto max-w-7xl bg-black/90 backdrop-blur-md rounded-full px-6 flex items-center justify-between text-white shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-white/10 relative"
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <div className="flex items-center gap-3 py-3 md:py-4">
            <Image src="/RelyLogo.png" alt="Rely" width={140} height={56} className="h-11 md:h-14 w-auto object-contain -my-3 md:-my-4 brightness-0 invert" />
            <Link href="/" className="relative flex items-center border-l border-white/30 pl-3">
              <Image src="/logo.png" alt="Pfaffen Autos" width={100} height={24} className="h-4 sm:h-5 md:h-6 w-auto object-contain brightness-0 invert" />
              <Image src="/r.png" alt="" width={10} height={10} className="absolute -top-1.5 -right-2 h-2 md:h-2.5 w-auto object-contain brightness-0 invert" />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-wider h-full">
            <div
              className="h-full flex items-center cursor-pointer py-5"
              onMouseEnter={() => setIsMenuOpen(true)}
            >
              <span className="hover:text-gray-300 transition-colors">Versiones ▾</span>
            </div>

            <a href="#contacto" className="hover:text-gray-300 transition-colors py-5">Prueba de manejo</a>
            <a href="#historia" className="hover:text-gray-300 transition-colors py-5">Historia</a>
            <a href="#institucional" className="hover:text-gray-300 transition-colors py-5">Institucional</a>
            <a href="#contacto" className="hover:text-gray-300 transition-colors py-5">Contacto</a>
          </nav>

          <div className="flex items-center gap-4 py-3 md:py-4">
            <a
              href="#contacto"
              className="border border-white hover:bg-white hover:text-black transition-colors rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Reservá
            </a>
          </div>

          {/* ================= MEGA MENÚ DESPLEGABLE ================= */}
          {isMenuOpen && (
            <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-[#111] rounded-xl shadow-2xl border border-white/10 text-white p-6 md:p-8 animate-fadeIn cursor-default">

              <div className="flex justify-between items-center border-b border-white/10 pb-0 mb-6">
                <div className="flex gap-8">
                  <button className="text-[15px] font-bold text-white border-b-2 border-white pb-3">Todas las versiones</button>
                  <button className="text-[15px] font-normal text-slate-400 hover:text-slate-200 pb-3">Pick-ups 4x4</button>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-white pb-3">
                  <X className="w-5 h-5" />
                </button>
              </div>

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
        </div>
      </header>

      {/* ================= HERO — CARRUSEL DE AUTOS ================= */}
      <VehiculosCarousel items={CARRUSEL_RELY} logoSrc="/RelyLogo.png" logoAlt="Rely" invertLogo />

      {/* ================= FORMULARIO DE RESERVA ================= */}
      <section id="contacto" className="bg-black py-16 relative border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

          <div className="max-w-md">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              Dejá tus datos y reservá tu Rely R8
            </h2>
            <p className="text-slate-400 font-medium mb-8 text-base md:text-lg italic">
              Completá el formulario. Te contactamos para confirmar la reserva y los pasos a seguir.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[20px] p-8 shadow-[0_8px_40px_rgb(0,0,0,0.3)] relative overflow-hidden">
            <form className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Nombre</label>
                  <input type="text" placeholder="Nombre completo" className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#F26B1D] focus:bg-white/10 transition-colors text-white font-medium placeholder:font-normal placeholder:text-slate-500" />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Apellido</label>
                  <input type="text" placeholder="Apellido" className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#F26B1D] focus:bg-white/10 transition-colors text-white font-medium placeholder:font-normal placeholder:text-slate-500" />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Teléfono / WhatsApp</label>
                <input type="tel" placeholder="Código de área + Número" className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#F26B1D] focus:bg-white/10 transition-colors text-white font-medium placeholder:font-normal placeholder:text-slate-500" />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">Versión de interés</label>
                <select className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-[#F26B1D] focus:bg-white/10 transition-colors text-white font-medium appearance-none cursor-pointer">
                  {VERSIONS.map((v) => (<option key={v.code} className="bg-black">{v.name}</option>))}
                </select>
              </div>

              <button type="button" className="w-full bg-[#25D366] hover:bg-[#1fbc59] text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl transition-all shadow-md active:scale-95 mt-6 flex items-center justify-center gap-2">
                Enviar Solicitud
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* ================= MODELOS DESTACADOS ================= */}
      <section id="modelos" className="bg-[#0a0a0a] py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <h2 className="text-3xl font-bold text-white tracking-tight">Versiones disponibles</h2>
            <a href="#contacto" className="bg-[#F26B1D] hover:bg-[#C9560F] text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors shadow-sm">
              Reservar ahora
            </a>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VERSIONS.map((v) => (
              <div key={v.code} className="bg-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-white/10 flex flex-col">

                <Link href={`/rely/${v.slug}`} className="block">
                  <div className="bg-white/5 h-56 relative flex justify-center items-center p-4">
                    <Image src={v.image} alt={v.name} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-contain drop-shadow-md" />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F26B1D]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                    </div>
                  </div>
                </Link>

                <div className="p-6 flex flex-col flex-grow">
                  <Link href={`/rely/${v.slug}`}>
                    <h3 className="text-[17px] font-bold text-white uppercase tracking-tight hover:text-[#F26B1D] transition-colors">{v.name}</h3>
                  </Link>
                  <p className="text-[13px] italic text-slate-400 mb-4 mt-1 font-medium">{v.subtitle}</p>

                  <div className="space-y-1 text-[13px] text-slate-400 font-light mb-8 flex-grow leading-relaxed">
                    {v.specs.map((spec, i) => (
                      <p key={i}>{spec}</p>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-auto">
                    <a href="#contacto" className="bg-[#F26B1D] hover:bg-[#C9560F] text-white px-6 py-2 rounded-[10px] font-semibold text-sm transition-colors text-center shadow-sm">
                      Reservar
                    </a>
                    <Link href={`/rely/${v.slug}`} className="bg-transparent border border-white/20 text-white hover:bg-white/5 px-6 py-2 rounded-[10px] font-semibold text-sm transition-colors text-center italic">
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
        <div className="mx-auto grid max-w-6xl grid-cols-2 md:grid-cols-4 gap-8 px-6 divide-x divide-white/10">
          {STATS.map((s, index) => (
            <div key={s.label} className={`text-center ${index === 0 ? "" : "pl-8"}`}>
              <div className="text-3xl sm:text-5xl font-light text-[#F26B1D] tracking-tight">
                {s.value}
                <span className="ml-1 text-base font-medium text-slate-500">{s.unit}</span>
              </div>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= HISTORIA ================= */}
      <section id="historia" className="bg-black py-20 border-b border-white/10">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="inline-flex items-center gap-2 bg-[#F26B1D]/10 text-[#F26B1D] text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 border border-[#F26B1D]/20">
            Nuestra Historia
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-6">
            Rely en Argentina, con el respaldo de Pfaffen Autos
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Rely nace en 2009 como una de las marcas del Chery Group, el mayor exportador de autos de pasajeros de China durante 22 años consecutivos. Su nombre resume el espíritu de la marca: <em className="not-italic text-slate-300">Rebuild, Explore, Link, Yield</em> — reconstruir, explorar, conectar, rendir. Hoy se especializa en pick-ups medianas, con la ingeniería que respalda a todo el Grupo Chery. Pfaffen Autos es concesionario oficial de Rely en el país, garantizando unidades 0KM con documentación al día, service oficial y repuestos originales.
          </p>
        </div>
      </section>

      {/* ================= FICHA TÉCNICA E INSTITUCIONAL ================= */}
      <section id="institucional" className="bg-[#0a0a0a] py-20 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-2 gap-16">

          <div>
            <h2 className="text-3xl font-bold mb-3 text-white tracking-tight">Equipamiento de serie</h2>
            <p className="text-slate-400 mb-8 font-medium">Sin extras innecesarios, con lo justo para trabajar todos los días.</p>

            <ul className="space-y-4">
              {CHECKLIST.map((item, i) => (
                <li key={item} className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <span className="text-[#F26B1D] font-mono text-sm font-bold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-slate-200 text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-8 text-white tracking-tight">Ficha técnica</h2>
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
              {SPECS.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex items-center justify-between px-6 py-4 border-b border-white/10 last:border-0 ${
                    i % 2 === 0 ? "bg-white/5" : "bg-transparent"
                  }`}
                >
                  <span className="text-sm text-slate-400 font-medium">{s.label}</span>
                  <span className="text-sm font-bold text-white text-right ml-4">
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
          <span>© {new Date().getFullYear()} Rely Argentina / Pfaffen Autos</span>
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
