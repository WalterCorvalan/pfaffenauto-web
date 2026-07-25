"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { Search, ChevronDown, MapPin, SlidersHorizontal, X, Filter, Scale } from "lucide-react"; // <-- Agregamos Scale
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion"; 
import ComparadorModal from "@/components/ComparadorModal"; // <-- Importamos el Modal

export default function CatalogoPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [orden, setOrden] = useState("Relevancia");

  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);

  // NUEVO: ESTADOS PARA EL COMPARADOR
  const [autosComparar, setAutosComparar] = useState<any[]>([]);
  const [modalComparadorOpen, setModalComparadorOpen] = useState(false);

  useEffect(() => {
    async function fetchVehiculos() {
      setLoading(true);
      let query = supabase
        .from("vehiculos")
        .select(`
          *,
          multimedia_vehiculos ( url_archivo ),
          sucursales ( nombre )
        `)
        .in("estado", ["Disponible", "Reservado"]);

      if (searchQuery) {
        query = query.or(`marca.ilike.%${searchQuery}%,modelo.ilike.%${searchQuery}%`);
      }

      if (precioMin) query = query.gte("precio_publicado_ars", Number(precioMin));
      if (precioMax) query = query.lte("precio_publicado_ars", Number(precioMax));

      if (tiposSeleccionados.length > 0) {
        query = query.in("tipo", tiposSeleccionados);
      }

      if (orden === "Menor precio") query = query.order("precio_publicado_ars", { ascending: true });
      else if (orden === "Mayor precio") query = query.order("precio_publicado_ars", { ascending: false });
      else if (orden === "Más nuevos") query = query.order("anio", { ascending: false });
      else query = query.order("created_at", { ascending: false });

      const { data } = await query;
      if (data) setVehiculos(data);
      setLoading(false);
    }

    fetchVehiculos();
  }, [searchQuery, precioMin, precioMax, tiposSeleccionados, orden]);

  const totalResultados = vehiculos.length;

  const toggleTipo = (tipo: string) => {
    setTiposSeleccionados(prev => 
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  // NUEVO: LÓGICA PARA AGREGAR/QUITAR DEL COMPARADOR
  const toggleComparar = (e: React.MouseEvent, auto: any) => {
    e.preventDefault(); 
    e.stopPropagation();

    const yaEsta = autosComparar.find(a => a.id === auto.id);
    if (yaEsta) {
      setAutosComparar(prev => prev.filter(a => a.id !== auto.id));
    } else {
      if (autosComparar.length >= 2) {
        setAutosComparar([autosComparar[1], auto]);
      } else {
        setAutosComparar(prev => [...prev, auto]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pt-6 pb-20 font-sans text-foreground">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* ================= MIGAS DE PAN Y TÍTULO ================= */}
        <div className="mb-6">
          <div className="text-xs text-gray-400 font-medium mb-1">
            <Link href="/" className="hover:text-primary transition-colors">Inicio</Link> / <span className="text-gray-600">Catálogo</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-navy tracking-tight">
            Catálogo de autos 0km y usados en Argentina
          </h1>
        </div>

        {/* ================= BARRA DE FILTROS APLICADOS ================= */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mr-2">Filtros aplicados:</span>
            {searchQuery ? (
              <span className="inline-flex items-center gap-1.5 bg-sky-50 text-primary border border-sky-100 text-xs font-bold px-3 py-1 rounded-full">
                Búsqueda: "{searchQuery}"
                <Link href="/catalogo" className="hover:text-navy transition-colors"><X className="w-3.5 h-3.5" /></Link>
              </span>
            ) : (
              <span className="text-xs text-gray-400 italic">Ningún filtro activo por el momento.</span>
            )}
          </div>
          {searchQuery && (
            <Link href="/catalogo" className="text-xs font-bold text-primary hover:underline active:scale-95 transition-transform">
              Limpiar todo
            </Link>
          )}
        </div>

        {/* ================= CONTROLES SUPERIORES ================= */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 pb-4 border-b border-gray-200">
          
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <span className="text-sm font-bold text-gray-600">
              <strong className="text-navy">{totalResultados}</strong> autos disponibles
            </span>

            {/* Botón Filtros Mobile */}
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-xs font-bold text-navy hover:bg-gray-50 active:scale-95 transition-all"
            >
              <Filter className="w-3.5 h-3.5 text-primary" /> Filtros
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
              <span>Crédito BNA</span>
              <input type="checkbox" className="sr-only peer" />
              <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary relative"></div>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
              <span>USD</span>
              <input type="checkbox" className="sr-only peer" />
              <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary relative"></div>
            </label>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm text-xs font-bold text-gray-600">
              <span>Ordenar por:</span>
              <select 
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className="bg-transparent border-none outline-none text-navy font-bold cursor-pointer"
              >
                <option value="Relevancia">Relevancia</option>
                <option value="Menor precio">Menor precio</option>
                <option value="Mayor precio">Mayor precio</option>
                <option value="Más nuevos">Más nuevos</option>
              </select>
            </div>
          </div>
        </div>

        {/* ================= DISEÑO DE 2 COLUMNAS ================= */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          <aside className="hidden lg:block w-72 shrink-0 space-y-6">
            <FiltrosContent 
              precioMin={precioMin} setPrecioMin={setPrecioMin} 
              precioMax={precioMax} setPrecioMax={setPrecioMax} 
              tiposSeleccionados={tiposSeleccionados} toggleTipo={toggleTipo} 
            />
          </aside>

          {isFilterOpen && (
            <div className="fixed inset-0 z-[60] flex lg:hidden">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}></div>
              <div className="relative w-full max-w-xs bg-white h-full shadow-2xl z-10 p-6 flex flex-col overflow-y-auto">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <h3 className="text-base font-black text-navy uppercase tracking-tight">Filtros</h3>
                  <button onClick={() => setIsFilterOpen(false)} className="p-2 text-gray-400 hover:text-navy active:scale-90 rounded-full transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1">
                  <FiltrosContent 
                    precioMin={precioMin} setPrecioMin={setPrecioMin} 
                    precioMax={precioMax} setPrecioMax={setPrecioMax} 
                    tiposSeleccionados={tiposSeleccionados} toggleTipo={toggleTipo} 
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 mt-auto">
                  <button 
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full bg-primary hover:bg-secondary active:scale-95 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md"
                  >
                    Ver resultados ({totalResultados})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= GRILLA DE AUTOS ================= */}
          <div className="flex-1">
            {loading ? (
              // SKELETONS FANTASMAS MIENTRAS CARGA
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-full shadow-sm p-4 animate-pulse">
                    <div className="h-[150px] bg-gray-200 rounded-xl mb-4 w-full"></div>
                    <div className="flex flex-col flex-grow">
                      <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-6"></div>
                      <div className="mt-auto pt-3">
                        <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100">
                          <div className="h-2 bg-gray-200 rounded w-1/4 mb-2"></div>
                          <div className="h-6 bg-gray-300 rounded w-2/3"></div>
                        </div>
                        <div className="h-9 bg-gray-200 rounded-xl w-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : vehiculos.length > 0 ? (
              // AUTOS CARGADOS CON EFECTO STAGGER
              <motion.div 
                initial="hidden" animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 pb-16"
              >
                {vehiculos.map((auto) => {
                  const estaSeleccionado = autosComparar.some(a => a.id === auto.id);

                  return (
                    <motion.div 
                      key={auto.id} 
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                      }}
                    >
                      <Link href={`/catalogo/${auto.slug}`} className="block group h-full active:scale-[0.98] transition-transform">
                        <div className={`bg-white rounded-2xl border overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl transition-all duration-300 relative
                          ${estaSeleccionado ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'}
                        `}>
                          
                          {/* BOTÓN FLOTANTE COMPARAR */}
                          <button 
                            onClick={(e) => toggleComparar(e, auto)}
                            className={`absolute top-3 left-3 z-10 p-2 rounded-full shadow-md transition-colors border backdrop-blur-md hover:scale-110
                              ${estaSeleccionado ? 'bg-primary text-white border-primary' : 'bg-white/90 text-gray-400 hover:text-primary border-gray-200'}
                            `}
                            title="Comparar vehículo"
                          >
                            <Scale className="w-4 h-4" />
                          </button>

                          <div className="relative h-[180px] bg-gray-50 flex items-center justify-center overflow-hidden p-4">
                            <img
                              src={auto.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"}
                              alt={`${auto.marca} ${auto.modelo}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
                            />
                            <div className="absolute bottom-2 left-3 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-bold text-gray-500 uppercase tracking-widest border border-gray-100">
                              elcerokm.com
                            </div>
                            <div className="absolute bottom-2 right-3 text-[9px] font-medium text-gray-400 italic">
                              *Imagen ilustrativa
                            </div>

                            {auto.estado === "Reservado" && (
                              <div className="absolute top-3 right-3 bg-yellow-100 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm">
                                Reservado
                              </div>
                            )}
                          </div>

                          <div className="p-5 flex flex-col flex-grow">
                            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
                              {auto.marca}
                            </span>
                            <h3 className="text-xl font-black text-navy leading-tight uppercase truncate">
                              {auto.modelo}
                            </h3>
                            
                            <p className="text-xs text-gray-500 font-medium mt-1 line-clamp-1">
                              {auto.version || `${auto.tipo || "Vehículo"} • ${auto.transmision || "Manual"}`}
                            </p>

                            <div className="mt-auto pt-5">
                              <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3 mb-2.5 border border-gray-100">
                                <span className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-0.5">
                                  Desde
                                </span>
                                <span className="text-xl md:text-2xl font-black text-navy tracking-tight">
                                  $ {auto.precio_publicado_ars?.toLocaleString("es-AR")}
                                </span>
                              </div>

                              <button className="w-full bg-white text-primary border border-primary/30 hover:bg-sky-50 font-bold text-[10px] sm:text-xs uppercase tracking-widest py-2 sm:py-2.5 rounded-xl transition-colors">
                                Ver detalles
                              </button>
                            </div>
                          </div>

                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </motion.div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-navy font-black text-lg mb-2">No se encontraron vehículos</h3>
                <p className="text-gray-500 text-sm mb-6">Probá modificando los filtros o buscando con otros términos.</p>
                <Link href="/catalogo" className="bg-primary hover:bg-secondary active:scale-95 text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full transition-all">
                  Ver todo el catálogo
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ================= BARRA FLOTANTE COMPARADOR ================= */}
      <AnimatePresence>
        {autosComparar.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-28 md:bottom-6 left-2 right-2 sm:left-4 sm:right-4 md:left-1/2 md:-translate-x-1/2 md:w-max z-50"
          >
            <div className="bg-navy border border-gray-800 shadow-2xl shadow-navy/30 rounded-full pl-3 pr-2 py-2 md:px-4 md:py-3 flex items-center justify-between gap-2 md:gap-8 backdrop-blur-lg">
              
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <div className="flex -space-x-2 md:-space-x-3">
                  {autosComparar.map((auto, i) => (
                    <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-navy overflow-hidden bg-white shadow-sm shrink-0">
                      <img src={auto.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {autosComparar.length === 1 && (
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-navy border-dashed flex items-center justify-center bg-gray-800 text-gray-400 text-[10px] md:text-xs font-bold shrink-0">?</div>
                  )}
                </div>
                
                <div className="flex flex-col justify-center">
                  <span className="text-white text-[11px] md:text-sm font-bold leading-none">
                    {autosComparar.length} {autosComparar.length === 1 ? 'auto' : 'autos'}
                    {/* Ocultamos "seleccionado(s)" en celulares para que no se rompa el diseño */}
                    <span className="hidden sm:inline"> seleccionado(s)</span>
                  </span>
                  <span className="text-gray-400 text-[8px] md:text-[10px] uppercase tracking-widest hidden sm:block mt-0.5">Comparador activo</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 md:gap-4 shrink-0">
                <button 
                  onClick={() => setAutosComparar([])}
                  className="text-gray-400 hover:text-white px-2 py-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-colors"
                >
                  Limpiar
                </button>
                <button 
                  onClick={() => setModalComparadorOpen(true)}
                  disabled={autosComparar.length === 0}
                  className="bg-primary hover:bg-secondary disabled:bg-gray-700 disabled:text-gray-500 text-white px-3 py-2 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-lg shrink-0"
                >
                  <Scale className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" /> Comparar
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ComparadorModal 
        isOpen={modalComparadorOpen} 
        onClose={() => setModalComparadorOpen(false)} 
        autos={autosComparar} 
        removerAuto={(id) => setAutosComparar(prev => prev.filter(a => a.id !== id))}
      />

    </div>
  );
}

// Filtros Content (Igual que antes)
function FiltrosContent({ 
  precioMin, setPrecioMin, 
  precioMax, setPrecioMax, 
  tiposSeleccionados, toggleTipo 
}: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-navy font-black uppercase tracking-wider text-xs">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          Filtros de búsqueda
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <label className="text-xs font-bold text-navy uppercase tracking-wider block">Precio (ARS)</label>
        <div className="space-y-2">
          <input 
            type="number" 
            placeholder="Desde" 
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-navy outline-none focus:border-primary transition-colors"
          />
          <input 
            type="number" 
            placeholder="Hasta" 
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-navy outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-gray-100">
        <label className="text-xs font-bold text-navy uppercase tracking-wider block">Tipo de auto</label>
        {["Hatchback", "Pick-up", "Sedán", "SUV", "Utilitario"].map((tipo, idx) => (
          <label key={idx} className="flex items-center gap-2 text-xs text-gray-600 font-medium cursor-pointer hover:text-navy transition-colors">
            <input 
              type="checkbox" 
              checked={tiposSeleccionados.includes(tipo)}
              onChange={() => toggleTipo(tipo)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary transition-colors" 
            />
            {tipo}
          </label>
        ))}
      </div>
    </div>
  );
}