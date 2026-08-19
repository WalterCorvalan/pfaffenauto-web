"use client";

import { useState, MouseEvent } from "react";
import Link from "next/link";
import { Search, CarFront, Zap, Users, Grid, Wand2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

// ================= VALORES FIJOS PARA EVITAR HYDRATION MISMATCH =================
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
      className="relative w-full pt-20 pb-24 md:pt-32 md:pb-32 overflow-hidden flex flex-col items-center justify-center border-b border-gray-400 dark:border-white/10 bg-[#0a0a0f]"
    >

      {/* ================= VIDEO DE FONDO ================= */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 dark:opacity-70"
      >
        {/* Asegurate de tener este archivo en tu carpeta public/ */}
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

      {/* Capa de cristal (Overlay) para mantener la legibilidad de los textos */}
      <div className="absolute inset-0 bg-[#F8FAFC]/75 dark:bg-black/70 backdrop-blur-[3px] z-0"></div>


      {/* ================= EFECTOS ADICIONALES ================= */}
      
      {/* 1. Spotlight interactivo (Sigue al mouse) */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(1, 69, 242, 0.12),
              transparent 80%
            )
          `,
        }}
      />

      {/* 2. Grilla arquitectónica ultra sutil superpuesta al video */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_70%,transparent_100%)] z-0 opacity-50 dark:opacity-40"></div>

      {/* 3. Líneas de velocidad */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {speedTrails.map((trail, i) => (
          <motion.div
            key={i}
            className="absolute h-[1px] bg-gradient-to-r from-transparent via-[#0145F2]/40 dark:via-sky-400/50 to-transparent"
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
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 flex flex-col items-center text-center">
        
        {/* Etiqueta animada */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/80 dark:border-white/15 text-navy dark:text-white font-bold text-[10px] md:text-[11px] uppercase tracking-widest px-5 py-2 rounded-full mb-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 dark:bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 dark:bg-sky-400"></span>
          </span>
          Compra o Vende tu auto en el momento
        </motion.div>

        {/* Título Monumental */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-[72px] text-navy dark:text-white leading-[1.05] mb-10 font-light tracking-tighter drop-shadow-sm"
        >
          La forma mas<br className="font-black hidden md:block"/>
          confiable de comprar o vender<span className="font-black bg-clip-text text-transparent bg-gradient-to-r from-[#0145F2] to-sky-500 dark:from-sky-400 dark:to-blue-300"> TU AUTO</span>
        </motion.h1>

        {/* ================= BUSCADOR ESPACIAL (GLASSMORPHISM) ================= */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSearch}
          className="w-full max-w-3xl bg-white/70 dark:bg-white/5 backdrop-blur-3xl rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] border border-white dark:border-white/10 p-2 flex flex-col md:flex-row items-center gap-2 mb-10 group transition-all hover:bg-white/90 dark:hover:bg-white/10"
        >
          <div className="flex items-center w-full px-4 py-3 md:py-2 relative z-10">
            <Search className="w-6 h-6 text-primary dark:text-sky-400 mr-4 shrink-0" />
            <input
              type="text"
              placeholder="Ej: SUV automática blanca..."
              className="w-full bg-transparent border-none outline-none text-navy dark:text-white placeholder:text-gray-500 dark:placeholder:text-slate-400 text-base md:text-lg font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-navy dark:bg-[#0145F2] hover:bg-[#0145F2] dark:hover:bg-blue-500 text-white p-4 md:px-8 md:py-4 rounded-2xl transition-all shadow-lg shrink-0 w-full md:w-auto z-10 cursor-pointer overflow-hidden relative"
          >
            {/* Efecto de brillo interior en el botón */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-[150%] group-hover:translate-x-[250%] transition-transform duration-700 ease-out"></div>
            
            <span className="text-sm font-black uppercase tracking-widest relative z-10">Buscar</span>
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
          <Pill icon={<CarFront className="w-4 h-4"/>} text="SUVs" href="/catalogo?q=SUV" />
          <Pill icon={<CarFront className="w-4 h-4"/>} text="Sedanes" href="/catalogo?q=Sedan" />
          <Pill icon={<CarFront className="w-4 h-4" />} text="Pick-ups" href="/catalogo?q=Pick-up" />
          <Pill icon={<Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" fill="currentColor"/>} text="Híbridos / Eléctricos" href="/catalogo?q=Hibrido" />
          <div className="w-full h-2 md:hidden"></div> {/* Break en móvil */}
          <Pill icon={<Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />} text="Consignar Mi Auto" borderClass="border-white dark:border-emerald-400/20 bg-emerald-50/80 dark:bg-emerald-400/10 hover:bg-emerald-100/90 dark:hover:bg-emerald-400/20 text-emerald-900 dark:text-emerald-300" href="/consignacion" />
          {/* Pill de 0KM renovada con estilo exclusivo */}
          <Pill
            icon={<CarFront className="w-4 h-4 text-amber-400 dark:text-amber-300" fill="currentColor"/>}
            text="0KM"
            borderClass="border-gray-900 dark:border-white/20 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-slate-200 shadow-md"
            href="/catalogo?q=0km"
          />
          <Pill icon={<Grid className="w-4 h-4 text-[#0145F2] dark:text-sky-300"/>} text="Ver Catálogo" borderClass="border-white dark:border-sky-400/20 bg-blue-50/80 dark:bg-sky-400/10 hover:bg-blue-100/90 dark:hover:bg-sky-400/20 text-[#0145F2] dark:text-sky-300" href="/catalogo" />
        </motion.div>

      </div>
    </section>
  );
}

// Componente Pill actualizado
function Pill({ icon, text, borderClass = "border-white dark:border-white/15 bg-white/60 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 text-navy dark:text-white", href = "/catalogo" }: { icon: React.ReactNode, text: string, borderClass?: string, href?: string }) {
  return (
    <Link href={href}>
      <div className={`backdrop-blur-md border shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] rounded-2xl px-5 py-3 flex items-center gap-2.5 text-[13px] font-black tracking-wide transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${borderClass}`}>
        {icon}
        <span>{text}</span>
      </div>
    </Link>
  );
}