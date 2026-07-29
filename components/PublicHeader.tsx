"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Heart, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const pathname = usePathname();

  // Función para leer los favoritos del localStorage
  const updateFavCount = () => {
    const favs = JSON.parse(localStorage.getItem("pfaffen_favs") || "[]");
    setFavCount(favs.length);
  };

  useEffect(() => {
    updateFavCount();
    // Actualizamos el contador cada vez que el usuario navega
  }, [pathname]);

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Catálogo", href: "/catalogo" },
    { name: "Marcas", href: "/marcas" },
    { name: "Outlet", href: "/outlet", badge: "Ofertas" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all">
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
            className="absolute -top-1 -right-3 md:-right-4 w-2.5 h-2.5 object-contain opacity-80"
          />
        </Link>

        {/* NAVEGACIÓN DESKTOP */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname?.startsWith(link.href));

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
        </nav>

        {/* ACCIONES (Favoritos + Cotizador) */}
        <div className="flex items-center gap-2 md:gap-4">
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
            className="hidden lg:flex items-center gap-2 bg-navy hover:bg-[#0145F2] text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-colors shadow-md hover:shadow-lg active:scale-95"
          >
            Cotizar Usado <ChevronRight className="w-4 h-4" />
          </Link>

          {/* MENÚ HAMBURGUESA (Móvil) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-navy hover:bg-slate-100 rounded-full transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MENÚ MÓVIL PANTALLA COMPLETA */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 shadow-xl overflow-hidden"
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
