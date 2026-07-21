import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* NAVBAR FIJO */}
      <header className="absolute top-0 w-full z-50 bg-gradient-to-b from-black/80 to-transparent py-6 px-8 flex justify-between items-center">
        
        {/* Contenedor del Logo con la R posicionada arriba a la derecha */}
        <Link href="/" className="flex items-center">
          <div className="relative inline-block">
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

        {/* Menú de navegación alineado a la referencia */}
        <nav className="hidden lg:flex gap-8 uppercase text-[11px] font-bold tracking-[0.2em] text-gray-200 items-center">
          <Link href="#contacto" className="hover:text-[#3b82f6] transition-colors">Vende tu auto</Link>
          <Link href="#stock" className="hover:text-[#3b82f6] transition-colors">Compra tu auto</Link>
          <Link href="#contacto" className="hover:text-[#3b82f6] transition-colors">Financiá tu auto</Link>
          <Link href="#stock" className="hover:text-[#3b82f6] transition-colors">Outlet de autos</Link>
          <Link href="#nosotros" className="hover:text-[#3b82f6] transition-colors">Nosotros</Link>
        </nav>

        {/* Icono de menú hamburguesa (para versión mobile o estética de la referencia) */}
        <div className="flex items-center">
          <button className="text-white hover:text-[#3b82f6] transition-colors p-2 focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
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