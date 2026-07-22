"use client";
import React, { useState } from "react";

interface StockProps {
  vehiculos: any[] | null;
}

export default function Stock({ vehiculos }: StockProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Todas las marcas");

  const listaVehiculos = vehiculos || [];

  // Extraemos marcas únicas de la base de datos para el filtro dinámicamente
  const marcasDisponibles = Array.from(
    new Set(listaVehiculos.map((auto) => auto.marca).filter(Boolean))
  );

  // Lógica de filtrado inteligente (Tolerante a errores y multi-criterio)
  const vehiculosFiltrados = listaVehiculos.filter((auto) => {
    const query = searchTerm.toLowerCase().trim();
    const marcaAuto = auto.marca?.toLowerCase() || "";
    const modeloAuto = auto.modelo?.toLowerCase() || "";
    const textoCompleto = `${marcaAuto} ${modeloAuto}`;

    // 1. Filtro por marca desde el selector desplegable
    if (selectedBrand !== "Todas las marcas" && auto.marca !== selectedBrand) {
      return false;
    }

    // 2. Si no hay texto en el buscador, pasa el filtro de marca
    if (!query) return true;

    // Protección de Typosquatting (Si escriben variaciones de marca de la casa o términos generales)
    const esPfaffenMatch = query.includes("fafen") || query.includes("pfafen");
    if (esPfaffenMatch) return true;

    // Coincidencia parcial flexible
    return textoCompleto.includes(query);
  });

  const limpiarFiltros = () => {
    setSearchTerm("");
    setSelectedBrand("Todas las marcas");
  };

  return (
    <section id="stock" className="py-24 bg-[#050505] relative overflow-hidden">
      {/* Brillo de fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#0145F2]/5 blur-[150px] rounded-full pointer-events-none z-0"></div>

      <div className="max-w-[90rem] mx-auto px-4 md:px-6 relative z-10">
        
        {/* ================= A. BUSCADOR PRINCIPAL (ESTILO AI) ================= */}
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

          {/* Sugerencias (Pills interactivos) */}
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

        {/* ================= B. BARRA DE FILTROS AVANZADA ================= */}
        <div className="bg-[#09090b] border border-white/5 rounded-[2rem] p-6 lg:p-8 mb-16 shadow-2xl relative">
          <div className="absolute top-6 right-6 w-1.5 h-1.5 rounded-full bg-[#0145F2] animate-pulse"></div>

          {/* Input secundario sincronizado */}
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

          {/* Selects de filtros */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 flex-grow">
              
              {/* Filtro Dinámico de Marcas */}
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

              {/* Filtros visuales estáticos (preparados para lógica futura si se requiere) */}
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

        {/* ================= C. ENCABEZADO DE RESULTADOS ================= */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
            <svg
              className="text-[#0145F2] w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.58 6.42a1 1 0 00-1.07-.15c-.17.08-1.52.74-2.88 2.3A5.4 5.4 0 0012 11c0-1.87-.58-3.41-1.72-4.57a7.25 7.25 0 00-3.83-2A9 9 0 005.1 8c-.62 1.4-.73 2.87-.33 4.31a5.62 5.62 0 001.35 2.59 5.89 5.89 0 011.08 1.45c.23.46.22.95-.03 1.48-.33.68-.9 1.05-1.7 1.1-.38.03-.64.38-.56.76.13.62.43 1.2.91 1.68C7.11 22.7 8.94 23.5 11 23.5c2.14 0 4.15-.84 5.66-2.36C18.17 19.63 19 17.62 19 15.5c0-2.82-1-5-1.42-9.08z" />
            </svg>
            Stock Seleccionado
          </h3>
          <a
            href="#stock"
            className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#0145F2] flex items-center gap-2 transition-colors"
          >
            Catálogo General <span className="animate-bounce">&darr;</span>
          </a>
        </div>

        {/* ================= D. GRILLA DE VEHÍCULOS ================= */}
        {vehiculosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehiculosFiltrados.map((auto) => (
              <div
                key={auto.id}
                className="bg-[#09090b] rounded-[1.5rem] overflow-hidden border border-white/5 hover:border-[#0145F2]/40 transition-all duration-300 flex flex-col group hover:shadow-[0_0_30px_rgba(1,69,242,0.1)]"
              >
                {/* Contenedor Imagen */}
                <div className="relative h-[250px] bg-gray-900 overflow-hidden">
                  {auto.multimedia_vehiculos?.[0] && (
                    <img
                      src={auto.multimedia_vehiculos[0].url_archivo}
                      alt={`${auto.marca} ${auto.modelo}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none"></div>

                  {/* Badge PREMIUM */}
                  <div className="absolute top-4 left-4 bg-[#0145F2] text-white px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest shadow-lg">
                    Premium
                  </div>

                  {/* Badge Estado si está reservado */}
                  {auto.estado === "Reservado" && (
                    <div className="absolute top-12 left-4 bg-[#D4AF37] text-black px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest shadow-lg">
                      Reservado
                    </div>
                  )}

                  {/* Iconos de Acción flotantes */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button aria-label="Compartir vehículo" className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-[#0145F2] hover:border-[#0145F2] transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </button>
                    <button aria-label="Comparar vehículo" className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-[#0145F2] hover:border-[#0145F2] transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                    </button>
                    <button aria-label="Agregar a favoritos" className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-pink-500 hover:bg-pink-500/20 hover:border-pink-500 transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                  </div>
                </div>

                {/* Info Vehículo */}
                <div className="p-6 md:p-8 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-[#0145F2] transition-colors">
                      {auto.marca} {auto.modelo}
                    </h3>
                  </div>

                  <p className="text-[11px] text-gray-500 uppercase tracking-widest font-medium mb-6">
                    {auto.sucursales?.nombre ? `Sucursal ${auto.sucursales.nombre}` : "Unidad Seleccionada"}
                  </p>

                  <div className="mt-auto">
                    <div className="text-2xl font-black text-white font-mono flex items-end gap-2">
                      ${auto.precio_ars?.toLocaleString()}
                      <span className="text-[10px] font-sans text-gray-500 font-bold uppercase tracking-widest mb-1">
                        ARS
                      </span>
                    </div>

                    {auto.precio_usd && (
                      <div className="text-[11px] font-bold text-[#0145F2] font-mono mt-1">
                        (US$ {auto.precio_usd?.toLocaleString()})
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
            <svg
              className="w-12 h-12 text-gray-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2_2 0 012 2v2M7 7h10"
              />
            </svg>
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