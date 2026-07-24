"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion, Variants} from "framer-motion"; // <-- Sumamos Framer Motion


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
  const pickipsCarrusel = listaVehiculos.filter((auto) => {
    const t = normalizar(auto.tipo);
    return t.includes("pick") || t.includes("camioneta"); 
  }).slice(0, 10);
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

  if (listaVehiculos.length === 0) {
    return (
      <section className="py-16 bg-background relative border-t border-gray-100 text-center">
        <p className="text-gray-500 font-medium animate-pulse">Actualmente no hay unidades disponibles en esta sucursal.</p>
      </section>
    );
  }

  return (
    <section id="stock" className="py-16 bg-background relative border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-16">
        
        {/* ================= SECCIÓN 1: SUVs ================= */}
        {suvsDestacadas.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                  Selección exclusiva
                </span>
                <h2 className="text-2xl md:text-3xl text-navy font-light tracking-tight mt-2">
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

        {/* ================= SECCIÓN 2: Pick-ups ================= */}
        {pickipsCarrusel.length > 0 && (
          <div className="bg-slate-50/70 p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                  Alta Demanda
                </span>
                <h2 className="text-2xl md:text-3xl text-navy font-light tracking-tight mt-2">
                  Pick-ups <strong className="font-black">Disponibles</strong>
                </h2>
              </div>
              <Link href="/catalogo?tipo=Pick-up" className="text-sm font-bold text-gray-500 hover:text-primary active:scale-95 transition-all flex items-center gap-1 group">
                Ver catálogo de Pick-ups <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <motion.div 
              variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar snap-x"
            >
              {pickipsCarrusel.map((auto) => (
                <motion.div variants={itemVariants} key={auto.id} className="min-w-[260px] max-w-[260px] sm:min-w-[280px] sm:max-w-[280px] snap-start flex-shrink-0">
                  <VehicleCard auto={auto} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* ================= SECCIÓN 3: Sedanes / Hatchbacks ================= */}
        {urbanosYSedanes.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Prácticos y eficientes
                </span>
                <h2 className="text-2xl md:text-3xl text-navy font-light tracking-tight mt-2">
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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                  Más Opciones
                </span>
                <h2 className="text-2xl md:text-3xl text-navy font-light tracking-tight mt-2">
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
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5"
    >
      {vehiculos.map((auto) => (
        <motion.div variants={itemVariants} key={auto.id}>
          <VehicleCard auto={auto} />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Tarjeta Individual
function VehicleCard({ auto }: { auto: any }) {
  const precioMostrar = auto.precio_publicado_usd && !auto.precio_publicado_ars
    ? `US$ ${auto.precio_publicado_usd.toLocaleString("es-AR")}`
    : auto.precio_publicado_ars 
      ? `$ ${auto.precio_publicado_ars.toLocaleString("es-AR")}` 
      : `US$ ${auto.precio_publicado_usd?.toLocaleString("es-AR")}`;

  return (
    <Link href={`/catalogo/${auto.slug}`} className="block group h-full active:scale-[0.98] transition-transform">
      <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300">
        
        <div className="relative h-[140px] sm:h-[160px] bg-gray-50/50 flex items-center justify-center overflow-hidden p-4">
          {auto.multimedia_vehiculos?.[0] ? (
            <img src={auto.multimedia_vehiculos[0].url_archivo} alt={`${auto.marca} ${auto.modelo}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 mix-blend-multiply" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Sin foto</div>
          )}
          {auto.estado === "Reservado" && (
            <div className="absolute top-3 right-3 bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-sm">Reservado</div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{auto.marca}</span>
          <h3 className="text-sm sm:text-base font-black text-navy leading-tight uppercase truncate">{auto.modelo}</h3>
          <p className="text-[11px] text-gray-500 font-medium mt-1 line-clamp-1">{auto.version || `${auto.anio} • ${auto.kilometraje?.toLocaleString("es-AR")} km`}</p>
          
          <div className="mt-auto pt-4 flex items-end justify-between">
            <span className="text-base sm:text-lg font-black text-navy tracking-tight">{precioMostrar}</span>
          </div>
        </div>

      </div>
    </Link>
  );
}