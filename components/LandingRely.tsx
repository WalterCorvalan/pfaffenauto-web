"use client";

import { useState } from "react";
import { Oswald, Inter, IBM_Plex_Mono } from "next/font/google";
import { CalendarDays, Phone, ChevronRight, FileText, Settings, ShieldCheck, X } from "lucide-react";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-body",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

const STATS = [
  { value: "161", unit: "CV", label: "Potencia máx." },
  { value: "420", unit: "Nm", label: "Torque máx." },
  { value: "4×4", unit: "", label: "Tracción integral" },
  { value: "1.000", unit: "kg", label: "Capacidad de carga" },
];

const FEATURES = [
  {
    n: "01",
    title: "Frenado autónomo",
    text: "Detecta riesgo de colisión y frena solo cuando vos no llegás a hacerlo.",
    icon: <ShieldCheck className="w-6 h-6 text-[#0145F2]" />
  },
  {
    n: "02",
    title: "Crucero adaptativo",
    text: "Mantiene la distancia con el vehículo de adelante en ruta, de forma automática.",
    icon: <Settings className="w-6 h-6 text-[#0145F2]" />
  },
  {
    n: "03",
    title: "Pantalla 12,3″",
    text: "Apple CarPlay y Android Auto inalámbricos, más carga por inducción.",
    icon: <Settings className="w-6 h-6 text-[#0145F2]" />
  },
  {
    n: "04",
    title: "Cámara 360°",
    text: "Visión completa del entorno para maniobrar en terrenos exigentes.",
    icon: <ShieldCheck className="w-6 h-6 text-[#0145F2]" />
  },
];

const VERSIONS = [
  {
    name: "Comfort MT",
    trans: "Manual 6 Vel.",
    price: "32.000",
    bullets: ["Motor 2.3 turbodiésel", "Doble airbag frontal", "Tracción 4×4"],
    image: "/Pick-up-Rely-R8-frente-1.jpg",
  },
  {
    name: "Comfort AT",
    trans: "Automática 8 Vel.",
    price: "34.000",
    bullets: ["Motor 2.3 turbodiésel", "Caja automática", "Tracción 4×4"],
    image: "/Pick-up-Rely-R8-frente-1.jpg",
  },
  {
    name: "Luxury MT",
    trans: "Manual 6 Vel.",
    price: "36.500",
    bullets: ["Equipamiento ampliado", "Pantalla 12,3″", "Tracción 4×4"],
    highlight: true,
    image: "/Pick-up-Rely-R8-frente-1.jpg",
  },
  {
    name: "Limited AT",
    trans: "Automática 8 Vel.",
    price: "39.500",
    bullets: ["Tope de gama", "7 airbags + ADAS", "Cámara 360°"],
    image: "/Pick-up-Rely-R8-frente-1.jpg",
  },
];

const SPECS = [
  { label: "Largo / Ancho / Alto", value: "5.370 / 1.960 / 1.880 mm" },
  { label: "Entre ejes", value: "3.230 mm" },
  { label: "Altura libre al piso", value: "200 mm" },
  { label: "Motor", value: "2.3L turbodiésel · 4 cil." },
  { label: "Potencia", value: "161 CV @ 3.500 rpm" },
  { label: "Torque", value: "420 Nm @ 1.500–2.500 rpm" },
  { label: "Transmisión", value: "MT 6 vel. / AT 8 vel." },
  { label: "Tracción", value: "4×4 (2H / 4H / 4L)" },
  { label: "Garantía", value: "5 años / 200.000 km" },
];

const WHATSAPP_LINK =
  "https://wa.me/5491121907000?text=Hola%2C%20quiero%20cotizar%20la%20Rely%20R8";

export default function LandingRely() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <main className={`${oswald.variable} ${inter.variable} ${mono.variable} bg-[#0a0a0a] text-[#ECE8DD] font-sans selection:bg-[#0145f2] selection:text-white`}>
      
      {/* ================= HEADER TRANSPARENTE CON MEGA-MENÚ ================= */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 via-black/50 to-transparent pt-4 pb-10"
        onMouseLeave={() => setIsMenuOpen(false)}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 xl:px-8 relative">
          
          {/* Logo */}
          <a href="/" className="flex items-center shrink-0">
            <img 
              src="/relyLogo.png" 
              alt="Rely Logo" 
              className="h-8 md:h-10 lg:h-22 w-auto object-contain invert brightness-0"
            />
          </a>

          {/* Navegación Desktop */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-[13px] font-bold uppercase tracking-widest text-gray-300 h-full">
            {/* Disparador Mega Menú */}
            <div 
              className="py-4 cursor-pointer"
              onMouseEnter={() => setIsMenuOpen(true)}
            >
              <span className="hover:text-white transition-colors">Modelos ▾</span>
            </div>
            
            <a href="#catalogo" className="hover:text-white transition-colors py-4">Catálogo</a>
            <a href="#galeria" className="hover:text-white transition-colors py-4">Galería</a>
            <a href="#contacto" className="hover:text-white transition-colors py-4">Compra Programada</a>
            <a href="#servicios" className="hover:text-white transition-colors py-4">Servicios</a>
          </nav>

          {/* Botones de Acción */}
          <div className="flex items-center gap-3">
            <a
              href="#contacto"
              className="hidden md:flex items-center gap-2 border border-white/30 bg-black/20 backdrop-blur-sm hover:bg-white/10 px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors uppercase tracking-wider"
            >
              <CalendarDays className="w-4 h-4" /> Test Drive
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#0145F2] hover:bg-[#0134b0] px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-xs font-bold text-white transition-colors shadow-lg shadow-[#0145F2]/20 uppercase tracking-wider"
            >
              <Phone className="w-4 h-4" /> Contactar
            </a>
          </div>

          {/* ================= MEGA MENÚ DESPLEGABLE (OSCURO) ================= */}
          {isMenuOpen && (
            <div className="absolute top-[calc(100%+10px)] left-6 right-6 xl:left-8 xl:right-8 bg-[#111] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#222] p-8 animate-fadeIn cursor-default">
              
              <div className="flex justify-between items-center border-b border-[#222] pb-4 mb-6">
                <div className="flex gap-8">
                  <button className="text-[13px] font-bold text-white border-b-2 border-[#0145F2] pb-4 -mb-[17px] uppercase tracking-wider">Todas las versiones</button>
                  <button className="text-[13px] font-medium text-gray-500 hover:text-gray-300 pb-4 -mb-[17px] uppercase tracking-wider transition-colors">Transmisión Manual</button>
                  <button className="text-[13px] font-medium text-gray-500 hover:text-gray-300 pb-4 -mb-[17px] uppercase tracking-wider transition-colors">Transmisión Automática</button>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {VERSIONS.map((v) => (
                  <div key={v.name} className="bg-[#0a0a0a] rounded-xl p-5 border border-[#222] hover:border-[#0145F2]/50 transition-colors group flex flex-col">
                    <div>
                      <h4 className="font-black text-lg text-white uppercase tracking-tight">{v.name}</h4>
                      <p className="text-xs text-[#0145F2] font-bold mt-1 uppercase tracking-widest">{v.trans}</p>
                    </div>
                    
                    <div className="py-6 flex justify-center">
                      <img src={v.image} alt={v.name} className="h-24 object-contain group-hover:scale-105 transition-transform drop-shadow-xl" />
                    </div>

                    <div className="flex items-center gap-2 mt-auto">
                      <a href="#versiones" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center border border-[#333] text-gray-400 hover:border-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest py-2 rounded-lg transition-colors">
                        Conócelo
                      </a>
                      <a href="#contacto" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center bg-[#0] hover:bg-[#e04800] text-white text-xs font-bold uppercase tracking-widest py-2 rounded-lg transition-colors">
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

      {/* ================= HERO SECTION (FULL SCREEN) ================= */}
      <section className="relative h-[100svh] flex flex-col justify-center overflow-hidden">
        
        {/* Imagen de Fondo Absoluta */}
        <div className="absolute inset-0 w-full h-full z-0">
          <img 
            src="/Pick-up-Rely-R8-frente-1.jpg" 
            alt="Rely R8 Pickup" 
            className="w-full h-full object-cover object-center"
          />
          {/* Gradiente oscuro para asegurar legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent h-full"></div>
        </div>

        {/* Contenido del Hero */}
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 xl:px-8 mt-20">
          <h1 className="font-[family-name:var(--font-display)] text-[3.5rem] leading-[0.9] sm:text-[5rem] md:text-[6.5rem] lg:text-[8.5rem] font-black uppercase tracking-tighter text-white drop-shadow-2xl">
            La pickup que lo
            <br />
            <span className="text-[#0145f2]">puede todo</span>
          </h1>

          <div className="mt-8 md:mt-12 flex flex-col sm:flex-row gap-4">
            <a
              href="#versiones"
              className="bg-[#0145f2] hover:bg-[#e04800] text-white text-center px-8 py-4 rounded-lg font-bold text-sm uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(255,81,0,0.3)] active:scale-95"
            >
              Explorar Modelos
            </a>
            <a
              href="#contacto"
              className="border border-white/40 bg-black/30 backdrop-blur-md hover:bg-white/10 text-white text-center px-8 py-4 rounded-lg font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <CalendarDays className="w-5 h-5" /> Agendar Test Drive
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-60 animate-bounce">
          <span className="text-[10px] uppercase tracking-[0.3em] text-white font-bold">Scroll</span>
          <div className="w-px h-6 bg-white"></div>
        </div>
      </section>

      {/* ================= STATS BAR ================= */}
      <section className="bg-[#0a0a0a] relative z-20 border-b border-[#222]">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 lg:grid-cols-4 px-6 xl:px-8 divide-x divide-[#222]">
          {STATS.map((s) => (
            <div key={s.label} className="py-10 md:py-14 text-center">
              <div className="font-[family-name:var(--font-display)] text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter">
                {s.value}
                <span className="ml-2 text-xl md:text-2xl text-[#0145f2]">{s.unit}</span>
              </div>
              <div className="mt-2 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="mx-auto max-w-[1400px] px-6 xl:px-8 py-24">
        <div className="mb-16 md:w-2/3">
          <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-none">
            Tecnología pensada <br/><span className="text-[#0145f2]">para el trabajo duro</span>
          </h2>
          <p className="mt-6 text-lg text-gray-400 font-light max-w-xl">
            Cada función tiene un propósito concreto: menos riesgo, más control en el terreno y mayor comodidad en la ruta.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div key={f.n} className="bg-[#111] border border-[#222] p-8 rounded-2xl hover:border-[#0145f2]/50 transition-colors group">
              <div className="flex justify-between items-start mb-8">
                {f.icon}
                <span className="font-[family-name:var(--font-mono)] text-xl font-black text-[#222] group-hover:text-[#0145f2]/30 transition-colors">
                  {f.n}
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-tight text-white mb-3">
                {f.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed font-light">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= VERSIONES (ESTILO MODELOS DESTACADOS) ================= */}
      <section id="versiones" className="bg-[#111] py-24 border-y border-[#222]">
        <div className="mx-auto max-w-[1400px] px-6 xl:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
                Versiones
              </h2>
              <p className="mt-3 text-gray-400">
                Cuatro configuraciones, todas con tracción 4×4 de serie.
              </p>
            </div>
            <a href="#contacto" className="bg-[#0145f2] hover:bg-[#e04800] text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors shadow-sm">
              Reservar ahora
            </a>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VERSIONS.map((v) => (
              <div
                key={`${v.name}-${v.trans}`}
                className={`bg-[#0a0a0a] rounded-2xl overflow-hidden flex flex-col border transition-all ${
                  v.highlight 
                  ? "border-[#0145f2] shadow-[0_0_30px_rgba(1,69,242,0.15)] relative lg:-translate-y-2" 
                  : "border-[#222] hover:border-gray-600"
                }`}
              >
                {/* Etiqueta Destacada */}
                {v.highlight && (
                  <span className="absolute top-4 left-4 z-10 bg-[#0145f2] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    Más elegida
                  </span>
                )}
                
                {/* Imagen del modelo con dots simulados */}
                <div className="bg-[#151515] h-48 relative flex justify-center items-center p-4">
                  <img src={v.image} alt={v.name} className="w-full h-full object-contain drop-shadow-xl" />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0145f2]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                  </div>
                </div>

                {/* Contenido de la Tarjeta */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-black uppercase text-white tracking-tight">{v.name}</h3>
                  <p className="text-xs text-[#0145F2] font-bold mt-1 mb-4 uppercase tracking-widest">{v.trans}</p>
                  
                  {/* Precio */}
                  <div className="mb-6 pb-6 border-b border-[#222]">
                    <p className="font-[family-name:var(--font-mono)] text-3xl font-bold text-white">
                      <span className="text-sm text-gray-500 mr-1">USD</span>{v.price}
                    </p>
                  </div>
                  
                  {/* Bullets */}
                  <ul className="flex-1 space-y-2.5 text-[13px] text-gray-400 font-medium mb-8">
                    {v.bullets.map((b, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="text-[#0145F2]">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>

                  {/* Botones de acción */}
                  <div className="flex gap-2 mt-auto">
                    <a href="#contacto" className="flex-1 text-center bg-[#0145f2] hover:bg-[#e04800] text-white font-bold text-xs uppercase tracking-widest py-3 rounded-lg transition-colors">
                      Reservar
                    </a>
                    <a href="#ficha" className="flex-1 text-center border border-[#333] hover:border-gray-500 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-widest py-3 rounded-lg transition-colors">
                      Ficha
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FORMULARIO Y FICHA ================= */}
      <section id="contacto" className="mx-auto max-w-[1400px] px-6 xl:px-8 py-24 grid lg:grid-cols-2 gap-16 lg:gap-24">
        
        {/* Formulario */}
        <div>
          <div className="mb-10">
            <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-4">
              Ponela a prueba
            </h2>
            <p className="text-gray-400">
              Coordiná un test drive o pedí tu cotización personalizada. Dejanos tus datos y un asesor se comunicará al instante.
            </p>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Nombre</label>
                <input type="text" className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3.5 text-white outline-none focus:border-[#0145f2] transition-colors" placeholder="Tu nombre" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Apellido</label>
                <input type="text" className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3.5 text-white outline-none focus:border-[#0145f2] transition-colors" placeholder="Tu apellido" />
              </div>
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">WhatsApp</label>
              <input type="tel" className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3.5 text-white outline-none focus:border-[#0145f2] transition-colors" placeholder="Código de área + Número" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Interés</label>
                <select className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3.5 text-white outline-none focus:border-[#0145f2] transition-colors appearance-none">
                  <option>Comprar 0KM</option>
                  <option>Test Drive</option>
                  <option>Plan de Ahorro</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Sucursal</label>
                <select className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3.5 text-white outline-none focus:border-[#0145f2] transition-colors appearance-none">
                  <option>Casa Central</option>
                  <option>Pilar</option>
                  <option>Don Torcuato</option>
                </select>
              </div>
            </div>

            <button type="button" className="w-full bg-[#0145f2] hover:bg-[#e04800] text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl transition-all shadow-lg active:scale-95 mt-4">
              Enviar Solicitud
            </button>
          </form>
        </div>

        {/* Ficha Técnica */}
        <div id="ficha">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-black uppercase tracking-tight text-white">
              Ficha Técnica
            </h2>
            <div className="bg-[#111] border border-[#222] p-2 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#0145f2]" />
            </div>
          </div>

          <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
            {SPECS.map((s, i) => (
              <div
                key={s.label}
                className={`flex items-center justify-between px-6 py-4 border-b border-[#222] last:border-0 ${
                  i % 2 === 0 ? "bg-[#161616]" : "bg-transparent"
                }`}
              >
                <span className="text-sm text-gray-400 font-medium">{s.label}</span>
                <span className="font-[family-name:var(--font-mono)] text-sm font-bold text-white text-right ml-4">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-black py-12 border-t border-[#222]">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-6 px-6 text-xs text-gray-500 font-medium sm:flex-row">
          <div className="flex items-center gap-4">
            <span className="font-[family-name:var(--font-display)] text-2xl font-black text-white tracking-widest">RELY</span>
            <span className="border-l border-gray-700 pl-4">© {new Date().getFullYear()} Rely Argentina / Pfaffen Autos</span>
          </div>
          <span>Precios y disponibilidad sujetos a modificación sin previo aviso.</span>
        </div>
      </footer>

      {/* ================= BOTÓN WHATSAPP FLOTANTE ================= */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-[#0145f2] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 flex items-center justify-center border-2 border-black"
        aria-label="Contactar por WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.311.144.359.491 1.205.534 1.293.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.327.101.148.45.716 1.018 1.157.734.568 1.258.744 1.403.832.145.087.231.072.318-.029l.375-.434c.087-.116.173-.087.318-.029l1.446.685c.145.087.231.13.26.202.03.072.03.419-.114.824z"/>
        </svg>
      </a>

    </main>
  );
}