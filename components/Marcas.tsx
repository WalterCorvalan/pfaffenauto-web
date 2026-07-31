"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { motion, Variants } from "framer-motion";

// ================= VARIANTES DE ANIMACIÓN (FRAMER MOTION) =================
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.9, filter: "blur(5px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 200, damping: 20 } 
  },
};

// ================= SUBCOMPONENTE DE TARJETA (GLASSMORPHISM) =================
function MarcaCard({ marca }: { marca: { nombre: string; slug: string; logo: string } }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link 
      href={`/marcas/${marca.slug}`} 
      className="flex flex-col items-center justify-center gap-3 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[28px] py-5 md:py-7 shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(1,69,242,0.12)] hover:border-white hover:bg-white/70 transition-all duration-500 group relative overflow-hidden h-full"
    >
      {/* Reflejo de luz diagonal al hacer hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0"></div>

      <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 relative z-10 mix-blend-multiply">
        {!imgError ? (
          <img 
            src={marca.logo} 
            alt={`Logo de ${marca.nombre}`} 
            className="w-full h-full object-contain filter drop-shadow-sm"
            onError={() => setImgError(true)} 
          />
        ) : (
          // Fallback: Si no hay foto, mostramos la inicial grande y elegante
          <div className="w-full h-full rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shadow-inner group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
            <span className="text-2xl md:text-3xl font-black text-gray-400 group-hover:text-[#0145F2] transition-colors">
              {marca.nombre.charAt(0)}
            </span>
          </div>
        )}
      </div>
      
      <span className="text-[10px] md:text-xs font-bold text-gray-500 group-hover:text-navy uppercase tracking-widest transition-colors relative z-10 text-center px-2 line-clamp-1 w-full">
        {marca.nombre}
      </span>
    </Link>
  );
}

// ================= COMPONENTE PRINCIPAL =================
export default function Marcas() {
  const marcas = [
    { nombre: "Volkswagen", slug: "volkswagen", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg" },
    { nombre: "Chevrolet", slug: "chevrolet", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Chevrolet-logo.png" },
    { nombre: "Toyota", slug: "toyota", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg" },
    { nombre: "Ford", slug: "ford", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg" },
    { nombre: "Peugeot", slug: "peugeot", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg" },
    { nombre: "Renault", slug: "renault", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_logo.svg" },
    { nombre: "Fiat", slug: "fiat", logo: "https://upload.wikimedia.org/wikipedia/commons/1/12/Fiat_Automobiles_logo.svg" },
    { nombre: "Nissan", slug: "nissan", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Nissan_logo.png" },
    { nombre: "Honda", slug: "honda", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg" },
    { nombre: "Citroën", slug: "citroen", logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Citroen_2021_Logo.svg" },
    { nombre: "Hyundai", slug: "hyundai", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg" },
    { nombre: "Jeep", slug: "jeep", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Jeep_logo.svg" },
    { nombre: "Audi", slug: "audi", logo: "https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg" },
    { nombre: "BMW", slug: "bmw", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg" },
    { nombre: "Mercedes-Benz", slug: "mercedes-benz", logo: "https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg" },
  ];

  return (
    <section className="w-full bg-transparent border-t border-transparent pt-16 pb-12 relative overflow-hidden">
      
      {/* ================= LUCES AMBIENTALES (SPATIAL UI) ================= */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-slate-300/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#0145F2]/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* ================= ENCABEZADO GLASSMORPHISM ================= */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 border-b border-gray-200/50 pb-6">
          <div>
            <span className="flex items-center gap-1.5 text-gray-500 bg-white/40 backdrop-blur-md border border-white/60 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm w-fit mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0145F2]" /> Respaldo Oficial
            </span>
            <h2 className="text-3xl md:text-4xl text-navy font-light tracking-tighter drop-shadow-sm">
              Buscá por <strong className="font-black bg-clip-text text-transparent bg-gradient-to-r from-navy to-[#0145F2]">marca</strong>
            </h2>
          </div>
          
          <Link 
            href="/marcas" 
            className="text-xs font-bold text-gray-500 bg-white/40 backdrop-blur-md border border-white/60 px-4 py-2 rounded-full hover:bg-white hover:text-primary hover:shadow-[0_8px_20px_rgba(1,69,242,0.1)] active:scale-95 transition-all flex items-center gap-1.5 w-fit group"
          >
            <span className="hidden sm:inline">Ver todas las marcas</span>
            <span className="inline sm:hidden">Ver todas</span>
            <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-[#0145F2] group-hover:text-white transition-colors ml-1">
              <ChevronRight className="w-3 h-3 transition-transform" />
            </span>
          </Link>
        </div>

        {/* ================= GRILLA DE MARCAS ANIMADA ================= */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-5"
        >
          {marcas.map((marca) => (
            <motion.div variants={itemVariants} key={marca.slug} className="h-full">
              <MarcaCard marca={marca} />
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}