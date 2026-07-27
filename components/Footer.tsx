"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "lucide-react"; // Dejamos solo el teléfono que sí es un ícono de UI

export default function Footer() {
  const pathname = usePathname();
  
  // Detectamos si estamos adentro del panel
  const isPanel = pathname?.startsWith("/panel");

  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-32 md:pb-10 relative overflow-hidden flex flex-col">
      
      {/* Marca de agua gigante de fondo (Estilo Lujo) */}
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
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] leading-loose max-w-[280px] font-medium mb-6">
            Especialistas en vehículos de alta gama y unidades 0KM seleccionadas
            con los más altos estándares.
          </p>

          {/* REDES SOCIALES (SVGs Nativos) */}
          <div className="flex items-center gap-3">
            {/* INSTAGRAM */}
            <a href="#" className="p-3 bg-white/5 hover:bg-[#0145F2] text-gray-400 hover:text-white border border-white/5 hover:border-[#0145F2] rounded-full transition-all duration-300 hover:-translate-y-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
              </svg>
            </a>
            
            {/* FACEBOOK */}
            <a href="#" className="p-3 bg-white/5 hover:bg-[#0145F2] text-gray-400 hover:text-white border border-white/5 hover:border-[#0145F2] rounded-full transition-all duration-300 hover:-translate-y-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            
            {/* YOUTUBE */}
            <a href="#" className="p-3 bg-white/5 hover:bg-[#0145F2] text-gray-400 hover:text-white border border-white/5 hover:border-[#0145F2] rounded-full transition-all duration-300 hover:-translate-y-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path>
                <path d="m10 15 5-3-5-3z"></path>
              </svg>
            </a>
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
            className="group flex items-center gap-3 bg-white/5 hover:bg-[#25D366] text-white border border-white/10 hover:border-[#25D366] text-[9px] font-black uppercase tracking-[0.2em] px-6 py-3.5 rounded-full transition-all duration-500 hover:shadow-[0_0_25px_rgba(37,211,102,0.4)] hover:-translate-y-1 backdrop-blur-sm"
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
            <Link href="/panel" className="text-blue-600 hover:text-[#0145F2] font-black transition-colors">
              Acceso Staff
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}