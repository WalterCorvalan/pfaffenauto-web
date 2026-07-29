"use client";

import { useState, MouseEvent } from "react";
import Link from "next/link";
import { Search, CarFront, Zap, Users, Lightbulb, Grid, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

// ================= VALORES FIJOS PARA EVITAR HYDRATION MISMATCH =================
// Estos valores simulan aleatoriedad pero son constantes, así el servidor y el cliente renderizan lo mismo.
const speedTrails = [
  { top: 15, width: 45, duration: 5.2, delay: 1.2 },
  { top: 25, width: 28, duration: 7.1, delay: 3.5 },
  { top: 35, width: 35, duration: 4.5, delay: 0.5 },
  { top: 45, width: 50, duration: 6.8, delay: 2.1 },
  { top: 55, width: 22, duration: 5.9, delay: 4.2 },
  { top: 65, width: 38, duration: 7.5, delay: 1.8 },
  { top: 75, width: 42, duration: 4.8, delay: 0.2 },
  { top: 85, width: 31, duration: 6.2, delay: 2.9 },
];

export default function Hero() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // ================= LÓGICA DEL FOCO INTERACTIVO (SPOTLIGHT) =================
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/catalogo?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <section 
      onMouseMove={handleMouseMove}
      className="relative w-full pt-20 pb-24 md:pt-32 md:pb-32 bg-[#F8FAFC] overflow-hidden flex flex-col items-center justify-center border-b border-gray-200/50"
    >
      
      {/* ================= EFECTOS DE FONDO ================= */}
      
      {/* 1. Spotlight interactivo (Sigue al mouse) */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(0, 85, 164, 0.07),
              transparent 80%
            )
          `,
        }}
      />

      {/* 2. Grilla arquitectónica ultra sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_70%,transparent_100%)] z-0 opacity-60"></div>

      {/* 3. Líneas de velocidad (Mapeadas desde el array estático) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {speedTrails.map((trail, i) => (
          <motion.div
            key={i}
            className="absolute h-[1px] bg-gradient-to-r from-transparent via-[#0055A4]/30 to-transparent"
            style={{
              top: `${trail.top}%`,
              width: `${trail.width}%`,
              left: "-50%",
            }}
            animate={{
              x: ["0vw", "200vw"],
            }}
            transition={{
              duration: trail.duration,
              repeat: Infinity,
              ease: "linear",
              delay: trail.delay,
            }}
          />
        ))}
      </div>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 flex flex-col items-center text-center">
        
        {/* Etiqueta animada */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-white/40 backdrop-blur-md border border-white/60 text-navy font-bold text-[10px] md:text-[11px] uppercase tracking-widest px-5 py-2 rounded-full mb-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          La nueva era de la movilidad
        </motion.div>

        {/* Título Monumental */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-[72px] text-navy leading-[1.05] mb-10 font-light tracking-tighter"
        >
          La forma mas<br className="hidden md:block"/>
          confiable de comprar o vender<span className="font-black bg-clip-text text-transparent bg-gradient-to-r from-[#0055A4] to-sky-400"> TU AUTO</span>
        </motion.h1>

        {/* ================= BUSCADOR ESPACIAL (GLASSMORPHISM) ================= */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSearch}
          className="w-full max-w-3xl bg-white/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white p-2 flex flex-col md:flex-row items-center gap-2 mb-10 group transition-all hover:bg-white/80"
        >
          <div className="flex items-center w-full px-4 py-3 md:py-2 relative z-10">
            <Search className="w-6 h-6 text-primary mr-4 shrink-0" />
            <input 
              type="text"
              placeholder="Ej: SUV automática blanca..."
              className="w-full bg-transparent border-none outline-none text-navy placeholder:text-gray-400/80 text-base md:text-lg font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            type="submit"
            className="flex items-center justify-center gap-2 bg-navy hover:bg-[#0055A4] text-white p-4 md:px-8 md:py-4 rounded-2xl transition-all shadow-lg shrink-0 w-full md:w-auto z-10 cursor-pointer overflow-hidden relative"
          >
            {/* Efecto de brillo interior en el botón */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-[150%] group-hover:translate-x-[250%] transition-transform duration-700 ease-out"></div>
            
            <span className="text-sm font-black uppercase tracking-widest relative z-10">Encontrar</span>
            <Wand2 className="w-5 h-5 relative z-10" />
          </button>
        </motion.form>

        {/* ================= PASTILLAS MAGNÉTICAS ================= */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 max-w-[48rem]"
        >
          <Pill icon={<CarFront className="w-4 h-4"/>} text="SUVs" />
          <Pill icon={<CarFront className="w-4 h-4"/>} text="Sedanes" />
          <Pill icon={<CarFront className="w-4 h-4"/>} text="Pick-ups" />
          <Pill icon={<Zap className="w-4 h-4 text-amber-500" fill="currentColor"/>} text="Híbridos / Eléctricos" />
          <div className="w-full h-2 md:hidden"></div> {/* Break en móvil */}
          <Pill icon={<Users className="w-4 h-4 text-emerald-500"/>} text="Consignar Mi Auto" borderClass="border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/80 text-emerald-800" href="/cotizador" />
          <Pill icon={<Grid className="w-4 h-4 text-blue-500"/>} text="Ver Catálogo" borderClass="border-blue-200 bg-blue-50/50 hover:bg-blue-100/80 text-blue-800" href="/catalogo" />
        </motion.div>

      </div>
    </section>
  );
}

// Componente Pill actualizado al estilo Glassmorphism
function Pill({ icon, text, borderClass = "border-white bg-white/40 hover:bg-white/80 text-navy", href = "/catalogo" }: { icon: React.ReactNode, text: string, borderClass?: string, href?: string }) {
  return (
    <Link href={href}>
      <div className={`backdrop-blur-md border shadow-[0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl px-5 py-3 flex items-center gap-2.5 text-[13px] font-black tracking-wide transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${borderClass}`}>
        {icon}
        <span>{text}</span>
      </div>
    </Link>
  );
}