"use client";

import { useEffect, useRef, useState } from "react";

// Botones flotantes (mensajes, acciones rápidas) arrastrables: el usuario los
// mueve con el mouse/touch y la posición queda guardada en localStorage (por
// navegador) para la próxima visita. Mientras no se arrastró ninguna vez, se
// mantiene la posición default por CSS (bottom/right) — recién al soltar
// después de un arrastre real se pasa a coordenadas fijas top/left.
export function useDraggableFab<T extends HTMLElement = HTMLDivElement>(storageKey: string) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const elRef = useRef<T>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, top: 0, left: 0 });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setPos(JSON.parse(saved));
    } catch {}
  }, [storageKey]);

  const clamp = (top: number, left: number) => {
    const el = elRef.current;
    const w = el?.offsetWidth ?? 56;
    const h = el?.offsetHeight ?? 56;
    return {
      top: Math.max(8, Math.min(window.innerHeight - h - 8, top)),
      left: Math.max(8, Math.min(window.innerWidth - w - 8, left)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    draggingRef.current = true;
    movedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY, top: rect.top, left: rect.left };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (!movedRef.current && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    movedRef.current = true;
    setPos(clamp(startRef.current.top + dy, startRef.current.left + dx));
  };

  const onPointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (movedRef.current) {
      setPos((p) => {
        if (p) { try { localStorage.setItem(storageKey, JSON.stringify(p)); } catch {} }
        return p;
      });
    }
  };

  // Llamar al principio del onClick del botón: si hubo un arrastre real,
  // devuelve true (y el caller debe cortar ahí, no abrir menú ni navegar).
  const didDrag = () => {
    const arrastro = movedRef.current;
    movedRef.current = false;
    return arrastro;
  };

  return {
    elRef,
    style: pos ? ({ position: "fixed", top: pos.top, left: pos.left } as const) : undefined,
    handlers: { onPointerDown, onPointerMove, onPointerUp },
    didDrag,
  };
}
