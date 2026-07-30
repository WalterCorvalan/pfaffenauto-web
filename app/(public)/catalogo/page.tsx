"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search,
  ChevronDown,
  MapPin,
  SlidersHorizontal,
  X,
  Filter,
  Scale,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ComparadorModal from "@/components/ComparadorModal";
import BuscadorFallback from "@/components/BuscadorFallBack";

const ITEMS_POR_PAGINA = 12;

export default function CatalogoPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [isFallbackModalOpen, setIsFallbackModalOpen] = useState(false);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [orden, setOrden] = useState("Relevancia");

  // ================= ESTADOS DE FILTROS =================
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState<string[]>([]);
  const [sucursalesSeleccionadas, setSucursalesSeleccionadas] = useState<
    string[]
  >([]);
  const [transmisionesSeleccionadas, setTransmisionesSeleccionadas] = useState<
    string[]
  >([]);
  const [combustiblesSeleccionados, setCombustiblesSeleccionados] = useState<
    string[]
  >([]);
  const [traccionesSeleccionadas, setTraccionesSeleccionadas] = useState<
    string[]
  >([]);
  const [potenciasSeleccionadas, setPotenciasSeleccionadas] = useState<
    string[]
  >([]);
  const [plazasSeleccionadas, setPlazasSeleccionadas] = useState<number[]>([]);

  // Datos de base para los filtros (Sucursales se traen dinámicas)
  const [sucursalesDB, setSucursalesDB] = useState<
    { id: string; nombre: string }[]
  >([]);

  // ESTADOS DE PAGINACIÓN
  const [pagina, setPagina] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalResultados, setTotalResultados] = useState(0);

  // ESTADOS PARA EL COMPARADOR
  const [autosComparar, setAutosComparar] = useState<any[]>([]);
  const [modalComparadorOpen, setModalComparadorOpen] = useState(false);

  // Traer Sucursales al cargar
  useEffect(() => {
    supabase
      .from("sucursales")
      .select("id, nombre")
      .then(({ data }) => {
        if (data) setSucursalesDB(data);
      });
  }, []);

  // FUNCIÓN PRINCIPAL DE FETCH PROTEGIDA CONTRA DUPLICADOS
  const fetchVehiculos = async (
    pageIndex: number,
    reemplazar: boolean = false,
  ) => {
    if (reemplazar) setLoading(true);
    else setLoadingMore(true);

    let query = supabase
      .from("vehiculos")
      .select(
        `
        *,
        multimedia_vehiculos ( url_archivo ),
        sucursales ( nombre )
      `,
        { count: "exact" },
      )
      .in("estado", ["Disponible", "Reservado"]);

    // Filtros de texto y precio
    if (searchQuery)
      query = query.or(
        `marca.ilike.%${searchQuery}%,modelo.ilike.%${searchQuery}%`,
      );
    if (precioMin) query = query.gte("precio_publicado_ars", Number(precioMin));
    if (precioMax) query = query.lte("precio_publicado_ars", Number(precioMax));

    // Filtros de Arrays Exactos
    if (tiposSeleccionados.length > 0)
      query = query.in("tipo", tiposSeleccionados);
    if (marcasSeleccionadas.length > 0)
      query = query.in("marca", marcasSeleccionadas);
    if (sucursalesSeleccionadas.length > 0)
      query = query.in("sucursal_id", sucursalesSeleccionadas);
    if (transmisionesSeleccionadas.length > 0)
      query = query.in("transmision", transmisionesSeleccionadas);
    if (combustiblesSeleccionados.length > 0)
      query = query.in("tipo_combustible", combustiblesSeleccionados);
    if (traccionesSeleccionadas.length > 0)
      query = query.in("traccion", traccionesSeleccionadas);
    if (plazasSeleccionadas.length > 0)
      query = query.in("cantidad_plazas", plazasSeleccionadas);

    // Filtro Matemático (Potencia)
    if (potenciasSeleccionadas.length > 0) {
      const orConditions = [];
      if (potenciasSeleccionadas.includes("Hasta 120 CV"))
        orConditions.push("potencia_cv.lte.120");
      if (potenciasSeleccionadas.includes("120 - 180 CV"))
        orConditions.push("and(potencia_cv.gt.120,potencia_cv.lte.180)");
      if (potenciasSeleccionadas.includes("180+ CV"))
        orConditions.push("potencia_cv.gt.180");
      if (orConditions.length > 0) query = query.or(orConditions.join(","));
    }

    // Ordenamiento
    if (orden === "Menor precio")
      query = query.order("precio_publicado_ars", { ascending: true });
    else if (orden === "Mayor precio")
      query = query.order("precio_publicado_ars", { ascending: false });
    else if (orden === "Más nuevos")
      query = query.order("anio", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const from = pageIndex * ITEMS_POR_PAGINA;
    const to = from + ITEMS_POR_PAGINA - 1;
    query = query.range(from, to);

    const { data, count } = await query;

    if (data) {
      if (reemplazar) {
        setVehiculos(data);
      } else {
        setVehiculos((prev) => {
          const idsExistentes = new Set(prev.map((item) => item.id));
          const nuevosUnicos = data.filter(
            (item) => !idsExistentes.has(item.id),
          );
          return [...prev, ...nuevosUnicos];
        });
      }
      setHasMore(data.length === ITEMS_POR_PAGINA);
    }

    if (count !== null) setTotalResultados(count);

    setLoading(false);
    setLoadingMore(false);
  };

  // Disparador cuando cambian los filtros
  useEffect(() => {
    setPagina(0);
    fetchVehiculos(0, true);
  }, [
    searchQuery,
    precioMin,
    precioMax,
    tiposSeleccionados,
    orden,
    marcasSeleccionadas,
    sucursalesSeleccionadas,
    transmisionesSeleccionadas,
    combustiblesSeleccionados,
    traccionesSeleccionadas,
    potenciasSeleccionadas,
    plazasSeleccionadas,
  ]);

  const cargarMas = () => {
    const siguientePagina = pagina + 1;
    setPagina(siguientePagina);
    fetchVehiculos(siguientePagina, false);
  };

  const toggleArrayItem = (
    setState: React.Dispatch<React.SetStateAction<any[]>>,
    item: any,
  ) => {
    setState((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const toggleComparar = (e: React.MouseEvent, auto: any) => {
    e.preventDefault();
    e.stopPropagation();
    const yaEsta = autosComparar.find((a) => a.id === auto.id);
    if (yaEsta)
      setAutosComparar((prev) => prev.filter((a) => a.id !== auto.id));
    else if (autosComparar.length >= 2)
      setAutosComparar([autosComparar[1], auto]);
    else setAutosComparar((prev) => [...prev, auto]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-6 pb-20 font-sans text-foreground relative overflow-hidden">
      {/* ================= EFECTOS ESPACIALES DE FONDO ================= */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0145F2]/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        {/* ================= MIGAS DE PAN Y TÍTULO ================= */}
        <div className="mb-6">
          <div className="text-xs text-slate-400 font-medium mb-1">
            <Link href="/" className="hover:text-[#0145F2] transition-colors">
              Inicio
            </Link>{" "}
            / <span className="text-slate-600">Catálogo</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-light text-navy tracking-tighter">
            Catálogo de autos{" "}
            <strong className="font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0145F2] to-sky-400">
              0km y usados
            </strong>
          </h1>
        </div>

        {/* ================= BARRA DE FILTROS APLICADOS ================= */}
        <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-3xl p-4 mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mr-2">
              Filtros aplicados:
            </span>
            {searchQuery ? (
              <span className="inline-flex items-center gap-1.5 bg-white border border-sky-100 text-[#0145F2] shadow-sm text-xs font-bold px-4 py-1.5 rounded-full">
                Búsqueda: "{searchQuery}"
                <Link
                  href="/catalogo"
                  className="hover:text-red-500 transition-colors bg-sky-50 rounded-full p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </Link>
              </span>
            ) : (
              <span className="text-xs text-slate-400 italic">
                Ningún filtro activo.
              </span>
            )}
          </div>
          {searchQuery && (
            <Link
              href="/catalogo"
              className="text-xs font-bold text-[#0145F2] hover:underline active:scale-95 transition-transform"
            >
              Limpiar todo
            </Link>
          )}
        </div>

        {/* ================= CONTROLES SUPERIORES ================= */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 pb-4 border-b border-slate-200/50">
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <span className="text-sm font-medium text-slate-500">
              <strong className="text-navy font-black text-lg">
                {totalResultados}
              </strong>{" "}
              vehículos
            </span>

            <button
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm text-xs font-bold text-navy hover:bg-white active:scale-95 transition-all"
            >
              <Filter className="w-3.5 h-3.5 text-[#0145F2]" /> Filtros
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-3 md:px-4 py-1.5 rounded-full border border-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-[10px] md:text-xs font-bold text-slate-500">
              <span className="hidden sm:inline">Ordenar:</span>
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className="bg-transparent border-none outline-none text-navy font-black cursor-pointer appearance-none pr-1 focus:ring-0"
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
        <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
          {/* SIDEBAR PC */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-6">
            <FiltrosContent
              precioMin={precioMin}
              setPrecioMin={setPrecioMin}
              precioMax={precioMax}
              setPrecioMax={setPrecioMax}
              tiposSeleccionados={tiposSeleccionados}
              toggleTipo={(t: string) =>
                toggleArrayItem(setTiposSeleccionados, t)
              }
              marcasSeleccionadas={marcasSeleccionadas}
              toggleMarca={(m: string) =>
                toggleArrayItem(setMarcasSeleccionadas, m)
              }
              sucursalesSeleccionadas={sucursalesSeleccionadas}
              toggleSucursal={(s: string) =>
                toggleArrayItem(setSucursalesSeleccionadas, s)
              }
              transmisionesSeleccionadas={transmisionesSeleccionadas}
              toggleTransmision={(t: string) =>
                toggleArrayItem(setTransmisionesSeleccionadas, t)
              }
              combustiblesSeleccionados={combustiblesSeleccionados}
              toggleCombustible={(c: string) =>
                toggleArrayItem(setCombustiblesSeleccionados, c)
              }
              traccionesSeleccionadas={traccionesSeleccionadas}
              toggleTraccion={(t: string) =>
                toggleArrayItem(setTraccionesSeleccionadas, t)
              }
              potenciasSeleccionadas={potenciasSeleccionadas}
              togglePotencia={(p: string) =>
                toggleArrayItem(setPotenciasSeleccionadas, p)
              }
              plazasSeleccionadas={plazasSeleccionadas}
              togglePlazas={(p: number) =>
                toggleArrayItem(setPlazasSeleccionadas, p)
              }
              sucursalesDB={sucursalesDB}
            />
          </aside>

          {/* SIDEBAR MOBILE MODAL */}
          {isFilterOpen && (
            <div className="fixed inset-0 z-[60] flex lg:hidden">
              <div
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
                onClick={() => setIsFilterOpen(false)}
              ></div>
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-[280px] bg-white/95 backdrop-blur-2xl h-full shadow-2xl z-10 p-5 flex flex-col overflow-y-auto border-r border-white"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/50">
                  <h3 className="text-sm font-black text-navy uppercase tracking-tight">
                    Filtros
                  </h3>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-navy bg-white rounded-full border border-slate-100 shadow-sm active:scale-90 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <FiltrosContent
                    precioMin={precioMin}
                    setPrecioMin={setPrecioMin}
                    precioMax={precioMax}
                    setPrecioMax={setPrecioMax}
                    tiposSeleccionados={tiposSeleccionados}
                    toggleTipo={(t: string) =>
                      toggleArrayItem(setTiposSeleccionados, t)
                    }
                    marcasSeleccionadas={marcasSeleccionadas}
                    toggleMarca={(m: string) =>
                      toggleArrayItem(setMarcasSeleccionadas, m)
                    }
                    sucursalesSeleccionadas={sucursalesSeleccionadas}
                    toggleSucursal={(s: string) =>
                      toggleArrayItem(setSucursalesSeleccionadas, s)
                    }
                    transmisionesSeleccionadas={transmisionesSeleccionadas}
                    toggleTransmision={(t: string) =>
                      toggleArrayItem(setTransmisionesSeleccionadas, t)
                    }
                    combustiblesSeleccionados={combustiblesSeleccionados}
                    toggleCombustible={(c: string) =>
                      toggleArrayItem(setCombustiblesSeleccionados, c)
                    }
                    traccionesSeleccionadas={traccionesSeleccionadas}
                    toggleTraccion={(t: string) =>
                      toggleArrayItem(setTraccionesSeleccionadas, t)
                    }
                    potenciasSeleccionadas={potenciasSeleccionadas}
                    togglePotencia={(p: string) =>
                      toggleArrayItem(setPotenciasSeleccionadas, p)
                    }
                    plazasSeleccionadas={plazasSeleccionadas}
                    togglePlazas={(p: number) =>
                      toggleArrayItem(setPlazasSeleccionadas, p)
                    }
                    sucursalesDB={sucursalesDB}
                  />
                </div>

                <div className="pt-4 mt-auto">
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full bg-gradient-to-r from-[#0145F2] to-blue-600 hover:from-blue-600 hover:to-sky-500 active:scale-95 text-white font-bold text-[10px] uppercase tracking-widest py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-500/20"
                  >
                    Ver {totalResultados} resultados
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* ================= GRILLA DE AUTOS ================= */}
          <div className="flex-1 w-full flex flex-col">
            {loading ? (
              // SKELETONS INICIALES
              <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white/40 backdrop-blur-xl rounded-[20px] sm:rounded-3xl border border-white overflow-hidden flex flex-col h-full shadow-sm p-3 sm:p-4 animate-pulse"
                  >
                    <div className="h-[100px] sm:h-[180px] bg-slate-200/50 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 w-full"></div>
                    <div className="flex flex-col flex-grow">
                      <div className="h-2 sm:h-3 bg-slate-200 rounded-full w-1/3 mb-2 sm:mb-3"></div>
                      <div className="h-4 sm:h-6 bg-slate-300 rounded-full w-3/4 mb-3 sm:mb-4"></div>
                      <div className="mt-auto pt-2 sm:pt-3">
                        <div className="h-8 sm:h-11 bg-slate-200 rounded-xl sm:rounded-2xl w-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : vehiculos.length > 0 ? (
              <>
                {/* AUTOS CARGADOS */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.05 } },
                  }}
                  className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6 pb-8"
                >
                  {vehiculos.map((auto, index) => {
                    const estaSeleccionado = autosComparar.some(
                      (a) => a.id === auto.id,
                    );
                    return (
                      <motion.div
                        key={`${auto.id}-${index}`}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.4, ease: "easeOut" },
                          },
                        }}
                        className="h-full"
                      >
                        <Link
                          href={`/catalogo/${auto.slug}`}
                          className="block group h-full transition-transform duration-300 active:scale-[0.98]"
                        >
                          <div
                            className={`bg-white/70 backdrop-blur-2xl rounded-[20px] sm:rounded-[28px] overflow-hidden flex flex-col h-full shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgba(1,69,242,0.08)] hover:-translate-y-1 transition-all duration-500 relative border
                            ${estaSeleccionado ? "border-[#0145F2] ring-2 sm:ring-4 ring-[#0145F2]/10" : "border-white"}
                          `}
                          >
                            {/* BOTÓN COMPARAR */}
                            <button
                              onClick={(e) => toggleComparar(e, auto)}
                              className={`absolute top-2 left-2 sm:top-4 sm:left-4 z-10 p-1.5 sm:p-2.5 rounded-full shadow-md transition-all duration-300 border backdrop-blur-xl hover:scale-110 hover:rotate-3
                                ${estaSeleccionado ? "bg-[#0145F2] text-white border-[#0145F2]" : "bg-white/90 text-slate-400 hover:text-[#0145F2] border-white"}
                              `}
                              title="Comparar vehículo"
                            >
                              <Scale className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>

                            <div className="relative h-[110px] sm:h-[180px] bg-slate-50/50 p-1.5 sm:p-2 overflow-hidden">
                              <img
                                src={
                                  auto.multimedia_vehiculos?.[0]?.url_archivo ||
                                  "/placeholder.jpg"
                                }
                                alt={`${auto.marca} ${auto.modelo}`}
                                className="w-full h-full object-cover rounded-[14px] sm:rounded-[20px] group-hover:scale-105 transition-transform duration-700 mix-blend-multiply"
                              />

                              <div className="hidden sm:block absolute bottom-4 left-4 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white shadow-sm">
                                elcerokm.com
                              </div>

                              {auto.estado === "Reservado" && (
                                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-amber-400/95 backdrop-blur-md text-amber-950 border border-amber-300 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest shadow-sm">
                                  Reservado
                                </div>
                              )}
                            </div>

                            <div className="p-3 sm:p-6 flex flex-col flex-grow">
                              <span className="text-[9px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-0.5 sm:mb-1">
                                {auto.marca}
                              </span>
                              <h3 className="text-sm sm:text-xl font-black text-navy leading-tight uppercase line-clamp-1">
                                {auto.modelo}
                              </h3>

                              <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1.5 line-clamp-1">
                                {auto.version ||
                                  `${auto.tipo || "Vehículo"} • ${auto.transmision || "Manual"}`}
                              </p>

                              <div className="mt-auto pt-3 sm:pt-6">
                                <div className="bg-white/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-2 sm:p-4 mb-2 sm:mb-3 border border-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] group-hover:border-blue-50 transition-colors">
                                  <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">
                                    Desde
                                  </span>
                                  <span className="text-sm sm:text-2xl font-black text-navy tracking-tighter">
                                    ${" "}
                                    {auto.precio_publicado_ars?.toLocaleString(
                                      "es-AR",
                                    )}
                                  </span>
                                </div>

                                <button className="w-full bg-white text-[#0145F2] border border-blue-50 hover:bg-blue-50 hover:border-blue-100 font-black text-[9px] sm:text-[11px] uppercase tracking-widest py-2 sm:py-3.5 rounded-lg sm:rounded-xl transition-all shadow-sm">
                                  Ver detalles
                                </button>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* BOTÓN CARGAR MÁS */}
                {hasMore && (
                  <div className="flex justify-center pb-16">
                    <button
                      onClick={cargarMas}
                      disabled={loadingMore}
                      className="group flex items-center gap-2 bg-white/60 backdrop-blur-md border border-white hover:border-[#0145F2]/20 hover:bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg disabled:opacity-70 px-8 py-3.5 rounded-full text-navy font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#0145F2]" />
                          Cargando...
                        </>
                      ) : (
                        <>
                          Cargar más autos
                          <ChevronDown className="w-4 h-4 text-[#0145F2] group-hover:translate-y-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 sm:py-24 bg-white/60 backdrop-blur-xl rounded-[20px] sm:rounded-3xl border border-white shadow-sm px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                </div>
                <h3 className="text-navy font-black text-base sm:text-xl mb-2">No encontramos resultados</h3>
                <p className="text-slate-500 text-xs sm:text-sm mb-6 sm:mb-8 max-w-sm mx-auto">Probá ajustando los filtros o realizando otra búsqueda.</p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/catalogo" className="w-full sm:w-auto inline-block bg-white text-navy border border-gray-200 hover:bg-gray-50 active:scale-95 font-bold text-[10px] sm:text-xs uppercase tracking-widest px-6 sm:px-8 py-3.5 rounded-full transition-all shadow-sm">
                    Limpiar filtros
                  </Link>
                  
                  {/* BOTÓN PARA ABRIR EL POPUP */}
                  <button 
                    onClick={() => setIsFallbackModalOpen(true)}
                    className="w-full sm:w-auto inline-block bg-gradient-to-r from-[#0145F2] to-blue-600 hover:to-sky-500 active:scale-95 text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest px-6 sm:px-8 py-3.5 rounded-full transition-all shadow-lg shadow-blue-500/20"
                  >
                    Pedir auto a medida
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= BARRA FLOTANTE COMPARADOR ================= */}
      <AnimatePresence>
        {autosComparar.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 md:bottom-8 left-2 right-2 sm:left-4 sm:right-4 md:left-1/2 md:-translate-x-1/2 md:w-max z-50"
          >
            <div className="bg-[#0F172A]/90 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-full pl-3 pr-2 py-2 md:px-4 md:py-3 flex items-center justify-between gap-3 md:gap-8 ring-1 ring-white/5">
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <div className="flex -space-x-3">
                  {autosComparar.map((auto, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 md:w-12 md:h-12 rounded-full border-2 border-[#0F172A] overflow-hidden bg-white shadow-md shrink-0"
                    >
                      <img
                        src={
                          auto.multimedia_vehiculos?.[0]?.url_archivo ||
                          "/placeholder.jpg"
                        }
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {autosComparar.length === 1 && (
                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-full border-2 border-[#0F172A] border-dashed flex items-center justify-center bg-slate-800/50 text-slate-400 text-[10px] md:text-xs font-bold shrink-0">
                      +
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-white text-[10px] md:text-sm font-bold leading-none">
                    {autosComparar.length}{" "}
                    {autosComparar.length === 1 ? "auto" : "autos"}
                    <span className="hidden sm:inline"> listo(s)</span>
                  </span>
                  <span className="text-slate-400 text-[8px] md:text-[9px] uppercase tracking-widest hidden sm:block mt-1">
                    Comparador
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 md:gap-3 shrink-0">
                <button
                  onClick={() => setAutosComparar([])}
                  className="text-slate-400 hover:text-white px-2 py-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-colors rounded-full hover:bg-white/5"
                >
                  <X className="w-3.5 h-3.5 md:hidden" />
                  <span className="hidden md:inline">Limpiar</span>
                </button>
                <button
                  onClick={() => setModalComparadorOpen(true)}
                  disabled={autosComparar.length === 0}
                  className="bg-gradient-to-r from-[#0145F2] to-sky-500 hover:to-sky-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 text-white px-3 py-2 md:px-6 md:py-3 rounded-full text-[9px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 md:gap-2 shadow-lg shadow-blue-500/20 shrink-0 border border-blue-400/30"
                >
                  <Scale className="w-3.5 h-3.5 shrink-0" /> Comparar
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
        removerAuto={(id) =>
          setAutosComparar((prev) => prev.filter((a) => a.id !== id))
        }
      />
      {/* POPUP DE CAÍDA (CUANDO NO ENCUENTRA AUTO) */}
      <BuscadorFallback 
        isOpen={isFallbackModalOpen} 
        onClose={() => setIsFallbackModalOpen(false)} 
        busquedaPrevia={searchQuery}
      />
    </div>
  );
}

// ================= SIDEBAR COMPONENT =================
function FiltrosContent(props: any) {
  const LISTA_MARCAS = [
    "Audi",
    "BMW",
    "Chevrolet",
    "Citroën",
    "Fiat",
    "Ford",
    "Hyundai",
    "Jeep",
    "Kia",
    "Nissan",
    "Peugeot",
    "Renault",
    "Toyota",
    "Volkswagen",
  ];
  const LISTA_TIPOS = [
    "Auto",
    "Buses",
    "Cabriolet",
    "Camión",
    "Camioneta",
    "Casa Rodante",
    "Coupe",
    "Familiar",
    "Monovolumen",
    "Moto",
    "Pickup",
    "Rural 5 Puertas",
    "Sedan 3p",
    "Sedan 4p",
    "Sedan 5p",
    "Todo Terreno | SUV",
    "Utilitarios",
    "Van | Mini-Van",
  ];

  return (
    <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-[24px] md:rounded-[28px] p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.03)] pb-10 max-h-[85vh] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-5 md:mb-6 pb-3 md:pb-4 border-b border-slate-200/50 sticky top-0 bg-white/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-2 text-navy font-black uppercase tracking-widest text-[11px] md:text-xs">
          <SlidersHorizontal className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#0145F2]" />
          Filtros Avanzados
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 md:mb-2">
          Rango de Precio
        </label>
        <div className="space-y-2 md:space-y-3">
          <input
            type="number"
            placeholder="Desde $ (Mínimo)"
            value={props.precioMin}
            onChange={(e) => props.setPrecioMin(e.target.value)}
            className="w-full bg-white/50 backdrop-blur-md border border-white shadow-inner rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-xs font-bold text-navy outline-none focus:ring-4 focus:ring-[#0145F2]/10 placeholder:text-slate-400 transition-all"
          />
          <input
            type="number"
            placeholder="Hasta $ (Máximo)"
            value={props.precioMax}
            onChange={(e) => props.setPrecioMax(e.target.value)}
            className="w-full bg-white/50 backdrop-blur-md border border-white shadow-inner rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-xs font-bold text-navy outline-none focus:ring-4 focus:ring-[#0145F2]/10 placeholder:text-slate-400 transition-all"
          />
        </div>
      </div>

      <FilterSection
        title="Tipo de Auto"
        options={LISTA_TIPOS.map((t) => ({ label: t, value: t }))}
        selected={props.tiposSeleccionados}
        onToggle={props.toggleTipo}
      />
      <FilterSection
        title="Marca"
        options={LISTA_MARCAS.map((m) => ({ label: m, value: m }))}
        selected={props.marcasSeleccionadas}
        onToggle={props.toggleMarca}
      />
      <FilterSection
        title="Ubicación"
        options={props.sucursalesDB.map((s: any) => ({
          label: s.nombre,
          value: s.id,
        }))}
        selected={props.sucursalesSeleccionadas}
        onToggle={props.toggleSucursal}
      />
      <FilterSection
        title="Transmisión"
        options={[
          { label: "Manual", value: "Manual" },
          { label: "Automática", value: "Automática" },
        ]}
        selected={props.transmisionesSeleccionadas}
        onToggle={props.toggleTransmision}
      />
      <FilterSection
        title="Combustible"
        options={[
          { label: "Nafta", value: "Nafta" },
          { label: "Diesel", value: "Diesel" },
          { label: "Eléctrico", value: "Eléctrico" },
          { label: "GNC", value: "GNC" },
          { label: "Híbrido", value: "Híbrido" },
        ]}
        selected={props.combustiblesSeleccionados}
        onToggle={props.toggleCombustible}
      />
      <FilterSection
        title="Tracción"
        options={[
          { label: "4x2", value: "4x2" },
          { label: "4x4", value: "4x4" },
          { label: "Delantera", value: "Delantera" },
          { label: "Trasera", value: "Trasera" },
          { label: "Integral (AWD)", value: "Integral (AWD)" },
        ]}
        selected={props.traccionesSeleccionadas}
        onToggle={props.toggleTraccion}
      />
      <FilterSection
        title="Potencia (CV)"
        options={[
          { label: "Hasta 120 CV", value: "Hasta 120 CV" },
          { label: "120 - 180 CV", value: "120 - 180 CV" },
          { label: "180+ CV", value: "180+ CV" },
        ]}
        selected={props.potenciasSeleccionadas}
        onToggle={props.togglePotencia}
      />
      <FilterSection
        title="Cantidad de plazas"
        options={[2, 3, 4, 5, 6, 7].map((n) => ({
          label: `${n} Plazas`,
          value: n,
        }))}
        selected={props.plazasSeleccionadas}
        onToggle={props.togglePlazas}
      />
    </div>
  );
}

function FilterSection({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { label: string; value: any }[];
  selected: any[];
  onToggle: (val: any) => void;
}) {
  return (
    <div className="space-y-3 md:space-y-4 pt-5 md:pt-6 border-t border-slate-200/50">
      <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 md:mb-2">
        {title}
      </label>
      <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 space-y-2.5">
        {options.map((opt, idx) => (
          <label
            key={idx}
            className="flex items-center gap-2.5 md:gap-3 text-[11px] md:text-xs text-slate-600 font-bold cursor-pointer hover:text-navy transition-colors group"
          >
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => onToggle(opt.value)}
                className="peer w-4 h-4 md:w-5 md:h-5 rounded-[4px] md:rounded-md border-slate-300 text-[#0145F2] focus:ring-[#0145F2] transition-all bg-white shadow-inner cursor-pointer"
              />
            </div>
            <span className="group-hover:translate-x-1 transition-transform">
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
