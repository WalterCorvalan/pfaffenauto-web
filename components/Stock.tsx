"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface StockProps {
  vehiculos: any[] | null;
}

export default function Stock({ vehiculos }: StockProps) {
  const [selectedBrand, setSelectedBrand] = useState("Todas");

  const listaVehiculos = vehiculos || [];

  const marcasDisponibles = Array.from(
    new Set(listaVehiculos.map((auto) => auto.marca).filter(Boolean))
  );

  // Filtramos por marca (el buscador de texto lo pasamos al Hero)
  const vehiculosFiltrados = listaVehiculos.filter((auto) => {
    if (selectedBrand !== "Todas" && auto.marca !== selectedBrand) {
      return false;
    }
    return true;
  });

  return (
    <section id="stock" className="py-16 bg-background relative">
      <div className="max-w-[90rem] mx-auto px-4 md:px-6">
        
        {/* ================= ENCABEZADO: LO MÁS BUSCADO ================= */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <h2 className="text-2xl md:text-3xl text-navy font-light tracking-tight">
            Lo más <strong className="font-black">buscado</strong>
          </h2>
          
          <div className="flex items-center gap-4">
            {/* Filtro rápido súper limpio */}
            <select 
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-lg px-3 py-1.5 outline-none appearance-none cursor-pointer shadow-sm hover:border-primary/50 transition-colors"
            >
              <option value="Todas">Filtrar marca</option>
              {marcasDisponibles.map((marca, idx) => (
                <option key={idx} value={marca as string}>
                  {marca as string}
                </option>
              ))}
            </select>

            <Link href="/catalogo" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 group">
              Ver catálogo <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ================= GRILLA DE TARJETAS BLANCAS ================= */}
        {vehiculosFiltrados.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {vehiculosFiltrados.map((auto) => (
              <Link href={`/catalogo/${auto.slug}`} key={auto.id} className="block group">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl transition-all duration-300">
                  
                  {/* Contenedor de Imagen (Fondo muy clarito para simular estudio) */}
                  <div className="relative h-[140px] sm:h-[180px] bg-gray-50/50 flex items-center justify-center overflow-hidden p-4">
                    {auto.multimedia_vehiculos?.[0] ? (
                      <img
                        src={auto.multimedia_vehiculos[0].url_archivo}
                        alt={`${auto.marca} ${auto.modelo}`}
                        // El mix-blend-multiply fusiona los fondos blancos de las fotos para crear un efecto silueta
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">Sin foto</div>
                    )}
                    
                    {/* Badge Reservado (Si aplica) */}
                    {auto.estado === "Reservado" && (
                      <div className="absolute top-3 right-3 bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-sm">
                        Reservado
                      </div>
                    )}
                  </div>

                  {/* Información del Vehículo */}
                  <div className="p-4 md:p-5 flex flex-col flex-grow">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                      {auto.marca}
                    </span>
                    <h3 className="text-base md:text-lg font-black text-navy leading-tight uppercase truncate">
                      {auto.modelo}
                    </h3>
                    <p className="text-[11px] md:text-xs text-gray-500 font-medium mt-1 line-clamp-1">
                      {auto.version || `${auto.anio} • ${auto.kilometraje?.toLocaleString("es-AR")} km`}
                    </p>
                    
                    {/* Precio alineado abajo */}
                    <div className="mt-auto pt-4 flex items-end justify-between">
                      <span className="text-base md:text-xl font-black text-navy tracking-tight">
                        $ {auto.precio_publicado_ars?.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="text-navy font-black text-lg mb-2">
              No hay unidades disponibles
            </h4>
            <p className="text-gray-500 text-sm mb-6">
              Por el momento no encontramos vehículos de esta marca.
            </p>
            <button
              onClick={() => setSelectedBrand("Todas")}
              className="bg-primary hover:bg-secondary text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full transition-colors"
            >
              Ver todo el stock
            </button>
          </div>
        )}
      </div>
    </section>
  );
}