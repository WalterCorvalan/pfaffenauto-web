"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  Menu, X, Heart, ChevronRight, Search, Sparkles, 
  Landmark, Home, CarFront, ShieldCheck, Tag 
} from "lucide-react";
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

  // Se agregaron íconos a todas las opciones para unificar el menú móvil
  const navLinks = [
    { name: "Inicio", href: "/", icon: Home },
    { name: "0KM", href: "/0km", icon: CarFront },
    { name: "Usados Seleccionados", href: "/catalogo?q=usados-seleccionados", icon: ShieldCheck },
    { name: "Outlet", href: "/outlet", badge: "Ofertas", icon: Tag },
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
          ? "bg-white/60 dark:bg-black/70 backdrop-blur-2xl border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          : "bg-white/40 dark:bg-black/50 backdrop-blur-xl border-white/40 dark:border-white/5 shadow-sm"
      }`}
    >
      <div className="w-full px-4 md:px-8 h-20 grid grid-cols-[auto_1fr_auto] items-center gap-2 relative z-20">
        {/* ================= COLUMNA IZQUIERDA: LOGOS ================= */}
        <div className="flex items-center gap-3 md:gap-4 justify-start shrink-0">
          <Link href="/" className="relative flex items-center group shrink-0">
            <Image
              src="/logo.png"
              alt="Pfaffen Autos"
              width={668}
              height={173}
              priority
              className="h-6 md:h-7 w-auto transition-transform duration-500 group-hover:scale-105 drop-shadow-sm dark:brightness-0 dark:invert"
            />
            <Image
              src="/r.png"
              alt="Marca Registrada"
              width={66}
              height={66}
              className="absolute -top-1 -right-2.5 md:-right-2.5 w-2 h-2 object-contain brightness-0 dark:invert opacity-80"
            />
          </Link>

          <span className="h-6 w-[1px] bg-slate-300/75 dark:bg-white/15 hidden sm:block"></span>

          <div className="flex items-center gap-1.5 sm:gap-2.5 sm:bg-white/30 dark:sm:bg-white/5 sm:border sm:border-white/50 dark:sm:border-white/10 rounded-full sm:pl-3 sm:pr-3 sm:py-1 min-w-0">
            <span className="text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-wide sm:tracking-widest text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0 leading-none">
              Concesionario oficial
            </span>
            <div className="flex items-center gap-0 sm:gap-1 shrink-0 h-4 sm:h-6 md:h-7">
              <Link
                href="/rely"
                className="flex items-center h-full group shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0145F2] focus-visible:ring-offset-1"
                title="Rely"
              >
                <Image
                  src="/RelyLogo.png"
                  alt="Rely"
                  width={1536}
                  height={1024}
                  className="h-8 sm:h-10 md:h-12.5 w-auto object-contain transition-transform group-hover:scale-105 -my-1.5 sm:-my-2 md:-my-2.5 dark:brightness-0 dark:invert"
                />
              </Link>
              <Link
                href="/karry"
                className="flex items-center h-full group shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0145F2] focus-visible:ring-offset-1"
                title="Karry"
              >
                <Image
                  src="/logo-karry.webp"
                  alt="Karry"
                  width={500}
                  height={240}
                  className="h-5 sm:h-10 md:h-7.5 w-auto object-contain transition-transform group-hover:scale-105 -my-1.5 sm:-my-2 md:-my-2.5"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* ================= COLUMNA CENTRO: MENÚ / BUSCADOR (CENTRADO) ================= */}
        <div className="flex justify-center items-center w-full">
          <AnimatePresence mode="popLayout">
            {!isScrolled ? (
              <motion.nav
                key="nav-links"
                initial={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                className="hidden lg:flex items-center gap-0 bg-white/30 dark:bg-white/5 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/50 dark:border-white/10 shadow-inner"
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
                          ? "bg-white dark:bg-white text-[#0145F2] dark:text-black shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-white/80"
                          : "text-slate-600 dark:text-slate-300 hover:text-navy dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10"
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
                  <Sparkles className="h-4 w-4 text-[#0145F2] dark:text-sky-400 opacity-80" />
                </div>
                <input
                  type="text"
                  placeholder="Buscá por marca, modelo, o necesidad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/40 dark:bg-white/5 backdrop-blur-md hover:bg-white/60 dark:hover:bg-white/10 border border-white/60 dark:border-white/10 text-navy dark:text-white text-xs font-bold rounded-full pl-11 pr-12 py-3 outline-none focus:bg-white/80 dark:focus:bg-white/15 focus:ring-4 focus:ring-[#0145F2]/15 dark:focus:ring-sky-400/15 focus:border-[#0145F2]/40 dark:focus:border-sky-400/40 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] placeholder:text-slate-400 placeholder:font-medium"
                />
                <button
                  type="submit"
                  className="absolute inset-y-1.5 right-1.5 bg-[#0145F2] hover:bg-blue-600 dark:hover:bg-blue-500 text-white p-2 rounded-full transition-all shadow-[0_2px_10px_rgba(1,69,242,0.3)] active:scale-95"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* ================= COLUMNA DERECHA: ACCIONES ================= */}
        <div className="flex items-center gap-0 md:gap-3 justify-end shrink-0">
          <Link
            href="/favoritos"
            className="hidden lg:flex relative p-2.5 text-slate-500 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 rounded-full transition-all"
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
              <span className="absolute top-1 right-1 bg-gradient-to-br from-red-400 to-red-600 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white/80 dark:border-black/40 shadow-sm">
                {favCount}
              </span>
            )}
          </Link>

          <Link
            href="/cotizador"
            className="hidden lg:flex items-center gap-2 bg-[#0145F2] hover:bg-blue-600 dark:hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(1,69,242,0.3)] shrink-0 relative overflow-hidden group"
          >
            <span className="absolute inset-0 w-[150%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]"></span>
            Cotizá Tu Usado <ChevronRight className="w-4 h-4" />
          </Link>

          <button
            onClick={toggleSearchMobile}
            className="lg:hidden p-2.5 text-primary dark:text-sky-300 bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-full shadow-sm"
            title="Buscar"
          >
            <Search className="w-3.5 h-3.5 md:w-5 md:h-5" />
          </button>

          <button
            onClick={toggleMenu}
            className="lg:hidden p-2.5 text-navy dark:text-white hover:bg-white/60 dark:hover:bg-white/10 rounded-full transition-all ml-[-2]"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ================= BUSCADOR MÓVIL ================= */}
      <AnimatePresence>
        {isSearchMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/70 dark:bg-black/80 backdrop-blur-3xl border-t border-white/60 dark:border-white/10 overflow-hidden absolute w-full z-10"
          >
            <form onSubmit={handleSearch} className="p-4 relative">
              <input
                type="text"
                placeholder="¿Qué auto buscás?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/80 dark:border-white/15 text-navy dark:text-white text-sm font-bold rounded-2xl pl-12 pr-4 py-3.5 outline-none"
                autoFocus
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MENÚ HAMBURGUESA MÓVIL (NUEVO DISEÑO NATIVO) ================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-[#0a0a0f] border-t border-slate-200 dark:border-white/5 shadow-2xl absolute w-full left-0 z-10 overflow-hidden"
          >
            {/* Se agrega un padding top leve para darle aire respecto a elementos flotantes externos (como el botón de dark mode) */}
            <div className="flex flex-col pt-4 pb-6 px-6">
              
              {/* Lista de navegación principal */}
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between py-4 text-navy dark:text-white group"
                  >
                    <div className="flex items-center gap-4">
                      {link.icon && (
                        <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-[#0145F2] dark:text-sky-400 group-hover:bg-[#0145F2] group-hover:text-white transition-colors">
                          <link.icon className="w-[18px] h-[18px]" />
                        </div>
                      )}
                      <span className="font-black uppercase tracking-widest text-[12px]">
                        {link.name}
                      </span>
                      {link.badge && (
                        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm ml-1">
                          {link.badge}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#0145F2] dark:group-hover:text-sky-400 transition-colors" />
                  </Link>
                ))}

                {/* Sección Favoritos */}
                <Link
                  href="/favoritos"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between py-4 text-navy dark:text-white group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${favCount > 0 ? "bg-red-50 dark:bg-red-500/10 text-red-500" : "bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500"}`}>
                      <Heart className={`w-[18px] h-[18px] ${favCount > 0 ? "fill-red-500" : ""}`} />
                    </div>
                    <span className="font-black uppercase tracking-widest text-[12px] flex items-center gap-2">
                      Mis Favoritos
                      {favCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                          {favCount}
                        </span>
                      )}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-red-500 transition-colors" />
                </Link>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}