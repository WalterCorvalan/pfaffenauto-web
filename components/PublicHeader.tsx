"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Heart, ChevronRight, Search, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchMobileOpen, setIsSearchMobileOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const pathname = usePathname();
  const router = useRouter();

  // 1. Leer los favoritos del localStorage
  const updateFavCount = () => {
    const favs = JSON.parse(localStorage.getItem("pfaffen_favs") || "[]");
    setFavCount(favs.length);
  };

  // 2. Controlar si el usuario scrolleó más allá del Hero (ej: 400px)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3. Efectos al cambiar de ruta
  useEffect(() => {
    updateFavCount();
    setIsOpen(false);
    setIsSearchMobileOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Catálogo", href: "/catalogo" },
    { name: "Marcas", href: "/marcas" },
    { name: "Outlet", href: "/outlet", badge: "Ofertas" },
  ];

  // 4. Manejar la búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalogo?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchMobileOpen(false);
      setSearchQuery("");
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    setIsSearchMobileOpen(false);
  };

  const toggleSearchMobile = () => {
    setIsSearchMobileOpen(!isSearchMobileOpen);
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#dee2e6] backdrop-blur-xl border-b border-gray-300/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="relative flex items-center group shrink-0">
          <img
            src="/logo.png"
            alt="Pfaffen Autos"
            className="h-7 md:h-8 w-auto transition-transform duration-300 group-hover:scale-105"
          />
          <img
            src="/r.png"
            alt="Marca Registrada"
            className="absolute -top-1 -right-3 md:-right-4 w-2.5 h-2.5 object-contain brightness-0 opacity-80"
          />
        </Link>

        {/* ÁREA CENTRAL DESKTOP: Menú o Buscador Dinámico */}
        <div className="hidden lg:flex items-center flex-1 justify-center px-8">
          <AnimatePresence mode="wait">
            {!isScrolled ? (
              // ESTADO 1: MENÚ DE NAVEGACIÓN NORMAL (Arriba de todo)
              <motion.nav 
                key="nav-links"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1"
              >
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`relative px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-all rounded-full hover:bg-slate-50 ${
                        isActive ? "text-[#0145F2]" : "text-slate-600 hover:text-navy"
                      }`}
                    >
                      {link.name}
                      {link.badge && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] px-1.5 py-0.5 rounded-full">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </motion.nav>
            ) : (
              // ESTADO 2: BUSCADOR CON IA (Cuando se hace scroll hacia abajo)
              <motion.form 
                key="search-bar"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSearch}
                className="w-full max-w-lg relative group"
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Sparkles className="h-4 w-4 text-[#0145F2] opacity-80" />
                </div>
                <input
                  type="text"
                  placeholder="Buscá por marca, modelo, o necesidad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100/50 hover:bg-slate-100 border border-slate-200 text-navy text-xs font-bold rounded-full pl-11 pr-12 py-3 outline-none focus:bg-white focus:ring-4 focus:ring-[#0145F2]/10 focus:border-[#0145F2]/30 transition-all duration-300 shadow-inner placeholder:text-slate-400 placeholder:font-medium"
                />
                <button type="submit" className="absolute inset-y-1 right-1 bg-[#0145F2] hover:bg-blue-700 text-white p-2 rounded-full transition-colors">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* ACCIONES (Favoritos + Cotizador) */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          
          {/* BOTÓN BÚSQUEDA MÓVIL (Aparece al scrollear en celulares) */}
          <AnimatePresence>
            {isScrolled && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                onClick={toggleSearchMobile}
                className="lg:hidden p-2.5 text-[#0145F2] hover:bg-blue-50 rounded-full transition-colors active:scale-95 bg-blue-50/50"
                title="Buscar"
              >
                <Search className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* BOTÓN MIS FAVORITOS */}
          <Link
            href="/favoritos"
            className="relative p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors active:scale-95"
            title="Mis Favoritos"
          >
            <Heart
              className={`w-5 h-5 md:w-6 md:h-6 ${favCount > 0 ? "fill-red-500 text-red-500" : ""}`}
            />
            {favCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {favCount}
              </span>
            )}
          </Link>

          {/* BOTÓN COTIZAR (Desktop) */}
          <Link
            href="/cotizador"
            className="hidden lg:flex items-center gap-2 bg-navy hover:bg-[#0145F2] text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-colors shadow-md hover:shadow-lg active:scale-95 shrink-0"
          >
            Cotizá Tu Usado <ChevronRight className="w-4 h-4" />
          </Link>

          {/* MENÚ HAMBURGUESA (Móvil) */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 text-navy hover:bg-slate-100 rounded-full transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ================= BARRA DE BÚSQUEDA MÓVIL DESPLEGABLE ================= */}
      <AnimatePresence>
        {isSearchMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.05)]"
          >
            <form onSubmit={handleSearch} className="p-4 relative">
              <div className="absolute inset-y-0 left-4 pl-4 flex items-center pointer-events-none">
                <Sparkles className="h-5 w-5 text-[#0145F2]" />
              </div>
              <input
                type="text"
                placeholder="¿Qué auto buscás?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-navy text-sm font-medium rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:border-[#0145F2] focus:bg-white focus:ring-4 focus:ring-[#0145F2]/10 transition-all shadow-inner"
                autoFocus
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MENÚ MÓVIL PANTALLA COMPLETA */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 shadow-xl overflow-hidden absolute w-full"
          >
            <div className="flex flex-col px-4 py-6 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 text-navy font-black uppercase tracking-widest text-sm transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {link.name}
                    {link.badge && (
                      <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
              ))}

              <div className="mt-4 pt-4 border-t border-slate-100">
                <Link
                  href="/cotizador"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-navy to-[#0145F2] text-white p-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg"
                >
                  Cotizar mi Usado <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}