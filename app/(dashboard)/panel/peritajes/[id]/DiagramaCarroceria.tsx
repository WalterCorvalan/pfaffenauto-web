"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

// Símbolos calcados del papel: Rayado (—), Elemento a cambiar (X),
// Pintura quemada (○), Pintura cuarteada (□).
const SIMBOLOS = [
  { clave: "rayado", label: "Rayado", glifo: "—" },
  { clave: "cambiar", label: "Elem. a cambiar", glifo: "✕" },
  { clave: "quemada", label: "Pintura quemada", glifo: "○" },
  { clave: "cuarteada", label: "Pintura cuarteada", glifo: "□" },
] as const;

const COLOR_SIMBOLO: Record<string, string> = {
  rayado: "text-amber-600 dark:text-amber-400",
  cambiar: "text-rose-600 dark:text-rose-400",
  quemada: "text-orange-600 dark:text-orange-400",
  cuarteada: "text-indigo-600 dark:text-indigo-400",
};

interface Zona {
  id: string;
  label: string;
  x: number; // posición del punto clickeable, en % del ancho/alto de la imagen de esa vista
  y: number;
}

// Fotos reales del diagrama de carrocería (public/diagramas). Cada vista tiene
// su propia relación de aspecto — se respeta con aspectRatio para que los % de
// x/y de las zonas calcen exactamente con los rasgos del auto en la imagen.
// Imágenes recortadas al mínimo (sin márgenes blancos) con sharp .trim() para
// aprovechar mejor el espacio — antes traían un borde blanco grande y por eso
// las laterales se veían mucho más chicas que frente/atrás en el grid.
const IMAGENES_VISTA: Record<string, { src: string; width: number; height: number }> = {
  frente: { src: "/diagramas/frente.png", width: 1249, height: 944 },
  lateral_izq: { src: "/diagramas/lateral-izquierdo.png", width: 2120, height: 642 },
  lateral_der: { src: "/diagramas/lateral-derecho.png", width: 1917, height: 593 },
  atras: { src: "/diagramas/detras.png", width: 1266, height: 979 },
};

const VISTAS: { id: string; titulo: string; zonas: Zona[] }[] = [
  {
    id: "frente",
    titulo: "Frente",
    zonas: [
      { id: "paragolpes_del", label: "Paragolpes delantero", x: 51.1, y: 78.8 },
      { id: "capot", label: "Capot", x: 51.1, y: 38.9 },
      { id: "faro_izq", label: "Faro izquierdo", x: 15.7, y: 53.9 },
      { id: "faro_der", label: "Faro derecho", x: 86.4, y: 53.9 },
      { id: "parabrisas", label: "Parabrisas", x: 51.1, y: 9 },
    ],
  },
  {
    id: "lateral_izq",
    titulo: "Lateral izquierdo",
    zonas: [
      { id: "guardabarros_del", label: "Guardabarros delantero", x: 12.7, y: 53.4 },
      { id: "puerta_del", label: "Puerta delantera", x: 36.3, y: 42.1 },
      { id: "puerta_tras", label: "Puerta trasera", x: 57.8, y: 42.1 },
      { id: "guardabarros_tras", label: "Guardabarros trasero", x: 84.4, y: 53.4 },
      { id: "techo", label: "Techo", x: 49.6, y: 4.8 },
      { id: "zocalo", label: "Zócalo", x: 49.6, y: 79.4 },
    ],
  },
  {
    id: "lateral_der",
    titulo: "Lateral derecho",
    zonas: [
      { id: "guardabarros_del", label: "Guardabarros delantero", x: 87.5, y: 59 },
      { id: "puerta_del", label: "Puerta delantera", x: 63.4, y: 45.9 },
      { id: "puerta_tras", label: "Puerta trasera", x: 41.4, y: 45.9 },
      { id: "guardabarros_tras", label: "Guardabarros trasero", x: 14.1, y: 59 },
      { id: "techo", label: "Techo", x: 49.8, y: 6 },
      { id: "zocalo", label: "Zócalo", x: 49.8, y: 89.4 },
    ],
  },
  {
    id: "atras",
    titulo: "Atrás",
    zonas: [
      { id: "paragolpes_tras", label: "Paragolpes trasero", x: 50.3, y: 82 },
      { id: "baul", label: "Baúl", x: 50.3, y: 46.5 },
      { id: "optica_izq", label: "Óptica izquierda", x: 14.9, y: 43 },
      { id: "optica_der", label: "Óptica derecha", x: 85.8, y: 43 },
      { id: "luneta", label: "Luneta", x: 50.3, y: 11.1 },
    ],
  },
];

export default function DiagramaCarroceria({ peritajeId, marcasIniciales }: { peritajeId: string; marcasIniciales: Record<string, string> }) {
  const [marcas, setMarcas] = useState<Record<string, string>>(marcasIniciales || {});
  const [popupAbierto, setPopupAbierto] = useState<{ vista: string; zona: Zona } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const claveMarca = (vista: string, zonaId: string) => `${vista}:${zonaId}`;

  const elegirSimbolo = async (simbolo: string | null) => {
    if (!popupAbierto) return;
    const clave = claveMarca(popupAbierto.vista, popupAbierto.zona.id);
    const nuevo = { ...marcas };
    if (simbolo) nuevo[clave] = simbolo;
    else delete nuevo[clave];

    setMarcas(nuevo);
    setPopupAbierto(null);
    setGuardando(true);
    const { error } = await supabase.from("peritajes").update({ carroceria_marcas: nuevo }).eq("id", peritajeId);
    if (error) console.error("Error guardando marca de carrocería:", error);
    setGuardando(false);
  };

  return (
    <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 bg-slate-50 dark:bg-[#00246b] border-b border-slate-100 dark:border-[#0a2a6b] flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Diagrama de carrocería</h2>
        <div className="flex items-center gap-3">
          {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          <div className="flex items-center gap-2.5 sm:gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {SIMBOLOS.map((s) => (
              <span key={s.clave} className="flex items-center gap-1" title={s.label}>
                <span className={COLOR_SIMBOLO[s.clave]}>{s.glifo}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-wrap items-end justify-center gap-4">
        {VISTAS.map((vista) => {
          const img = IMAGENES_VISTA[vista.id];
          const esLateral = vista.id.startsWith("lateral");
          return (
            <div key={vista.id} className="flex flex-col items-center w-full sm:w-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center mb-1">{vista.titulo}</p>
              <div className={`relative bg-white rounded-xl p-2 border border-slate-100 w-full ${esLateral ? "max-w-[420px] sm:max-w-[440px]" : "max-w-[220px] sm:max-w-[240px]"}`}>
                <div className="relative w-full" style={{ aspectRatio: `${img.width} / ${img.height}` }}>
                  <Image src={img.src} alt={`Diagrama ${vista.titulo}`} fill sizes="400px" className="object-contain pointer-events-none select-none" />
                  {vista.zonas.map((zona) => {
                    const clave = claveMarca(vista.id, zona.id);
                    const marcada = marcas[clave];
                    const simboloInfo = marcada ? SIMBOLOS.find((s) => s.clave === marcada) : null;
                    return (
                      <button
                        key={zona.id}
                        type="button"
                        onClick={() => setPopupAbierto({ vista: vista.id, zona })}
                        title={zona.label}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border transition-all flex items-center justify-center ${marcada ? "bg-rose-500/20 border-rose-500" : "bg-transparent border-slate-300 hover:bg-indigo-500/10 hover:border-indigo-400"}`}
                        style={{ left: `${zona.x}%`, top: `${zona.y}%` }}
                      >
                        {simboloInfo && (
                          <span className={`${COLOR_SIMBOLO[simboloInfo.clave]} text-[11px] font-black leading-none`}>{simboloInfo.glifo}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Burbuja de selección de símbolo */}
      {popupAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPopupAbierto(null)}>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-2xl p-5 w-full max-w-xs animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{VISTAS.find((v) => v.id === popupAbierto.vista)?.titulo}</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-4">{popupAbierto.zona.label}</p>
            <div className="grid grid-cols-2 gap-2">
              {SIMBOLOS.map((s) => (
                <button
                  key={s.clave}
                  onClick={() => elegirSimbolo(s.clave)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-200 dark:border-[#0a2a6b] hover:border-indigo-400 dark:hover:border-sky-400 hover:bg-slate-50 dark:hover:bg-[#00246b] transition-colors"
                >
                  <span className={`text-xl font-black ${COLOR_SIMBOLO[s.clave]}`}>{s.glifo}</span>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight">{s.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => elegirSimbolo(null)}
              className="w-full mt-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 py-2 transition-colors"
            >
              Quitar marca
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
