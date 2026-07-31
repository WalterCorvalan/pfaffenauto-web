"use client";

import React, { useRef } from "react";
// 1. Agregamos "Variants" a la importación
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import Link from "next/link";
import { MapPin, Phone, Clock, ArrowLeft } from "lucide-react";

interface HeroProps {
  nombre: string;
  imagen: string;
  direccion: string;
  telefono: string;
  horario: string;
}

export default function SucursalHeroAnimated({ nombre, imagen, direccion, telefono, horario }: HeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Efecto Parallax en la imagen de fondo
  const yImage = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // 2. Le decimos a TypeScript explícitamente que esto es un tipo "Variants"
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 100, damping: 20 },
    },
  };

  return (
    <section 
      ref={containerRef}
      className="relative h-[80vh] min-h-[600px] w-full flex flex-col justify-center px-4 md:px-12 pb-[140px] overflow-hidden"
    >
      {/* ================= FONDO PARALLAX Y ESPACIAL ================= */}
      <motion.div style={{ y: yImage }} className="absolute inset-0 z-0 bg-black">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.8 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src={imagen}
          alt={`Sucursal ${nombre}`}
          className="w-full h-full object-cover object-center"
        />
        {/* Gradientes volumétricos */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-[#050505]/95"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]"></div>
        
        {/* Luces de Neón difuminadas (Glow) */}
        <motion.div 
          animate={{ opacity: [0.3, 0.6, 0.3] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-[#0145F2]/40 rounded-full blur-[140px] pointer-events-none mix-blend-screen"
        ></motion.div>
        <motion.div 
          animate={{ opacity: [0.2, 0.4, 0.2] }} 
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] bg-sky-400/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen"
        ></motion.div>
      </motion.div>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ opacity: opacityText }}
        className="relative z-20 max-w-7xl mx-auto w-full mt-12"
      >
        {/* Botón Volver con Microinteracción (Hover magnético) */}
        <motion.div variants={itemVariants} className="w-fit">
          <Link
            href="/#sucursales"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white text-[10px] md:text-xs font-black uppercase tracking-widest transition-all mb-10 bg-white/10 backdrop-blur-2xl px-5 py-2.5 rounded-full border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/20 hover:border-white/40 hover:shadow-[0_8px_32px_rgba(1,69,242,0.4)] group overflow-hidden relative"
          >
            {/* Brillo de barrido al hacer hover */}
            <span className="absolute inset-0 w-[150%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]"></span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            Volver a Sucursales
          </Link>
        </motion.div>

        {/* Título Transparente/Cristal */}
        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-[90px] font-black uppercase tracking-tighter drop-shadow-2xl mb-12 leading-[0.9]">
          <span className="text-white/40 font-light text-2xl md:text-4xl block mb-2 tracking-widest drop-shadow-md">Sucursal</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-sky-300 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            {nombre}
          </span>
        </motion.h1>

        {/* ================= TARJETAS GLASSMORPHISM ================= */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl">
          <GlassCard icon={<MapPin />} title="Dirección" value={direccion} delay={0} />
          <GlassCard icon={<Phone />} title="Línea Directa" value={telefono} delay={0.1} />
          <GlassCard icon={<Clock />} title="Horario" value={horario} delay={0.2} />
        </motion.div>
      </motion.div>
    </section>
  );
}

// Subcomponente de Tarjeta Glass
function GlassCard({ icon, title, value, delay }: { icon: React.ReactNode; title: string; value: string; delay: number }) {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex items-center gap-4 bg-white/[0.08] backdrop-blur-[40px] p-4 md:p-5 rounded-[24px] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:bg-white/[0.15] hover:border-white/30 hover:shadow-[0_8px_40px_0_rgba(1,69,242,0.2)] group cursor-default relative overflow-hidden"
    >
      {/* Resplandor lateral en hover */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#0145F2] to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/20 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-[#0145F2]/40 group-hover:border-sky-300/50 transition-all duration-300 relative z-10">
        <div className="text-gray-300 group-hover:text-white w-5 h-5 md:w-6 md:h-6 transition-colors drop-shadow-md">
          {icon}
        </div>
      </div>
      
      <div className="flex flex-col relative z-10">
        <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mb-1 group-hover:text-sky-300 transition-colors">
          {title}
        </span>
        <span className="text-sm md:text-base font-black text-white tracking-wide leading-tight drop-shadow-md">
          {value}
        </span>
      </div>
    </motion.div>
  );
}