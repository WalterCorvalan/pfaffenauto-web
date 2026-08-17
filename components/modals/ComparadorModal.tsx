"use client";

import { X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const precioTexto = (auto: any) =>
  auto.precio_publicado_usd
    ? `US$ ${auto.precio_publicado_usd.toLocaleString("en-US")}`
    : `$ ${auto.precio_publicado_ars?.toLocaleString("es-AR")}`;

interface ComparadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  autos: any[];
  removerAuto: (id: string) => void;
}

export default function ComparadorModal({ isOpen, onClose, autos, removerAuto }: ComparadorModalProps) {
  if (!isOpen) return null;

  // Rellenamos hasta 3 espacios vacíos si hay menos de 3 autos seleccionados
  const auto1 = autos[0];
  const auto2 = autos[1] || null;
  const auto3 = autos[2] || null;

  const Row = ({ label, val1, val2, val3 }: { label: string; val1: React.ReactNode; val2: React.ReactNode; val3: React.ReactNode }) => (
    <div className="grid grid-cols-[24%_1fr_1fr_1fr] md:grid-cols-[18%_1fr_1fr_1fr] gap-1.5 md:gap-4 py-3 md:py-4 border-b border-white/5 items-center px-3 md:px-8">
      <span className="text-[8px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="text-[11px] md:text-sm font-bold text-white pr-1">{val1 || "-"}</span>
      <span className="text-[11px] md:text-sm font-bold text-white pr-1">{val2 || "-"}</span>
      <span className="text-[11px] md:text-sm font-bold text-white">{val3 || "-"}</span>
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
          className="relative w-full max-w-5xl max-h-[90vh] bg-[#121212] border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* BOTÓN CERRAR */}
          <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors backdrop-blur-md">
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* CABECERA (Fija arriba al scrollear) */}
          <div className="bg-gradient-to-b from-red-950/20 to-[#121212] pt-8 pb-4 md:pt-10 px-3 md:px-8 shrink-0 border-b border-white/10 sticky top-0 z-10">
            <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter mb-6">
              Comparativa <span className="text-gray-500 font-medium text-sm md:text-lg ml-2 lowercase tracking-normal">de hasta 3 autos</span>
            </h2>
            
            <div className="grid grid-cols-[24%_1fr_1fr_1fr] md:grid-cols-[18%_1fr_1fr_1fr] gap-1.5 md:gap-4 items-end">
              <div></div> {/* Espacio vacío para la columna de labels */}
              
              {/* AUTO 1 */}
              <div className="flex flex-col relative group">
                <button onClick={() => removerAuto(auto1.id)} className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"><X className="w-3 h-3"/></button>
                <div className="relative h-14 md:h-24 bg-white/5 rounded-xl overflow-hidden border border-white/10 mb-2 md:mb-3">
                  <Image src={auto1?.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"} alt={auto1?.modelo || ""} fill sizes="200px" className="object-cover" />
                </div>
                <h3 className="text-xs md:text-xl font-black text-white leading-tight truncate">{auto1?.marca} <br className="md:hidden"/>{auto1?.modelo}</h3>
              </div>

              {/* AUTO 2 */}
              <div className="flex flex-col relative group">
                {auto2 ? (
                  <>
                    <button onClick={() => removerAuto(auto2.id)} className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"><X className="w-3 h-3"/></button>
                    <div className="relative h-14 md:h-24 bg-white/5 rounded-xl overflow-hidden border border-white/10 mb-2 md:mb-3">
                      <Image src={auto2.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"} alt={auto2.modelo} fill sizes="200px" className="object-cover" />
                    </div>
                    <h3 className="text-xs md:text-xl font-black text-white leading-tight truncate">{auto2.marca} <br className="md:hidden"/>{auto2.modelo}</h3>
                  </>
                ) : (
                  <div className="h-14 md:h-24 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-white/5 p-2 text-center mb-2 md:mb-3">
                    <span className="text-[9px] md:text-xs text-gray-500 font-bold uppercase tracking-widest leading-tight">Seleccioná otro</span>
                  </div>
                )}
              </div>

              {/* AUTO 3 */}
              <div className="flex flex-col relative group">
                {auto3 ? (
                  <>
                    <button onClick={() => removerAuto(auto3.id)} className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden md:block"><X className="w-3 h-3"/></button>
                    <div className="relative h-14 md:h-24 bg-white/5 rounded-xl overflow-hidden border border-white/10 mb-2 md:mb-3">
                      <Image src={auto3.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"} alt={auto3.modelo} fill sizes="200px" className="object-cover" />
                    </div>
                    <h3 className="text-xs md:text-xl font-black text-white leading-tight truncate">{auto3.marca} <br className="md:hidden"/>{auto3.modelo}</h3>
                  </>
                ) : (
                  <div className="h-14 md:h-24 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-white/5 p-2 text-center mb-2 md:mb-3">
                    <span className="text-[9px] md:text-xs text-gray-500 font-bold uppercase tracking-widest leading-tight">Seleccioná otro</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABLA DE DATOS (Scrolleable) */}
          <div className="flex-1 overflow-y-auto pb-8 custom-scrollbar">
            <Row
              label="Precio"
              val1={auto1 ? <span className="text-xs md:text-lg text-white">{precioTexto(auto1)}</span> : null}
              val2={auto2 ? <span className="text-xs md:text-lg text-white">{precioTexto(auto2)}</span> : null}
              val3={auto3 ? <span className="text-xs md:text-lg text-white">{precioTexto(auto3)}</span> : null}
            />
            <Row label="Marca" val1={auto1?.marca} val2={auto2?.marca} val3={auto3?.marca} />
            <Row label="Modelo" val1={auto1?.modelo} val2={auto2?.modelo} val3={auto3?.modelo} />
            <Row label="Año" val1={auto1?.anio} val2={auto2?.anio} val3={auto3?.anio} />
            <Row label="KM" val1={`${auto1?.kilometraje?.toLocaleString("es-AR")} km`} val2={auto2 ? `${auto2.kilometraje?.toLocaleString("es-AR")} km` : null} val3={auto3 ? `${auto3.kilometraje?.toLocaleString("es-AR")} km` : null} />
            <Row label="Combustible" val1={auto1?.tipo_combustible || "-"} val2={auto2?.tipo_combustible || "-"} val3={auto3?.tipo_combustible || "-"} />
            <Row label="Transmisión" val1={auto1?.transmision || "-"} val2={auto2?.transmision || "-"} val3={auto3?.transmision || "-"} />
            <Row label="Tipo" val1={auto1?.tipo?.toUpperCase() || "-"} val2={auto2?.tipo?.toUpperCase() || "-"} val3={auto3?.tipo?.toUpperCase() || "-"} />
            <Row label="Condición" val1={auto1?.kilometraje === 0 ? "0KM" : "Usado"} val2={auto2 ? (auto2.kilometraje === 0 ? "0KM" : "Usado") : null} val3={auto3 ? (auto3.kilometraje === 0 ? "0KM" : "Usado") : null} />
            
            {/* ACCIÓN (BOTONES) */}
            <div className="grid grid-cols-[24%_1fr_1fr_1fr] md:grid-cols-[18%_1fr_1fr_1fr] gap-1.5 md:gap-4 py-6 border-b border-white/5 items-center px-3 md:px-8 mt-2">
              <span className="text-[8px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">Acción</span>
              <div>
                <Link href={`/catalogo/${auto1?.slug}`} className="inline-block bg-red-600 hover:bg-red-700 text-white text-[9px] md:text-xs font-bold uppercase tracking-widest px-2 py-2.5 md:px-6 md:py-4 rounded-full transition-colors text-center shadow-lg shadow-red-600/20 w-full">Ver Detalles</Link>
              </div>
              <div>
                {auto2 && <Link href={`/catalogo/${auto2.slug}`} className="inline-block bg-red-600 hover:bg-red-700 text-white text-[9px] md:text-xs font-bold uppercase tracking-widest px-2 py-2.5 md:px-6 md:py-4 rounded-full transition-colors text-center shadow-lg shadow-red-600/20 w-full">Ver Detalles</Link>}
              </div>
              <div>
                {auto3 && <Link href={`/catalogo/${auto3.slug}`} className="inline-block bg-red-600 hover:bg-red-700 text-white text-[9px] md:text-xs font-bold uppercase tracking-widest px-2 py-2.5 md:px-6 md:py-4 rounded-full transition-colors text-center shadow-lg shadow-red-600/20 w-full">Ver Detalles</Link>}
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}