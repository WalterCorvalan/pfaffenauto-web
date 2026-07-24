"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Menu, X, Mail, Search, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export default function PublicHeader() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  // ================= DETECCIÓN DE SCROLL =================
  useEffect(() => {
    const handleScroll = () => {
      // 400px es aprox cuando el buscador del Hero desaparece de la vista
      if (window.scrollY > 400) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/catalogo?q=${encodeURIComponent(searchTerm)}`);
      setIsNavOpen(false);
    }
  };

  const navLinks = [
    { name: "Cotizá tu auto", href: "/cotizador" },
    { name: "Comprá tu auto", href: "/catalogo" },
    { name: "Outlet", href: "/outlet" },
    { name: "Nosotros", href: "#nosotros" },
  ];

  return (
    <>
      <header className="sticky top-0 w-full z-50 bg-white border-b border-gray-200 shadow-sm flex flex-col transition-all duration-300">
        
        {/* ================= FILA SUPERIOR: LOGO Y CONTROLES ================= */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex justify-between items-center w-full bg-white z-20">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center relative z-50 group">
            <div className="relative inline-block transform group-hover:scale-105 transition-transform duration-500">
              <img src="/logo.png" alt="Pfaffen Autos" className="h-5 md:h-6 w-auto" />
              <img src="/r.png" alt="Marca Registrada" className="absolute brightness-0 -top-1 -right-3 md:-right-3 w-2.5 h-2.5 md:w-3 md:h-3 object-contain" />
            </div>
          </Link>

          {/* NAVEGACIÓN DESKTOP */}
          <nav className={`hidden lg:flex absolute left-1/2 -translate-x-1/2 gap-8 text-[13px] font-bold text-navy items-center ${montserrat.className}`}>
            {navLinks.map((link, i) => (
              <Link key={i} href={link.href} className="relative group py-2">
                <span className="group-hover:text-primary transition-colors duration-300">{link.name}</span>
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </nav>

          {/* CONTROLES DERECHA */}
          <div className="flex items-center gap-3 relative z-50">
            <Link href="/#sucursales" className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-navy hover:border-gray-300 transition-colors">
              <MapPin className="w-4 h-4 text-gray-400" /> Ubicación
            </Link>
            <button onClick={() => setIsNavOpen(true)} className="p-1.5 text-primary hover:bg-sky-50 rounded-lg transition-colors focus:outline-none">
              <Menu className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ================= FILA INFERIOR: BUSCADOR MÓVIL STICKY ================= */}
        {/* Usamos AnimatePresence para que baje y suba suavemente solo cuando scrolleas */}
        <AnimatePresence>
          {isScrolled && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full bg-white z-10 overflow-hidden border-t border-gray-100"
            >
              <div className="max-w-7xl mx-auto px-4 py-3 pb-4">
                <form 
                  onSubmit={handleSearch} 
                  className="flex items-center w-full bg-background border border-primary/20 rounded-xl px-3 py-1.5 shadow-inner focus-within:border-primary/50 transition-colors"
                >
                  <Search className="w-4 h-4 text-primary mr-2 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Buscá por marca, modelo o versión" 
                    className="w-full bg-transparent text-[13px] outline-none text-navy placeholder:text-gray-400 py-1.5"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button type="submit" className="shrink-0 p-1 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                    <Wand2 className="w-4 h-4 text-orange-500" strokeWidth={2.5} />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ================= PANEL LATERAL ================= */}
      <AnimatePresence>
        {isNavOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNavOpen(false)} className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className={`fixed top-0 right-0 bottom-0 w-[300px] bg-white shadow-2xl z-[70] p-6 flex flex-col overflow-y-auto ${montserrat.className}`}>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 shrink-0">
                <span className="font-bold text-navy text-sm">Menú</span>
                <button onClick={() => setIsNavOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-full p-2 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="flex flex-col gap-2 lg:hidden mb-8 pb-8 border-b border-gray-100">
                {navLinks.map((link, i) => (
                  <Link key={i} href={link.href} onClick={() => setIsNavOpen(false)} className="text-navy text-sm font-bold py-3 px-4 hover:bg-sky-50 hover:text-primary rounded-xl transition-colors">{link.name}</Link>
                ))}
                <Link href="/#sucursales" onClick={() => setIsNavOpen(false)} className="flex items-center justify-center gap-3 text-gray-600 text-sm font-bold py-3 px-4 border border-gray-200 mt-2 rounded-xl hover:bg-gray-50"><MapPin className="w-4 h-4" /> Ver Sucursales</Link>
              </div>

              <div className="flex flex-col items-center text-center mt-auto lg:mt-0 pt-4">
                <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mb-4"><Mail className="w-5 h-5 text-primary" /></div>
                <h3 className="text-lg font-black uppercase text-navy tracking-tight mb-2">Pfaffen <span className="text-primary">VIP</span></h3>
                <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed px-2">Suscribite para recibir descuentos exclusivos, ofertas de liquidación y los nuevos ingresos antes que nadie.</p>
                <form className="w-full flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); alert("¡Suscrito con éxito!"); setIsNavOpen(false); }}>
                  <input type="email" placeholder="Tu correo electrónico" required className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-xs text-navy placeholder:text-gray-400 outline-none focus:border-primary transition-colors" />
                  <button type="submit" className="w-full bg-primary hover:bg-secondary text-white font-bold uppercase tracking-widest text-[10px] py-4 rounded-xl transition-all shadow-md">Recibir información</button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}