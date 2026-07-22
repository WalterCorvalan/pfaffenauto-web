import Link from "next/link";
import { Montserrat } from "next/font/google";

// 1. Cargamos Montserrat: ideal para diseño premium, limpio y muy espaciado
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500"] });

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* NAVBAR FIJO */}
      <header className="absolute top-0 w-full z-50 bg-gradient-to-b from-black/60 to-transparent pt-8 pb-6 px-6 md:px-12 flex justify-between items-center">
        
        {/* Contenedor del Logo (Le damos z-10 para que quede encima) */}
        <Link href="/" className="flex items-center group relative z-10">
          <div className="relative inline-block transform group-hover:scale-105 transition-transform duration-500">
            <img 
              src="/logo.png" 
              alt="Pfaffen Autos" 
              className="h-8 md:h-10 w-auto invert brightness-0 drop-shadow-md" 
            />
            <img 
              src="/r.png" 
              alt="Marca Registrada" 
              className="absolute -top-1 -right-5 w-3.5 h-3.5 object-contain invert brightness-0 drop-shadow-sm" 
            />
          </div>
        </Link>

        {/* Menú de navegación ABSOLUTAMENTE CENTRADO para que coincida con el Hero */}
        <nav className={`hidden lg:flex absolute left-1/2 -translate-x-1/2 gap-8 xl:gap-10 uppercase text-[12px] font-medium tracking-[0.25em] text-white/80 items-center ${montserrat.className}`}>
          
          <Link href="#contacto" className="relative group py-2">
            <span className="group-hover:text-white transition-colors duration-300">Vende tu auto</span>
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#3b82f6] group-hover:w-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.8)] opacity-0 group-hover:opacity-100"></span>
          </Link>
          
          <Link href="#stock" className="relative group py-2">
            <span className="group-hover:text-white transition-colors duration-300">Compra tu auto</span>
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#3b82f6] group-hover:w-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.8)] opacity-0 group-hover:opacity-100"></span>
          </Link>
          
          <Link href="#contacto" className="relative group py-2">
            <span className="group-hover:text-white transition-colors duration-300">Financiá tu auto</span>
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#3b82f6] group-hover:w-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.8)] opacity-0 group-hover:opacity-100"></span>
          </Link>
          
          <Link href="#stock" className="relative group py-2">
            <span className="group-hover:text-white transition-colors duration-300">Outlet de autos</span>
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#3b82f6] group-hover:w-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.8)] opacity-0 group-hover:opacity-100"></span>
          </Link>
          
          <Link href="#nosotros" className="relative group py-2">
            <span className="group-hover:text-white transition-colors duration-300">Nosotros</span>
            <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#3b82f6] group-hover:w-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.8)] opacity-0 group-hover:opacity-100"></span>
          </Link>
        </nav>

        {/* Icono de menú hamburguesa (Le damos z-10) */}
        <div className="flex items-center relative z-10">
          <button className="text-white hover:text-[#3b82f6] transition-colors p-2 focus:outline-none group">
            <svg className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16"></path>
            </svg>
          </button>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}