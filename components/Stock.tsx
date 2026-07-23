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
    <section id="stock" className="py-24 bg-[#050505] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#0145F2]/5 blur-[150px] rounded-full pointer-events-none z-0"></div>

      <div className="max-w-[90rem] mx-auto px-4 md:px-6 relative z-10">
        
        {/* ================= A. BUSCADOR PRINCIPAL ================= */}
        <div className="max-w-4xl mx-auto mb-8 relative z-20">
          <div className="flex items-center bg-[#09090b] border border-white/10 hover:border-[#0145F2]/50 transition-colors rounded-full p-1.5 pl-6 shadow-2xl">
            <svg
              className="text-[#0145F2] w-5 h-5 mr-3 animate-pulse shrink-0"
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
                className="text-gray-400 hover:text-white text-xs px-3 transition-colors"
              >
                Limpiar
              </button>
            )}
            <button className="hidden sm:flex bg-[#0145F2] hover:bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest py-3.5 px-8 rounded-full transition-all shadow-[0_0_15px_rgba(1,69,242,0.4)] items-center gap-2 shrink-0">
              Buscar <span className="text-sm leading-none">&rarr;</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <span className="text-gray-500 text-[9px] uppercase tracking-widest font-bold">
              Búsquedas frecuentes:
            </span>
            {[
              "Toyota",
              "Volkswagen",
              "Pick-up",
              "SUV",
            ].map((tag, i) => (
              <button
                key={i}
                onClick={() => setSearchTerm(tag.toLowerCase())}
                className="bg-white/5 hover:bg-[#0145F2]/10 border border-white/10 hover:border-[#0145F2]/50 text-gray-400 hover:text-white text-[10px] px-4 py-1.5 rounded-full transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ================= B. BARRA DE FILTROS ================= */}
        <div className="bg-[#09090b] border border-white/5 rounded-[2rem] p-6 lg:p-8 mb-16 shadow-2xl relative">
          <div className="absolute top-6 right-6 w-1.5 h-1.5 rounded-full bg-[#0145F2] animate-pulse"></div>

          <div className="flex items-center border-b border-white/5 pb-4 mb-5">
            <svg
              className="w-5 h-5 text-gray-500 mr-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por palabra clave o modelo específico..."
              className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-gray-600"
            />
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 flex-grow">
              <div className="relative group">
                <select 
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="bg-black/40 border border-white/5 hover:border-white/20 text-gray-300 text-[11px] font-medium rounded-xl px-5 py-3 outline-none appearance-none cursor-pointer pr-10 transition-colors"
                >
                  <option value="Todas las marcas" className="bg-[#09090b]">Todas las marcas</option>
                  {marcasDisponibles.map((marca, idx) => (
                    <option key={idx} value={marca} className="bg-[#09090b]">
                      {marca}
                    </option>
                  ))}
                </select>
                <svg
                  className="w-3 h-3 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {["Cualquier año", "Transmisión", "Kilómetros", "Rango de precio"].map((filtro, i) => (
                <div key={i} className="relative group">
                  <select className="bg-black/40 border border-white/5 hover:border-white/20 text-gray-500 text-[11px] font-medium rounded-xl px-5 py-3 outline-none appearance-none cursor-pointer pr-10 transition-colors">
                    <option className="bg-[#09090b]">{filtro}</option>
                  </select>
                  <svg
                    className="w-3 h-3 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              ))}
            </div>

            <button 
              onClick={limpiarFiltros}
              className="flex items-center gap-2 text-[#0145F2] hover:text-white text-[10px] uppercase font-black tracking-widest transition-colors mt-4 lg:mt-0 px-4 py-2"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Limpiar filtros
            </button>
          </div>

          <div className="mt-6 text-[10px] text-gray-500 font-medium uppercase tracking-widest">
            Mostrando <span className="text-white font-bold">{vehiculosFiltrados.length}</span> de {listaVehiculos.length} vehículos disponibles
          </div>
        </div>

        {/* ================= C. GRILLA DE VEHÍCULOS ================= */}
        {vehiculosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehiculosFiltrados.map((auto) => (
              <div
                key={auto.id}
                className="bg-[#09090b] rounded-[1.5rem] overflow-hidden border border-white/5 hover:border-[#0145F2]/40 transition-all duration-300 flex flex-col group hover:shadow-[0_0_30px_rgba(1,69,242,0.1)]"
              >
                {/* Contenedor Imagen (Enlazado al Slug) */}
                <Link href={`/catalogo/${auto.slug}`} className="relative h-[250px] bg-gray-900 overflow-hidden block">
                  {auto.multimedia_vehiculos?.[0] && (
                    <img
                      src={auto.multimedia_vehiculos[0].url_archivo}
                      alt={`${auto.marca} ${auto.modelo}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none"></div>

                  <div className="absolute top-4 left-4 bg-[#0145F2] text-white px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest shadow-lg">
                    Premium
                  </div>

                  {auto.estado === "Reservado" && (
                    <div className="absolute top-12 left-4 bg-[#D4AF37] text-black px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest shadow-lg">
                      Reservado
                    </div>
                  )}
                </Link>

                {/* Info Vehículo */}
                <div className="p-6 md:p-8 flex-grow flex flex-col">
                  <Link href={`/catalogo/${auto.slug}`} className="block mb-2">
                    <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-[#0145F2] transition-colors">
                      {auto.marca} {auto.modelo}
                    </h3>
                  </Link>

                  <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium mb-6">
                    {auto.sucursales?.nombre ? `Sucursal ${auto.sucursales.nombre}` : "Unidad Seleccionada"}
                  </p>

                  <div className="mt-auto">
                    <div className="text-2xl font-black text-white font-mono flex items-end gap-2">
                      ${auto.precio_publicado_ars?.toLocaleString()}
                      <span className="text-[10px] font-sans text-gray-500 font-bold uppercase tracking-widest mb-1">
                        ARS
                      </span>
                    </div>

                    {auto.precio_publicado_usd && (
                      <div className="text-[11px] font-bold text-[#0145F2] font-mono mt-1">
                        (US$ {auto.precio_publicado_usd?.toLocaleString()})
                      </div>
                    )}
                  </div>

                  <div className="w-full h-[1px] bg-white/5 my-6"></div>

                  <a
                    href={`https://wa.me/5491100000000?text=Hola,%20me%20interesa%20el%20${auto.marca}%20${auto.modelo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-4 rounded-xl hover:bg-[#0145F2] hover:border-[#0145F2] text-white transition-all w-full flex justify-center items-center gap-2 shadow-lg"
                  >
                    Consultar Unidad
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#09090b] rounded-[2rem] border border-white/5">
            <h4 className="text-white font-bold text-lg mb-2">
              No se encontraron resultados
            </h4>
            <p className="text-gray-500 text-xs mb-6">
              Intentá buscar con otros términos o blanqueá los filtros aplicados.
            </p>
            <button
              onClick={limpiarFiltros}
              className="bg-[#0145F2] text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full transition-all"
            >
              Ver todo el stock
            </button>
          </div>
        )}
      </div>
    </section>
  );
}