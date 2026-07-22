import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { MapPin, Phone, Award, Users, CheckCircle } from "lucide-react";
import { Bebas_Neue } from "next/font/google";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"] });

// Conexión a Supabase (modo lectura pública)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

export const revalidate = 0;

// Íconos SVG personalizados para redes sociales
const InstagramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4 text-[#0055A4]"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4 text-[#0055A4]"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export default async function HomePage() {
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(
      `
        *,
        multimedia_vehiculos ( url_archivo ),
        sucursales ( nombre )
      `,
    )
    .in("estado", ["Disponible", "Reservado"])
    .order("created_at", { ascending: false });

  return (
    <div className="w-full text-white font-sans scroll-smooth">
      
      {/* ================= 1. HERO ================= */}
      <section
        id="inicio"
        className="relative h-[100svh] w-full flex flex-col justify-between items-center text-center px-4 pt-24 md:pt-32 pb-16 lg:pb-8 overflow-hidden bg-[#050505]"
      >
        {/* FONDO CONTROLADO: Dos imágenes distintas según la pantalla */}
        <div className="absolute top-0 left-0 w-full h-[100svh] z-0">
          
          {/* Imagen Desktop (Se oculta en celulares) */}
          <img
            src="/hero-bg.png"
            alt="Fondo Desktop"
            className="hidden md:block w-full h-full object-cover object-[center_100%]" 
          />
          
          {/* Imagen Mobile (Se oculta en computadoras y tablets) */}
          <img
            src="/hero-bg-mobile.png"
            alt="Fondo Mobile"
            className="block md:hidden w-full h-full object-cover object-bottom" 
          />

          {/* Degradados */}
          <div className="absolute top-0 left-0 w-full h-40 md:h-64 bg-gradient-to-b from-[#050505]/90 md:from-[#050505]/80 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-56 md:h-48 bg-gradient-to-t from-[#050505] via-[#050505]/80 md:via-[#050505]/0 to-transparent"></div>
        </div>

        {/* CONTENEDOR SUPERIOR: Títulos */}
        <div className="relative z-20 w-full flex flex-col items-center justify-start mt-0 md:mt-4">
          
          <h1 className={`text-[3rem] leading-[0.85] sm:text-5xl md:text-6xl lg:text-[5.5rem] xl:text-[7rem] uppercase tracking-normal flex flex-col gap-1 md:gap-2 ${bebas.className}`}>
            <span className="text-white drop-shadow-lg">Tu próximo vehículo</span>
            <span className="text-[#0145F2] drop-shadow-[0_0_30px_rgba(1,69,242,0.8)]">Empieza acá.</span>
          </h1>

          <p className="mt-4 md:mt-5 text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] text-white lg:text-black drop-shadow-md">
            Usados Seleccionados y <span className="text-[#0145F2]">0 KM.</span>
          </p>

          <div className="my-4 lg:my-6 relative flex justify-center items-center w-full max-w-[200px] lg:max-w-[300px]">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#0145F2] to-transparent opacity-100"></div>
            <div className="absolute w-8 lg:w-12 h-[2px] bg-white rounded-full shadow-[0_0_20px_#0145F2]"></div>
          </div>

          <div className="font-serif">
            <p className="text-[10px] md:text-xs lg:text-sm uppercase tracking-[0.2em] lg:tracking-[0.3em] text-white lg:text-black mb-1 lg:mb-1.5 drop-shadow-md">
              La forma <span className="text-[#0145F2]">más confiable</span>
            </p>
            <p className="text-[10px] md:text-xs lg:text-sm uppercase tracking-[0.2em] lg:tracking-[0.3em] text-white lg:text-black drop-shadow-md">
              De comprar o vender tu auto
            </p>
          </div>
        </div>

        {/* CONTENEDOR INFERIOR: Enlaces (Grid en celular, Flex en computadora) */}
        <div className="relative z-20 w-full max-w-5xl mt-auto mb-2 lg:mb-6 grid grid-cols-2 md:flex md:flex-wrap justify-center gap-y-8 gap-x-2 md:gap-x-8 lg:gap-x-14 px-2">
          
          {/* 1. VER STOCK */}
          <a href="#stock" className="group flex flex-col items-center gap-2 md:gap-3 cursor-pointer">
            <span className="flex items-center gap-1 md:gap-2 text-[10px] md:text-[11px] font-medium tracking-[0.15em] md:tracking-[0.2em] text-white uppercase drop-shadow-md group-hover:text-gray-300 transition-colors">
              Ver Stock
              <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white/70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </span>
            <div className="w-[40px] lg:w-[60px] h-[1.5px] lg:h-[2px] bg-[#0145F2] opacity-100 shadow-[0_0_10px_rgba(1,69,242,0.8)] group-hover:w-full transition-all duration-300"></div>
          </a>

          {/* 2. COTIZAR AHORA */}
          <a href="#contacto" className="group flex flex-col items-center gap-2 md:gap-3 cursor-pointer">
            <span className="flex items-center gap-1 md:gap-2 text-[10px] md:text-[11px] font-medium tracking-[0.15em] md:tracking-[0.2em] text-white uppercase drop-shadow-md group-hover:text-gray-300 transition-colors">
              Cotizar Ahora
              <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white/70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </span>
            <div className="w-[50px] lg:w-[70px] h-[1.5px] lg:h-[2px] bg-[#0145F2] opacity-100 shadow-[0_0_10px_rgba(1,69,242,0.8)] group-hover:w-full transition-all duration-300"></div>
          </a>

          {/* 3. COMPRAR */}
          <a href="#stock" className="group flex flex-col items-center gap-2 md:gap-3 cursor-pointer">
            <span className="flex items-center gap-1 md:gap-2 text-[10px] md:text-[11px] font-medium tracking-[0.15em] md:tracking-[0.2em] text-white uppercase drop-shadow-md group-hover:text-gray-300 transition-colors">
              Comprar
              <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white/70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </span>
            <div className="w-[40px] lg:w-[60px] h-[1.5px] lg:h-[2px] bg-[#0145F2] opacity-100 shadow-[0_0_10px_rgba(1,69,242,0.8)] group-hover:w-full transition-all duration-300"></div>
          </a>

          {/* 4. VENDER */}
          <a href="#contacto" className="group flex flex-col items-center gap-2 md:gap-3 cursor-pointer">
            <span className="flex items-center gap-1 md:gap-2 text-[10px] md:text-[11px] font-medium tracking-[0.15em] md:tracking-[0.2em] text-white uppercase drop-shadow-md group-hover:text-gray-300 transition-colors">
              Vender
              <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white/70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </span>
            <div className="w-[40px] lg:w-[50px] h-[1.5px] lg:h-[2px] bg-[#0145F2] opacity-100 shadow-[0_0_10px_rgba(1,69,242,0.8)] group-hover:w-full transition-all duration-300"></div>
          </a>

          {/* 5. CAMBIAR (En celular usa col-span-2 para centrarse en la fila de abajo) */}
          <a href="#contacto" className="col-span-2 md:col-span-1 group flex flex-col items-center gap-2 md:gap-3 cursor-pointer">
            <span className="flex items-center gap-1 md:gap-2 text-[10px] md:text-[11px] font-medium tracking-[0.15em] md:tracking-[0.2em] text-white uppercase drop-shadow-md group-hover:text-gray-300 transition-colors">
              Cambiar
              <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white/70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </span>
            <div className="w-[40px] lg:w-[50px] h-[1.5px] lg:h-[2px] bg-[#0145F2] opacity-100 shadow-[0_0_10px_rgba(1,69,242,0.8)] group-hover:w-full transition-all duration-300"></div>
          </a>

        </div>

        {/* Doble Flecha hacia abajo */}
        <div className="relative z-20 animate-bounce text-white/40 hover:text-white transition-colors mt-4">
          <a href="#stock">
            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </section>

      {/* ================= 1.5 NUESTROS NÚMEROS ================= */}
      <section className="bg-[#1b3a82] py-10 w-full border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center flex flex-col items-center">
          
          <span className="text-white/70 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-3">
            Nuestros Números
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-white mb-12 tracking-tight">
            Resultados que hablan solos
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-4 w-full">
            
            {/* Dato 1 */}
            <div className="flex flex-col items-center">
              <span className={`text-5xl md:text-7xl text-white mb-2 ${bebas.className}`}>
                1.247
              </span>
              <span className="text-[9px] md:text-[11px] text-white/80 font-medium uppercase tracking-widest">
                Autos Vendidos
              </span>
            </div>
            
            {/* Dato 2 */}
            <div className="flex flex-col items-center">
              <span className={`text-5xl md:text-7xl text-white mb-2 ${bebas.className}`}>
                1.180
              </span>
              <span className="text-[9px] md:text-[11px] text-white/80 font-medium uppercase tracking-widest">
                Clientes Satisfechos
              </span>
            </div>
            
            {/* Dato 3 */}
            <div className="flex flex-col items-center">
              <span className={`text-5xl md:text-7xl text-white mb-2 ${bebas.className}`}>
                15+
              </span>
              <span className="text-[9px] md:text-[11px] text-white/80 font-medium uppercase tracking-widest">
                Años de Trayectoria
              </span>
            </div>
            
            {/* Dato 4 */}
            <div className="flex flex-col items-center">
              <span className={`text-5xl md:text-7xl text-white mb-2 ${bebas.className}`}>
                3
              </span>
              <span className="text-[9px] md:text-[11px] text-white/80 font-medium uppercase tracking-widest">
                Sucursales Activas
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ================= 2. SUCURSALES (Versión Simplificada) ================= */}
      <section id="sucursales" className="py-16 bg-[#0A0F16]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          
          {/* Título simplificado sin textos extra */}
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-10 tracking-tight">
            Nuestras Sucursales
          </h2>

          {/* Grid de Tarjetas (3 Columnas) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            {/* Tarjeta 1: Villa de Mayo */}
            <Link href="/sucursales/villa-de-mayo" className="relative h-[340px] rounded-[1.25rem] overflow-hidden group shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop" 
                alt="Villa de Mayo" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F16] via-[#0A0F16]/70 to-[#0A0F16]/10 z-10 transition-opacity duration-500 group-hover:opacity-90"></div>
              
              <div className="absolute bottom-0 left-0 w-full p-6 z-20">
                <h3 className="text-[22px] font-bold text-white mb-5 tracking-tight group-hover:text-[#3b82f6] transition-colors">
                  Villa de Mayo
                </h3>
                
                <div className="flex flex-col gap-3 text-[13px] text-gray-300 font-medium">
                  <div className="flex items-center gap-3">
                    <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <span>Villa de Mayo, Buenos Aires</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    <span>+54 11 4500-1200</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>Lun–Sáb 9:00–19:00</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Tarjeta 2: Olivos */}
            <Link href="/sucursales/olivos" className="relative h-[340px] rounded-[1.25rem] overflow-hidden group shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=1000&auto=format&fit=crop" 
                alt="Olivos" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F16] via-[#0A0F16]/70 to-[#0A0F16]/10 z-10 transition-opacity duration-500 group-hover:opacity-90"></div>
              
              <div className="absolute bottom-0 left-0 w-full p-6 z-20">
                <h3 className="text-[22px] font-bold text-white mb-5 tracking-tight group-hover:text-[#3b82f6] transition-colors">
                  Olivos
                </h3>
                
                <div className="flex flex-col gap-3 text-[13px] text-gray-300 font-medium">
                  <div className="flex items-center gap-3">
                    <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <span>Olivos, Buenos Aires</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    <span>+54 11 4790-3300</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>Lun–Sáb 9:00–18:30</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Tarjeta 3: Panamericana */}
            <Link href="/sucursales/panamericana" className="relative h-[340px] rounded-[1.25rem] overflow-hidden group shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop" 
                alt="Panamericana" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F16] via-[#0A0F16]/70 to-[#0A0F16]/10 z-10 transition-opacity duration-500 group-hover:opacity-90"></div>
              
              <div className="absolute bottom-0 left-0 w-full p-6 z-20">
                <h3 className="text-[22px] font-bold text-white mb-5 tracking-tight group-hover:text-[#3b82f6] transition-colors">
                  Panamericana
                </h3>
                
                <div className="flex flex-col gap-3 text-[13px] text-gray-300 font-medium">
                  <div className="flex items-center gap-3">
                    <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <span>Panamericana km 28</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    <span>+54 11 4716-5500</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-[18px] h-[18px] text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>Lun–Dom 9:00–20:00</span>
                  </div>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      

      {/* ================= 3. STOCK ACTUALIZADO (UI BUSCADOR AVANZADO) ================= */}
      <section id="stock" className="py-24 bg-[#050505] relative overflow-hidden">
        
        {/* Brillo de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#0145F2]/5 blur-[150px] rounded-full pointer-events-none z-0"></div>

        <div className="max-w-[90rem] mx-auto px-4 md:px-6 relative z-10">
          
          {/* ================= A. BUSCADOR PRINCIPAL (ESTILO AI) ================= */}
          <div className="max-w-4xl mx-auto mb-8 relative z-20">
            <div className="flex items-center bg-[#09090b] border border-white/10 hover:border-[#0145F2]/50 transition-colors rounded-full p-1.5 pl-6 shadow-2xl">
              {/* Ícono Sparkles */}
              <svg className="text-[#0145F2] w-5 h-5 mr-3 animate-pulse shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <input 
                type="text" 
                placeholder='Buscá como hablás: "SUV automática hasta 40 mil dólares"' 
                className="bg-transparent border-none outline-none text-white text-xs md:text-sm w-full placeholder:text-gray-500" 
              />
              <button className="hidden sm:flex bg-[#0145F2] hover:bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest py-3.5 px-8 rounded-full transition-all shadow-[0_0_15px_rgba(1,69,242,0.4)] items-center gap-2 shrink-0">
                Buscar <span className="text-sm leading-none">&rarr;</span>
              </button>
            </div>
            
            {/* Sugerencias (Pills) */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <span className="text-gray-500 text-[9px] uppercase tracking-widest font-bold">Probá:</span>
              {["Pick-up 4x4 diésel", "Automático hasta USD 25.000", "SUV 2024"].map((tag, i) => (
                <button key={i} className="bg-white/5 hover:bg-[#0145F2]/10 border border-white/10 hover:border-[#0145F2]/50 text-gray-400 hover:text-white text-[10px] px-4 py-1.5 rounded-full transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* ================= B. BARRA DE FILTROS AVANZADA ================= */}
          <div className="bg-[#09090b] border border-white/5 rounded-[2rem] p-6 lg:p-8 mb-16 shadow-2xl relative">
            {/* Punto indicador de sistema activo */}
            <div className="absolute top-6 right-6 w-1.5 h-1.5 rounded-full bg-[#0145F2] animate-pulse"></div>
            
            {/* Input tradicional */}
            <div className="flex items-center border-b border-white/5 pb-4 mb-5">
              <svg className="w-5 h-5 text-gray-500 mr-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Buscar por marca, modelo o palabra clave..." 
                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-gray-600" 
              />
            </div>

            {/* Selects de filtros */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3 flex-grow">
                {["Todas las marcas", "Cualquier año", "Transmisión", "Kilómetros", "Rango de precio"].map((filtro, i) => (
                  <div key={i} className="relative group">
                    <select className="bg-black/40 border border-white/5 hover:border-white/20 text-gray-400 text-[11px] font-medium rounded-xl px-5 py-3 outline-none appearance-none cursor-pointer pr-10 transition-colors">
                      <option>{filtro}</option>
                    </select>
                    <svg className="w-3 h-3 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                ))}
              </div>
              
              <button className="flex items-center gap-2 text-[#0145F2] hover:text-white text-[10px] uppercase font-black tracking-widest transition-colors mt-4 lg:mt-0 px-4 py-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Limpiar
              </button>
            </div>

            <div className="mt-6 text-[10px] text-gray-500 font-medium uppercase tracking-widest">
              Mostrando {vehiculos?.length || 0} vehículos en catálogo
            </div>
          </div>

          {/* ================= C. ENCABEZADO DE RESULTADOS ================= */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
              <svg className="text-[#0145F2] w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.58 6.42a1 1 0 00-1.07-.15c-.17.08-1.52.74-2.88 2.3A5.4 5.4 0 0012 11c0-1.87-.58-3.41-1.72-4.57a7.25 7.25 0 00-3.83-2A9 9 0 005.1 8c-.62 1.4-.73 2.87-.33 4.31a5.62 5.62 0 001.35 2.59 5.89 5.89 0 011.08 1.45c.23.46.22.95-.03 1.48-.33.68-.9 1.05-1.7 1.1-.38.03-.64.38-.56.76.13.62.43 1.2.91 1.68C7.11 22.7 8.94 23.5 11 23.5c2.14 0 4.15-.84 5.66-2.36C18.17 19.63 19 17.62 19 15.5c0-2.82-1-5-1.42-9.08z"/></svg>
              Stock Destacado
            </h3>
            <a href="#stock" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#0145F2] flex items-center gap-2 transition-colors">
              Ver todo el stock <span className="animate-bounce">&darr;</span>
            </a>
          </div>

          {/* ================= D. GRILLA DE VEHÍCULOS (CARDS ESTILO MARKETPLACE) ================= */}
          {vehiculos && vehiculos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehiculos.map((auto) => (
                <div
                  key={auto.id}
                  className="bg-[#09090b] rounded-[1.5rem] overflow-hidden border border-white/5 hover:border-[#0145F2]/40 transition-all duration-300 flex flex-col group hover:shadow-[0_0_30px_rgba(1,69,242,0.1)]"
                >
                  {/* Contenedor Imagen */}
                  <div className="relative h-[250px] bg-gray-900 overflow-hidden">
                    {auto.multimedia_vehiculos?.[0] && (
                      <img
                        src={auto.multimedia_vehiculos[0].url_archivo}
                        alt={`${auto.marca} ${auto.modelo}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    )}
                    
                    {/* Degradado interno para textos/iconos */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none"></div>

                    {/* Badge PREMIUM (Izquierda) */}
                    <div className="absolute top-4 left-4 bg-[#0145F2] text-white px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest shadow-lg">
                      Premium
                    </div>

                    {/* Badge Estado (Si está reservado) */}
                    {auto.estado === "Reservado" && (
                      <div className="absolute top-12 left-4 bg-[#D4AF37] text-black px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest shadow-lg">
                        Reservado
                      </div>
                    )}

                    {/* Iconos de Acción (Derecha) */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-[#0145F2] hover:border-[#0145F2] transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      </button>
                      <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-[#0145F2] hover:border-[#0145F2] transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                      </button>
                      <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-pink-500 hover:bg-pink-500/20 hover:border-pink-500 transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Info Vehículo */}
                  <div className="p-6 md:p-8 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-[#0145F2] transition-colors">
                        {auto.marca} {auto.modelo}
                      </h3>
                    </div>
                    
                    <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium mb-6">
                      Consultar especificaciones
                    </p>

                    <div className="mt-auto">
                      <div className="text-2xl font-black text-white font-mono flex items-end gap-2">
                        ${auto.precio_ars?.toLocaleString()}
                        <span className="text-[10px] font-sans text-gray-500 font-bold uppercase tracking-widest mb-1">
                          ARS
                        </span>
                      </div>
                      
                      {auto.precio_usd && (
                        <div className="text-[11px] font-bold text-[#0145F2] font-mono mt-1">
                          (US$ {auto.precio_usd?.toLocaleString()})
                        </div>
                      )}
                    </div>

                    <div className="w-full h-[1px] bg-white/5 my-6"></div>

                    <a
                      href={`https://wa.me/5491100000000?text=Hola,%20me%20interesa%20el%20${auto.marca}%20${auto.modelo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-center text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-4 rounded-xl hover:bg-[#0145F2] hover:border-[#0145F2] text-white transition-all w-full flex justify-center items-center gap-2"
                    >
                      Consultar Unidad
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-[#09090b] rounded-[2rem] border border-white/5">
              <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <h4 className="text-white font-bold text-lg mb-2">Catálogo en actualización</h4>
              <p className="text-gray-500 text-xs">
                Actualmente estamos cargando nuevas unidades. ¡Volvé a consultar pronto!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================= ESTAMOS UBICADOS (TARJETAS MODERNAS & BOTONES PREMIUM) ================= */}
      <section className="py-24 bg-[#050505] border-t border-white/5 relative overflow-hidden">
        
        {/* Brillo de fondo sutil */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#0145F2]/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

        <div className="max-w-[90rem] mx-auto px-4 md:px-6 relative z-10"> 
          
          {/* Encabezado */}
          <div className="text-center mb-16">
            <span className="text-[#0145F2] text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-4 block drop-shadow-md">
              Infraestructura & Presencia
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter">
              Estamos Ubicados
            </h2>
          </div>

          {/* Grid de 3 Tarjetas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* SUCURSAL 1: VILLA DE MAYO */}
            <div className="bg-[#09090b] rounded-[2.5rem] border border-white/5 hover:border-[#0145F2]/40 transition-all duration-500 overflow-hidden flex flex-col shadow-2xl hover:shadow-[0_0_40px_rgba(1,69,242,0.15)] group relative">
              
              {/* Mapa */}
              <div className="w-full h-[320px] relative overflow-hidden">
                <iframe 
                  src="https://maps.google.com/maps?q=Pfaffen+Autos,+Villa+de+Mayo,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es" 
                  className="w-full h-full border-0 group-hover:scale-105 transition-transform duration-700" 
                  loading="lazy"
                  title="Mapa Villa de Mayo"
                ></iframe>
                {/* Sombra interna para integrar el mapa con la tarjeta */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent pointer-events-none"></div>
              </div>
              
              {/* Contenido */}
              <div className="px-8 pb-8 pt-2 flex flex-col flex-grow relative">
                <h3 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tight mb-1">
                  Villa de Mayo
                </h3>
                <p className="text-[10px] text-[#0145F2] uppercase tracking-widest font-bold mb-8 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0145F2] animate-pulse"></span>
                  Casa Central
                </p>
                
                <div className="flex-grow"></div>
                
                {/* Botones Modernos */}
                <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                  <a href="#stock" className="group/btn relative overflow-hidden flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0145F2] to-[#002b99] text-white text-[10px] font-black uppercase tracking-widest py-4 px-2 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(1,69,242,0.3)] hover:shadow-[0_0_30px_rgba(1,69,242,0.6)] hover:-translate-y-1">
                    <span>Ver Stock</span>
                    <svg className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
                  </a>
                  <a href="https://maps.app.goo.gl/4ZMmpWJCarHcZ2sb9" target="_blank" rel="noopener noreferrer" className="group/btn relative flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-[#0145F2]/10 text-white text-[10px] font-black uppercase tracking-widest py-4 px-2 rounded-2xl border border-white/10 hover:border-[#0145F2]/50 transition-all duration-300 backdrop-blur-md hover:-translate-y-1">
                    <span>Cómo Llegar</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover/btn:text-[#0145F2] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                  </a>
                </div>
              </div>
            </div>

            {/* SUCURSAL 2: PANAMERICANA */}
            <div className="bg-[#09090b] rounded-[2.5rem] border border-white/5 hover:border-[#0145F2]/40 transition-all duration-500 overflow-hidden flex flex-col shadow-2xl hover:shadow-[0_0_40px_rgba(1,69,242,0.15)] group relative">
              
              {/* Mapa */}
              <div className="w-full h-[320px] relative overflow-hidden">
                <iframe 
                  src="https://maps.google.com/maps?q=Pfaffen+Autos,+Don+Torcuato,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es" 
                  className="w-full h-full border-0 group-hover:scale-105 transition-transform duration-700" 
                  loading="lazy"
                  title="Mapa Panamericana"
                ></iframe>
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent pointer-events-none"></div>
              </div>
              
              {/* Contenido */}
              <div className="px-8 pb-8 pt-2 flex flex-col flex-grow relative">
                <h3 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tight mb-1">
                  Panamericana
                </h3>
                <p className="text-[10px] text-[#0145F2] uppercase tracking-widest font-bold mb-8 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0145F2] animate-pulse"></span>
                  Sucursal Panamericana
                </p>
                
                <div className="flex-grow"></div>
                
                {/* Botones Modernos */}
                <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                  <a href="#stock" className="group/btn relative overflow-hidden flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0145F2] to-[#002b99] text-white text-[10px] font-black uppercase tracking-widest py-4 px-2 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(1,69,242,0.3)] hover:shadow-[0_0_30px_rgba(1,69,242,0.6)] hover:-translate-y-1">
                    <span>Ver Stock</span>
                    <svg className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
                  </a>
                  <a href="https://maps.app.goo.gl/GuNBuUKT5xMFw5jR9" target="_blank" rel="noopener noreferrer" className="group/btn relative flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-[#0145F2]/10 text-white text-[10px] font-black uppercase tracking-widest py-4 px-2 rounded-2xl border border-white/10 hover:border-[#0145F2]/50 transition-all duration-300 backdrop-blur-md hover:-translate-y-1">
                    <span>Cómo Llegar</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover/btn:text-[#0145F2] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                  </a>
                </div>
              </div>
            </div>

            {/* SUCURSAL 3: OLIVOS */}
            <div className="bg-[#09090b] rounded-[2.5rem] border border-white/5 hover:border-[#0145F2]/40 transition-all duration-500 overflow-hidden flex flex-col shadow-2xl hover:shadow-[0_0_40px_rgba(1,69,242,0.15)] group relative">
              
              {/* Mapa */}
              <div className="w-full h-[320px] relative overflow-hidden">
                <iframe 
                  src="https://maps.google.com/maps?q=Pfaffen+Autos,+Olivos,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es" 
                  className="w-full h-full border-0 group-hover:scale-105 transition-transform duration-700" 
                  loading="lazy"
                  title="Mapa Olivos"
                ></iframe>
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent pointer-events-none"></div>
              </div>
              
              {/* Contenido */}
              <div className="px-8 pb-8 pt-2 flex flex-col flex-grow relative">
                <h3 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tight mb-1">
                  Olivos
                </h3>
                <p className="text-[10px] text-[#0145F2] uppercase tracking-widest font-bold mb-8 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0145F2] animate-pulse"></span>
                  Sucursal Olivos
                </p>
                
                <div className="flex-grow"></div>
                
                {/* Botones Modernos */}
                <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                  <a href="#stock" className="group/btn relative overflow-hidden flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0145F2] to-[#002b99] text-white text-[10px] font-black uppercase tracking-widest py-4 px-2 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(1,69,242,0.3)] hover:shadow-[0_0_30px_rgba(1,69,242,0.6)] hover:-translate-y-1">
                    <span>Ver Stock</span>
                    <svg className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
                  </a>
                  <a href="https://maps.app.goo.gl/3agMwsdC8hg7CT417" target="_blank" rel="noopener noreferrer" className="group/btn relative flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-[#0145F2]/10 text-white text-[10px] font-black uppercase tracking-widest py-4 px-2 rounded-2xl border border-white/10 hover:border-[#0145F2]/50 transition-all duration-300 backdrop-blur-md hover:-translate-y-1">
                    <span>Cómo Llegar</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover/btn:text-[#0145F2] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= 6 REDES SOCIALES CON ICONOS GRANDES Y ANIMACIÓN PREMIUM ================= */}
      <section className="py-24 bg-[#050505] border-t border-white/5 text-center relative overflow-hidden">
        
        {/* Brillo de fondo sutil general */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-white/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

        <div className="max-w-[80rem] mx-auto px-6 relative z-10">
          <span className="text-[#0145F2] text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-4 block drop-shadow-md">
            Comunidad Pfaffen
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter mb-4">
            Nuestras Redes Oficiales
          </h2>
          <p className="text-gray-400 text-xs md:text-sm mb-16 tracking-wide max-w-xl mx-auto">
            Seguinos y enterate de los nuevos ingresos antes que nadie.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            
            {/* WhatsApp */}
            <a
              href="https://wa.me/5491100000000"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden bg-[#09090b] rounded-[1.5rem] border border-white/5 hover:border-[#25D366]/50 p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(37,211,102,0.15)]"
            >
              {/* Resplandor interno de la marca */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#25D366]/0 to-[#25D366]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <svg
                className="w-10 h-10 fill-current text-gray-500 group-hover:text-[#25D366] group-hover:scale-110 transition-all duration-300 relative z-10"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors relative z-10">
                WhatsApp
              </span>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden bg-[#09090b] rounded-[1.5rem] border border-white/5 hover:border-pink-500/50 p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-pink-500/0 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <svg
                className="w-10 h-10 fill-current text-gray-500 group-hover:text-pink-500 group-hover:scale-110 transition-all duration-300 relative z-10"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors relative z-10">
                Instagram
              </span>
            </a>

            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden bg-[#09090b] rounded-[1.5rem] border border-white/5 hover:border-blue-600/50 p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-blue-600/0 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <svg
                className="w-10 h-10 fill-current text-gray-500 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300 relative z-10"
                viewBox="0 0 24 24"
              >
                <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.37 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.582 9 4.75V8z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors relative z-10">
                Facebook
              </span>
            </a>

            {/* Mercado Libre */}
            <a
              href="https://www.mercadolibre.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden bg-[#09090b] rounded-[1.5rem] border border-white/5 hover:border-yellow-400/50 p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(250,204,21,0.15)]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/0 to-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <svg
                className="w-10 h-10 fill-current text-gray-500 group-hover:text-yellow-400 group-hover:scale-110 transition-all duration-300 relative z-10"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3.125 17.518c-1.396 0-2.483-.418-3.262-1.254-.779-.836-1.168-1.996-1.168-3.48v-2.002h2.234v2.002c0 .762.207 1.34.62 1.734.414.394.974.591 1.678.591.704 0 1.264-.197 1.678-.591.413-.394.62-.972.62-1.734v-2.002h2.234v2.002c0 1.484-.389 2.644-1.168 3.48-.779.836-1.866 1.254-3.262 1.254zm-4.717-9.522v-2.234h6.318v2.234h-6.318z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors relative z-10">
                Mercado Libre
              </span>
            </a>

            {/* TikTok */}
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden bg-[#09090b] rounded-[1.5rem] border border-white/5 hover:border-cyan-400/50 p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/0 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <svg
                className="w-10 h-10 fill-current text-gray-500 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300 relative z-10"
                viewBox="0 0 24 24"
              >
                <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.242V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.144-4.53v-3.49a6.341 6.341 0 0 0-6.035 6.347 6.342 6.342 0 0 0 6.67 6.331 6.344 6.344 0 0 0 5.955-6.331V9.08a8.17 8.17 0 0 0 4.634 1.446V7.082a4.816 4.816 0 0 1-1.002-.396z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors relative z-10">
                TikTok
              </span>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden bg-[#09090b] rounded-[1.5rem] border border-white/5 hover:border-red-600/50 p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(220,38,38,0.15)]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-red-600/0 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <svg
                className="w-10 h-10 fill-current text-gray-500 group-hover:text-red-600 group-hover:scale-110 transition-all duration-300 relative z-10"
                viewBox="0 0 24 24"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors relative z-10">
                YouTube
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ================= 7. FOOTER ULTRA PREMIUM ================= */}
      <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-10 relative overflow-hidden flex flex-col">
        
        {/* Marca de agua gigante de fondo (Estilo Lujo) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0">
          <span className="text-[12vw] font-black text-white/[0.015] uppercase tracking-tighter whitespace-nowrap flex items-center justify-center">
            Pfaffen <span className="text-[4vw] ml-4 text-white/[0.015]">®</span>
          </span>
        </div>

        {/* Resplandor inferior */}
        <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-[#0145F2]/5 to-transparent pointer-events-none z-0"></div>

        <div className="max-w-[85rem] mx-auto px-6 w-full grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 relative z-10 mb-16">
          
          {/* COLUMNA 1: Identidad de Marca (Ocupa 4 columnas) */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="group relative inline-block mb-6 transform hover:scale-105 transition-transform duration-500">
              <img 
                src="/logo.png" 
                alt="Pfaffen Autos" 
                className="h-8 md:h-10 w-auto invert brightness-0 drop-shadow-lg" 
              />
              <img 
                src="/r.png" 
                alt="Marca Registrada" 
                className="absolute -top-1 -right-5 w-3 h-3 object-contain invert brightness-0 drop-shadow-sm opacity-80" 
              />
            </Link>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] leading-loose max-w-[280px] font-medium">
              Especialistas en vehículos de alta gama y unidades 0KM seleccionadas con los más altos estándares.
            </p>
          </div>

          {/* COLUMNA 2: Enlaces Rápidos (Ocupa 4 columnas) */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start">
            <h4 className="text-white font-black uppercase tracking-[0.25em] text-[10px] mb-8">
              Accesos Rápidos
            </h4>
            <nav className="flex flex-col gap-4 text-[10px] text-gray-400 uppercase tracking-widest font-medium">
              <a href="#stock" className="hover:text-white transition-colors flex items-center gap-3 group">
                <span className="w-0 h-[1px] bg-[#0145F2] group-hover:w-4 transition-all duration-300"></span> 
                Ver Catálogo
              </a>
              <a href="#contacto" className="hover:text-white transition-colors flex items-center gap-3 group">
                <span className="w-0 h-[1px] bg-[#0145F2] group-hover:w-4 transition-all duration-300"></span> 
                Cotizar Vehículo
              </a>
              <a href="#sucursales" className="hover:text-white transition-colors flex items-center gap-3 group">
                <span className="w-0 h-[1px] bg-[#0145F2] group-hover:w-4 transition-all duration-300"></span> 
                Nuestras Sucursales
              </a>
              <a href="#nosotros" className="hover:text-white transition-colors flex items-center gap-3 group">
                <span className="w-0 h-[1px] bg-[#0145F2] group-hover:w-4 transition-all duration-300"></span> 
                Sobre Nosotros
              </a>
            </nav>
          </div>

          {/* COLUMNA 3: Contacto y Horarios (Ocupa 4 columnas) */}
          <div className="md:col-span-4 flex flex-col items-center md:items-end text-center md:text-right">
            <h4 className="text-white font-black uppercase tracking-[0.25em] text-[10px] mb-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0145F2] animate-pulse hidden md:block"></span>
              Atención al Cliente
            </h4>
            
            <div className="mb-8">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 font-medium">
                Lun a Sáb: <span className="text-white font-bold ml-1">9:00 - 19:00hs</span>
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                Domingos: <span className="text-gray-600 font-bold ml-1">Cerrado</span>
              </p>
            </div>

            <a
              href="https://wa.me/5491100000000"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 bg-white/5 hover:bg-[#25D366] text-white border border-white/10 hover:border-[#25D366] text-[9px] font-black uppercase tracking-[0.2em] px-6 py-3.5 rounded-full transition-all duration-500 hover:shadow-[0_0_25px_rgba(37,211,102,0.4)] hover:-translate-y-1 backdrop-blur-sm"
            >
              <Phone className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" /> 
              <span>WhatsApp Oficial</span>
            </a>
          </div>

        </div>

        {/* LÍNEA DIVISORIA Y COPYRIGHT */}
        <div className="max-w-[85rem] mx-auto px-6 w-full relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/5">
          <p className="text-[9px] text-gray-600 uppercase tracking-[0.25em] font-medium">
            © {new Date().getFullYear()} Pfaffen Autos. Todos los derechos reservados.
          </p>
          
          <div className="flex items-center gap-4 text-[9px] text-gray-600 uppercase tracking-[0.2em] font-medium">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <span className="text-gray-800">|</span>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
          </div>
        </div>
      </footer>

      {/* BOTÓN FLOTANTE WHATSAPP */}
      <a
        href="https://wa.me/5491100000000"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 bg-[#25D366] text-white p-4 rounded-full shadow-[0_0_30px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform z-50 flex items-center justify-center"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );
}
