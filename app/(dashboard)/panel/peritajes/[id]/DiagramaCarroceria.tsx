"use client";

import { useState } from "react";
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
  x: number; // posición del punto clickeable, en % del viewBox de esa vista
  y: number;
}

// Zonas aproximadas por vista (coordenadas en % sobre un viewBox 300x120).
const VISTAS: { id: string; titulo: string; zonas: Zona[] }[] = [
  {
    id: "frente",
    titulo: "Frente",
    zonas: [
      { id: "paragolpes_del", label: "Paragolpes delantero", x: 50, y: 85 },
      { id: "capot", label: "Capot", x: 50, y: 35 },
      { id: "faro_izq", label: "Faro izquierdo", x: 20, y: 55 },
      { id: "faro_der", label: "Faro derecho", x: 80, y: 55 },
      { id: "parabrisas", label: "Parabrisas", x: 50, y: 15 },
    ],
  },
  {
    id: "lateral_izq",
    titulo: "Lateral izquierdo",
    zonas: [
      { id: "guardabarros_del", label: "Guardabarros delantero", x: 15, y: 55 },
      { id: "puerta_del", label: "Puerta delantera", x: 38, y: 55 },
      { id: "puerta_tras", label: "Puerta trasera", x: 62, y: 55 },
      { id: "guardabarros_tras", label: "Guardabarros trasero", x: 85, y: 55 },
      { id: "techo", label: "Techo", x: 50, y: 20 },
      { id: "zocalo", label: "Zócalo", x: 50, y: 85 },
    ],
  },
  {
    id: "lateral_der",
    titulo: "Lateral derecho",
    zonas: [
      { id: "guardabarros_del", label: "Guardabarros delantero", x: 85, y: 55 },
      { id: "puerta_del", label: "Puerta delantera", x: 62, y: 55 },
      { id: "puerta_tras", label: "Puerta trasera", x: 38, y: 55 },
      { id: "guardabarros_tras", label: "Guardabarros trasero", x: 15, y: 55 },
      { id: "techo", label: "Techo", x: 50, y: 20 },
      { id: "zocalo", label: "Zócalo", x: 50, y: 85 },
    ],
  },
  {
    id: "atras",
    titulo: "Atrás",
    zonas: [
      { id: "paragolpes_tras", label: "Paragolpes trasero", x: 50, y: 85 },
      { id: "baul", label: "Baúl", x: 50, y: 35 },
      { id: "optica_izq", label: "Óptica izquierda", x: 20, y: 55 },
      { id: "optica_der", label: "Óptica derecha", x: 80, y: 55 },
      { id: "luneta", label: "Luneta", x: 50, y: 15 },
    ],
  },
];

// Tres siluetas distintas (frente/lateral/atrás) — antes se reutilizaba la
// misma silueta lateral para las 4 vistas y todas parecían un capot.
const SILUETA_CLASS = "text-slate-300 dark:text-slate-600";

function SiluetaFrente() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.5" className={SILUETA_CLASS}>
      {/* Capot + parabrisas visto de frente, techo arriba */}
      <path d="M28,88 Q22,88 22,80 L24,58 Q26,40 38,30 Q44,26 50,26 Q56,26 62,30 Q74,40 76,58 L78,80 Q78,88 72,88 Z" />
      <path d="M35,30 Q50,20 65,30" />
      {/* Faros */}
      <circle cx="30" cy="60" r="4" />
      <circle cx="70" cy="60" r="4" />
      {/* Paragolpes */}
      <path d="M24,80 L76,80" />
    </g>
  );
}

function SiluetaAtras() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.5" className={SILUETA_CLASS}>
      {/* Baúl + luneta vista de atrás — más ancha abajo que el frente */}
      <path d="M24,88 Q18,88 18,80 L21,56 Q24,38 38,30 Q44,27 50,27 Q56,27 62,30 Q76,38 79,56 L82,80 Q82,88 76,88 Z" />
      <path d="M33,32 Q50,24 67,32" />
      {/* Ópticas traseras (rectangulares, distinto de los faros redondos) */}
      <rect x="25" y="56" width="7" height="10" rx="1.5" />
      <rect x="68" y="56" width="7" height="10" rx="1.5" />
      <path d="M21,80 L79,80" />
    </g>
  );
}

function SiluetaLateral() {
  return (
    <path
      d="M20,85 L25,55 Q30,35 50,32 L70,32 Q85,35 90,55 L95,85 Z M20,85 Q15,85 15,80 L15,75 Q15,70 20,70 M95,85 Q100,85 100,80 L100,75 Q100,70 95,70"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={SILUETA_CLASS}
    />
  );
}

function Silueta({ vista }: { vista: string }) {
  if (vista === "frente") return <SiluetaFrente />;
  if (vista === "atras") return <SiluetaAtras />;
  // lateral_der: espejamos la lateral izquierda para que se note que es el otro costado
  return (
    <g transform={vista === "lateral_der" ? "scale(-1,1) translate(-100,0)" : undefined}>
      <SiluetaLateral />
    </g>
  );
}

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
      <div className="px-5 py-3 bg-slate-50 dark:bg-[#00246b] border-b border-slate-100 dark:border-[#0a2a6b] flex items-center justify-between">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Diagrama de carrocería</h2>
        <div className="flex items-center gap-3">
          {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {SIMBOLOS.map((s) => (
              <span key={s.clave} className="flex items-center gap-1">
                <span className={COLOR_SIMBOLO[s.clave]}>{s.glifo}</span> {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {VISTAS.map((vista) => (
          <div key={vista.id}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center mb-1">{vista.titulo}</p>
            <div className="relative bg-slate-50 dark:bg-[#00246b] rounded-xl p-2">
              <svg viewBox="0 0 100 100" className="w-full h-auto">
                <Silueta vista={vista.id} />
                {vista.zonas.map((zona) => {
                  const clave = claveMarca(vista.id, zona.id);
                  const marcada = marcas[clave];
                  const simboloInfo = marcada ? SIMBOLOS.find((s) => s.clave === marcada) : null;
                  return (
                    <g key={zona.id}>
                      <circle
                        cx={zona.x} cy={zona.y} r="6"
                        className={`cursor-pointer transition-all ${marcada ? "fill-rose-500/20 stroke-rose-500" : "fill-transparent stroke-slate-300 dark:stroke-slate-600 hover:fill-indigo-500/10 hover:stroke-indigo-400"}`}
                        strokeWidth="1"
                        onClick={() => setPopupAbierto({ vista: vista.id, zona })}
                      />
                      {simboloInfo && (
                        <text x={zona.x} y={zona.y + 2.5} textAnchor="middle" fontSize="7" className={`${COLOR_SIMBOLO[simboloInfo.clave]} pointer-events-none font-black`} fill="currentColor">
                          {simboloInfo.glifo}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        ))}
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
