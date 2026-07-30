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
    }, 5500); // 1 segundo extra de retraso (5.5s)

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
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  return (
    <section id="sucursales" className="w-full bg-[#dee2e6] border-gray-400 pt-8 pb-4">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* ================= ENCABEZADO ================= */}
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl md:text-2xl font-light text-navy tracking-tight">
            Nuestras <strong className="font-black">sucursales</strong>
          </h2>

          <div className="flex items-center gap-3">
            <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1 animate-pulse">
              <span className="hidden sm:inline">Deslizá para ver más</span>
              <span className="inline sm:hidden">Deslizá</span>
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4"/>
            </span>

            {/* FLECHAS DE NAVEGACIÓN MANUAL (PC) */}
            <div className="hidden md:flex items-center gap-1.5 ml-2">
              <button 
                onClick={prev}
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 text-navy transition-colors cursor-pointer z-10"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={next}
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 text-navy transition-colors cursor-pointer z-10"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ================= CARRUSEL INFINITO ================= */}
        <div 
          className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl aspect-[1/1] sm:aspect-[16/9] md:aspect-[21/6] shadow-xl bg-[#111111]"
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
                x: { type: "spring", stiffness: 250, damping: 30 }, 
                opacity: { duration: 0.4 } 
              }}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
              drag="x" // Permite deslizar con el dedo en móviles
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
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
                
                {/* IMAGEN DE FONDO */}
                <img 
                  src={sucursales[currentIndex].img} 
                  alt={sucursales[currentIndex].titulo} 
                  draggable="false"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 md:opacity-90 md:w-[65%] md:left-auto md:right-0 transition-transform duration-1000 group-hover:scale-105 pointer-events-none" 
                />

                {/* DEGRADADOS */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent md:hidden pointer-events-none"></div>
                <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#111111] via-[#111111]/90 to-transparent w-[75%] pointer-events-none"></div>

                {/* CONTENIDO DEL BANNER */}
                <div className="absolute inset-0 p-4 sm:p-5 md:p-10 flex flex-col justify-between z-10 w-full h-full pointer-events-none">
                  
                  {/* Logo Superior Derecho */}
                  <div className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2 opacity-70">
                     <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                       <span className="text-white text-[10px] font-black">P</span>
                     </div>
                     <span className="text-white text-[10px] md:text-xs font-black uppercase tracking-widest hidden md:block">Pfaffen</span>
                  </div>

                  {/* Texto Principal (Izquierda) */}
                  <div className="mt-auto md:mt-0 max-w-lg">
                    <h3 className="text-2xl sm:text-3xl md:text-5xl lg:text-[56px] font-black text-white uppercase leading-[0.95] tracking-tighter mb-2 md:mb-3 shadow-black/50 drop-shadow-lg">
                      SUCURSAL <br/> 
                      {sucursales[currentIndex].titulo}.
                    </h3>
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-300 font-bold uppercase tracking-wider flex items-center gap-1.5 md:gap-2">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-white" /> {sucursales[currentIndex].direccion}
                    </p>
                  </div>

                  {/* Bloque Inferior */}
                  <div className="flex justify-start items-end mt-4 sm:mt-6 pointer-events-auto">
                    <div className="border-[2px] border-white/90 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-md bg-black/30 group-hover:bg-white group-hover:border-white transition-all duration-300 w-fit">
                      
                      <span className="block text-white group-hover:text-black font-black italic tracking-widest text-[9px] md:text-xs uppercase mb-0.5 transition-colors">
                        {sucursales[currentIndex].subtitulo}
                      </span>
                      
                      <div className="flex items-end gap-1 sm:gap-1.5 text-white group-hover:text-black leading-none whitespace-nowrap transition-colors">
                         <span className="font-black text-xs sm:text-sm md:text-lg mb-0.5">TEL</span>
                         <span className="font-black text-[19px] sm:text-2xl md:text-4xl tracking-tighter">
                           {sucursales[currentIndex].telefono}
                         </span>
                      </div>

                    </div>
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