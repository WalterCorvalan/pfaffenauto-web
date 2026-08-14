"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, ArrowUpRight, Clock, Scale, X } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import ComparadorModal from "@/components/modals/ComparadorModal";

interface StockProps {
  vehiculos: any[] | null;
}

// Función para limpiar textos
const normalizar = (texto: string) => {
  return (
    texto
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim() || ""
  );
};

// Variantes para la animación
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95, filter: "blur(5px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 150, damping: 20 },
  },
};

export default function Stock({ vehiculos }: StockProps) {
  const listaVehiculos = vehiculos || [];

  // Estado para la lista de "Vistos recientemente"
  const [vistosRecientes, setVistosRecientes] = useState<any[]>([]);

  // ================= COMPARADOR (hasta 3 autos) =================
  const [autosComparar, setAutosComparar] = useState<any[]>([]);
  const [modalComparadorOpen, setModalComparadorOpen] = useState(false);

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

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pfaffen_vistos");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed)) {
          setVistosRecientes(parsed.slice(0, 10)); // Top 10
          return;
        }
      }
    } catch (e) {
      console.error("Error leyendo vistos recientes", e);
    }
    // Si no hay historial, se queda vacío. No rellenamos más.
    setVistosRecientes([]);
  }, []);

  // ================= FILTROS INTELIGENTES Y ROBUSTOS =================
  const suvsDestacadas = listaVehiculos
    .filter((auto) => {
      const t = normalizar(auto.tipo);
      const m = normalizar(auto.modelo);
      return (
        t.includes("suv") ||
        t.includes("terreno") ||
        m.includes("sw4") ||
        m.includes("tracker") ||
        m.includes("taos") ||
        m.includes("t-cross")
      );
    })
    .slice(0, 4);

  const pickipsCarrusel = listaVehiculos
    .filter((auto) => {
      const t = normalizar(auto.tipo);
      const m = normalizar(auto.modelo);
      return (
        t.includes("pick") ||
        t.includes("camioneta") ||
        m.includes("hilux") ||
        m.includes("amarok") ||
        m.includes("ranger") ||
        m.includes("strada") ||
        m.includes("toro")
      );
    })
    .slice(0, 8);

  const urbanosYSedanes = listaVehiculos
    .filter((auto) => {
      const t = normalizar(auto.tipo);
      return (
        t.includes("sedan") ||
        t.includes("hatchback") ||
        t.includes("urbano") ||
        t.includes("auto")
      );
    })
    .slice(0, 4);

  const idsMostrados = new Set([
    ...suvsDestacadas.map((a) => a.id),
    ...pickipsCarrusel.map((a) => a.id),
    ...urbanosYSedanes.map((a) => a.id),
  ]);

  // Si después de filtrar por categoría sigue habiendo autos sin mostrar,
  // los mandamos a "otrosVehiculos" para que NUNCA aparezca vacío el stock.
  let otrosVehiculos = listaVehiculos.filter(
    (auto) => !idsMostrados.has(auto.id),
  );

  if (otrosVehiculos.length === 0 && listaVehiculos.length > 0) {
    otrosVehiculos = listaVehiculos.slice(0, 6);
  } else {
    otrosVehiculos = otrosVehiculos.slice(0, 6);
  }

  if (listaVehiculos.length === 0) {
    return (
      <section className="py-24 bg-transparent relative text-center border-none">
        <div className="max-w-md mx-auto p-10 rounded-[32px] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_16px_40px_0_rgba(31,38,135,0.05)]">
          <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-ping"></span>
          </div>
          <p className="text-gray-500 font-bold tracking-wide">
            Actualmente no hay unidades disponibles en esta sucursal.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="stock"
      className="py-12 bg-transparent relative border-t border-transparent overflow-hidden"
    >
      {/* Luces Ambientales (Spatial UI) */}
      <div className="absolute top-0 left-[-5%] w-[600px] h-[600px] bg-[#0145F2]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] bg-sky-300/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-24 relative z-10">
        {/* ================= SECCIÓN 1: SUVs (GRILLA TRADICIONAL) ================= */}
        {suvsDestacadas.length > 0 && (
          <div>
            <SectionHeader
              pillText="Selección exclusiva"
              pillColor="text-sky-600 bg-sky-50/50 border-sky-100/50"
              titleLight="SUVs"
              titleBold="Destacadas"
              linkHref="/catalogo?q=SUV"
              linkLabel="Ver todas las SUVs"
            />
            <VehicleGrid
              vehiculos={suvsDestacadas}
              autosComparar={autosComparar}
              onToggleComparar={toggleComparar}
            />
          </div>
        )}

        {/* ================= SECCIÓN 2: Pick-ups (CARRUSEL SCROLL NATIVO) ================= */}
        {pickipsCarrusel.length > 0 && (
          <div className="space-y-8">
            <SectionHeader
              pillText="Alta Demanda"
              pillColor="text-orange-600 bg-orange-50/50 border-orange-100/50"
              titleLight="Pick-ups"
              titleBold="Disponibles"
              linkHref="/catalogo?q=Pick-up"
              linkLabel="Ver catálogo de Pick-ups"
            />

            <div className="relative w-full [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] py-4">
              <div className="flex gap-5 md:gap-6 w-full overflow-x-auto pb-6 custom-scrollbar snap-x snap-mandatory">
                {[...pickipsCarrusel, ...pickipsCarrusel].map((auto, index) => (
                  <div
                    key={`${auto.id}-${index}`}
                    className="min-w-[280px] max-w-[280px] sm:min-w-[300px] sm:max-w-[300px] flex-shrink-0 snap-center"
                  >
                    <VehicleCard
                      auto={auto}
                      estaSeleccionado={autosComparar.some(
                        (a) => a.id === auto.id,
                      )}
                      onToggleComparar={toggleComparar}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= SECCIÓN 3: SEDANES + VISTOS RECIENTEMENTE (GLASS) ================= */}
        {urbanosYSedanes.length > 0 && (
          <div>
            <SectionHeader
              pillText="Prácticos y eficientes"
              pillColor="text-emerald-600 bg-emerald-50/50 border-emerald-100/50"
              titleLight="Sedanes y Hatchbacks"
              titleBold="Urbanos"
              linkHref="/catalogo?q=Sedan"
              linkLabel="Ver todo el stock"
            />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
              {/* Tarjeta Principal Izquierda (Grande) */}
              {urbanosYSedanes[0] && (
                <Link
                  href={`/catalogo/${urbanosYSedanes[0].slug}`}
                  className="md:col-span-8 relative h-[380px] md:h-[450px] rounded-[32px] overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(1,69,242,0.12)] border border-white/60 transition-all duration-500"
                >
                  <button
                    onClick={(e) => toggleComparar(e, urbanosYSedanes[0])}
                    className={`absolute top-5 left-5 z-30 p-2.5 rounded-full shadow-sm transition-all duration-300 border hover:scale-110 active:scale-95 ${
                      autosComparar.some((a) => a.id === urbanosYSedanes[0].id)
                        ? "bg-[#0145F2] text-white border-[#0145F2]"
                        : "bg-white/80 backdrop-blur-md text-slate-500 hover:text-[#0145F2] border-white/60"
                    }`}
                    title="Comparar vehículo"
                  >
                    <Scale className="w-4 h-4" />
                  </button>
                  <div className="absolute inset-0 bg-slate-100 z-0"></div>
                  <img
                    src={
                      urbanosYSedanes[0].multimedia_vehiculos?.[0]
                        ?.url_archivo || "/placeholder.jpg"
                    }
                    alt={urbanosYSedanes[0].modelo}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out mix-blend-multiply opacity-90 z-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent z-10"></div>

                  <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-20">
                    <div>
                      <span className="bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1.5 rounded-full text-white text-[10px] font-black tracking-widest uppercase mb-3 inline-block">
                        Destacado
                      </span>
                      <h3 className="text-3xl md:text-4xl font-black text-white leading-tight uppercase drop-shadow-md">
                        {urbanosYSedanes[0].marca}{" "}
                        <br className="hidden sm:block" />
                        {urbanosYSedanes[0].modelo}
                      </h3>
                      <p className="text-white/80 text-sm mt-1 font-medium">
                        {urbanosYSedanes[0].segmento || urbanosYSedanes[0].anio}
                      </p>
                    </div>
                    <div className="sm:text-right flex items-center sm:items-end gap-3 sm:flex-col">
                      <p className="text-white font-black text-2xl md:text-3xl drop-shadow-md">
                        ${" "}
                        {urbanosYSedanes[0].precio_publicado_ars?.toLocaleString(
                          "es-AR",
                        )}
                      </p>
                      <div className="w-10 h-10 rounded-full bg-white text-navy flex items-center justify-center group-hover:bg-[#0145F2] group-hover:text-white transition-colors shadow-lg">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* TARJETA DERECHA: VISTOS RECIENTEMENTE */}
              <div className="md:col-span-4 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[32px] p-5 md:p-6 flex flex-col h-[400px] md:h-[450px] shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
                <div className="mb-4 pb-3 border-b border-white/40 flex items-center justify-between">
                  <h4 className="text-xs font-black text-navy uppercase tracking-widest">
                    Vistos recientemente
                  </h4>
                  <span className="text-[10px] bg-blue-500/10 text-[#0145F2] font-bold px-2.5 py-0.5 rounded-full">
                    {vistosRecientes.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                  {vistosRecientes.length > 0 ? (
                    vistosRecientes.map((auto, idx) => {
                      const precioMostrar =
                        auto.precio_publicado_usd && !auto.precio_publicado_ars
                          ? `US$ ${auto.precio_publicado_usd.toLocaleString("es-AR")}`
                          : auto.precio_publicado_ars
                            ? `$ ${auto.precio_publicado_ars.toLocaleString("es-AR")}`
                            : `US$ ${auto.precio_publicado_usd?.toLocaleString("es-AR")}`;

                      const imagenSrc =
                        auto.imagen ||
                        auto.multimedia_vehiculos?.[0]?.url_archivo ||
                        "/placeholder.jpg";

                      return (
                        <Link
                          key={`visto-${auto.id}-${idx}`}
                          href={`/catalogo/${auto.slug}`}
                          className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl p-2.5 flex gap-3 items-center group hover:bg-white hover:border-[#0145F2]/40 transition-all shadow-sm focus:outline-none"
                        >
                          <div className="h-14 w-16 shrink-0 rounded-xl overflow-hidden relative bg-white/50 mix-blend-multiply">
                            <img
                              src={imagenSrc}
                              alt={auto.modelo}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="flex flex-col justify-center w-full min-w-0 pr-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate">
                              {auto.marca}
                            </span>
                            <h5 className="text-xs font-black text-navy leading-tight truncate uppercase">
                              {auto.modelo}
                            </h5>
                            <p className="text-[#] font-black text-xs mt-0.5">
                              {precioMostrar}
                            </p>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    // ====== ESTADO VACÍO ELEGANTE ======
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-60">
                      <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center mb-3">
                        <Clock className="w-5 h-5 text-navy" />
                      </div>
                      <p className="text-xs font-black text-navy uppercase tracking-widest mb-1">
                        Historial vacío
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Aún no viste ningún vehículo. Explorá nuestro catálogo y
                        aparecerán acá.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECCIÓN 4: OTROS (ESTILO APPLE CARDS CAROUSEL) ================= */}
        {otrosVehiculos.length > 0 && (
          <div>
            <SectionHeader
              pillText="Más Opciones"
              pillColor="text-purple-600 bg-purple-50/50 border-purple-100/50"
              titleLight="0"
              titleBold="KM"
              linkHref="/catalogo"
              linkLabel="Ir al catálogo completo"
            />

            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-10 pt-2 custom-scrollbar snap-x snap-mandatory">
              {otrosVehiculos.map((auto) => (
                <Link
                  key={auto.id}
                  href={`/catalogo/${auto.slug}`}
                  className="min-w-[280px] md:min-w-[360px] h-[380px] md:h-[480px] relative rounded-[32px] overflow-hidden group snap-center shadow-lg hover:shadow-2xl border border-white/40 shrink-0 transition-all duration-500"
                >
                  <button
                    onClick={(e) => toggleComparar(e, auto)}
                    className={`absolute top-5 left-5 z-30 p-2.5 rounded-full shadow-sm transition-all duration-300 border hover:scale-110 active:scale-95 ${
                      autosComparar.some((a) => a.id === auto.id)
                        ? "bg-[#0145F2] text-white border-[#0145F2]"
                        : "bg-white/20 backdrop-blur-md text-white hover:text-[#0145F2] hover:bg-white border-white/40"
                    }`}
                    title="Comparar vehículo"
                  >
                    <Scale className="w-4 h-4" />
                  </button>
                  <div className="absolute inset-0 bg-slate-200 z-0"></div>
                  <img
                    src={
                      auto.multimedia_vehiculos?.[0]?.url_archivo ||
                      "/placeholder.jpg"
                    }
                    alt={auto.modelo}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out z-0 mix-blend-multiply opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 z-10" />

                  <div className="absolute top-6 left-16 right-6 z-20">
                    <span className="text-white/80 text-[10px] md:text-xs uppercase tracking-widest font-black drop-shadow-md">
                      {auto.marca}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mt-1 drop-shadow-lg uppercase">
                      {auto.modelo}
                    </h3>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-20">
                    <div>
                      <p className="text-white/80 text-xs md:text-sm font-medium mb-1 drop-shadow-md">
                        {auto.anio} •{" "}
                        {auto.kilometraje?.toLocaleString("es-AR")} km
                      </p>
                      <p className="text-white font-black text-xl md:text-2xl drop-shadow-lg">
                        $ {auto.precio_publicado_ars?.toLocaleString("es-AR")}
                      </p>
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 text-white group-hover:bg-[#0145F2] group-hover:border-[#0145F2] transition-colors shadow-lg">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
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
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-gray-900 overflow-hidden bg-white shadow-sm shrink-0"
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
                  {autosComparar.length < 3 && (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center bg-gray-800 text-gray-500 text-xs font-bold shrink-0">
                      +
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-white text-[11px] md:text-sm font-bold leading-none">
                    {autosComparar.length} / 3
                    <span className="hidden sm:inline"> listos</span>
                  </span>
                  <span className="text-gray-400 text-[9px] uppercase tracking-widest hidden sm:block mt-1">
                    Comparador
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setAutosComparar([])}
                  className="text-gray-400 hover:text-white px-2 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-lg hover:bg-white/10"
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
    </section>
  );
}

// ================= COMPONENTES DE UI MODULARIZADOS =================

function SectionHeader({
  pillText,
  pillColor,
  titleLight,
  titleBold,
  linkHref,
  linkLabel,
}: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
      <div>
        <span
          className={`text-[10px] font-black uppercase tracking-widest backdrop-blur-xl px-4 py-1.5 rounded-full border shadow-[0_2px_10px_rgba(0,0,0,0.03)] ${pillColor}`}
        >
          {pillText}
        </span>
        <h2 className="text-3xl md:text-4xl text-navy font-light tracking-tighter mt-4 drop-shadow-sm">
          {titleLight}{" "}
          <strong className="font-black bg-clip-text text-transparent bg-gradient-to-r from-navy to-[#0145F2]">
            {titleBold}
          </strong>
        </h2>
      </div>
      <Link
        href={linkHref}
        className="text-xs font-bold text-gray-500 bg-white/40 backdrop-blur-md border border-white/60 px-4 py-2 rounded-full hover:bg-white hover:text-primary hover:shadow-[0_8px_20px_rgba(1,69,242,0.1)] active:scale-95 transition-all flex items-center gap-1.5 w-fit group"
      >
        {linkLabel}
        <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-[#0145F2] group-hover:text-white transition-colors">
          <ChevronRight className="w-3 h-3 transition-transform" />
        </span>
      </Link>
    </div>
  );
}

function VehicleGrid({
  vehiculos,
  autosComparar,
  onToggleComparar,
}: {
  vehiculos: any[];
  autosComparar?: any[];
  onToggleComparar?: (e: React.MouseEvent, auto: any) => void;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6"
    >
      {vehiculos.map((auto) => (
        <motion.div variants={itemVariants} key={auto.id} className="h-full">
          <VehicleCard
            auto={auto}
            estaSeleccionado={autosComparar?.some((a) => a.id === auto.id)}
            onToggleComparar={onToggleComparar}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

function VehicleCard({
  auto,
  estaSeleccionado,
  onToggleComparar,
}: {
  auto: any;
  estaSeleccionado?: boolean;
  onToggleComparar?: (e: React.MouseEvent, auto: any) => void;
}) {
  const precioMostrar =
    auto.precio_publicado_usd && !auto.precio_publicado_ars
      ? `US$ ${auto.precio_publicado_usd.toLocaleString("es-AR")}`
      : auto.precio_publicado_ars
        ? `$ ${auto.precio_publicado_ars.toLocaleString("es-AR")}`
        : `US$ ${auto.precio_publicado_usd?.toLocaleString("es-AR")}`;

  return (
    <Link
      href={`/catalogo/${auto.slug}`}
      className="block group h-full focus:outline-none"
    >
      <div
        className={`bg-white/40 backdrop-blur-2xl rounded-[28px] overflow-hidden flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(1,69,242,0.12)] hover:bg-white/70 transition-all duration-500 relative transform group-hover:-translate-y-1 border ${
          estaSeleccionado
            ? "border-[#0145F2] ring-1 ring-[#0145F2]"
            : "border-white/60 hover:border-white"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20"></div>

        {onToggleComparar && (
          <button
            onClick={(e) => onToggleComparar(e, auto)}
            className={`absolute top-3.5 left-3.5 z-30 p-2 rounded-full shadow-sm transition-all duration-300 border hover:scale-110 active:scale-95 ${
              estaSeleccionado
                ? "bg-[#0145F2] text-white border-[#0145F2]"
                : "bg-white/80 backdrop-blur-md text-gray-400 hover:text-[#0145F2] border-white/60"
            }`}
            title="Comparar vehículo"
          >
            <Scale className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="relative h-[160px] sm:h-[180px] bg-white/30 flex items-center justify-center overflow-hidden mix-blend-multiply">
          {auto.multimedia_vehiculos?.[0] ? (
            <img
              src={auto.multimedia_vehiculos[0].url_archivo}
              alt={`${auto.marca} ${auto.modelo}`}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-medium">
              Sin foto
            </div>
          )}
          {auto.estado === "Reservado" && (
            <div className="absolute top-4 right-4 bg-yellow-100/90 backdrop-blur-md text-yellow-800 border border-yellow-200/80 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_4px_12px_rgba(0,0,0,0.05)] z-10">
              Reservado
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 flex flex-col flex-grow relative z-10">
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">
            {auto.marca}
          </span>
          <h3 className="text-base sm:text-lg font-black text-navy leading-tight uppercase truncate drop-shadow-sm">
            {auto.modelo}
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1 line-clamp-1">
            {auto.version ||
              `${auto.anio} • ${auto.kilometraje?.toLocaleString("es-AR")} km`}
          </p>

          <div className="mt-auto pt-5 flex items-end justify-between border-t border-gray-200/50">
            <span className="text-lg sm:text-xl font-black text-navy tracking-tighter">
              {precioMostrar}
            </span>
            <div className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm group-hover:bg-[#0145F2] group-hover:border-[#0145F2] group-hover:text-white flex items-center justify-center transition-all duration-300 text-gray-400 group-hover:shadow-[0_0_15px_rgba(1,69,242,0.4)]">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
