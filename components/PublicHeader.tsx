"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Mail, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PublicHeader() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  // ================= DETECCIÓN DE SCROLL =================
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 350);
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
      <header className="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm transition-all duration-300">
        
        {/* ================= FILA ÚNICA: LOGO | ESPACIO CENTRAL MÁGICO | MENÚ ================= */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex justify-between items-center w-full relative z-20 gap-3 md:gap-6">
          
          {/* 1. LOGO (Izquierda) */}
          <Link href="/" className="shrink-0 flex items-center relative group">
            <div className="relative inline-block transform group-hover:scale-105 transition-transform duration-500">
              <img
                src="/logo.png"
                alt="Pfaffen Autos"
                className="h-5 md:h-9 w-auto"
              />
              <img
                src="/r.png"
                alt="Marca Registrada"
                className="absolute brightness-0 -top-1 -right-3 md:-right-3.5 w-2.5 h-2.5 md:w-3 md:h-3 object-contain"
              />
            </div>
          </Link>

          {/* 2. ESPACIO CENTRAL MÁGICO (Ocupa todo el espacio disponible) */}
          <div className="flex-1 h-full flex items-center justify-center relative overflow-hidden">
            
            {/* A) ENLACES DE NAVEGACIÓN (Solo PC, se ocultan al scrollear) */}
            <nav
              className={`hidden lg:flex absolute gap-8 text-[13px] font-bold text-navy items-center transition-all duration-500 ease-out ${
                isScrolled ? "opacity-0 translate-y-8 pointer-events-none" : "opacity-100 translate-y-0"
              }`}
            >
              {navLinks.map((link, i) => (
                <Link key={i} href={link.href} className="relative group py-2">
                  <span className="group-hover:text-primary transition-colors duration-300">
                    {link.name}
                  </span>
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-300"></span>
                </Link>
              ))}
            </nav>

            {/* B) BUSCADOR IA (Cae desde arriba al scrollear, funciona en PC y Móvil) */}
            <div
              className={`w-full max-w-xl absolute px-1 transition-all duration-500 ease-out ${
                isScrolled ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-8 pointer-events-none"
              }`}
            >
              <form
                onSubmit={handleSearch}
                className="flex items-center w-full bg-gray-50 border border-primary/20 rounded-full px-2 md:px-3 py-1 shadow-inner focus-within:border-primary/50 transition-colors focus-within:ring-4 focus-within:ring-primary/10 focus-within:bg-white"
              >
                <Wand2 className="w-3.5 h-3.5 text-blue-600 ml-2 mr-2 shrink-0 animate-pulse hidden sm:block" />
                <input
                  type="text"
                  placeholder="Describile a la IA qué buscás..."
                  className="w-full bg-transparent text-[11px] md:text-[13px] outline-none text-navy placeholder:text-gray-400 py-1.5 px-2 truncate"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                {/* CRUZ PARA BORRAR RÁPIDO */}
                <AnimatePresence>
                  {searchTerm && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="p-1.5 mr-1 text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 rounded-full transition-colors focus:outline-none shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  className="shrink-0 px-3 md:px-4 py-1.5 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold uppercase tracking-widest text-[9px] md:text-[10px] rounded-full hover:from-blue-500 hover:to-blue-600 transition-colors shadow-sm cursor-pointer"
                >
                  Buscar
                </button>
              </form>
            </div>
          </div>

          {/* 3. CONTROLES DERECHA (Ubicación y Menú) */}
          <div className="shrink-0 flex items-center gap-2 md:gap-3">
            <Link
              href="/#sucursales"
              className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-navy hover:border-gray-300 transition-colors"
            >
              <MapPin className="w-4 h-4 text-gray-400" /> Ubicación
            </Link>

            <button
              onClick={() => setIsNavOpen(true)}
              className="group flex items-center gap-2 px-3.5 py-2 bg-gray-50 hover:bg-sky-50 border border-gray-200 hover:border-primary/40 rounded-full transition-all duration-300 focus:outline-none shadow-sm cursor-pointer"
              aria-label="Abrir menú"
            >
              <span className="text-xs font-black uppercase tracking-wider text-navy group-hover:text-primary transition-colors hidden sm:inline">
                Menú
              </span>
              <div className="flex flex-col gap-1 w-5 items-end justify-center shrink-0">
                <span className="w-full h-0.5 bg-navy group-hover:bg-primary rounded-full transition-all duration-300 group-hover:w-3"></span>
                <span className="w-3.5 h-0.5 bg-navy group-hover:bg-primary rounded-full transition-all duration-300 group-hover:w-5"></span>
                <span className="w-full h-0.5 bg-navy group-hover:bg-primary rounded-full transition-all duration-300 group-hover:w-4"></span>
              </div>
            </button>
          </div>

        </div>
      </header>

      {/* PANEL LATERAL VIP */}
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
              className={`fixed top-0 right-0 bottom-0 w-[300px] bg-white shadow-2xl z-[70] p-6 flex flex-col overflow-y-auto`}
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 shrink-0">
                <span className="font-bold text-navy text-sm">Menú</span>
                <button
                  onClick={() => setIsNavOpen(false)}
                  className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-full p-2 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2 lg:hidden mb-8 pb-8 border-b border-gray-100">
                {navLinks.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    onClick={() => setIsNavOpen(false)}
                    className="text-navy text-sm font-bold py-3 px-4 hover:bg-sky-50 hover:text-primary rounded-xl transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  href="/#sucursales"
                  onClick={() => setIsNavOpen(false)}
                  className="flex items-center justify-center gap-3 text-gray-600 text-sm font-bold py-3 px-4 border border-gray-200 mt-2 rounded-xl hover:bg-gray-50"
                >
                  <MapPin className="w-4 h-4" /> Ver Sucursales
                </Link>
              </div>
              <div className="flex flex-col items-center text-center mt-auto lg:mt-0 pt-4">
                <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-black uppercase text-navy tracking-tight mb-2">
                  Pfaffen <span className="text-primary">VIP</span>
                </h3>
                <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed px-2">
                  Suscribite para recibir descuentos exclusivos, ofertas de
                  liquidación y los nuevos ingresos antes que nadie.
                </p>
                <form
                  className="w-full flex flex-col gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert("¡Suscrito con éxito!");
                    setIsNavOpen(false);
                  }}
                >
                  <input
                    type="email"
                    placeholder="Tu correo electrónico"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-xs text-navy placeholder:text-gray-400 outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-secondary text-white font-bold uppercase tracking-widest text-[10px] py-4 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Recibir info
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}