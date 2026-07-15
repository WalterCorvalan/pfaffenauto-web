"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, CarFront } from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Catálogo", href: "/catalogo" },
    { name: "Sucursales", href: "/sucursales" },
    { name: "Nosotros", href: "/nosotros" },
    { name: "Contacto", href: "/contacto" },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <CarFront className="w-8 h-8 text-[#0055A4] group-hover:text-[#1E6FD9] transition-colors" />
            <span className="text-[#F5F5F3] font-serif text-2xl tracking-wide">
              PFAFFEN<span className="text-[#0055A4] font-sans font-bold text-sm ml-1">AUTOS</span>
            </span>
          </Link>

          {/* Menú Desktop */}
          <nav className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[#F5F5F3] hover:text-[#0055A4] transition-colors text-sm font-medium tracking-wide"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Botón Menú Mobile */}
          <button
            className="md:hidden text-[#F5F5F3]"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menú Desplegable Mobile */}
      {isOpen && (
        <div className="md:hidden bg-[#1A1A1A] border-b border-white/10">
          <div className="px-4 pt-2 pb-6 space-y-2 flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-3 text-[#F5F5F3] hover:bg-[#0A0A0A] hover:text-[#0055A4] rounded-md transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}