"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, CarFront, Zap, Users, Lightbulb, Grid, Wand2 } from "lucide-react";
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
    <section className="relative w-full pt-16 pb-20 md:pt-24 md:pb-28 bg-gradient-to-b from-slate-50 via-white to-slate-100/50 overflow-hidden border-b border-gray-200/80">
      
      {/* Luz ambiental corporativa minimalista (Efecto glow difuminado de fondo) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 flex flex-col items-center text-center">
        
        {/* Etiqueta de confianza limpia */}
        <span className="bg-sky-50 text-primary font-bold text-[10px] md:text-[11px] uppercase tracking-wide px-4 py-1.5 rounded-full mb-6 shadow-sm border border-sky-100 backdrop-blur-sm">
          +3000 personas ya confiaron en nosotros
        </span>

        {/* Título principal con tipografía sólida */}
        <h1 className="text-3xl md:text-5xl lg:text-[54px] text-navy leading-[1.1] mb-8 font-light tracking-tight">
          La forma más <strong className="font-black text-primary">fácil</strong><br className="hidden md:block"/>
          de <strong className="font-black">comprar o vender</strong><br className="hidden md:block"/>
          tu auto
        </h1>

        {/* ================= BUSCADOR MINIMALISTA PROFESIONAL ================= */}
        <form 
          onSubmit={handleSearch}
          className="w-full max-w-[42rem] bg-white rounded-2xl md:rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-gray-200/80 p-2 md:p-2.5 flex flex-col md:flex-row items-center gap-2 mb-8 relative overflow-hidden transition-all focus-within:border-primary/50 focus-within:shadow-[0_10px_40px_rgba(14,165,233,0.15)] group"
        >
          {/* Destello sutil al hacer hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-sky-50/30 via-transparent to-blue-50/30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="flex items-center w-full px-3 py-2 md:py-1 relative z-10">
            <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
            <input 
              type="text"
              placeholder="Describí el auto que buscás (Ej: SUV automática...)"
              className="w-full bg-transparent border-none outline-none text-navy placeholder:text-gray-400 text-sm md:text-base font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Botón de búsqueda con IA corporativo */}
          <button 
            type="submit"
            className="flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white p-3 md:px-6 md:py-3 rounded-xl md:rounded-full transition-all shadow-md shrink-0 w-full md:w-auto z-10"
          >
            <span className="hidden md:block text-xs font-bold uppercase tracking-widest">Buscar con IA</span>
            <Wand2 className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </form>

        {/* PASTILLAS DE ACCESO RÁPIDO */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 max-w-[42rem]">
          <Pill icon={<CarFront className="w-4 h-4 text-gray-500"/>} text="SUVs" />
          <Pill icon={<CarFront className="w-4 h-4 text-gray-500"/>} text="Sedanes" />
          <Pill icon={<CarFront className="w-4 h-4 text-gray-500"/>} text="Pick-ups" />
          <Pill icon={<Zap className="w-4 h-4 text-sky-500" fill="currentColor"/>} text="Híbridos y eléctricos" />
          <Pill icon={<Users className="w-4 h-4 text-emerald-500" fill="currentColor"/>} text="Asesoría" colorClass="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200" />
          <Pill icon={<Lightbulb className="w-4 h-4 text-purple-500" fill="currentColor"/>} text="Recomendador" colorClass="text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200" />
          <Pill icon={<Grid className="w-4 h-4 text-cyan-600"/>} text="Catálogo" colorClass="text-cyan-800 bg-cyan-100 hover:bg-cyan-200 border-cyan-200" href="/catalogo" />
        </div>

      </div>
    </section>
  );
}

function Pill({ icon, text, colorClass = "text-gray-600 bg-white hover:bg-gray-50 border-gray-200/60", href = "/catalogo" }: { icon: React.ReactNode, text: string, colorClass?: string, href?: string }) {
  return (
    <Link href={href} className={`border shadow-sm rounded-full px-4 py-2 md:py-2.5 flex items-center gap-2 text-[11px] md:text-sm font-bold transition-all hover:-translate-y-0.5 ${colorClass}`}>
      {icon}
      <span>{text}</span>
    </Link>
  );
}