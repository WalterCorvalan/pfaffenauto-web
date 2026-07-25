"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ComparadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  autos: any[];
  removerAuto: (id: string) => void;
}

export default function ComparadorModal({ isOpen, onClose, autos, removerAuto }: ComparadorModalProps) {
  if (!isOpen) return null;

  // Rellenamos con un espacio vacío si solo hay 1 auto seleccionado
  const auto1 = autos[0];
  const auto2 = autos[1] || null;

  const Row = ({ label, val1, val2 }: { label: string; val1: React.ReactNode; val2: React.ReactNode }) => (
    <div className="grid grid-cols-[28%_1fr_1fr] md:grid-cols-[20%_1fr_1fr] gap-2 md:gap-4 py-3 md:py-4 border-b border-white/5 items-center px-4 md:px-8">
      <span className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="text-xs md:text-sm font-bold text-white pr-2">{val1 || "-"}</span>
      <span className="text-xs md:text-sm font-bold text-white">{val2 || "-"}</span>
    </div>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-6">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#121212] border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* BOTÓN CERRAR */}
          <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors backdrop-blur-md">
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* CABECERA (Fija arriba al scrollear) */}
          <div className="bg-gradient-to-b from-red-950/20 to-[#121212] pt-8 pb-4 md:pt-10 px-4 md:px-8 shrink-0 border-b border-white/10 sticky top-0 z-10">
            <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter mb-6">
              Comparativa <span className="text-gray-500 font-medium text-sm md:text-lg ml-2 lowercase tracking-normal">de 2 autos</span>
            </h2>
            
            <div className="grid grid-cols-[28%_1fr_1fr] md:grid-cols-[20%_1fr_1fr] gap-2 md:gap-4 items-end">
              <div></div> {/* Espacio vacío para la columna de labels */}
              
              {/* AUTO 1 */}
              <div className="flex flex-col relative group">
                <button onClick={() => removerAuto(auto1.id)} className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"><X className="w-3 h-3"/></button>
                <div className="h-16 md:h-24 bg-white/5 rounded-xl overflow-hidden border border-white/10 mb-2 md:mb-3">
                  <img src={auto1?.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"} alt={auto1?.modelo} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-sm md:text-xl font-black text-white leading-tight truncate">{auto1?.marca} <br className="md:hidden"/>{auto1?.modelo}</h3>
              </div>

              {/* AUTO 2 */}
              <div className="flex flex-col relative group">
                {auto2 ? (
                  <>
                    <button onClick={() => removerAuto(auto2.id)} className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"><X className="w-3 h-3"/></button>
                    <div className="h-16 md:h-24 bg-white/5 rounded-xl overflow-hidden border border-white/10 mb-2 md:mb-3">
                      <img src={auto2.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"} alt={auto2.modelo} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-sm md:text-xl font-black text-white leading-tight truncate">{auto2.marca} <br className="md:hidden"/>{auto2.modelo}</h3>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-white/5 p-4 text-center">
                    <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">Seleccioná otro vehículo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABLA DE DATOS (Scrolleable) */}
          <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
            <Row 
              label="Precio" 
              val1={<div className="flex flex-col"><span className="text-base md:text-lg text-white">${auto1?.precio_publicado_ars?.toLocaleString("es-AR")}</span>{auto1?.precio_publicado_usd && <span className="text-[9px] md:text-xs text-gray-400 font-medium">U$S {auto1.precio_publicado_usd.toLocaleString("en-US")}</span>}</div>} 
              val2={auto2 ? <div className="flex flex-col"><span className="text-base md:text-lg text-white">${auto2.precio_publicado_ars?.toLocaleString("es-AR")}</span>{auto2.precio_publicado_usd && <span className="text-[9px] md:text-xs text-gray-400 font-medium">U$S {auto2.precio_publicado_usd.toLocaleString("en-US")}</span>}</div> : null} 
            />
            <Row label="Marca" val1={auto1?.marca} val2={auto2?.marca} />
            <Row label="Modelo" val1={auto1?.modelo} val2={auto2?.modelo} />
            <Row label="Año" val1={auto1?.anio} val2={auto2?.anio} />
            <Row label="KM" val1={`${auto1?.kilometraje?.toLocaleString("es-AR")} km`} val2={auto2 ? `${auto2.kilometraje?.toLocaleString("es-AR")} km` : null} />
            <Row label="Combustible" val1={auto1?.tipo_combustible || "-"} val2={auto2?.tipo_combustible || "-"} />
            <Row label="Transmisión" val1={auto1?.transmision || "-"} val2={auto2?.transmision || "-"} />
            <Row label="Tipo" val1={auto1?.tipo?.toUpperCase() || "-"} val2={auto2?.tipo?.toUpperCase() || "-"} />
            <Row label="Condición" val1={auto1?.kilometraje === 0 ? "0KM" : "Usado"} val2={auto2 ? (auto2.kilometraje === 0 ? "0KM" : "Usado") : null} />
            
            {/* ACCIÓN (BOTONES) */}
            <div className="grid grid-cols-[28%_1fr_1fr] md:grid-cols-[20%_1fr_1fr] gap-2 md:gap-4 py-6 border-b border-white/5 items-center px-4 md:px-8 mt-2">
              <span className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Acción</span>
              <div>
                <Link href={`/catalogo/${auto1?.slug}`} className="inline-block bg-red-600 hover:bg-red-700 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-3 md:px-6 md:py-4 rounded-full transition-colors text-center shadow-lg shadow-red-600/20">Ver Detalles</Link>
              </div>
              <div>
                {auto2 && <Link href={`/catalogo/${auto2.slug}`} className="inline-block bg-red-600 hover:bg-red-700 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-3 md:px-6 md:py-4 rounded-full transition-colors text-center shadow-lg shadow-red-600/20">Ver Detalles</Link>}
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}