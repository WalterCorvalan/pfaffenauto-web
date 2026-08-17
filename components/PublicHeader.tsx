"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, X, Heart, ChevronRight, Search, Sparkles, Landmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchMobileOpen, setIsSearchMobileOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const condicionParam = searchParams.get("condicion");

  const updateFavCount = () => {
    const favs = JSON.parse(localStorage.getItem("pfaffen_favs") || "[]");
    setFavCount(favs.length);
  };

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

  useEffect(() => {
    updateFavCount();
    setIsOpen(false);
    setIsSearchMobileOpen(false);
  }, [pathname, searchParams]);

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "0KM", href: "/0km" },
    { name: "Usados Seleccionados", href: "/catalogo?q=usados-seleccionados" },
    { name: "Outlet", href: "/outlet", badge: "Ofertas" },
    { name: "Nuestra Historia", href: "/nosotros", icon: Landmark },
  ];

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
      {/* Contenedor estirado a los laterales para aprovechar espacio */}
      <div className="w-full px-4 md:px-8 h-20 grid grid-cols-[auto_1fr_auto] items-center gap-2">
        {/* ================= COLUMNA IZQUIERDA: LOGOS ================= */}
        <div className="flex items-center gap-3 md:gap-4 justify-start shrink-0">
          {/* Logo Pfaffen */}
          <Link href="/" className="relative flex items-center group shrink-0">
            <img
              src="/logo.png"
              alt="Pfaffen Autos"
              className="h-6 md:h-7 w-auto transition-transform duration-500 group-hover:scale-105 drop-shadow-sm"
            />
            <img
              src="/r.png"
              alt="Marca Registrada"
              className="absolute -top-1 -right-2.5 md:-right-3.5 w-2 h-2 object-contain brightness-0 opacity-80"
            />
          </Link>

          <span className="h-6 w-[1px] bg-slate-300/75 hidden sm:block"></span>

          {/* Grupo de concesionarios oficiales */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 sm:bg-white/30 sm:border sm:border-white/50 rounded-full sm:pl-3 sm:pr-3 sm:py-1 min-w-0">
            <span className="text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-wide sm:tracking-widest text-slate-600 whitespace-nowrap shrink-0 leading-none">
              Concesionario oficial
            </span>
            <div className="flex items-center gap-0 sm:gap-1 shrink-0 h-4 sm:h-6 md:h-7">
              <Link
                href="/rely"
                className="flex items-center h-full group shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0145F2] focus-visible:ring-offset-1"
                title="Rely"
              >
                <img
                  src="/RelyLogo.png"
                  alt="Rely"
                  className="h-8 sm:h-10 md:h-12.5 w-auto object-contain transition-transform group-hover:scale-105 -my-1.5 sm:-my-2 md:-my-2.5"
                />
              </Link>
              <Link
                href="/karry"
                className="flex items-center h-full group shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0145F2] focus-visible:ring-offset-1"
                title="Karry"
              >
                <img
                  src="/logo-karry.webp"
                  alt="Karry"
                  className="h-5 sm:h-10 md:h-7.5 w-auto object-contain transition-transform group-hover:scale-105 -my-1.5 sm:-my-2 md:-my-2.5"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* ================= COLUMNA CENTRO: MENÚ / BUSCADOR (CENTRADO EXACTO) ================= */}
        <div className="flex justify-center items-center w-full">
          <AnimatePresence mode="popLayout">
            {!isScrolled ? (
              <motion.nav
                key="nav-links"
                initial={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                className="hidden lg:flex items-center gap-0 bg-white/30 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/50 shadow-inner"
              >
                {navLinks.map((link) => {
                  const is0KM = link.href.includes("condicion=0km");
                  const isUsados = link.href.includes("condicion=usados");

                  let isActive = false;
                  if (link.href === "/") {
                    isActive = pathname === "/";
                  } else if (is0KM) {
                    isActive = pathname === "/catalogo" && condicionParam === "0km";
                  } else if (isUsados) {
                    isActive = pathname === "/catalogo" && condicionParam === "usados";
                  } else {
                    isActive =
                      pathname === link.href ||
                      (link.href !== "/" && pathname?.startsWith(link.href) && !condicionParam);
                  }

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`relative px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 rounded-full ${
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
              <motion.form
                key="search-bar"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                onSubmit={handleSearch}
                className="hidden lg:block w-full max-w-md relative group"
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Sparkles className="h-4 w-4 text-[#0145F2] opacity-80" />
                </div>
                <input
                  type="text"
                  placeholder="Buscá por marca, modelo, o necesidad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/40 backdrop-blur-md hover:bg-white/60 border border-white/60 text-navy text-xs font-bold rounded-full pl-11 pr-12 py-3 outline-none focus:bg-white/80 focus:ring-4 focus:ring-[#0145F2]/15 focus:border-[#0145F2]/40 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-slate-400 placeholder:font-medium"
                />
                <button
                  type="submit"
                  className="absolute inset-y-1.5 right-1.5 bg-[#0145F2] hover:bg-blue-600 text-white p-2 rounded-full transition-all shadow-[0_2px_10px_rgba(1,69,242,0.3)] active:scale-95"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* ================= COLUMNA DERECHA: ACCIONES ================= */}
        <div className="flex items-center gap-0 md:gap-3 justify-end shrink-0">
          <button
            onClick={toggleSearchMobile}
            className="lg:hidden p-2.5 text-primary bg-white/40 backdrop-blur-md border border-white/60 rounded-full shadow-sm"
            title="Buscar"
          >
            <Search className="w-3.5 h-3.5 md:w-5 md:h-5" />
          </button>

          <Link
            href="/favoritos"
            className="hidden lg:flex relative p-2.5 text-slate-500 hover:text-red-500 rounded-full transition-all"
            title="Mis Favoritos"
          >
            <Heart
              className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${
                favCount > 0
                  ? "fill-red-500 text-red-500 drop-shadow-[0_2px_8px_rgba(239,68,68,0.4)]"
                  : ""
              }`}
            />
            {favCount > 0 && (
              <span className="absolute top-1 right-1 bg-gradient-to-br from-red-400 to-red-600 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white/80 shadow-sm">
                {favCount}
              </span>
            )}
          </Link>

          <Link
            href="/cotizador"
            className="hidden lg:flex items-center gap-2 bg-[#0145F2] hover:bg-blue-600 text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(1,69,242,0.3)] shrink-0 relative overflow-hidden group"
          >
            <span className="absolute inset-0 w-[150%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]"></span>
            Cotizá Tu Usado <ChevronRight className="w-4 h-4" />
          </Link>

          <button
            onClick={toggleMenu}
            className="lg:hidden p-2.5 text-navy hover:bg-white/60 rounded-full transition-all"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menús desplegables móviles */}
      <AnimatePresence>
        {isSearchMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/70 backdrop-blur-3xl border-t border-white/60 overflow-hidden"
          >
            <form onSubmit={handleSearch} className="p-4 relative">
              <input
                type="text"
                placeholder="¿Qué auto buscás?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/50 backdrop-blur-md border border-white/80 text-navy text-sm font-bold rounded-2xl pl-12 pr-4 py-3.5 outline-none"
                autoFocus
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-slate-200 shadow-xl overflow-hidden absolute w-full"
          >
            <div className="flex flex-col px-4 py-6 gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-4 rounded-[20px] bg-slate-50 border border-slate-200 text-navy font-black uppercase tracking-widest text-sm"
                >
                  <span className="flex items-center gap-2.5">
                    {link.icon && <link.icon className="w-4 h-4 text-primary shrink-0" />}
                    {link.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-primary" />
                </Link>
              ))}

              <Link
                href="/favoritos"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between p-4 rounded-[20px] bg-slate-50 border border-slate-200 text-navy font-black uppercase tracking-widest text-sm"
              >
                <span className="flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${favCount > 0 ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
                  Mis Favoritos
                  {favCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                      {favCount}
                    </span>
                  )}
                </span>
                <ChevronRight className="w-4 h-4 text-primary" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}