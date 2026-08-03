"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GaleriaProps {
  imagenes: any[];
  altText: string;
}

export default function GaleriaVehiculo({ imagenes, altText }: GaleriaProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Si no hay imágenes, mostramos un placeholder elegante sin bordes
  if (!imagenes || imagenes.length === 0) {
    return (
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[520px] bg-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden text-gray-400">
        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
        <span className="text-xs font-black uppercase tracking-widest">Sin imágenes</span>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % imagenes.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? imagenes.length - 1 : prev - 1));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* IMAGEN PRINCIPAL AL 100% SIN BORDES REDONDEADOS */}
      <div className="relative w-full h-[300px] sm:h-[420px] md:h-[520px] bg-slate-950 overflow-hidden group">
        
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
            transition={{ duration: 0.3 }}
            src={imagenes[currentIndex]?.url_archivo}
            alt={`${altText} - Foto ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
        
        {/* Controles de navegación (Solo si hay más de 1 foto) */}
        {imagenes.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 backdrop-blur-md text-white p-3.5 rounded-full transition-all border border-white/20 active:scale-95 z-20 opacity-80 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 backdrop-blur-md text-white p-3.5 rounded-full transition-all border border-white/20 active:scale-95 z-20 opacity-80 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            {/* Contador de fotos */}
            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-widest z-20 border border-white/10">
              {currentIndex + 1} / {imagenes.length}
            </div>
          </>
        )}
      </div>

      {/* MINIATURAS (THUMBNAILS) SIN BORDES REDONDEADOS */}
      {imagenes.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar px-1">
          {imagenes.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-20 h-14 md:w-28 md:h-20 overflow-hidden shrink-0 transition-all ${
                currentIndex === idx 
                  ? "ring-2 ring-[#0145F2] opacity-100 scale-[1.02]" 
                  : "opacity-50 hover:opacity-100 grayscale hover:grayscale-0"
              }`}
            >
              <img src={img.url_archivo} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}