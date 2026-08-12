"use client";

import { useState } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { ChevronLeft, ChevronRight, X, Menu, Loader2, CheckCircle2 } from "lucide-react";
import { KARRY_VERSIONS } from "@/lib/karry-versions";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

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
    <main className={`${inter.variable} font-sans bg-white text-slate-800 selection:bg-[#1273b9] selection:text-white relative scroll-smooth`}>
      
      {/* ================= HEADER FLOTANTE ESTILO BYD ================= */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-8">
        <div 
          className="mx-auto max-w-7xl bg-[#4a5056] backdrop-blur-md rounded-full px-6 flex items-center justify-between text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] relative"
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <div className="flex items-center gap-3 py-3 md:py-4">
            <img src="/logo-karry.webp" alt="Karry" className="h-6 md:h-7 w-auto object-contain" />
            <Link href="/" className="relative flex items-center border-l border-white/30 pl-3">
              <img src="/logo.png" alt="Pfaffen Autos" className="h-4 sm:h-5 md:h-6 w-auto object-contain brightness-0 invert" />
              <img src="/r.png" alt="" className="absolute -top-1.5 -right-2 h-2 md:h-2.5 w-auto object-contain brightness-0 invert" />
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
            <span className="hidden md:block text-xs font-medium">Cigliutti Guerini</span>
            <a
              href="#contacto"
              className="border border-white hover:bg-white hover:text-[#4a5056] transition-colors rounded-full px-4 sm:px-5 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0"
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
            <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-white rounded-xl shadow-2xl border border-gray-100 text-slate-800 p-6 md:p-8 animate-fadeIn cursor-default">
              
              {/* Pestañas superiores */}
              <div className="flex justify-between items-center border-b border-gray-200 pb-0 mb-6">
                <div className="flex gap-8">
                  <button className="text-[15px] font-bold text-slate-900 border-b-2 border-slate-900 pb-3">Todos los modelos</button>
                  <button className="text-[15px] font-normal text-slate-400 hover:text-slate-600 pb-3">Vehículos Utilitarios</button>
                  <button className="text-[15px] font-normal text-slate-400 hover:text-slate-600 pb-3">Carga Pesada</button>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-slate-700 pb-3">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tarjetas de Vehículos del Menú */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {VERSIONS.map((v) => (
                  <div key={v.code} className="bg-[#f4f5f6] rounded-lg p-5 flex flex-col justify-between group hover:bg-[#ebeef0] transition-colors">
                    <div>
                      <h4 className="font-bold text-[15px] text-slate-900 uppercase tracking-tight">{v.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 font-light leading-relaxed">{v.text}</p>
                    </div>
                    
                    <div className="py-4 flex justify-center mix-blend-multiply">
                      <img src={v.image} alt={v.name} className="h-24 object-contain group-hover:scale-105 transition-transform" />
                    </div>

                    <div className="flex items-center gap-2 mt-auto">
                      <a href="#modelos" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center bg-transparent border border-slate-300 text-slate-700 hover:border-slate-500 text-xs py-1.5 rounded font-medium transition-colors">
                        Conócelo
                      </a>
                      <a href="#contacto" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center bg-transparent border border-slate-300 text-slate-700 hover:border-slate-500 text-xs py-1.5 rounded font-medium transition-colors">
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
            <div className="lg:hidden absolute top-[calc(100%+10px)] left-0 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 text-slate-800 p-5 animate-fadeIn cursor-default flex flex-col gap-1">
              <a href="#modelos" onClick={() => setIsMobileNavOpen(false)} className="px-3 py-3 rounded-xl hover:bg-gray-50 font-bold text-sm uppercase tracking-wide">Modelos</a>
              <a href="#contacto" onClick={() => setIsMobileNavOpen(false)} className="px-3 py-3 rounded-xl hover:bg-gray-50 font-bold text-sm uppercase tracking-wide">Prueba de manejo</a>
              <a href="#institucional" onClick={() => setIsMobileNavOpen(false)} className="px-3 py-3 rounded-xl hover:bg-gray-50 font-bold text-sm uppercase tracking-wide">Institucional</a>
              <a href="#contacto" onClick={() => setIsMobileNavOpen(false)} className="px-3 py-3 rounded-xl hover:bg-gray-50 font-bold text-sm uppercase tracking-wide">Contacto</a>
            </div>
          )}
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 min-h-[75vh] flex flex-col items-center justify-center text-center overflow-hidden">
        
        {/* IMAGEN DE FONDO ABSOLUTA */}
        <div className="absolute inset-0 w-full h-full z-0">
          <img 
            src="/karryBanner.png" 
            alt="Karry Pick Up" 
            className="w-full h-full object-cover"
          />
          {/* Sombra sutil opcional para que el texto blanco de arriba se lea bien */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Textos y Botones (z-10 para que queden arriba de la foto) */}
        <div className="relative z-10 flex flex-col items-center px-4 mt-6">
          <span className="bg-[#1273b9] text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4 shadow-md">
            ¡Ya Disponible!
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white tracking-tight mb-2 drop-shadow-md">
            Karry Pick Up
          </h1>
          <p className="text-base md:text-lg text-slate-100 font-medium mb-6 drop-shadow-md">
            Utilitario CS / CD · Capacidad hasta 1,62 Ton.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto px-6 sm:px-0 max-w-xs sm:max-w-none mx-auto sm:mx-0">
            <a href="#modelos" className="w-full sm:w-auto text-center bg-white text-slate-800 hover:bg-gray-50 px-6 sm:px-8 py-3 rounded-full text-sm font-semibold shadow-md transition-all active:scale-95">
              Conócelo
            </a>
            <a href="#contacto" className="w-full sm:w-auto text-center bg-[#1273b9] text-white hover:bg-[#0f609b] px-6 sm:px-8 py-3 rounded-full text-sm font-semibold shadow-md transition-all active:scale-95">
              Reservá
            </a>
          </div>
        </div>
      </section>

      {/* ================= FORMULARIO DE RESERVA ================= */}
      <section id="contacto" className="bg-white py-12 md:py-16 relative border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
          
          <div className="max-w-md">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Dejá tus datos y reservá tu Karry
            </h2>
            <p className="text-slate-600 font-medium mb-8 text-base md:text-lg italic">
              Completá el formulario. Te contactamos para confirmar la reserva y los pasos a seguir.
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-[20px] p-6 sm:p-8 shadow-[0_8px_40px_rgb(0,0,0,0.06)] relative overflow-hidden">
            {enviado ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#25D366] mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">¡Listo!</h3>
                <p className="text-sm text-slate-500">Te abrimos WhatsApp para que confirmes tu reserva con un asesor.</p>
              </div>
            ) : (
              <form onSubmit={enviarReserva} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Nombre</label>
                    <input required type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" className="w-full bg-transparent border-b border-gray-300 py-2 outline-none focus:border-[#1273b9] transition-colors text-slate-800 font-medium placeholder:font-normal placeholder:text-gray-400" />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Apellido</label>
                    <input required type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Apellido" className="w-full bg-transparent border-b border-gray-300 py-2 outline-none focus:border-[#1273b9] transition-colors text-slate-800 font-medium placeholder:font-normal placeholder:text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Teléfono / WhatsApp</label>
                  <input required type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Código de área + Número" className="w-full bg-transparent border-b border-gray-300 py-2 outline-none focus:border-[#1273b9] transition-colors text-slate-800 font-medium placeholder:font-normal placeholder:text-gray-400" />
                </div>

                <div>
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Versión de interés</label>
                  <select value={versionInteres} onChange={(e) => setVersionInteres(e.target.value)} className="w-full bg-transparent border-b border-gray-300 py-2 outline-none focus:border-[#1273b9] transition-colors text-slate-800 font-medium appearance-none cursor-pointer">
                    <option>Cabina Simple (CS)</option>
                    <option>Cabina Doble (CD)</option>
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
      <section id="modelos" className="bg-[#f8f9fa] py-12 md:py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Modelos destacados</h2>
            <a href="#contacto" className="bg-[#1273b9] hover:bg-[#0f609b] text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors shadow-sm">
              Reservar ahora
            </a>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VERSIONS.map((v) => (
              <div key={v.code} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col">

                <Link href={`/karry/${v.slug}`} className="block">
                  {/* Imagen del modelo con dots simulados */}
                  <div className="bg-[#eef0f2] h-56 relative flex justify-center items-center p-4">
                    <img src={v.image} alt={v.name} className="w-full h-full object-contain mix-blend-multiply drop-shadow-md" />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1273b9]"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                    </div>
                  </div>
                </Link>

                {/* Contenido de la Tarjeta */}
                <div className="p-6 flex flex-col flex-grow">
                  <Link href={`/karry/${v.slug}`}>
                    <h3 className="text-[17px] font-bold text-slate-900 uppercase tracking-tight hover:text-[#1273b9] transition-colors">{v.name}</h3>
                  </Link>
                  <p className="text-[13px] italic text-slate-600 mb-4 mt-1 font-medium">{v.subtitle}</p>
                  
                  {/* Specs sin viñetas, texto limpio como en BYD */}
                  <div className="space-y-1 text-[13px] text-slate-600 font-light mb-8 flex-grow leading-relaxed">
                    {v.specs.map((spec, i) => (
                      <p key={i}>{spec}</p>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-auto">
                    <a href="#contacto" className="bg-[#1273b9] hover:bg-[#0f609b] text-white px-6 py-2 rounded-[10px] font-semibold text-sm transition-colors text-center shadow-sm">
                      Reservar
                    </a>
                    <Link href={`/karry/${v.slug}`} className="bg-white border border-gray-300 text-slate-800 hover:bg-gray-50 px-6 py-2 rounded-[10px] font-semibold text-sm transition-colors text-center italic">
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
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="mx-auto grid max-w-6xl grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 md:gap-8 px-6 md:divide-x md:divide-gray-100">
          {STATS.map((s, index) => (
            <div key={s.label} className={`text-center ${index === 0 ? "" : "md:pl-8"}`}>
              <div className="text-2xl sm:text-3xl md:text-5xl font-light text-[#1273b9] tracking-tight">
                {s.value}
                <span className="ml-1 text-sm md:text-base font-medium text-slate-400">{s.unit}</span>
              </div>
              <div className="mt-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FICHA TÉCNICA E INSTITUCIONAL ================= */}
      <section id="institucional" className="bg-white py-12 md:py-20 border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-2 gap-10 md:gap-16">
          
          <div>
            <h2 className="text-3xl font-bold mb-3 text-slate-900 tracking-tight">Equipamiento de serie</h2>
            <p className="text-slate-500 mb-8 font-medium">Sin extras innecesarios, con lo justo para trabajar todos los días.</p>
            
            <ul className="space-y-4">
              {CHECKLIST.map((item, i) => (
                <li key={item} className="flex items-center gap-4 border-b border-gray-100 pb-4">
                  <span className="text-[#1273b9] font-mono text-sm font-bold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-slate-700 text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-8 text-slate-900 tracking-tight">Ficha técnica</h2>
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              {SPECS.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 last:border-0 ${
                    i % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <span className="text-sm text-slate-500 font-medium">{s.label}</span>
                  <span className="text-sm font-bold text-slate-900 text-right ml-4">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-xs text-slate-400 font-medium sm:flex-row">
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