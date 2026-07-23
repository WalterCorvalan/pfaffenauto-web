"use client";

import { useState } from "react";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Mail, Bell } from "lucide-react";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "700"] });

export default function PublicHeader() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

const navLinks = [
    { name: "Vende tu auto", href: "#contacto" },
    { name: "Compra tu auto", href: "/catalogo" },
    { name: "Financiá tu auto", href: "#contacto" },
    { name: "Outlet de autos", href: "/outlet" }, // <-- ¡CAMBIAR ACÁ!
    { name: "Nosotros", href: "#nosotros" },
  ];

  return (
    <>
      <header className="absolute top-0 w-full z-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-6 pb-6 px-4 md:px-12 flex justify-between items-center">
        
        {/* ================= 1. LOGO ================= */}
        <Link href="/" className="flex items-center group relative z-50">
          <div className="relative inline-block transform group-hover:scale-105 transition-transform duration-500">
            <img 
              src="/logo.png" 
              alt="Pfaffen Autos" 
              className="h-7 md:h-10 w-auto invert brightness-0 drop-shadow-md" 
            />
            <img 
              src="/r.png" 
              alt="Marca Registrada" 
              className="absolute -top-1 -right-4 md:-right-5 w-2.5 h-2.5 md:w-3.5 md:h-3.5 object-contain invert brightness-0 drop-shadow-sm" 
            />
          </div>
        </Link>

        {/* ================= 2. NAVEGACIÓN DESKTOP ================= */}
        <nav className={`hidden lg:flex absolute left-1/2 -translate-x-1/2 gap-8 xl:gap-10 uppercase text-[10px] font-bold tracking-[0.25em] text-white/80 items-center ${montserrat.className}`}>
          {navLinks.map((link, i) => (
            <Link key={i} href={link.href} className="relative group py-2">
              <span className="group-hover:text-white transition-colors duration-300">{link.name}</span>
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#0055A4] group-hover:w-full transition-all duration-300 shadow-[0_0_10px_rgba(0,85,164,0.8)] opacity-0 group-hover:opacity-100"></span>
            </Link>
          ))}
        </nav>

        {/* ================= 3. NAVEGACIÓN MOBILE ================= */}
        <div className="lg:hidden absolute left-1/2 -translate-x-1/2 z-50">
          <button 
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-full transition-all"
          >
            ¿Qué buscás? 
            <motion.div animate={{ rotate: isNavOpen ? 180 : 0 }}>
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isNavOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 10, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-1/2 -translate-x-1/2 w-[220px] bg-[#0A0F16]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 flex flex-col"
              >
                {navLinks.map((link, i) => (
                  <Link 
                    key={i} 
                    href={link.href} 
                    onClick={() => setIsNavOpen(false)}
                    className="text-white text-[10px] font-bold uppercase tracking-widest text-center py-3.5 hover:bg-[#0055A4] rounded-xl transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ================= 4. MENÚ HAMBURGUESA MODERNO ================= */}
        <div className="flex items-center relative z-50">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/5 border border-white/10 hover:bg-white/20 transition-all backdrop-blur-md group focus:outline-none shadow-lg"
          >
            {/* Ícono de dos líneas asimétricas (Súper minimalista) */}
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:text-[#0055A4] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M10 16h10" />
            </svg>
          </button>
        </div>
      </header>

      {/* ================= PANEL LATERAL (WIDGET FLOTANTE VIP) ================= */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Fondo oscuro desenfocado */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />

            {/* Panel Flotante Moderno */}
            <motion.div 
              initial={{ x: "100%", opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: "100%", opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              // Usamos un ancho máximo de 320px y lo separamos de los bordes con top-4, right-4 y rounded-3xl
              className={`fixed top-4 right-4 bottom-4 w-[calc(100%-32px)] sm:w-[320px] bg-[#0A0F16]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[70] p-6 flex flex-col ${montserrat.className}`}
            >
              <div className="flex justify-end mb-6">
                <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center px-2">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0055A4] to-[#1E6FD9] rounded-full flex items-center justify-center mb-5 shadow-lg shadow-[#0055A4]/30">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-xl md:text-2xl font-black uppercase text-white tracking-tight mb-2">
                  Pfaffen <span className="text-[#0055A4]">VIP</span>
                </h3>
                
                <p className="text-xs text-gray-400 font-medium mb-6 leading-relaxed">
                  Enterate antes que nadie de los nuevos ingresos de 0KM y usados, y accedé a precios especiales.
                </p>

                {/* Formulario de Suscripción Compacto */}
                <form className="w-full flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); alert("¡Suscrito con éxito!"); setIsDrawerOpen(false); }}>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="email" 
                      placeholder="Tu email" 
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder:text-gray-500 outline-none focus:border-[#0055A4] transition-colors"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-[#0055A4] hover:bg-[#1E6FD9] text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(0,85,164,0.3)]"
                  >
                    Suscribirme
                  </button>
                </form>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5 text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest">
                  ¿Sos empresa o flota? <br/>
                  <a href="mailto:ventas@pfaffenautos.com.ar" className="text-[#0055A4] font-bold mt-1 inline-block">Contactanos aquí</a>
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}