"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion, Variants } from "framer-motion";

interface StockProps {
  vehiculos: any[] | null;
}

// Función mágica para limpiar textos: quita tildes, espacios extra y pasa a minúsculas
const normalizar = (texto: string) => {
  return texto?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || "";
};

// Variantes para la animación en cascada (Stagger)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Stock({ vehiculos }: StockProps) {
  const listaVehiculos = vehiculos || [];

  const suvsDestacadas = listaVehiculos.filter((auto) => normalizar(auto.tipo).includes("suv")).slice(0, 4);
  
  // Para el carrusel de pick-ups traemos un buen lote (ej: hasta 8 o 10 para que el loop se vea fluido)
  const pickipsCarrusel = listaVehiculos.filter((auto) => {
    const t = normalizar(auto.tipo);
    return t.includes("pick") || t.includes("camioneta"); 
  }).slice(0, 8);

  const urbanosYSedanes = listaVehiculos.filter((auto) => {
    const t = normalizar(auto.tipo);
    return t.includes("sedan") || t.includes("hatchback") || t.includes("urbano");
  }).slice(0, 4);

  const idsMostrados = new Set([
    ...suvsDestacadas.map(a => a.id),
    ...pickipsCarrusel.map(a => a.id),
    ...urbanosYSedanes.map(a => a.id)
  ]);

  const otrosVehiculos = listaVehiculos.filter((auto) => !idsMostrados.has(auto.id)).slice(0, 8);

  // =========================================================================
  // LÓGICA DEL CARRUSEL INFINITO Y ARRASTRABLE
  // =========================================================================
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // El motor de auto-scroll
  useEffect(() => {
    let animationId: number;
    const move = () => {
      if (carouselRef.current && !isPaused && !isDragging) {
        // Velocidad: Ajustá este número si querés que vaya más rápido o más lento
        carouselRef.current.scrollLeft += 0.6; 
        
        // Magia del bucle infinito: cuando llega a la mitad (donde empalma el array duplicado), vuelve a 0
        if (carouselRef.current.scrollLeft >= carouselRef.current.scrollWidth / 2) {
          carouselRef.current.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(move);
    };
    animationId = requestAnimationFrame(move);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused, isDragging]);

  // Funciones para permitir el "Drag & Drop" (Arrastrar con el mouse en PC)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Multiplicador de velocidad de arrastre
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const stopDragging = () => {
    setIsDragging(false);
    setIsPaused(false);
  };
  // =========================================================================

  if (listaVehiculos.length === 0) {
    return (
      <section className="py-20 bg-[#F8FAFC] relative border-t border-gray-200/50 text-center">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-white/40 backdrop-blur-xl border border-white shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
          <p className="text-gray-500 font-medium animate-pulse">Actualmente no hay unidades disponibles en esta sucursal.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="stock" className="py-24 bg-[#6c757d] relative border-t border-gray-200/50 overflow-hidden">
      
      {/* Elementos ambientales de fondo para realzar el Spatial UI */}
      <div className="absolute top-1/4 left-[-10%] w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-[-10%] w-[500px] h-[500px] bg-sky-300/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-20 relative z-10">
        
        {/* ================= SECCIÓN 1: SUVs ================= */}
        {suvsDestacadas.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-sky-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  Selección exclusiva
                </span>
                <h2 className="text-2xl md:text-3xl text-navy font-light tracking-tight mt-3">
                  SUVs <strong className="font-black">Destacadas</strong>
                </h2>
              </div>
              <Link href="/catalogo?tipo=SUV" className="text-sm font-bold text-gray-500 hover:text-primary active:scale-95 transition-all flex items-center gap-1 group">
                Ver todas las SUVs <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <VehicleGrid vehiculos={suvsDestacadas} />
          </div>
        )}

        {/* ================= SECCIÓN 2: Pick-ups (Carrusel ARRASTRABLE) ================= */}
        {pickipsCarrusel.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-orange-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  Alta Demanda
                </span>
                <h2 className="text-2xl md:text-3xl text-navy font-light tracking-tight mt-3">
                  Pick-ups <strong className="font-black">Disponibles</strong>
                </h2>
              </div>
              <Link href="/catalogo?tipo=Pick-up" className="text-sm font-bold text-gray-500 hover:text-primary active:scale-95 transition-all flex items-center gap-1 group">
                Ver catálogo de Pick-ups <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* CONTENEDOR DEL CARRUSEL INTERACTIVO */}
            <div className="relative w-full [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] py-2">
              <div 
                ref={carouselRef}
                className="flex gap-5 w-full overflow-x-auto cursor-grab active:cursor-grabbing pb-4 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={stopDragging}
                onMouseDown={handleMouseDown}
                onMouseUp={stopDragging}
                onMouseMove={handleMouseMove}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
              >
                {/* Duplicamos el array para lograr el efecto de bucle infinito perfecto */}
                {[...pickipsCarrusel, ...pickipsCarrusel].map((auto, index) => (
                  <div 
                    key={`${auto.id}-${index}`} 
                    className={`min-w-[270px] max-w-[270px] sm:min-w-[290px] sm:max-w-[290px] flex-shrink-0 ${isDragging ? 'pointer-events-none' : ''}`}
                  >
                    <VehicleCard auto={auto} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= SECCIÓN 3: Sedanes / Hatchbacks ================= */}
        {urbanosYSedanes.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-emerald-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  Prácticos y eficientes
                </span>
                <h2 className="text-2xl md:text-3xl text-navy font-light tracking-tight mt-3">
                  Sedanes y Hatchbacks <strong className="font-black">Urbanos</strong>
                </h2>
              </div>
              <Link href="/catalogo" className="text-sm font-bold text-gray-500 hover:text-primary active:scale-95 transition-all flex items-center gap-1 group">
                Ver todo el stock <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <VehicleGrid vehiculos={urbanosYSedanes} />
          </div>
        )}

        {/* ================= SECCIÓN 4: OTROS ================= */}
        {otrosVehiculos.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-purple-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  Más Opciones
                </span>
                <h2 className="text-2xl md:text-3xl text-navy font-light tracking-tight mt-3">
                  Unidades <strong className="font-black">Disponibles</strong>
                </h2>
              </div>
              <Link href="/catalogo" className="text-sm font-bold text-gray-500 hover:text-primary active:scale-95 transition-all flex items-center gap-1 group">
                Ir al catálogo completo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <VehicleGrid vehiculos={otrosVehiculos} />
          </div>
        )}

      </div>
    </section>
  );
}

// Grilla Animada
function VehicleGrid({ vehiculos }: { vehiculos: any[] }) {
  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      whileInView="visible" 
      viewport={{ once: true, margin: "-50px" }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
    >
      {vehiculos.map((auto) => (
        <motion.div variants={itemVariants} key={auto.id} className="h-full">
          <VehicleCard auto={auto} />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Tarjeta Individual con estilo Glassmorphism 2.0 / Spatial UI
function VehicleCard({ auto }: { auto: any }) {
  const precioMostrar = auto.precio_publicado_usd && !auto.precio_publicado_ars
    ? `US$ ${auto.precio_publicado_usd.toLocaleString("es-AR")}`
    : auto.precio_publicado_ars 
      ? `$ ${auto.precio_publicado_ars.toLocaleString("es-AR")}` 
      : `US$ ${auto.precio_publicado_usd?.toLocaleString("es-AR")}`;

  return (
    <Link href={`/catalogo/${auto.slug}`} className="block group h-full active:scale-[0.98] transition-transform">
      <div className="bg-white/60 backdrop-blur-xl rounded-[24px] border border-white/80 overflow-hidden flex flex-col h-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_0_rgba(0,85,164,0.1)] hover:border-primary/40 hover:bg-white/80 transition-all duration-300">
        
        <div className="relative h-[150px] sm:h-[170px] bg-gradient-to-b from-gray-50/50 to-white/30 flex items-center justify-center overflow-hidden p-4">
          {auto.multimedia_vehiculos?.[0] ? (
            <img src={auto.multimedia_vehiculos[0].url_archivo} alt={`${auto.marca} ${auto.modelo}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 mix-blend-multiply" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin foto</div>
          )}
          {auto.estado === "Reservado" && (
            <div className="absolute top-3 right-3 bg-yellow-100/80 backdrop-blur-md text-yellow-800 border border-yellow-200 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">Reservado</div>
          )}
        </div>

        <div className="p-4 sm:p-5 flex flex-col flex-grow">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{auto.marca}</span>
          <h3 className="text-sm sm:text-base font-black text-navy leading-tight uppercase truncate">{auto.modelo}</h3>
          <p className="text-[11px] text-gray-500 font-medium mt-1 line-clamp-1">{auto.version || `${auto.anio} • ${auto.kilometraje?.toLocaleString("es-AR")} km`}</p>
          
          <div className="mt-auto pt-4 flex items-end justify-between border-t border-gray-100/60">
            <span className="text-base sm:text-lg font-black text-navy tracking-tight">{precioMostrar}</span>
            <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors text-gray-400">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
}