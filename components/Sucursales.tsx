"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sucursales() {
  const sucursales = [
    {
      id: "casa-central",
      titulo: "CASA CENTRAL",
      subtitulo: "AUTOS 0KM",
      telefono: "11 37564398",
      direccion: "Villa de Mayo, Buenos Aires",
      img: "/VDM.jpeg"
    },
    {
      id: "olivos",
      titulo: "OLIVOS",
      subtitulo: "ALTA GAMA",
      telefono: "11 56520726",
      direccion: "Olivos, Buenos Aires",
      img: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1200&auto=format&fit=crop" 
    },
    {
      id: "don-torcuato",
      titulo: "DON TORCUATO",
      subtitulo: "USADOS Y SEMINUEVOS",
      telefono: "11 57998065",
      direccion: "Panamericana R202",
      img: "/pana.jpg"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  // ================= LÓGICA DE AUTOPLAY INFINITO =================
  useEffect(() => {
    // Si el usuario tiene el mouse encima (o el dedo), pausamos para que pueda leer
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setDirection(1); // Siempre avanza hacia adelante en el autoplay
      setCurrentIndex((prev) => (prev + 1) % sucursales.length);
    }, 5500); // 1.5 segundo extra de retraso

    return () => clearInterval(interval);
  }, [isHovered, sucursales.length]);

  const next = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % sucursales.length);
  };

  const prev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + sucursales.length) % sucursales.length);
  };

  // Configuración de la animación fluida
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      filter: "blur(8px)",
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      filter: "blur(8px)",
      scale: 0.95,
    }),
  };

  return (
    <section id="sucursales" className="w-full bg-[#E9ECEF] border-gray-400 pt-12 pb-8 relative overflow-hidden">
      
      {/* Elementos ambientales de fondo (Spatial UI) para el contenedor principal */}
      <div className="absolute top-0 right-[-10%] w-[400px] h-[400px] bg-blue-300/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* ================= ENCABEZADO ================= */}
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl md:text-3xl font-light text-navy tracking-tight drop-shadow-sm">
            Nuestras <strong className="font-black">sucursales</strong>
          </h2>

          <div className="flex items-center gap-3">
            <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1 bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] animate-pulse">
              <span className="hidden sm:inline">Deslizá para explorar</span>
              <span className="inline sm:hidden">Deslizá</span>
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-[#0145F2]"/>
            </span>

            {/* FLECHAS DE NAVEGACIÓN MANUAL (PC) - Glassmorphism */}
            <div className="hidden md:flex items-center gap-2 ml-2">
              <button 
                onClick={prev}
                className="p-2.5 rounded-full bg-white/60 backdrop-blur-xl border border-white/80 hover:bg-white hover:border-[#0145F2]/30 text-navy hover:text-[#0145F2] transition-all shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(1,69,242,0.15)] cursor-pointer z-10 active:scale-95"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={next}
                className="p-2.5 rounded-full bg-white/60 backdrop-blur-xl border border-white/80 hover:bg-white hover:border-[#0145F2]/30 text-navy hover:text-[#0145F2] transition-all shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(1,69,242,0.15)] cursor-pointer z-10 active:scale-95"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ================= CARRUSEL INFINITO (Glassmorphism 2.0) ================= */}
        <div 
          className="relative w-full overflow-hidden rounded-[32px] md:rounded-[40px] aspect-[1/1] sm:aspect-[16/9] md:aspect-[21/6] shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white/10 backdrop-blur-xl border border-white/40"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ 
                x: { type: "spring", stiffness: 200, damping: 25 }, 
                opacity: { duration: 0.5 },
                scale: { duration: 0.5, ease: "easeOut" },
                filter: { duration: 0.4 }
              }}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing bg-black"
              drag="x" // Permite deslizar con el dedo en móviles
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragEnd={(e, { offset }) => {
                if (offset.x < -50) next();
                else if (offset.x > 50) prev();
              }}
            >
              <Link 
                href={`/sucursales/${sucursales[currentIndex].id}`} 
                className="relative block w-full h-full group"
                draggable="false"
              >
                
                {/* IMAGEN DE FONDO CON EFECTOS */}
                <img 
                  src={sucursales[currentIndex].img} 
                  alt={sucursales[currentIndex].titulo} 
                  draggable="false"
                  className="absolute inset-0 w-full h-full object-cover opacity-70 md:opacity-90 transition-transform duration-1000 group-hover:scale-105 pointer-events-none mix-blend-luminosity md:mix-blend-normal" 
                />

                {/* DEGRADADOS CRISTALINOS PARA EL TEXTO */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent md:hidden pointer-events-none"></div>
                <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#050505]/95 via-[#050505]/70 to-transparent w-[80%] pointer-events-none"></div>
                
                {/* Luces Ambientales internas del Slider (Glow) */}
                <div className="absolute top-[20%] left-[-10%] w-[300px] h-[300px] bg-[#0145F2]/30 rounded-full blur-[80px] pointer-events-none mix-blend-screen opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                {/* CONTENIDO DEL BANNER */}
                <div className="absolute inset-0 p-5 md:p-10 flex flex-col justify-between z-10 w-full h-full pointer-events-none">
                  
                  {/* Logo Superior Derecho (Glass) */}
                  <div className="absolute top-5 right-5 md:top-8 md:right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-[0_4px_15px_rgba(0,0,0,0.1)] group-hover:bg-white/20 transition-colors">
                     <div className="w-5 h-5 border-[1.5px] border-white rounded-full flex items-center justify-center">
                       <span className="text-white text-[9px] font-black">P</span>
                     </div>
                     <span className="text-white text-[10px] md:text-xs font-bold uppercase tracking-widest hidden md:block">Pfaffen</span>
                  </div>

                  {/* Texto Principal (Izquierda) */}
                  <div className="mt-auto md:mt-0 max-w-xl">
                    <motion.h3 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 uppercase leading-[0.95] tracking-tighter mb-3 drop-shadow-2xl"
                    >
                      SUCURSAL <br/> 
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-sky-300">
                        {sucursales[currentIndex].titulo}.
                      </span>
                    </motion.h3>
                    <motion.p 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="text-[10px] sm:text-xs md:text-sm text-gray-300 font-bold uppercase tracking-wider flex items-center gap-1.5 md:gap-2 drop-shadow-md"
                    >
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-sky-400" /> {sucursales[currentIndex].direccion}
                    </motion.p>
                  </div>

                  {/* Bloque Inferior Interactivo (Glassmorphism puro) */}
                  <div className="flex justify-start items-end mt-4 sm:mt-6 pointer-events-auto w-fit">
                    <motion.div 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="border border-white/30 rounded-2xl px-4 py-2 sm:px-5 sm:py-3 backdrop-blur-2xl bg-white/10 group-hover:bg-white group-hover:border-white transition-all duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.2)] group-hover:shadow-[0_12px_40px_rgba(1,69,242,0.3)] relative overflow-hidden"
                    >
                      {/* Brillo dinámico en hover */}
                      <span className="absolute inset-0 w-[150%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]"></span>
                      
                      <span className="block text-sky-300 group-hover:text-gray-500 font-black italic tracking-widest text-[9px] md:text-xs uppercase mb-1 transition-colors relative z-10">
                        {sucursales[currentIndex].subtitulo}
                      </span>
                      
                      <div className="flex items-end gap-1.5 sm:gap-2 text-white group-hover:text-navy leading-none whitespace-nowrap transition-colors relative z-10">
                         <span className="font-black text-xs sm:text-sm md:text-base mb-0.5 md:mb-1">TEL</span>
                         <span className="font-black text-[22px] sm:text-3xl md:text-[40px] tracking-tighter drop-shadow-md group-hover:drop-shadow-none">
                           {sucursales[currentIndex].telefono}
                         </span>
                      </div>

                    </motion.div>
                  </div>

                </div>
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}