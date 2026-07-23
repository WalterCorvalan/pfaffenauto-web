"use client";

import { useState } from "react";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Menu, X } from "lucide-react";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "700", "900"] });

export default function PublicHeader() {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const navLinks = [
    { name: "Cotizá tu auto", href: "/cotizador" }, 
    { name: "Comprá tu auto", href: "/catalogo" },
    { name: "Outlet", href: "/outlet" },
    { name: "Nosotros", href: "#nosotros" },
  ];

  return (
    <>
      <header className="sticky top-0 w-full z-50 bg-white border-b border-gray-200 shadow-sm">
        {/* Contenedor estandarizado a max-w-7xl para mantener márgenes uniformes en PC */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex justify-between items-center">
          
          {/* ================= 1. LOGO ================= */}
          <Link href="/" className="flex items-center relative z-50 group">
            <div className="relative border border-primary/30 py-1.5 px-3 md:py-2 md:px-4 rounded-xl group-hover:border-primary transition-colors">
              <img 
                src="/logo.png" 
                alt="Pfaffen Autos" 
                className="h-5 md:h-6 w-auto" 
              />
              <img 
                src="/r.png" 
                alt="Marca Registrada" 
                className="absolute -top-1.5 -right-2.5 md:-right-3 w-2.5 h-2.5 md:w-3 md:h-3 object-contain" 
              />
            </div>
          </Link>

          {/* ================= 2. NAVEGACIÓN DESKTOP ================= */}
          <nav className={`hidden lg:flex absolute left-1/2 -translate-x-1/2 gap-8 text-[13px] font-bold text-navy items-center ${montserrat.className}`}>
            {navLinks.map((link, i) => (
              <Link key={i} href={link.href} className="relative group py-2">
                <span className="group-hover:text-primary transition-colors duration-300">{link.name}</span>
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </nav>

          {/* ================= 3. CONTROLES DERECHA (Ubicación + Menú) ================= */}
          <div className="flex items-center gap-3 relative z-50">
            
            <Link 
              href="/#sucursales" 
              className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-navy hover:border-gray-300 transition-colors"
            >
              <MapPin className="w-4 h-4 text-gray-400" />
              Ubicación
            </Link>

            <button 
              onClick={() => setIsNavOpen(true)}
              className="p-2 text-primary hover:bg-sky-50 rounded-lg transition-colors focus:outline-none lg:hidden"
            >
              <Menu className="w-7 h-7" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* ================= PANEL LATERAL MOBILE ================= */}
      <AnimatePresence>
        {isNavOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNavOpen(false)}
              className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-[60]"
            />

            <motion.div 
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed top-0 right-0 bottom-0 w-[280px] bg-white shadow-2xl z-[70] p-6 flex flex-col ${montserrat.className}`}
            >
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                <span className="font-bold text-navy text-sm">Menú</span>
                <button onClick={() => setIsNavOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-full p-2 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {navLinks.map((link, i) => (
                  <Link 
                    key={i} 
                    href={link.href} 
                    onClick={() => setIsNavOpen(false)}
                    className="text-navy text-sm font-bold py-3.5 px-4 hover:bg-sky-50 hover:text-primary rounded-xl transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
                
                <Link 
                  href="/#sucursales" 
                  onClick={() => setIsNavOpen(false)}
                  className="flex items-center justify-center gap-3 text-gray-600 text-sm font-bold py-3.5 px-4 border border-gray-200 mt-4 rounded-xl hover:bg-gray-50"
                >
                  <MapPin className="w-4 h-4" /> Ver Sucursales
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}