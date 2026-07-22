import Link from "next/link";
import { Phone } from "lucide-react"; // Acordate de importar el ícono

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-10 relative overflow-hidden flex flex-col">
      {/* Marca de agua gigante de fondo (Estilo Lujo) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-evnts-none select-none z-0">
        <span className="text-[12vw] font-black text-white/[0.015] uppercase tracking-tighter whitespace-nowrap flex items-center justify-center">
          Pfaffen <span className="text-[4vw] ml-4 text-white/[0.015]">®</span>
        </span>
      </div>

      {/* Resplandor inferior */}
      <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-[#0145F2]/5 to-transparent pointer-events-none z-0"></div>

      <div className="max-w-[85rem] mx-auto px-6 w-full grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 relative z-10 mb-16">
        {/* COLUMNA 1: Identidad de Marca (Ocupa 4 columnas) */}
        <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
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
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] leading-loose max-w-[280px] font-medium">
            Especialistas en vehículos de alta gama y unidades 0KM seleccionadas
            con los más altos estándares.
          </p>
        </div>

        {/* COLUMNA 2: Enlaces Rápidos (Ocupa 4 columnas) */}
        <div className="md:col-span-4 flex flex-col items-center md:items-start">
          <h4 className="text-white font-black uppercase tracking-[0.25em] text-[10px] mb-8">
            Accesos Rápidos
          </h4>
          <nav className="flex flex-col gap-4 text-[10px] text-gray-400 uppercase tracking-widest font-medium">
            <a
              href="#stock"
              className="hover:text-white transition-colors flex items-center gap-3 group"
            >
              <span className="w-0 h-[1px] bg-[#0145F2] group-hover:w-4 transition-all duration-300"></span>
              Ver Catálogo
            </a>
            <a
              href="#contacto"
              className="hover:text-white transition-colors flex items-center gap-3 group"
            >
              <span className="w-0 h-[1px] bg-[#0145F2] group-hover:w-4 transition-all duration-300"></span>
              Cotizar Vehículo
            </a>
            <a
              href="#sucursales"
              className="hover:text-white transition-colors flex items-center gap-3 group"
            >
              <span className="w-0 h-[1px] bg-[#0145F2] group-hover:w-4 transition-all duration-300"></span>
              Nuestras Sucursales
            </a>
            <a
              href="#nosotros"
              className="hover:text-white transition-colors flex items-center gap-3 group"
            >
              <span className="w-0 h-[1px] bg-[#0145F2] group-hover:w-4 transition-all duration-300"></span>
              Sobre Nosotros
            </a>
          </nav>
        </div>

        {/* COLUMNA 3: Contacto y Horarios (Ocupa 4 columnas) */}
        <div className="md:col-span-4 flex flex-col items-center md:items-end text-center md:text-right">
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
            href="https://wa.me/5491100000000"
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

        <div className="flex items-center gap-4 text-[9px] text-gray-600 uppercase tracking-[0.2em] font-medium">
          <a href="#" className="hover:text-white transition-colors">
            Términos
          </a>
          <span className="text-gray-800">|</span>
          <a href="#" className="hover:text-white transition-colors">
            Privacidad
          </a>
        </div>
      </div>
    </footer>
  );
}
