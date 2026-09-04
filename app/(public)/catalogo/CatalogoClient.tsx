"use client";

import { useState, useEffect, useRef } from "react";
import { supabase2 as supabase } from "@/lib/supabase2/client";
import {
  Search,
  ChevronDown,
  MapPin,
  SlidersHorizontal,
  X,
  Filter,
  Scale,
  Loader2,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ComparadorModal from "@/components/modals/ComparadorModal";
import BuscadorFallback from "@/components/BuscadorFallBack";
import { CAMPOS_VEHICULO_PUBLICO } from "@/lib/vehiculos";
import { VehicleCard } from "@/components/Stock";

const ITEMS_POR_PAGINA = 12;

export default function CatalogoClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams.get("q") || "";
  const condicionQuery = searchParams.get("condicion") || "";

  // Estado local para el nuevo buscador
  const [inputBuscador, setInputBuscador] = useState(searchQuery);

  const [isFallbackModalOpen, setIsFallbackModalOpen] = useState(false);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [orden, setOrden] = useState("Relevancia");

  // ================= ESTADOS DE FILTROS =================
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [precioMinUsd, setPrecioMinUsd] = useState("");
  const [precioMaxUsd, setPrecioMaxUsd] = useState("");
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState<string[]>([]);
  const [sucursalesSeleccionadas, setSucursalesSeleccionadas] = useState<string[]>([]);
  const [transmisionesSeleccionadas, setTransmisionesSeleccionadas] = useState<string[]>([]);
  const [combustiblesSeleccionados, setCombustiblesSeleccionados] = useState<string[]>([]);
  const [traccionesSeleccionadas, setTraccionesSeleccionadas] = useState<string[]>([]);
  const [potenciasSeleccionadas, setPotenciasSeleccionadas] = useState<string[]>([]);
  const [plazasSeleccionadas, setPlazasSeleccionadas] = useState<number[]>([]);

  // Datos de base para los filtros (Sucursales se traen dinámicas)
  const [sucursalesDB, setSucursalesDB] = useState<{ id: string; nombre: string }[]>([]);

  // ESTADOS DE PAGINACIÓN
  const [pagina, setPagina] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalResultados, setTotalResultados] = useState(0);

  // ESTADOS PARA EL COMPARADOR (Ahora soporta hasta 3 autos)
  const [autosComparar, setAutosComparar] = useState<any[]>([]);
  const [modalComparadorOpen, setModalComparadorOpen] = useState(false);

  // Evita loguear la misma búsqueda varias veces al tocar otros filtros
  const ultimoTerminoLogueado = useRef<string>("");

  // ================= BUSCADOR HÍBRIDO: fallback a IA cuando el match por texto no encuentra nada =================
  const [buscandoConIA, setBuscandoConIA] = useState(false);
  const [sugerenciaIA, setSugerenciaIA] = useState<string | null>(null);

  // Sincroniza el input si cambia la URL por fuera
  useEffect(() => {
    setInputBuscador(searchQuery);
  }, [searchQuery]);

  // Traer Sucursales al cargar
  useEffect(() => {
    supabase
      .from("sucursales")
      .select("id, nombre")
      .then(({ data }) => {
        if (data) setSucursalesDB(data);
      });
  }, []);

  // Lógica del nuevo buscador integrado
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (inputBuscador.trim()) {
      params.set("q", inputBuscador.trim());
    } else {
      params.delete("q");
    }
    router.push(`/catalogo?${params.toString()}`);
  };

  const aplicarSugerencia = (texto: string) => {
    setInputBuscador(texto);
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", texto);
    router.push(`/catalogo?${params.toString()}`);
  };

  // FUNCIÓN PRINCIPAL DE FETCH PROTEGIDA CONTRA DUPLICADOS
  const fetchVehiculos = async (
    pageIndex: number,
    reemplazar: boolean = false,
  ) => {
    if (reemplazar) setLoading(true);
    else setLoadingMore(true);

    let query = supabase
      .from("vehiculos")
      .select(CAMPOS_VEHICULO_PUBLICO, { count: "exact" })
      .in("estado", ["disponible", "reservado"]);

    // Filtros de texto, condición y precio
    const busquedaNormalizada = searchQuery.trim().toLowerCase();
    if (busquedaNormalizada === "0km" || busquedaNormalizada === "0 km") {
      query = query.eq("km", 0);
    } else if (busquedaNormalizada === "usados-seleccionados" || busquedaNormalizada === "autos-seleccionados") {
      // Todo el stock menos 0km y menos los de Outlet (mismo criterio de precio que usa /outlet).
      query = query.gt("km", 0).or("precio_publicado_ars.is.null,precio_publicado_ars.gte.10000000");
    } else if (searchQuery) {
      query = query.or(
        `marca.ilike.%${searchQuery}%,modelo.ilike.%${searchQuery}%,tipo.ilike.%${searchQuery}%,segmento.ilike.%${searchQuery}%`,
      );
    }

    if (condicionQuery) {
      if (condicionQuery === "0km") {
        query = query.eq("km", 0);
      } else if (condicionQuery === "usados") {
        query = query.gt("km", 0);
      }
    }

    if (precioMin) query = query.gte("precio_publicado_ars", Number(precioMin));
    if (precioMax) query = query.lte("precio_publicado_ars", Number(precioMax));
    
    // Filtros de Dólares
    if (precioMinUsd) query = query.gte("precio_publicado_usd", Number(precioMinUsd));
    if (precioMaxUsd) query = query.lte("precio_publicado_usd", Number(precioMaxUsd));

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
      query = query.in("combustible", combustiblesSeleccionados);
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
    const dataVehiculos = data as any[] | null;

    if (dataVehiculos) {
      if (reemplazar) {
        setVehiculos(dataVehiculos);
      } else {
        setVehiculos((prev) => {
          const idsExistentes = new Set(prev.map((item) => item.id));
          const nuevosUnicos = dataVehiculos.filter(
            (item) => !idsExistentes.has(item.id),
          );
          return [...prev, ...nuevosUnicos];
        });
      }
      setHasMore(dataVehiculos.length === ITEMS_POR_PAGINA);
    }

    if (count !== null) setTotalResultados(count);

    if (reemplazar && searchQuery && searchQuery !== ultimoTerminoLogueado.current) {
      ultimoTerminoLogueado.current = searchQuery;
      supabase
        .from("busquedas_log")
        .insert({ termino: searchQuery, resultados_encontrados: count ?? 0 })
        .then(({ error }) => {
          if (error) console.error("Error registrando búsqueda:", error);
        });
    }

    // Fallback a IA: si la búsqueda de texto plano no encontró nada y parece una frase (no una sola palabra)
    if (reemplazar && searchQuery && (count ?? 0) === 0 && searchQuery.trim().split(/\s+/).length >= 2) {
      buscarConIA(searchQuery);
    } else {
      setSugerenciaIA(null);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  const buscarConIA = async (termino: string) => {
    setBuscandoConIA(true);
    setSugerenciaIA(null);
    try {
      const res = await fetch("/api/buscar-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termino }),
      });
      const data = await res.json();
      if (res.ok && data.vehiculos?.length > 0) {
        setVehiculos(data.vehiculos);
        setTotalResultados(data.count);
        setHasMore(false);
        setSugerenciaIA(data.interpretacion.explicacion);
      }
    } catch (err) {
      console.error("Error en búsqueda con IA:", err);
    } finally {
      setBuscandoConIA(false);
    }
  };

  // Disparador cuando cambian los filtros
  useEffect(() => {
    setPagina(0);
    fetchVehiculos(0, true);
  }, [
    searchQuery,
    condicionQuery,
    precioMin,
    precioMax,
    precioMinUsd,
    precioMaxUsd,
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
    if (yaEsta) {
      setAutosComparar((prev) => prev.filter((a) => a.id !== auto.id));
    } else if (autosComparar.length >= 3) {
      setAutosComparar((prev) => [...prev.slice(1), auto]); // Quita el primero y agrega el nuevo al final
    } else {
      setAutosComparar((prev) => [...prev, auto]);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0f] pt-6 pb-20 font-sans text-gray-900 dark:text-white">

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* ================= MIGAS DE PAN Y BUSCADOR INTELIGENTE ================= */}
        <div className="mb-8">
          <div className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-4">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Inicio
            </Link>{" "}
            / <span className="text-gray-700 dark:text-slate-300">Catálogo</span>
          </div>
          
          <form onSubmit={handleSearchSubmit} className="w-full max-w-3xl mx-auto">
            <div className="relative flex items-center w-full bg-white dark:bg-[#161821] rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-gray-200 dark:border-white/15 hover:shadow-md transition-shadow overflow-hidden p-1.5 group focus-within:border-[#0145F2]/40 focus-within:ring-4 focus-within:ring-[#0145F2]/10">
              <div className="pl-4 pr-3 text-[#0145F2] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={inputBuscador}
                onChange={(e) => setInputBuscador(e.target.value)}
                placeholder='Buscá como hablás: "SUV diésel automática"'
                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 font-medium text-sm md:text-base w-full"
              />
              <button
                type="submit"
                className="shrink-0 bg-[#0145F2] hover:bg-blue-700 text-white rounded-full w-10 h-10 md:w-auto md:px-6 md:h-12 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all active:scale-95"
              >
                <span className="hidden md:inline">Buscar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4 md:ml-2">
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest mr-1">Probá:</span>
              <button
                type="button"
                onClick={() => aplicarSugerencia("Pick-up 4x4 diésel")}
                className="px-3.5 py-1.5 bg-white dark:bg-[#161821] border border-gray-200 dark:border-white/15 text-gray-600 dark:text-slate-400 rounded-full text-[11px] font-bold hover:border-[#0145F2] hover:text-[#0145F2] transition-colors shadow-sm"
              >
                Pick-up 4x4 diésel
              </button>
              <button
                type="button"
                onClick={() => aplicarSugerencia("Auto automático hasta USD 25.000")}
                className="px-3.5 py-1.5 bg-white dark:bg-[#161821] border border-gray-200 dark:border-white/15 text-gray-600 dark:text-slate-400 rounded-full text-[11px] font-bold hover:border-[#0145F2] hover:text-[#0145F2] transition-colors shadow-sm"
              >
                Auto automático hasta USD 25.000
              </button>
              <button
                type="button"
                onClick={() => aplicarSugerencia("SUV 2022 o más nueva")}
                className="px-3.5 py-1.5 bg-white dark:bg-[#161821] border border-gray-200 dark:border-white/15 text-gray-600 dark:text-slate-400 rounded-full text-[11px] font-bold hover:border-[#0145F2] hover:text-[#0145F2] transition-colors shadow-sm"
              >
                SUV 2022 o más nueva
              </button>
            </div>
          </form>
        </div>

        {/* ================= BARRA DE FILTROS APLICADOS ================= */}
        <div className="bg-white dark:bg-[#161821] border border-gray-200 dark:border-white/15 rounded-2xl p-4 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider mr-2">
              Filtros aplicados:
            </span>
            {searchQuery ? (
              <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-sky-400/10 border border-blue-200 dark:border-sky-400/20 text-blue-700 dark:text-sky-300 text-xs font-bold px-3 py-1.5 rounded-full">
                {searchQuery.toLowerCase() === "usados-seleccionados" || searchQuery.toLowerCase() === "autos-seleccionados"
                  ? "Usados Seleccionados"
                  : `Búsqueda: "${searchQuery}"`}
                <Link
                  href={condicionQuery ? `/catalogo?condicion=${condicionQuery}` : "/catalogo"}
                  className="hover:bg-blue-100 hover:text-red-500 transition-colors rounded-full p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </Link>
              </span>
            ) : null}

            {condicionQuery ? (
              <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-sky-400/10 border border-blue-200 dark:border-sky-400/20 text-blue-700 dark:text-sky-300 text-xs font-bold px-3 py-1.5 rounded-full">
                Condición: {condicionQuery === "0km" ? "0KM" : "Usados Seleccionados"}
                <Link
                  href={searchQuery ? `/catalogo?q=${searchQuery}` : "/catalogo"}
                  className="hover:bg-blue-100 hover:text-red-500 transition-colors rounded-full p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </Link>
              </span>
            ) : null}

            {!searchQuery && !condicionQuery && (
              <span className="text-xs text-gray-400 dark:text-slate-500 italic">
                Ningún filtro activo.
              </span>
            )}
          </div>
          {(searchQuery || condicionQuery) && (
            <Link
              href="/catalogo"
              className="text-xs font-bold text-blue-600 hover:underline transition-all"
            >
              Limpiar todo
            </Link>
          )}
        </div>

        {/* ================= BANNER BUSCADOR IA ================= */}
        {buscandoConIA && (
          <div className="mb-6 bg-indigo-50 dark:bg-indigo-400/10 border border-indigo-200 dark:border-indigo-400/20 rounded-2xl p-4 flex items-center gap-3 text-sm text-indigo-700 dark:text-indigo-300 font-medium">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            No encontramos nada exacto, dejá que la IA interprete tu búsqueda...
          </div>
        )}
        {sugerenciaIA && !buscandoConIA && (
          <div className="mb-6 bg-indigo-50 dark:bg-indigo-400/10 border border-indigo-200 dark:border-indigo-400/20 rounded-2xl p-4 flex items-center gap-3 text-sm text-indigo-700 dark:text-indigo-300 font-medium">
            <Sparkles className="w-4 h-4 shrink-0" />
            🤖 {sugerenciaIA}
          </div>
        )}

        {/* ================= CONTROLES SUPERIORES ================= */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 pb-4 border-b border-gray-200 dark:border-white/15">
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">
              <strong className="text-gray-900 dark:text-white font-black text-lg">
                {totalResultados}
              </strong>{" "}
              vehículos encontrados
            </span>

            <button
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 bg-white dark:bg-[#161821] px-4 py-2 rounded-lg border border-gray-300 dark:border-white/15 shadow-sm text-xs font-bold text-gray-900 dark:text-white active:scale-95 transition-all"
            >
              <Filter className="w-4 h-4 text-blue-600" /> Filtros
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-[#161821] px-4 py-2 rounded-lg border border-gray-200 dark:border-white/15 shadow-sm text-xs font-bold text-gray-600 dark:text-slate-400">
              <span className="hidden sm:inline">Ordenar por:</span>
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className="bg-transparent border-none outline-none text-gray-900 dark:text-white font-black cursor-pointer appearance-none pr-4 focus:ring-0"
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
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          
          {/* SIDEBAR PC */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-6">
            <FiltrosContent
              precioMin={precioMin}
              setPrecioMin={setPrecioMin}
              precioMax={precioMax}
              setPrecioMax={setPrecioMax}
              precioMinUsd={precioMinUsd}
              setPrecioMinUsd={setPrecioMinUsd}
              precioMaxUsd={precioMaxUsd}
              setPrecioMaxUsd={setPrecioMaxUsd}
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
                className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
                onClick={() => setIsFilterOpen(false)}
              ></div>
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-[300px] bg-white dark:bg-[#161821] h-full shadow-2xl z-10 p-5 flex flex-col overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-white/15">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                    Filtros
                  </h3>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-900 bg-gray-100 dark:bg-white/10 rounded-lg active:scale-95 transition-all"
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
                    precioMinUsd={precioMinUsd}
                    setPrecioMinUsd={setPrecioMinUsd}
                    precioMaxUsd={precioMaxUsd}
                    setPrecioMaxUsd={setPrecioMaxUsd}
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

                <div className="pt-4 mt-auto border-t border-gray-200 dark:border-white/15 bg-white dark:bg-[#161821] sticky bottom-0">
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all"
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
              // SKELETONS INICIALES (Sólidos)
              // CAMBIO ACÁ: grid-cols-2 para móvil por defecto
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pb-8">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-[#161821] rounded-2xl border border-gray-200 dark:border-white/15 overflow-hidden flex flex-col h-full p-4 animate-pulse"
                  >
                    <div className="h-32 sm:h-40 bg-gray-200 dark:bg-white/10 rounded-xl mb-4 w-full"></div>
                    <div className="flex flex-col flex-grow">
                      <div className="h-3 bg-gray-200 dark:bg-white/10 rounded-full w-1/3 mb-3"></div>
                      <div className="h-5 bg-gray-300 rounded-full w-3/4 mb-4"></div>
                      <div className="mt-auto pt-3">
                        <div className="h-6 bg-gray-200 dark:bg-white/10 rounded-xl w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : vehiculos.length > 0 ? (
              <>
                {/* AUTOS CARGADOS */}
                {/* CAMBIO ACÁ: grid-cols-2 para móvil por defecto */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pb-8 w-full">
                  {vehiculos.map((auto, index) => (
                    <VehicleCard
                      key={`${auto.id}-${index}`}
                      auto={auto}
                      estaSeleccionado={autosComparar.some((a) => a.id === auto.id)}
                      onToggleComparar={toggleComparar}
                    />
                  ))}
                </div>

                {/* BOTÓN CARGAR MÁS */}
                {hasMore && (
                  <div className="flex justify-center pb-16">
                    <button
                      onClick={cargarMas}
                      disabled={loadingMore}
                      className="flex items-center gap-2 bg-white dark:bg-[#161821] border border-gray-300 dark:border-white/15 hover:border-blue-600 hover:text-blue-600 shadow-sm hover:shadow px-8 py-3.5 rounded-xl text-gray-700 dark:text-slate-300 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
                        </>
                      ) : (
                        <>
                          Cargar más autos
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-[#161821] rounded-3xl border border-gray-200 dark:border-white/15 shadow-sm px-4">
                <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-white/15">
                  <Search className="w-6 h-6 text-gray-400 dark:text-slate-500" />
                </div>
                <h3 className="text-gray-900 dark:text-white font-black text-xl mb-2">No encontramos resultados</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-8 max-w-sm mx-auto">Probá ajustando los filtros o realizando otra búsqueda.</p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/catalogo" className="w-full sm:w-auto bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white border border-gray-200 dark:border-white/15 hover:bg-gray-200 font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all shadow-sm">
                    Limpiar filtros
                  </Link>
                  <button 
                    onClick={() => setIsFallbackModalOpen(true)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    Pedir auto a medida
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= BARRA FLOTANTE COMPARADOR (HASTA 3 AUTOS) ================= */}
      <AnimatePresence>
        {autosComparar.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-max z-50"
          >
            <div className="bg-gray-900 shadow-2xl rounded-2xl pl-4 pr-3 py-3 md:px-5 md:py-3.5 flex items-center justify-between gap-4 md:gap-8 border border-gray-700">
              <div className="flex items-center gap-3 md:gap-4 shrink-0">
                <div className="flex -space-x-3">
                  {autosComparar.map((auto, i) => (
                    <div
                      key={i}
                      className="relative w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-gray-900 overflow-hidden bg-white dark:bg-[#161821] shadow-sm shrink-0"
                    >
                      <Image
                        src={
                          auto.fotos?.[0] ||
                          "/placeholder.jpg"
                        }
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                  {/* Slots vacíos si hay menos de 3 */}
                  {autosComparar.length < 3 && (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center bg-gray-800 text-gray-500 dark:text-slate-400 text-xs font-bold shrink-0">
                      +
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-white text-[11px] md:text-sm font-bold leading-none">
                    {autosComparar.length} / 3
                    <span className="hidden sm:inline"> listos</span>
                  </span>
                  <span className="text-gray-400 dark:text-slate-500 text-[9px] uppercase tracking-widest hidden sm:block mt-1">
                    Comparador
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setAutosComparar([])}
                  className="text-gray-400 dark:text-slate-500 hover:text-white px-2 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-lg hover:bg-white/10"
                >
                  <X className="w-4 h-4 md:hidden" />
                  <span className="hidden md:inline">Limpiar</span>
                </button>
                <button
                  onClick={() => setModalComparadorOpen(true)}
                  disabled={autosComparar.length === 0}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95"
                >
                  <Scale className="w-4 h-4 shrink-0" /> Comparar
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

// ================= SIDEBAR COMPONENT (SÓLIDO) =================
function FiltrosContent(props: any) {
  const LISTA_MARCAS = [
    "Audi", "BMW", "Chevrolet", "Citroën", "Fiat", "Ford", "Hyundai", 
    "Jeep", "Kia", "Nissan", "Peugeot", "Renault", "Toyota", "Volkswagen"
  ];
  
  const LISTA_TIPOS = ["SUV", "Hatchback", "Pickup", "Sedán", "Auto", "Utilitarios"];

  return (
    <div className="bg-white dark:bg-[#161821] border border-gray-200 dark:border-white/15 rounded-2xl p-6 shadow-sm pb-10 max-h-[85vh] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-white/15 sticky top-0 bg-white dark:bg-[#161821] z-10">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-black uppercase tracking-widest text-xs">
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          Filtros Avanzados
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest block">
          Precio en Pesos (ARS)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Desde $"
            value={props.precioMin}
            onChange={(e) => props.setPrecioMin(e.target.value)}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/15 rounded-lg px-3 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:bg-white focus:border-blue-500 transition-colors placeholder:font-medium"
          />
          <input
            type="number"
            placeholder="Hasta $"
            value={props.precioMax}
            onChange={(e) => props.setPrecioMax(e.target.value)}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/15 rounded-lg px-3 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:bg-white focus:border-blue-500 transition-colors placeholder:font-medium"
          />
        </div>
      </div>

      <div className="space-y-4 mb-6 pb-6 border-b border-gray-100 dark:border-white/15">
        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest block">
          Precio en Dólares (USD)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Desde US$"
            value={props.precioMinUsd}
            onChange={(e) => props.setPrecioMinUsd(e.target.value)}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/15 rounded-lg px-3 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:bg-white focus:border-emerald-500 transition-colors placeholder:font-medium"
          />
          <input
            type="number"
            placeholder="Hasta US$"
            value={props.precioMaxUsd}
            onChange={(e) => props.setPrecioMaxUsd(e.target.value)}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/15 rounded-lg px-3 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:bg-white focus:border-emerald-500 transition-colors placeholder:font-medium"
          />
        </div>
      </div>

      <FilterSection
        title="Tipo de Vehículo"
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
    <div className="space-y-3 pt-5 border-t border-gray-100 dark:border-white/15">
      <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest block">
        {title}
      </label>
      <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 space-y-2.5">
        {options.map((opt, idx) => (
          <label
            key={idx}
            className="flex items-center gap-3 text-xs text-gray-700 dark:text-slate-300 font-semibold cursor-pointer hover:text-blue-600 transition-colors group"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => onToggle(opt.value)}
                className="w-4 h-4 rounded border-gray-300 dark:border-white/15 text-blue-600 focus:ring-blue-600 transition-all bg-gray-50 dark:bg-white/5 cursor-pointer"
              />
            </div>
            <span className="truncate">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}