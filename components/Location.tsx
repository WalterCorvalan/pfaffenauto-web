"use client";

import { MapPin, Navigation, Car, Map } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

// ================= VARIANTES DE ANIMACIÓN =================
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(5px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 150, damping: 20 } 
  },
};

// ================= DATOS DE SUCURSALES =================
const sucursalesData = [
  {
    id: "casa-central",
    nombre: "Casa Central",
    direccion: "Casa Central, Buenos Aires",
    mapUrl: "https://maps.google.com/maps?q=Pfaffen+Autos,+Villa+de+Mayo,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es",
    stockLink: "/sucursales/casa-central",
    navLink: "https://maps.app.goo.gl/4ZMmpWJCarHcZ2sb9"
  },
  {
    id: "don-torcuato",
    nombre: "Don Torcuato",
    direccion: "Don Torcuato, Tigre",
    mapUrl: "https://maps.google.com/maps?q=Pfaffen+Autos,+Don+Torcuato,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es",
    stockLink: "/sucursales/don-torcuato",
    navLink: "https://maps.app.goo.gl/GuNBuUKT5xMFw5jR9"
  },
  {
    id: "olivos",
    nombre: "Olivos",
    direccion: "Olivos, Buenos Aires",
    mapUrl: "https://maps.google.com/maps?q=Pfaffen+Autos+Olivos,+Av.+Maipu+4182,+Olivos&t=m&z=16&output=embed&iwloc=near&hl=es",
    stockLink: "/sucursales/olivos",
    navLink: "https://maps.app.goo.gl/LZCyj4v4mBHBt3uu5"
  }
];

export default function Location() {
  return (
    <section className="py-24 bg-transparent border-t border-transparent relative overflow-hidden">
      
      {/* ================= LUCES AMBIENTALES (SPATIAL UI) ================= */}
      <div className="absolute top-[10%] left-[-5%] w-[600px] h-[600px] bg-sky-300/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#0145F2]/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* ================= ENCABEZADO GLASSMORPHISM ================= */}
        <div className="text-center mb-16 relative z-10">
          <span className="flex items-center justify-center gap-1.5 mx-auto text-[#0145F2] bg-blue-50/50 backdrop-blur-xl border border-blue-100/50 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.03)] w-fit mb-4">
            <Map className="w-3.5 h-3.5" /> Dónde encontrarnos
          </span>
          <h2 className="text-3xl md:text-5xl text-navy font-light tracking-tighter drop-shadow-sm">
            Nuestras <strong className="font-black bg-clip-text text-transparent bg-gradient-to-r from-navy to-[#0145F2]">Sucursales</strong>
          </h2>
        </div>

        {/* ================= GRILLA DE SUCURSALES ================= */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          {sucursalesData.map((sucursal) => (
            <motion.div variants={itemVariants} key={sucursal.id}>
              {/* Contenedor tipo Widget iOS (Cristal) */}
              <div className="bg-white/40 backdrop-blur-2xl rounded-[32px] border border-white/60 p-2.5 flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(1,69,242,0.12)] hover:border-white hover:bg-white/70 transition-all duration-500 group relative">
                
                {/* Reflejo de luz interior al hacer hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20 rounded-[32px]"></div>

                {/* Mapa SIN el filtro gris */}
                <div className="w-full h-[220px] rounded-[24px] overflow-hidden relative border border-white/40 shadow-inner bg-slate-100/50">
                  <iframe 
                    src={sucursal.mapUrl} 
                    className="w-full h-full border-0 transition-transform duration-700 group-hover:scale-105" 
                    loading="lazy" 
                    title={`Mapa ${sucursal.nombre}`}
                  ></iframe>
                </div>
                
                {/* Info y Botones */}
                <div className="p-5 flex flex-col flex-grow relative z-10">
                  <h3 className="text-xl font-black text-navy uppercase tracking-tight mb-1.5 drop-shadow-sm transition-colors">
                    {sucursal.nombre}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-8">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" /> 
                    <span>{sucursal.direccion}</span>
                  </div>
                  
                  <div className="mt-auto flex gap-3">
                    {/* Botón Stock Primario */}
                    <Link 
                      href={sucursal.stockLink} 
                      className="flex-1 bg-[#0145F2] hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(1,69,242,0.3)] hover:shadow-[0_8px_25px_rgba(1,69,242,0.4)] active:scale-95"
                    >
                      <Car className="w-4 h-4" /> Stock
                    </Link>
                    
                    {/* Botón Llegar Glass */}
                    <a 
                      href={sucursal.navLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex-1 bg-white/60 backdrop-blur-md border border-white/80 hover:bg-white text-navy hover:text-[#0145F2] text-[10px] font-black uppercase tracking-widest py-3.5 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-[0_8px_25px_rgba(0,0,0,0.05)] flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Navigation className="w-4 h-4" /> Llegar
                    </a>
                  </div>
                </div>

              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}