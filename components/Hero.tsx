"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Settings2, CarFront, Zap, Users, Lightbulb, Grid } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/catalogo?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <section className="relative w-full pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-[#4bcff2] via-[#81e2f6] to-[#d6f5fb] overflow-hidden border-b border-gray-200">
      
      {/* Patrón de Cuadrícula (la clase bg-grid-pattern se definió en globals.css) */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 flex flex-col items-center text-center">
        
        {/* Etiqueta Social Proof (Amarilla) */}
        <span className="bg-yellow-100/90 text-yellow-700 font-bold text-[10px] md:text-[11px] uppercase tracking-wide px-4 py-1.5 rounded-full mb-6 shadow-sm border border-yellow-300 backdrop-blur-sm">
          +52.300 personas ya cotizaron
        </span>

        {/* Título Principal (Combinando textos finos y gruesos) */}
        <h1 className="text-3xl md:text-5xl lg:text-[54px] text-navy leading-[1.1] mb-8 font-light tracking-tight">
          <strong className="font-black">Comprá</strong> tu 0km,<br className="hidden md:block"/>
          de <strong className="font-black">concesionario oficial</strong>,<br className="hidden md:block"/>
          sin llamar a ninguno
        </h1>

        {/* ================= BARRA DE BÚSQUEDA BLANCA ================= */}
        <form 
          onSubmit={handleSearch}
          className="w-full max-w-[40rem] bg-white rounded-xl md:rounded-full shadow-xl p-1.5 md:p-2 flex flex-col md:flex-row items-center gap-2 mb-8 border border-gray-100"
        >
          <div className="flex items-center w-full px-3 py-2 md:py-1">
            <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
            <input 
              type="text"
              placeholder="Buscá por marca, modelo o versión"
              className="w-full bg-transparent border-none outline-none text-navy placeholder:text-gray-400 text-sm md:text-base font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Botón de Filtros Naranja */}
          <button 
            type="button"
            className="hidden md:flex items-center justify-center p-3 hover:bg-orange-50 rounded-full transition-colors shrink-0 group"
          >
            <Settings2 className="w-5 h-5 text-orange-500 group-hover:text-orange-600" strokeWidth={2.5} />
          </button>
        </form>

        {/* ================= PASTILLAS DE ACCESO RÁPIDO (PILLS) ================= */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 max-w-[42rem]">
          {/* Categorías Standard (Blancas) */}
          <Pill icon={<CarFront className="w-4 h-4 text-gray-500"/>} text="SUVs" />
          <Pill icon={<CarFront className="w-4 h-4 text-gray-500"/>} text="Sedanes" />
          <Pill icon={<CarFront className="w-4 h-4 text-gray-500"/>} text="Pick-ups" />
          
          {/* Especiales (Colores Pastel) */}
          <Pill 
            icon={<Zap className="w-4 h-4 text-sky-500" fill="currentColor"/>} 
            text="Híbridos y eléctricos" 
          />
          <Pill 
            icon={<Users className="w-4 h-4 text-emerald-500" fill="currentColor"/>} 
            text="Asesoría" 
            colorClass="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200" 
          />
          <Pill 
            icon={<Lightbulb className="w-4 h-4 text-purple-500" fill="currentColor"/>} 
            text="Recomendador" 
            colorClass="text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200" 
          />
          <Pill 
            icon={<Grid className="w-4 h-4 text-cyan-600"/>} 
            text="Catálogo" 
            colorClass="text-cyan-800 bg-cyan-100 hover:bg-cyan-200 border-cyan-200" 
            href="/catalogo"
          />
        </div>

      </div>
    </section>
  );
}

// Componente interno para las pastillas
function Pill({ 
  icon, 
  text, 
  colorClass = "text-gray-600 bg-white hover:bg-gray-50 border-white", 
  href = "/catalogo" 
}: { 
  icon: React.ReactNode, 
  text: string, 
  colorClass?: string,
  href?: string
}) {
  return (
    <Link 
      href={href} 
      className={`border shadow-sm rounded-full px-4 py-2 md:py-2.5 flex items-center gap-2 text-[11px] md:text-sm font-bold transition-all hover:-translate-y-0.5 ${colorClass}`}
    >
      {icon}
      <span>{text}</span>
    </Link>
  );
}