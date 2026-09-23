"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

export interface ReelItem {
  id: number | string;
  tipo: "video" | "foto";
  src: string;
  titulo: string;
  link?: string;
  duration?: number; // segundos, solo se usa para "foto" -- el video avanza solo al terminar
}

// Reel estilo "historias" (Instagram/TikTok): barra de progreso segmentada
// arriba, un ítem a la vez, avanza solo (foto por `duration`, video al
// terminar), tap/click en los costados para navegar, pausa en hover. Armado
// a mano con framer-motion (ya es dependencia del proyecto) en vez de
// instalar el paquete externo @shadcnblocks/reel -- evita sumar un registry
// de terceros y la inicialización completa de shadcn solo para esto.
const DURACION_FOTO_DEFAULT = 5;

export default function MediaReel({ items, className = "" }: { items: ReelItem[]; className?: string }) {
  const [activo, setActivo] = useState(0);
  const [progreso, setProgreso] = useState(0);
  const [pausado, setPausado] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const inicioRef = useRef<number>(0);

  const item = items[activo];
  const duracionFoto = item?.duration ?? DURACION_FOTO_DEFAULT;

  const irA = (i: number) => {
    setActivo(((i % items.length) + items.length) % items.length);
    setProgreso(0);
  };

  useEffect(() => {
    if (pausado || item?.tipo !== "foto" || !duracionFoto) return;
    inicioRef.current = performance.now();
    const tick = (t: number) => {
      const pct = Math.min(100, ((t - inicioRef.current) / (duracionFoto * 1000)) * 100);
      setProgreso(pct);
      if (pct >= 100) { irA(activo + 1); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, pausado, duracionFoto]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || item?.tipo !== "video") return;
    if (pausado) v.pause(); else v.play().catch(() => {});
  }, [activo, pausado, item?.tipo]);

  if (!item) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-black select-none ${className}`}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {/* Barra de progreso segmentada */}
      <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
        {items.map((it, i) => (
          <div key={it.id} className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{ width: i < activo ? "100%" : i === activo ? `${item.tipo === "foto" ? progreso : 0}%` : "0%" }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0"
        >
          {item.tipo === "video" ? (
            <video
              ref={videoRef}
              src={item.src}
              muted
              playsInline
              autoPlay
              onEnded={() => irA(activo + 1)}
              onTimeUpdate={(e) => setProgreso((e.currentTarget.currentTime / (e.currentTarget.duration || 1)) * 100)}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image src={item.src} alt={item.titulo} fill sizes="400px" className="object-cover" />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

      {/* Zonas de tap izquierda/derecha para navegar */}
      <button aria-label="Anterior" onClick={() => irA(activo - 1)} className="absolute left-0 top-0 bottom-0 w-1/3 z-10" />
      <button aria-label="Siguiente" onClick={() => irA(activo + 1)} className="absolute right-0 top-0 bottom-0 w-1/3 z-10" />

      <button
        aria-label={pausado ? "Reproducir" : "Pausar"}
        onClick={() => setPausado((p) => !p)}
        className="absolute top-5 right-2 z-20 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
      >
        {pausado ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
      </button>

      <div className="absolute inset-y-0 left-0 flex items-center z-20 pointer-events-none">
        <ChevronLeft className="w-6 h-6 text-white/70 -translate-x-1" />
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center z-20 pointer-events-none">
        <ChevronRight className="w-6 h-6 text-white/70 translate-x-1" />
      </div>

      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 left-4 right-4 z-20 text-white text-sm font-bold leading-tight drop-shadow-md"
      >
        {item.titulo}
      </a>
    </div>
  );
}
