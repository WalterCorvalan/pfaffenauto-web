"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isPanel = pathname?.startsWith("/panel");

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

  return (
    <footer className="bg-[#0b1329] border-t border-white/5 pt-16 pb-28 md:pb-10 relative overflow-hidden flex flex-col items-center">
      
      {/* Resplandor sutil de fondo */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#0145F2]/5 blur-[120px] pointer-events-none z-0 rounded-full"></div>

      <div className="max-w-4xl mx-auto px-6 w-full relative z-10 flex flex-col items-center">
        
        {/* LOGO CENTRADO CON LA "R" */}
        <Link 
          href="/" 
          className="group mb-8 relative inline-block transform hover:scale-105 transition-transform duration-500"
        >
          <img
            src="/logo.png"
            alt="Pfaffen Autos"
            className="h-7 md:h-8 w-auto invert brightness-0 drop-shadow-lg"
          />
          {/* Aquí agregamos la "R" */}
          <img
            src="/r.png"
            alt="Marca Registrada"
            className="absolute -top-1 -right-3 w-2.5 h-2.5 object-contain invert brightness-0 opacity-80"
          />
        </Link>

        {/* ENLACES PRINCIPALES (Inline) */}
        <nav className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 mb-10">
          <Link href="/catalogo" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Catálogo
          </Link>
          <Link href="/#sucursales" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Sucursales
          </Link>
          <Link href="/cotizador" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Cotizar Usado
          </Link>
          <Link href="/consignacion" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Consignación
          </Link>
          {isPanel ? (
            <Link href="/" className="text-sm font-medium text-[#0ea5e9] hover:text-[#38bdf8] transition-colors">
              Volver a la Web
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-medium text-[#0ea5e9] hover:text-[#38bdf8] transition-colors">
              Acceso Staff
            </Link>
          )}
        </nav>

        {/* LÍNEA DIVISORIA PUNTEADA */}
        <div className="w-full border-t border-dashed border-slate-700/50 mb-6"></div>

        {/* COPYRIGHT Y REDES SOCIALES (Alineados) */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <p className="text-xs text-slate-500 font-medium">
            © {new Date().getFullYear()} Pfaffen Autos. Todos los derechos reservados.
          </p>

          <div className="flex items-center gap-5">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                title={s.name}
                className="text-slate-400 hover:text-white hover:scale-110 transition-all duration-200"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
}