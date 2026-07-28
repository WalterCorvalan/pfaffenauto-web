"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Mail, Search, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PublicHeader() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 350);
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
    { name: "Comprar", href: "/catalogo" },
    { name: "Vender", href: "#nosotros" },
    { name: "Consignar", href: "/" },
    { name: "Cotizar", href: "/cotizador" },
    { name: "Outlet", href: "/outlet" },
  ];

  return (
    <>
      {/* HEADER GLASSMORPHISM */}
      <header className="sticky top-0 w-full z-50 bg-white/60 backdrop-blur-2xl border-b border-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-[72px] flex items-center justify-between gap-3 md:gap-8 relative z-10">
          {/* LOGO */}
          <Link href="/" className="shrink-0 flex items-center relative group">
            <div className="relative inline-block transform group-hover:scale-105 transition-transform duration-500">
              {/* Logo principal teñido de azul brillante con filtros CSS */}
              <img
                src="/logo.png"
                alt="Pfaffen Autos"
                className="h-5 md:h-7 w-auto transition-all duration-300 drop-shadow-[0_0_8px_rgba(1,69,242,0.5)]"
                style={{
                  filter:
                    "brightness(0) saturate(100%) invert(20%) sepia(98%) saturate(3540%) hue-rotate(220deg) brightness(95%) contrast(102%)",
                }}
              />

              {/* Marca Registrada (r.png) con el mismo color azul brillante */}
              <img
                src="/r.png"
                alt="Marca Registrada"
                className="absolute -top-1 -right-2.5 w-2 h-2 object-contain opacity-80"
                style={{
                  filter:
                    "brightness(0) saturate(100%) invert(20%) sepia(98%) saturate(3540%) hue-rotate(220deg) brightness(95%) contrast(102%)",
                }}
              />
            </div>
          </Link>

          {/* ================= CORRECCIÓN: CENTRO (NAV Y BUSCADOR) ================= */}
          {/* Le sacamos el 'hidden lg:flex' a este contenedor padre para que exista en móviles */}
          <div className="flex-1 h-full flex items-center justify-center relative px-1 md:px-0">
            {/* NAV DE LINKS (Esto sí se oculta en móviles: 'hidden lg:flex') */}
            <nav
              className={`hidden lg:flex absolute items-center gap-10 text-[13px] font-bold text-slate-700 tracking-wide transition-all duration-500 ease-out ${
                isScrolled
                  ? "opacity-0 -translate-y-4 pointer-events-none"
                  : "opacity-100 translate-y-0"
              }`}
            >
              {navLinks.map((link, i) => (
                <Link key={i} href={link.href} className="relative group py-2">
                  <span className="group-hover:text-[#0145F2] transition-colors duration-300">
                    {link.name}
                  </span>
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-[#0145F2] to-sky-400 group-hover:w-full rounded-full transition-all duration-300" />
                </Link>
              ))}
            </nav>

            {/* BUSCADOR (Visible en todas las pantallas al hacer scroll) */}
            <div
              className={`w-full max-w-md absolute transition-all duration-500 ease-out ${
                isScrolled
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 translate-y-4 pointer-events-none"
              }`}
            >
              <form
                onSubmit={handleSearch}
                className="flex items-center w-full bg-white/50 backdrop-blur-md border border-white/80 shadow-[0_2px_15px_rgba(0,0,0,0.04)] rounded-full px-3 py-1.5 md:px-4 md:py-2 focus-within:ring-4 focus-within:ring-[#0145F2]/10 focus-within:bg-white/80 transition-all duration-300 group"
              >
                <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#0145F2] shrink-0 group-focus-within:animate-pulse" />
                <input
                  type="text"
                  placeholder="Buscá tu auto..."
                  className="w-full bg-transparent text-xs md:text-[13px] outline-none text-slate-800 font-medium placeholder:text-slate-400 py-0.5 px-2 md:px-3"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <AnimatePresence>
                  {searchTerm && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="p-1 text-slate-400 hover:text-red-500 bg-slate-100/50 hover:bg-red-50 rounded-full transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </div>

          {/* DERECHA */}
          <div className="shrink-0 flex items-center gap-2 md:gap-3">
            <Link
              href="/#sucursales"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-slate-600 bg-white/40 border border-white shadow-sm hover:bg-white/80 hover:text-[#0145F2] hover:-translate-y-0.5 transition-all duration-300"
            >
              <MapPin className="w-3.5 h-3.5" /> Sucursales
            </Link>

            <button
              onClick={() => setIsNavOpen(true)}
              className="group flex items-center gap-2 px-3.5 py-2 md:px-4 md:py-2 bg-gradient-to-r from-[#0145F2] to-blue-600 hover:from-blue-600 hover:to-sky-500 rounded-full transition-all duration-500 shadow-md hover:shadow-lg hover:shadow-blue-500/20"
              aria-label="Abrir menú"
            >
              <span className="text-xs font-bold tracking-wider uppercase text-white hidden sm:inline">
                Menú
              </span>
              <Menu className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </header>

      {/* PANEL LATERAL GLASSMORPHISM */}
      <AnimatePresence>
        {isNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNavOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] bg-white/80 backdrop-blur-3xl border-l border-white/60 shadow-[-10px_0_40px_rgba(0,0,0,0.05)] z-[70] p-6 flex flex-col overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200/50 shrink-0">
                <span className="font-bold text-slate-800 text-sm uppercase tracking-widest">
                  Menú
                </span>
                <button
                  onClick={() => setIsNavOpen(false)}
                  className="p-2 text-slate-400 hover:text-[#0145F2] bg-white/50 border border-white hover:border-[#0145F2]/20 rounded-full transition-all hover:scale-105 shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2 lg:hidden mb-8 pb-8 border-b border-slate-200/50">
                {navLinks.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    onClick={() => setIsNavOpen(false)}
                    className="text-slate-700 text-sm font-bold py-3 px-4 rounded-2xl border border-transparent hover:border-white hover:bg-white/60 hover:text-[#0145F2] hover:shadow-sm transition-all"
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  href="/#sucursales"
                  onClick={() => setIsNavOpen(false)}
                  className="flex items-center justify-center gap-2 text-slate-700 text-sm font-bold py-3 px-4 rounded-2xl bg-white/40 border border-white shadow-sm hover:bg-white/80 transition-all mt-2"
                >
                  <MapPin className="w-4 h-4 text-[#0145F2]" /> Ver sucursales
                </Link>
              </div>

              <div className="flex flex-col items-center text-center mt-auto lg:mt-0 pt-2">
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-50 to-sky-100 border border-white shadow-sm rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-5 h-5 text-[#0145F2]" />
                </div>
                <h3 className="text-base font-black uppercase text-slate-800 tracking-tight mb-2">
                  Pfaffen{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0145F2] to-sky-400">
                    VIP
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed px-2">
                  Suscribite para recibir descuentos exclusivos, ofertas de
                  liquidación y nuevos ingresos antes que nadie.
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
                    className="w-full bg-white/50 backdrop-blur-sm border border-white shadow-inner rounded-xl py-3 px-4 text-xs text-slate-800 font-medium placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-[#0145F2]/10 transition-all"
                  />
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#0145F2] to-blue-600 hover:from-blue-600 hover:to-sky-500 text-white font-bold uppercase tracking-widest text-[10px] py-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
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
