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
  return (
    texto
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim() || ""
  );
};

// Variantes para la animación en cascada (Stagger) - Refinadas con físicas Spring
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95, filter: "blur(5px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 150, damping: 20 } 
  },
};

export default function Stock({ vehiculos }: StockProps) {
  const listaVehiculos = vehiculos || [];

  const suvsDestacadas = listaVehiculos
    .filter((auto) => normalizar(auto.tipo).includes("suv"))
    .slice(0, 4);

  const pickipsCarrusel = listaVehiculos
    .filter((auto) => {
      const t = normalizar(auto.tipo);
      return t.includes("pick") || t.includes("camioneta");
    })
    .slice(0, 8);

  const urbanosYSedanes = listaVehiculos
    .filter((auto) => {
      const t = normalizar(auto.tipo);
      return (
        t.includes("sedan") || t.includes("hatchback") || t.includes("urbano")
      );
    })
    .slice(0, 4);

  const idsMostrados = new Set([
    ...suvsDestacadas.map((a) => a.id),
    ...pickipsCarrusel.map((a) => a.id),
    ...urbanosYSedanes.map((a) => a.id),
  ]);

  const otrosVehiculos = listaVehiculos
    .filter((auto) => !idsMostrados.has(auto.id))
    .slice(0, 8);

  // =========================================================================
  // LÓGICA DEL CARRUSEL INFINITO Y ARRASTRABLE (INTACTA)
  // =========================================================================
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    let animationId: number;
    const move = () => {
      if (carouselRef.current && !isPaused && !isDragging) {
        carouselRef.current.scrollLeft += 0.6;
        if (
          carouselRef.current.scrollLeft >=
          carouselRef.current.scrollWidth / 2
        ) {
          carouselRef.current.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(move);
    };
    animationId = requestAnimationFrame(move);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused, isDragging]);

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
    const walk = (x - startX) * 1.5; 
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const stopDragging = () => {
    setIsDragging(false);
    setIsPaused(false);
  };
  // =========================================================================

  if (listaVehiculos.length === 0) {
    return (
      <section className="py-24 bg-transparent relative text-center border-none">
        <div className="max-w-md mx-auto p-10 rounded-[32px] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_16px_40px_0_rgba(31,38,135,0.05)]">
          <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-ping"></span>
          </div>
          <p className="text-gray-500 font-bold tracking-wide">
            Actualmente no hay unidades disponibles en esta sucursal.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="stock"
      className="py-24 bg-transparent relative border-t border-transparent overflow-hidden"
    >
      {/* Luces Ambientales (Spatial UI) */}
      <div className="absolute top-0 left-[-5%] w-[600px] h-[600px] bg-[#0145F2]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] bg-sky-300/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-24 relative z-10">
        
        {/* ================= SECCIÓN 1: SUVs ================= */}
        {suvsDestacadas.length > 0 && (
          <div>
            <SectionHeader 
              pillText="Selección exclusiva" 
              pillColor="text-sky-600 bg-sky-50/50 border-sky-100/50"
              titleLight="SUVs" 
              titleBold="Destacadas" 
              linkHref="/catalogo?tipo=SUV" 
              linkLabel="Ver todas las SUVs" 
            />
            <VehicleGrid vehiculos={suvsDestacadas} />
          </div>
        )}

        {/* ================= SECCIÓN 2: Pick-ups (Carrusel ARRASTRABLE) ================= */}
        {pickipsCarrusel.length > 0 && (
          <div className="space-y-8">
            <SectionHeader 
              pillText="Alta Demanda" 
              pillColor="text-orange-600 bg-orange-50/50 border-orange-100/50"
              titleLight="Pick-ups" 
              titleBold="Disponibles" 
              linkHref="/catalogo?tipo=Pick-up" 
              linkLabel="Ver catálogo de Pick-ups" 
            />

            {/* CONTENEDOR DEL CARRUSEL INTERACTIVO */}
            <div className="relative w-full [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] py-4">
              <div
                ref={carouselRef}
                className="flex gap-5 md:gap-6 w-full overflow-x-auto cursor-grab active:cursor-grabbing pb-6 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={stopDragging}
                onMouseDown={handleMouseDown}
                onMouseUp={stopDragging}
                onMouseMove={handleMouseMove}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
              >
                {[...pickipsCarrusel, ...pickipsCarrusel].map((auto, index) => (
                  <div
                    key={`${auto.id}-${index}`}
                    className={`min-w-[280px] max-w-[280px] sm:min-w-[300px] sm:max-w-[300px] flex-shrink-0 ${isDragging ? "pointer-events-none" : ""}`}
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
            <SectionHeader 
              pillText="Prácticos y eficientes" 
              pillColor="text-emerald-600 bg-emerald-50/50 border-emerald-100/50"
              titleLight="Sedanes y Hatchbacks" 
              titleBold="Urbanos" 
              linkHref="/catalogo" 
              linkLabel="Ver todo el stock" 
            />
            <VehicleGrid vehiculos={urbanosYSedanes} />
          </div>
        )}

        {/* ================= SECCIÓN 4: OTROS ================= */}
        {otrosVehiculos.length > 0 && (
          <div>
            <SectionHeader 
              pillText="Más Opciones" 
              pillColor="text-purple-600 bg-purple-50/50 border-purple-100/50"
              titleLight="Unidades" 
              titleBold="Disponibles" 
              linkHref="/catalogo" 
              linkLabel="Ir al catálogo completo" 
            />
            <VehicleGrid vehiculos={otrosVehiculos} />
          </div>
        )}
      </div>
    </section>
  );
}

// ================= COMPONENTES DE UI MODULARIZADOS =================

// Encabezado de Sección Estilizado
function SectionHeader({ pillText, pillColor, titleLight, titleBold, linkHref, linkLabel }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
      <div>
        <span className={`text-[10px] font-black uppercase tracking-widest backdrop-blur-xl px-4 py-1.5 rounded-full border shadow-[0_2px_10px_rgba(0,0,0,0.03)] ${pillColor}`}>
          {pillText}
        </span>
        <h2 className="text-3xl md:text-4xl text-navy font-light tracking-tighter mt-4 drop-shadow-sm">
          {titleLight} <strong className="font-black bg-clip-text text-transparent bg-gradient-to-r from-navy to-[#0145F2]">{titleBold}</strong>
        </h2>
      </div>
      <Link
        href={linkHref}
        className="text-xs font-bold text-gray-500 bg-white/40 backdrop-blur-md border border-white/60 px-4 py-2 rounded-full hover:bg-white hover:text-primary hover:shadow-[0_8px_20px_rgba(1,69,242,0.1)] active:scale-95 transition-all flex items-center gap-1.5 w-fit group"
      >
        {linkLabel}
        <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-[#0145F2] group-hover:text-white transition-colors">
          <ChevronRight className="w-3 h-3 transition-transform" />
        </span>
      </Link>
    </div>
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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6"
    >
      {vehiculos.map((auto) => (
        <motion.div variants={itemVariants} key={auto.id} className="h-full">
          <VehicleCard auto={auto} />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Tarjeta Individual Glassmorphism 2.0 / Spatial UI
function VehicleCard({ auto }: { auto: any }) {
  const precioMostrar =
    auto.precio_publicado_usd && !auto.precio_publicado_ars
      ? `US$ ${auto.precio_publicado_usd.toLocaleString("es-AR")}`
      : auto.precio_publicado_ars
        ? `$ ${auto.precio_publicado_ars.toLocaleString("es-AR")}`
        : `US$ ${auto.precio_publicado_usd?.toLocaleString("es-AR")}`;

  return (
    <Link
      href={`/catalogo/${auto.slug}`}
      className="block group h-full focus:outline-none"
    >
      <div className="bg-white/40 backdrop-blur-2xl rounded-[28px] border border-white/60 overflow-hidden flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(1,69,242,0.12)] hover:border-white hover:bg-white/70 transition-all duration-500 relative transform group-hover:-translate-y-1">
        
        {/* Reflejo de luz interior al hacer hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20"></div>

        <div className="relative h-[160px] sm:h-[180px] bg-white/30 flex items-center justify-center overflow-hidden p-4 mix-blend-multiply">
          {auto.multimedia_vehiculos?.[0] ? (
            <img
              src={auto.multimedia_vehiculos[0].url_archivo}
              alt={`${auto.marca} ${auto.modelo}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-medium">
              Sin foto
            </div>
          )}
          {auto.estado === "Reservado" && (
            <div className="absolute top-4 right-4 bg-yellow-100/90 backdrop-blur-md text-yellow-800 border border-yellow-200/80 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_4px_12px_rgba(0,0,0,0.05)] z-10">
              Reservado
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 flex flex-col flex-grow relative z-10">
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">
            {auto.marca}
          </span>
          <h3 className="text-base sm:text-lg font-black text-navy leading-tight uppercase truncate drop-shadow-sm">
            {auto.modelo}
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1 line-clamp-1">
            {auto.version || `${auto.anio} • ${auto.kilometraje?.toLocaleString("es-AR")} km`}
          </p>

          <div className="mt-auto pt-5 flex items-end justify-between border-t border-gray-200/50">
            <span className="text-lg sm:text-xl font-black text-navy tracking-tighter">
              {precioMostrar}
            </span>
            <div className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm group-hover:bg-[#0145F2] group-hover:border-[#0145F2] group-hover:text-white flex items-center justify-center transition-all duration-300 text-gray-400 group-hover:shadow-[0_0_15px_rgba(1,69,242,0.4)]">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}