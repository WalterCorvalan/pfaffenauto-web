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
    { name: "Cotizá tu auto", href: "/cotizador" },
    { name: "Comprá tu auto", href: "/catalogo" },
    { name: "Outlet", href: "/outlet" },
    { name: "Nosotros", href: "#nosotros" },
  ];

  return (
    <>
      <header className="sticky top-0 w-full z-50 bg-white border-b border-[#EDF1F5] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-[72px] flex items-center justify-between gap-4 md:gap-8">
          {/* LOGO */}
          <Link href="/" className="shrink-0 flex items-center relative">
            <img src="/logo.png" alt="Pfaffen Autos" className="h-5 md:h-7 w-auto" />
            <img
              src="/r.png"
              alt="Marca Registrada"
              className="absolute brightness-0 -top-1 -right-2.5 w-2 h-2 object-contain opacity-40"
            />
          </Link>

          {/* CENTRO: nav o buscador */}
          <div className="flex-1 h-full hidden lg:flex items-center justify-center relative">
            <nav
              className={`absolute flex items-center gap-10 text-[13px] font-medium text-[#161616] transition-all duration-300 ${
                isScrolled ? "opacity-0 -translate-y-3 pointer-events-none" : "opacity-100 translate-y-0"
              }`}
            >
              {navLinks.map((link, i) => (
                <Link key={i} href={link.href} className="relative group py-2">
                  <span className="group-hover:text-[#0145F2] transition-colors">{link.name}</span>
                  <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-[#0145F2] group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>

            <div
              className={`w-full max-w-md absolute transition-all duration-300 ${
                isScrolled ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none"
              }`}
            >
              <form
                onSubmit={handleSearch}
                className="flex items-center w-full bg-[#EDF1F5] rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-[#0145F2]/20 transition-all"
              >
                <Search className="w-4 h-4 text-[#0145F2] shrink-0" />
                <input
                  type="text"
                  placeholder="Buscá tu auto ideal..."
                  className="w-full bg-transparent text-[13px] outline-none text-[#161616] placeholder:text-gray-400 py-0.5 px-3"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="p-1 text-gray-400 hover:text-[#0145F2] transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* DERECHA */}
          <div className="shrink-0 flex items-center gap-2 md:gap-3">
            <Link
              href="/#sucursales"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-[#161616] hover:bg-[#EDF1F5] transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#0145F2]" /> Sucursales
            </Link>

            <button
              onClick={() => setIsNavOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0145F2] hover:bg-[#0145F2]/90 rounded-full transition-colors"
              aria-label="Abrir menú"
            >
              <span className="text-xs font-semibold text-white hidden sm:inline">Menú</span>
              <Menu className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* PANEL LATERAL */}
      <AnimatePresence>
        {isNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNavOpen(false)}
              className="fixed inset-0 bg-[#161616]/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] bg-white shadow-xl z-[70] p-6 flex flex-col overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#EDF1F5] shrink-0">
                <span className="font-semibold text-[#161616] text-sm">Menú</span>
                <button
                  onClick={() => setIsNavOpen(false)}
                  className="text-gray-400 hover:text-[#0145F2] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1 lg:hidden mb-8 pb-8 border-b border-[#EDF1F5]">
                {navLinks.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    onClick={() => setIsNavOpen(false)}
                    className="text-[#161616] text-sm font-medium py-3 px-3 rounded-lg hover:bg-[#EDF1F5] hover:text-[#0145F2] transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  href="/#sucursales"
                  onClick={() => setIsNavOpen(false)}
                  className="flex items-center gap-2 text-[#161616] text-sm font-medium py-3 px-3 rounded-lg hover:bg-[#EDF1F5] mt-1"
                >
                  <MapPin className="w-4 h-4 text-[#0145F2]" /> Ver sucursales
                </Link>
              </div>

              <div className="flex flex-col items-center text-center mt-auto lg:mt-0 pt-2">
                <div className="w-11 h-11 bg-[#EDF1F5] rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-4.5 h-4.5 text-[#0145F2]" />
                </div>
                <h3 className="text-base font-bold uppercase text-[#161616] tracking-tight mb-2">
                  Pfaffen <span className="text-[#0145F2]">VIP</span>
                </h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed px-2">
                  Suscribite para recibir descuentos exclusivos, ofertas de liquidación y nuevos ingresos antes que nadie.
                </p>
                <form
                  className="w-full flex flex-col gap-2.5"
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
                    className="w-full bg-[#EDF1F5] rounded-lg py-3 px-4 text-xs text-[#161616] placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#0145F2]/20 transition-all"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#0145F2] hover:bg-[#0145F2]/90 text-white font-semibold text-xs py-3.5 rounded-lg transition-colors"
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