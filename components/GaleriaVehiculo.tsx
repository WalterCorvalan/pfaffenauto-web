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

  // Si no hay imágenes, mostramos un placeholder elegante
  if (!imagenes || imagenes.length === 0) {
    return (
      <div className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] bg-gray-50/80 rounded-2xl flex flex-col items-center justify-center p-4 overflow-hidden border border-gray-100 shadow-sm text-gray-400">
        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
        <span className="text-xs font-bold uppercase tracking-widest">Sin imágenes</span>
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
    <div className="flex flex-col gap-4">
      {/* IMAGEN PRINCIPAL */}
      <div className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] bg-gray-50/80 rounded-2xl flex items-center justify-center p-4 md:p-10 overflow-hidden border border-gray-100 shadow-sm group">
        
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            src={imagenes[currentIndex]?.url_archivo}
            alt={`${altText} - Foto ${currentIndex + 1}`}
            className="w-full h-full object-contain mix-blend-multiply"
          />
        </AnimatePresence>

        {/* Sellos */}
        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-gray-200 shadow-sm">
          elcerokm.com
        </div>
        
        {/* Controles (Solo si hay más de 1 foto) */}
        {imagenes.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-navy p-2 md:p-3 rounded-full shadow-lg opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all border border-gray-200 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-navy p-2 md:p-3 rounded-full shadow-lg opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all border border-gray-200 active:scale-95"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            {/* Contador de fotos */}
            <div className="absolute bottom-4 right-4 bg-navy/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest">
              {currentIndex + 1} / {imagenes.length}
            </div>
          </>
        )}
      </div>

      {/* MINIATURAS (THUMBNAILS) */}
      {imagenes.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
          {imagenes.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-20 h-16 md:w-24 md:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                currentIndex === idx 
                  ? "border-[#0055A4] shadow-md opacity-100 ring-2 ring-[#0055A4]/20" 
                  : "border-transparent opacity-50 hover:opacity-100 bg-gray-100"
              }`}
            >
              <img src={img.url_archivo} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover mix-blend-multiply" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}