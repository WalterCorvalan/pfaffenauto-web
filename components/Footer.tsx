"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ArrowUp, ShieldCheck } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  const isPanel = pathname?.startsWith("/panel");

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const socials = [
    {
      name: "WhatsApp",
      href: "https://wa.me/5491121907000",
      path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.98 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z",
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/pfaffenautomotores/",
      path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
    },
    {
      name: "Facebook",
      href: "https://facebook.com/pfaffenautos",
      path: "M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.37 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.582 9 4.75V8z",
    },
    {
      name: "TikTok",
      href: "https://tiktok.com/@pfaffenautos",
      path: "M19.589 6.686a4.793 4.793 0 0 1-3.77-4.242V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.144-4.53v-3.49a6.341 6.341 0 0 0-6.035 6.347 6.342 6.342 0 0 0 6.67 6.331 6.344 6.344 0 0 0 5.955-6.331V9.08a8.17 8.17 0 0 0 4.634 1.446V7.082a4.816 4.816 0 0 1-1.002-.396z",
    },
  ];

  const links = [
    { label: "Catálogo de Autos", href: "/catalogo" },
    { label: "Nuestras Sucursales", href: "/#sucursales" },
    { label: "Cotizar mi Usado", href: "/cotizador" },
    { label: "Consignar Vehículo", href: "/consignacion" },
    { label: "Seguir mi Compra", href: "/seguimiento" },
    { label: "Nuestra Historia", href: "/nosotros" },
    { label: "Trabajá con nosotros", href: "/trabaja-con-nosotros" },
  ];

  const badges = [
    { value: "Data Fiscal", image: "/footer/data-fiscal.png" },
    { value: "Acceso a la Información Pública", image: "/footer/datos-publicos.jpg" },
    { value: "SSN", image: "/footer/ssn.png" },
  ];

  return (
    <footer className="bg-white border-t border-gray-200 relative overflow-hidden">

      {/* ================= COLUMNAS ================= */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">

          {/* Explorar */}
          <div>
            <h3 className="text-gray-900 text-[11px] font-black uppercase tracking-widest mb-5">Explorar</h3>
            <ul className="space-y-3.5">
              {links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-gray-500 hover:text-blue-600 text-sm font-bold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Redes */}
          <div>
            <h3 className="text-gray-900 text-[11px] font-black uppercase tracking-widest mb-5">Seguinos</h3>
            <div className="flex flex-col gap-3.5">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-gray-500 hover:text-blue-600 text-sm font-bold transition-colors"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d={s.path} />
                  </svg>
                  {s.name}
                </a>
              ))}
            </div>
          </div>

          {/* Respaldo Oficial */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-gray-900 text-[11px] font-black uppercase tracking-widest mb-5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Respaldo Oficial
            </h3>
            <div className="flex flex-wrap items-center gap-5">
              {badges.map((b) => (
                <Image key={b.value} src={b.image} alt={b.value} width={64} height={64} className="h-16 w-auto object-contain" />
              ))}
            </div>
          </div>

          {/* Acceso Staff */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-gray-900 text-[11px] font-black uppercase tracking-widest mb-5">Equipo</h3>
            {isPanel ? (
              <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-black transition-colors">
                Volver a la Web <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link href="/login" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-black transition-colors">
                Acceso Staff <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* ================= BOTTOM BAR ================= */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest text-center md:text-left">
            © {new Date().getFullYear()} Pfaffen Autos. Todos los derechos reservados.
          </p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors"
          >
            Volver arriba <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </footer>
  );
}
