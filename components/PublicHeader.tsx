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
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-500 border-b ${
        isScrolled 
          ? "bg-white/60 backdrop-blur-2xl border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.05)]" 
          : "bg-white/40 backdrop-blur-xl border-white/40 shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        
        {/* ================= LOGO ================= */}
        <Link href="/" className="relative flex items-center group shrink-0">
          <img
            src="/logo.png"
            alt="Pfaffen Autos"
            className="h-7 md:h-8 w-auto transition-transform duration-500 group-hover:scale-105 drop-shadow-sm"
          />
          <img
            src="/r.png"
            alt="Marca Registrada"
            className="absolute -top-1 -right-3 md:-right-4 w-2.5 h-2.5 object-contain brightness-0 opacity-80"
          />
        </Link>

        {/* ================= ÁREA CENTRAL DESKTOP ================= */}
        <div className="hidden lg:flex items-center flex-1 justify-center px-8">
          <AnimatePresence mode="wait">
            {!isScrolled ? (
              // ESTADO 1: MENÚ DE NAVEGACIÓN NORMAL
              <motion.nav 
                key="nav-links"
                initial={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                className="flex items-center gap-1 bg-white/30 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/50 shadow-inner"
              >
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`relative px-5 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 rounded-full ${
                        isActive 
                          ? "bg-white text-[#0145F2] shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-white/80" 
                          : "text-slate-600 hover:text-navy hover:bg-white/50"
                      }`}
                    >
                      {link.name}
                      {link.badge && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[7px] px-1.5 py-0.5 rounded-full shadow-sm">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </motion.nav>
            ) : (
              // ESTADO 2: BUSCADOR CON IA (Al scrollear)
              <motion.form 
                key="search-bar"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                onSubmit={handleSearch}
                className="w-full max-w-lg relative group"
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Sparkles className="h-4 w-4 text-[#0145F2] opacity-80" />
                </div>
                <input
                  type="text"
                  placeholder="Buscá por marca, modelo, o necesidad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/40 backdrop-blur-md hover:bg-white/60 border border-white/60 text-navy text-xs font-bold rounded-full pl-11 pr-12 py-3 outline-none focus:bg-white/80 focus:ring-4 focus:ring-[#0145F2]/15 focus:border-[#0145F2]/40 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-slate-400 placeholder:font-medium relative z-0"
                />
                <button 
                  type="submit" 
                  className="absolute inset-y-1.5 right-1.5 bg-[#0145F2] hover:bg-blue-600 text-white p-2 rounded-full transition-all duration-300 shadow-[0_2px_10px_rgba(1,69,242,0.3)] hover:shadow-[0_4px_15px_rgba(1,69,242,0.4)] active:scale-95 z-10"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* ================= ACCIONES (Favoritos + Cotizador) ================= */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          
          {/* BÚSQUEDA MÓVIL (Aparece al scrollear en celulares) */}
          <AnimatePresence>
            {isScrolled && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                onClick={toggleSearchMobile}
                className="lg:hidden p-2.5 text-[#0145F2] hover:bg-white/60 bg-white/40 backdrop-blur-md border border-white/60 rounded-full transition-all duration-300 active:scale-95 shadow-sm"
                title="Buscar"
              >
                <Search className="w-4 h-4 md:w-5 md:h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* MIS FAVORITOS */}
          <Link
            href="/favoritos"
            className="relative p-2.5 text-slate-500 hover:text-red-500 hover:bg-white/60 bg-transparent rounded-full transition-all duration-300 active:scale-95"
            title="Mis Favoritos"
          >
            <Heart className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${favCount > 0 ? "fill-red-500 text-red-500 drop-shadow-[0_2px_8px_rgba(239,68,68,0.4)]" : ""}`} />
            {favCount > 0 && (
              <span className="absolute top-1 right-1 bg-gradient-to-br from-red-400 to-red-600 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white/80 shadow-sm">
                {favCount}
              </span>
            )}
          </Link>

          {/* COTIZAR (Desktop) */}
          <Link
            href="/cotizador"
            className="hidden lg:flex items-center gap-2 bg-[#0145F2] hover:bg-blue-600 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-[0_4px_15px_rgba(1,69,242,0.3)] hover:shadow-[0_6px_20px_rgba(1,69,242,0.4)] active:scale-95 shrink-0 relative overflow-hidden group"
          >
            <span className="absolute inset-0 w-[150%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]"></span>
            Cotizá Tu Usado <ChevronRight className="w-4 h-4" />
          </Link>

          {/* MENÚ HAMBURGUESA (Móvil) */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2.5 text-navy hover:bg-white/60 bg-transparent rounded-full transition-all duration-300 active:scale-95"
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
            className="lg:hidden bg-white/70 backdrop-blur-3xl border-t border-white/60 overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
          >
            <form onSubmit={handleSearch} className="p-4 relative">
              <div className="absolute inset-y-0 left-4 pl-4 flex items-center pointer-events-none z-10">
                <Sparkles className="h-5 w-5 text-[#0145F2]" />
              </div>
              <input
                type="text"
                placeholder="¿Qué auto buscás?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-md border border-white/80 text-navy text-sm font-bold rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:border-[#0145F2]/50 focus:bg-white focus:ring-4 focus:ring-[#0145F2]/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] relative z-0"
                autoFocus
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MENÚ MÓVIL PANTALLA COMPLETA ================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/80 backdrop-blur-3xl border-t border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden absolute w-full"
          >
            <div className="flex flex-col px-4 py-6 gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-4 rounded-[20px] bg-white/40 hover:bg-white border border-white/60 shadow-sm text-navy font-black uppercase tracking-widest text-sm transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2">
                    {link.name}
                    {link.badge && (
                      <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] px-2 py-0.5 rounded-full shadow-sm">
                        {link.badge}
                      </span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                    <ChevronRight className="w-4 h-4 text-[#0145F2]" />
                  </div>
                </Link>
              ))}

              <div className="mt-4 pt-4 border-t border-white/50">
                <Link
                  href="/cotizador"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full bg-[#0145F2] hover:bg-blue-600 text-white p-4 rounded-[20px] text-xs font-black uppercase tracking-widest shadow-[0_8px_20px_rgba(1,69,242,0.3)] active:scale-[0.98] transition-all"
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