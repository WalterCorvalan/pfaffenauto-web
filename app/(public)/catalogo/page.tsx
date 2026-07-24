"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // <-- ESTO FALTABA
import { Search, ChevronDown, MapPin, SlidersHorizontal, X, Filter } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CatalogoPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [orden, setOrden] = useState("Relevancia");

  // Filtros seleccionados
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);

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

  return (
    <div className="min-h-screen bg-background pt-6 pb-20 font-sans text-foreground">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* ================= MIGAS DE PAN Y TÍTULO ================= */}
        <div className="mb-6">
          <div className="text-xs text-gray-400 font-medium mb-1">
            <Link href="/" className="hover:text-primary">Inicio</Link> / <span className="text-gray-600">Catálogo</span>
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
                <Link href="/catalogo" className="hover:text-navy"><X className="w-3.5 h-3.5" /></Link>
              </span>
            ) : (
              <span className="text-xs text-gray-400 italic">Ningún filtro activo por el momento.</span>
            )}
          </div>
          {searchQuery && (
            <Link href="/catalogo" className="text-xs font-bold text-primary hover:underline">
              Limpiar todo
            </Link>
          )}
        </div>

        {/* ================= CONTROLES SUPERIORES (CON BOTÓN MÓVIL DE FILTROS) ================= */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 pb-4 border-b border-gray-200">
          
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <span className="text-sm font-bold text-gray-600">
              <strong className="text-navy">{totalResultados}</strong> autos disponibles
            </span>

            {/* Botón Filtros Mobile (Abre el Drawer) */}
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm text-xs font-bold text-navy hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-3.5 h-3.5 text-primary" /> Filtros
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle Crédito BNA */}
            <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
              <span>Crédito BNA</span>
              <input type="checkbox" className="sr-only peer" />
              <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary relative"></div>
            </label>

            {/* Toggle USD */}
            <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
              <span>USD</span>
              <input type="checkbox" className="sr-only peer" />
              <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary relative"></div>
            </label>

            {/* Ordenar por */}
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
          
          {/* ASIDE: FILTROS LATERALES (Escritorio) */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-6">
            <FiltrosContent 
              precioMin={precioMin} 
              setPrecioMin={setPrecioMin} 
              precioMax={precioMax} 
              setPrecioMax={setPrecioMax} 
              tiposSeleccionados={tiposSeleccionados} 
              toggleTipo={toggleTipo} 
            />
          </aside>

          {/* DRAWER / PANEL DE FILTROS MÓVIL */}
          {isFilterOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}></div>
              <div className="relative w-full max-w-xs bg-white h-full shadow-2xl z-10 p-6 flex flex-col overflow-y-auto">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <h3 className="text-base font-black text-navy uppercase tracking-tight">Filtros</h3>
                  <button onClick={() => setIsFilterOpen(false)} className="p-2 text-gray-400 hover:text-navy rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1">
                  <FiltrosContent 
                    precioMin={precioMin} 
                    setPrecioMin={setPrecioMin} 
                    precioMax={precioMax} 
                    setPrecioMax={setPrecioMax} 
                    tiposSeleccionados={tiposSeleccionados} 
                    toggleTipo={toggleTipo} 
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 mt-auto">
                  <button 
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full bg-primary hover:bg-secondary text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-colors shadow-md"
                  >
                    Ver resultados ({totalResultados})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GRILLA DE AUTOS */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-20 text-gray-400 font-medium">Cargando vehículos...</div>
            ) : vehiculos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {vehiculos.map((auto) => (
                  <Link href={`/catalogo/${auto.slug}`} key={auto.id} className="block group h-full">
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl transition-all duration-300">
                      
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
                        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                          {auto.marca}
                        </span>
                        <h3 className="text-xl font-black text-navy leading-tight uppercase truncate">
                          {auto.modelo}
                        </h3>
                        
                        <p className="text-xs text-gray-500 font-medium mt-1 line-clamp-1">
                          {auto.version || `${auto.tipo || "Vehículo"} • ${auto.transmision || "Manual"}`}
                        </p>

                        <div className="mt-auto pt-5">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">
                            Desde
                          </span>
                          <span className="text-xl md:text-2xl font-black text-navy tracking-tight">
                            $ {auto.precio_publicado_ars?.toLocaleString("es-AR")}
                          </span>
                        </div>
                      </div>

                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-navy font-black text-lg mb-2">No se encontraron vehículos</h3>
                <p className="text-gray-500 text-sm mb-6">Probá modificando los filtros o buscando con otros términos.</p>
                <Link href="/catalogo" className="bg-primary hover:bg-secondary text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full transition-colors">
                  Ver todo el catálogo
                </Link>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

// Componente interno para reutilizar los filtros en Escritorio y Mobile Drawer
function FiltrosContent({ 
  precioMin, 
  setPrecioMin, 
  precioMax, 
  setPrecioMax, 
  tiposSeleccionados, 
  toggleTipo 
}: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-navy font-black uppercase tracking-wider text-xs">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          Filtros de búsqueda
        </div>
      </div>

      {/* Rango de Precio */}
      <div className="space-y-3 mb-6">
        <label className="text-xs font-bold text-navy uppercase tracking-wider block">Precio (ARS)</label>
        <div className="space-y-2">
          <input 
            type="number" 
            placeholder="Desde" 
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-navy outline-none focus:border-primary"
          />
          <input 
            type="number" 
            placeholder="Hasta" 
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-navy outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Tipo de vehículo */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <label className="text-xs font-bold text-navy uppercase tracking-wider block">Tipo de auto</label>
        {["Hatchback", "Pick-up", "Sedán", "SUV", "Utilitario"].map((tipo, idx) => (
          <label key={idx} className="flex items-center gap-2 text-xs text-gray-600 font-medium cursor-pointer hover:text-navy">
            <input 
              type="checkbox" 
              checked={tiposSeleccionados.includes(tipo)}
              onChange={() => toggleTipo(tipo)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" 
            />
            {tipo}
          </label>
        ))}
      </div>
    </div>
  );
}