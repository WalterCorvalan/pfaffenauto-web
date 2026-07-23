"use client";
import React, { useState } from "react";
import Link from "next/link";

interface StockProps {
  vehiculos: any[] | null;
}

export default function Stock({ vehiculos }: StockProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Todas las marcas");

  const listaVehiculos = vehiculos || [];

  const marcasDisponibles = Array.from(
    new Set(listaVehiculos.map((auto) => auto.marca).filter(Boolean))
  );

  const vehiculosFiltrados = listaVehiculos.filter((auto) => {
    const query = searchTerm.toLowerCase().trim();
    const marcaAuto = auto.marca?.toLowerCase() || "";
    const modeloAuto = auto.modelo?.toLowerCase() || "";
    const textoCompleto = `${marcaAuto} ${modeloAuto}`;

    if (selectedBrand !== "Todas las marcas" && auto.marca !== selectedBrand) {
      return false;
    }

    if (!query) return true;

    const esPfaffenMatch = query.includes("fafen") || query.includes("pfafen");
    if (esPfaffenMatch) return true;

    return textoCompleto.includes(query);
  });

  const limpiarFiltros = () => {
    setSearchTerm("");
    setSelectedBrand("Todas las marcas");
  };

  return (
    <section id="stock" className="py-16 bg-[#050505] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#0145F2]/5 blur-[150px] rounded-full pointer-events-none z-0"></div>

      <div className="max-w-[90rem] mx-auto px-4 md:px-6 relative z-10">
        
        {/* ================= A. BUSCADOR PRINCIPAL ================= */}
        <div className="max-w-4xl mx-auto mb-6 relative z-20">
          <div className="flex items-center bg-[#09090b] border border-white/10 hover:border-[#0145F2]/50 transition-colors rounded-full p-1.5 pl-5 shadow-xl">
            <svg
              className="text-[#0145F2] w-4 h-4 mr-3 animate-pulse shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Buscá marca, modelo o probá "fafen", "Toyota", "SUV"...'
              className="bg-transparent border-none outline-none text-white text-xs md:text-sm w-full placeholder:text-gray-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="text-gray-400 hover:text-white text-xs px-2 transition-colors"
              >
                Limpiar
              </button>
            )}
            <button className="hidden sm:flex bg-[#0145F2] hover:bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest py-2.5 px-6 rounded-full transition-all items-center gap-2 shrink-0">
              Buscar &rarr;
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            <span className="text-gray-500 text-[9px] uppercase tracking-widest font-bold">
              Frecuentes:
            </span>
            {["Toyota", "Volkswagen", "Pick-up", "SUV"].map((tag, i) => (
              <button
                key={i}
                onClick={() => setSearchTerm(tag.toLowerCase())}
                className="bg-white/5 hover:bg-[#0145F2]/10 border border-white/10 text-gray-400 hover:text-white text-[9px] px-3 py-1 rounded-full transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ================= B. BARRA DE FILTROS COMPACTA ================= */}
        <div className="bg-[#09090b] border border-white/5 rounded-2xl p-4 mb-10 shadow-xl relative">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 flex-grow">
              <div className="relative group">
                <select 
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="bg-black/40 border border-white/5 text-gray-300 text-[11px] font-medium rounded-xl px-4 py-2.5 outline-none appearance-none cursor-pointer pr-8"
                >
                  <option value="Todas las marcas" className="bg-[#09090b]">Todas las marcas</option>
                  {marcasDisponibles.map((marca, idx) => (
                    <option key={idx} value={marca} className="bg-[#09090b]">
                      {marca}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={limpiarFiltros}
              className="text-[#0145F2] hover:text-white text-[10px] uppercase font-black tracking-widest transition-colors px-2 py-1"
            >
              Limpiar filtros
            </button>
          </div>
          <div className="mt-3 text-[9px] text-gray-500 font-medium uppercase tracking-widest">
            Mostrando <span className="text-white font-bold">{vehiculosFiltrados.length}</span> de {listaVehiculos.length} vehículos
          </div>
        </div>

        {/* ================= C. GRILLA DE 3 COLUMNAS PREMIUM ================= */}
        {vehiculosFiltrados.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 md:gap-6">
            {vehiculosFiltrados.map((auto) => (
              <div
                key={auto.id}
                className="bg-[#0A0F16] rounded-xl overflow-hidden border border-white/10 hover:border-[#0145F2]/60 transition-all duration-300 flex flex-col group shadow-2xl hover:shadow-[0_0_25px_rgba(1,69,242,0.15)]"
              >
                {/* Contenedor Imagen */}
                <Link href={`/catalogo/${auto.slug}`} className="relative h-[95px] sm:h-[160px] md:h-[220px] bg-black overflow-hidden block">
                  {auto.multimedia_vehiculos?.[0] && (
                    <img
                      src={auto.multimedia_vehiculos[0].url_archivo}
                      alt={`${auto.marca} ${auto.modelo}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F16] via-transparent to-black/30 pointer-events-none"></div>

                  {/* Badge Premium */}
                  <div className="absolute top-1.5 left-1.5 md:top-3 md:left-3 bg-[#0145F2] text-white px-1.5 py-0.5 rounded-md text-[7px] md:text-[9px] font-black uppercase tracking-widest shadow-md">
                    Premium
                  </div>

                  {auto.estado === "Reservado" && (
                    <div className="absolute top-1.5 right-1.5 md:top-3 md:right-3 bg-yellow-500 text-black px-1.5 py-0.5 rounded-md text-[7px] md:text-[9px] font-black uppercase tracking-widest shadow-md">
                      Reservado
                    </div>
                  )}
                </Link>

                {/* Info Vehículo */}
                <div className="p-2.5 sm:p-4 md:p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <Link href={`/catalogo/${auto.slug}`} className="block">
                      <h3 className="text-[10px] sm:text-xs md:text-lg font-black uppercase tracking-tight text-white group-hover:text-[#0145F2] transition-colors line-clamp-1">
                        {auto.marca} <span className="text-gray-600 font-normal hidden sm:inline">•</span> <span className="block sm:inline">{auto.modelo}</span>
                      </h3>
                    </Link>

                    {/* Especificaciones rápidas (Año y KM) para rellenar con elegancia */}
                    <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-400 font-medium mt-0.5 truncate">
                      {auto.anio} {auto.kilometraje ? `• ${auto.kilometraje.toLocaleString("es-AR")} km` : ""}
                    </p>
                  </div>

                  <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-white/5 flex flex-col gap-2">
                    <div>
                      <span className="text-[7px] sm:text-[9px] text-gray-500 uppercase tracking-widest font-bold hidden sm:block">
                        Precio contado
                      </span>
                      <span className="text-white font-black text-xs sm:text-sm md:text-xl tracking-tight font-mono">
                        ${auto.precio_publicado_ars?.toLocaleString("es-AR")}
                      </span>
                    </div>

                    <Link
                      href={`/catalogo/${auto.slug}`}
                      className="w-full text-center bg-white/5 hover:bg-[#0145F2] border border-white/10 hover:border-[#0145F2] text-white text-[8px] sm:text-[10px] font-black uppercase tracking-widest py-1.5 sm:py-2.5 rounded-lg transition-all shadow-sm"
                    >
                      Ver Unidad
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[#09090b] rounded-2xl border border-white/5">
            <h4 className="text-white font-bold text-sm mb-1">
              No se encontraron resultados
            </h4>
            <p className="text-gray-500 text-[11px] mb-4">
              Intentá buscar con otros términos o blanqueá los filtros.
            </p>
            <button
              onClick={limpiarFiltros}
              className="bg-[#0145F2] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full"
            >
              Ver todo el stock
            </button>
          </div>
        )}
      </div>
    </section>
  );
}