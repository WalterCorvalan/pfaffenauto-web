"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  const isPanel = pathname?.startsWith("/panel");

  const socials = [
    {
      name: "WhatsApp",
      href: "https://wa.me/5491121907000",
      path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z",
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/pfaffenautomotores/",
      path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
    },
    {
      name: "Facebook",
      href: "https://facebook.com",
      path: "M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.37 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.582 9 4.75V8z",
    },
    {
      name: "Mercado Libre",
      href: "https://www.mercadolibre.com.ar",
      path: "M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3.125 17.518c-1.396 0-2.483-.418-3.262-1.254-.779-.836-1.168-1.996-1.168-3.48v-2.002h2.234v2.002c0 .762.207 1.34.62 1.734.414.394.974.591 1.678.591.704 0 1.264-.197 1.678-.591.413-.394.62-.972.62-1.734v-2.002h2.234v2.002c0 1.484-.389 2.644-1.168 3.48-.779.836-1.866 1.254-3.262 1.254zm-4.717-9.522v-2.234h6.318v2.234h-6.318z",
    },
    {
      name: "TikTok",
      href: "https://tiktok.com",
      path: "M19.589 6.686a4.793 4.793 0 0 1-3.77-4.242V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.144-4.53v-3.49a6.341 6.341 0 0 0-6.035 6.347 6.342 6.342 0 0 0 6.67 6.331 6.344 6.344 0 0 0 5.955-6.331V9.08a8.17 8.17 0 0 0 4.634 1.446V7.082a4.816 4.816 0 0 1-1.002-.396z",
    },
    {
      name: "YouTube",
      href: "https://youtube.com",
      path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    },
  ];

  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-32 md:pb-10 relative overflow-hidden flex flex-col">
      {/* Marca de agua gigante de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0">
        <span className="text-[12vw] font-black text-white/[0.015] uppercase tracking-tighter whitespace-nowrap flex items-center justify-center">
          Pfaffen <span className="text-[4vw] ml-4 text-white/[0.015]">®</span>
        </span>
      </div>

      {/* Resplandor inferior */}
      <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-[#0145F2]/5 to-transparent pointer-events-none z-0"></div>

      <div className="max-w-[85rem] mx-auto px-6 w-full grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10 mb-16">
        {/* COLUMNA 1: Identidad de Marca y Redes */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <Link
            href="/"
            className="group relative inline-block mb-6 transform hover:scale-105 transition-transform duration-500"
          >
            <img
              src="/logo.png"
              alt="Pfaffen Autos"
              className="h-8 md:h-10 w-auto invert brightness-0 drop-shadow-lg"
            />
            <img
              src="/r.png"
              alt="Marca Registrada"
              className="absolute -top-1 -right-5 w-3 h-3 object-contain invert brightness-0 drop-shadow-sm opacity-80"
            />
          </Link>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] leading-loose max-w-[280px] font-medium mb-7">
            Especialistas en vehículos de alta gama y unidades 0KM seleccionadas
            con los más altos estándares.
          </p>

          {/* REDES SOCIALES — bajo perfil, monocromo, mismo color de marca */}
          <div className="flex items-center gap-2">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                title={s.name}
                className="w-9 h-9 flex items-center justify-center rounded-full text-gray-600 hover:text-[#0145F2] hover:bg-[#EDF1F5]/[0.06] transition-colors duration-200"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* COLUMNA 2: Contacto y Horarios */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right">
          <h4 className="text-white font-black uppercase tracking-[0.25em] text-[10px] mb-8 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0145F2] animate-pulse hidden md:block"></span>
            Atención al Cliente
          </h4>

          <div className="mb-8">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 font-medium">
              Lun a Sáb:{" "}
              <span className="text-white font-bold ml-1">9:00 - 19:00hs</span>
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
              Domingos:{" "}
              <span className="text-gray-600 font-bold ml-1">Cerrado</span>
            </p>
          </div>

          <a
            href="https://wa.me/5491121907000"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-white/5 hover:bg-[#0145F2] text-white border border-white/10 hover:border-[#0145F2] text-[9px] font-black uppercase tracking-[0.2em] px-6 py-3.5 rounded-full transition-all duration-500 hover:-translate-y-1 backdrop-blur-sm"
          >
            <Phone className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
            <span>WhatsApp Oficial</span>
          </a>
        </div>
      </div>

      {/* LÍNEA DIVISORIA Y COPYRIGHT */}
      <div className="max-w-[85rem] mx-auto px-6 w-full relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/5">
        <p className="text-[9px] text-gray-600 uppercase tracking-[0.25em] font-medium">
          © {new Date().getFullYear()} Pfaffen Autos. Todos los derechos
          reservados.
        </p>

        <div className="flex flex-wrap justify-center items-center gap-3 text-[9px] text-gray-600 uppercase tracking-[0.2em] font-medium">
          <a href="#" className="hover:text-white transition-colors">
            Términos
          </a>
          <span className="text-gray-800">|</span>
          <a href="#" className="hover:text-white transition-colors">
            Privacidad
          </a>
          <span className="text-gray-800">|</span>

          {isPanel ? (
            <Link href="/" className="text-[#0145F2] hover:text-[#5fa1ec] font-black transition-colors">
              Volver a la Web
            </Link>
          ) : (
            <Link href="/panel" className="text-gray-600 hover:text-[#0145F2] font-black transition-colors">
              Acceso Staff
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}