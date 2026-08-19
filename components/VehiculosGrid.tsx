"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Scale, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ComparadorModal from "@/components/modals/ComparadorModal";
import { VehicleCard } from "@/components/Stock";

const ITEMS_POR_PAGINA = 9;

const normalizar = (texto: string) =>
  texto?.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim() || "";

export const MARCAS_CHINAS = new Set([
  "baic", "changan", "chery", "jac", "haval", "gwm", "great wall",
  "dfsk", "dfm", "mg", "byd", "geely", "foton", "jetour", "omoda",
]);

function categoriaDe(tipo: string, marca?: string): string {
  if (marca && MARCAS_CHINAS.has(normalizar(marca))) return "Mundo Chino";
  const t = normalizar(tipo);
  if (t.includes("suv") || t.includes("terreno")) return "SUV";
  if (t.includes("pick") || t.includes("camioneta")) return "Pick-ups";
  if (t.includes("sedan") || t.includes("hatchback") || t.includes("urbano") || t.includes("auto")) return "Sedanes";
  return "Otros";
}

export default function VehiculosGrid({ vehiculos }: { vehiculos: any[] | null }) {
  const lista = vehiculos || [];
  const [autosComparar, setAutosComparar] = useState<any[]>([]);
  const [modalComparadorOpen, setModalComparadorOpen] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [pagina, setPagina] = useState(0);

  const categoriasDisponibles = useMemo(() => {
    const set = new Set(lista.map((a) => categoriaDe(a.tipo, a.marca)));
    return ["Todos", ...Array.from(set)];
  }, [lista]);

  const listaFiltrada = useMemo(() => {
    if (categoriaActiva === "Todos") return lista;
    return lista.filter((a) => categoriaDe(a.tipo, a.marca) === categoriaActiva);
  }, [lista, categoriaActiva]);

  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / ITEMS_POR_PAGINA));
  const listaPaginada = listaFiltrada.slice(pagina * ITEMS_POR_PAGINA, (pagina + 1) * ITEMS_POR_PAGINA);

  const cambiarCategoria = (cat: string) => {
    setCategoriaActiva(cat);
    setPagina(0);
  };

  const toggleComparar = (e: React.MouseEvent, auto: any) => {
    e.preventDefault();
    e.stopPropagation();
    const yaEsta = autosComparar.find((a) => a.id === auto.id);
    if (yaEsta) {
      setAutosComparar((prev) => prev.filter((a) => a.id !== auto.id));
    } else if (autosComparar.length >= 3) {
      setAutosComparar((prev) => [...prev.slice(1), auto]);
    } else {
      setAutosComparar((prev) => [...prev, auto]);
    }
  };

  if (lista.length === 0) {
    return (
      <section className="py-16 text-center w-full">
        <div className="max-w-md mx-auto p-10 rounded-[32px] bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_16px_40px_0_rgba(31,38,135,0.05)] dark:shadow-none">
          <p className="text-gray-500 dark:text-slate-400 font-bold tracking-wide">
            Actualmente no hay unidades disponibles.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-8 max-w-7xl mx-auto px-4 md:px-6">
      {categoriasDisponibles.length > 2 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {categoriasDisponibles.map((cat) => (
            <button
              key={cat}
              onClick={() => cambiarCategoria(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${
                categoriaActiva === cat
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-sky-400/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ACÁ ESTÁ EL CAMBIO CLAVE: w-full y xl:grid-cols-4 para escritorio, manteniendo grid-cols-2 para móvil */}
      <div className="w-full grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pb-8">
        {listaPaginada.map((auto) => (
          <VehicleCard
            key={auto.id}
            auto={auto}
            estaSeleccionado={autosComparar.some((a) => a.id === auto.id)}
            onToggleComparar={toggleComparar}
          />
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2 pb-8">
          <button
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
            disabled={pagina === 0}
            className="p-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:border-blue-400 dark:hover:border-sky-400/50 hover:text-blue-600 dark:hover:text-sky-300 transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPaginas }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPagina(i)}
              className={`w-9 h-9 rounded-lg text-xs font-bold border transition-colors ${
                pagina === i ? "bg-blue-600 border-blue-600 text-white" : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-sky-400/50"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
            disabled={pagina === totalPaginas - 1}
            className="p-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 disabled:opacity-30 hover:border-blue-400 dark:hover:border-sky-400/50 hover:text-blue-600 dark:hover:text-sky-300 transition-colors"
            aria-label="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* BARRA FLOTANTE COMPARADOR */}
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
                    <div key={i} className="relative w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-gray-900 overflow-hidden bg-white shadow-sm shrink-0">
                      <Image src={auto.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"} alt={`${auto.marca} ${auto.modelo}`} fill sizes="48px" className="object-cover" />
                    </div>
                  ))}
                  {autosComparar.length < 3 && (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center bg-gray-800 text-gray-500 text-xs font-bold shrink-0">+</div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-white text-[11px] md:text-sm font-bold leading-none">{autosComparar.length} / 3<span className="hidden sm:inline"> listos</span></span>
                  <span className="text-gray-400 text-[9px] uppercase tracking-widest hidden sm:block mt-1">Comparador</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setAutosComparar([])} className="text-gray-400 hover:text-white px-2 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-lg hover:bg-white/10">
                  <X className="w-4 h-4 md:hidden" />
                  <span className="hidden md:inline">Limpiar</span>
                </button>
                <button onClick={() => setModalComparadorOpen(true)} disabled={autosComparar.length === 0} className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95">
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
        removerAuto={(id) => setAutosComparar((prev) => prev.filter((a) => a.id !== id))}
      />
    </section>
  );
}