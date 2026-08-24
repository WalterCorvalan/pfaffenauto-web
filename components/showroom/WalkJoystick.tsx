"use client";

import { useRef, useState } from "react";
import type { WalkState } from "./useWalkState";

const RADIO = 44;

// Joystick virtual abajo a la izquierda — funciona con touch y con mouse.
// Escribe directo en walk.mover (misma ref que lee el teclado), así
// WalkControls no necesita saber de dónde vino el input.
export default function WalkJoystick({ walk }: { walk: WalkState }) {
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);

  const actualizar = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > RADIO) {
      dx = (dx / dist) * RADIO;
      dy = (dy / dist) * RADIO;
    }
    setStick({ x: dx, y: dy });
    // Adelante/atrás (z) ya funcionaba bien tal cual venía — solo izquierda/
    // derecha (x) estaba invertido.
    walk.mover.current = { x: -dx / RADIO, z: dy / RADIO };
  };

  const soltar = () => {
    activeId.current = null;
    setStick({ x: 0, y: 0 });
    walk.mover.current = { x: 0, z: 0 };
  };

  return (
    <div
      ref={baseRef}
      className="pointer-events-auto absolute bottom-8 left-8 h-28 w-28 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm touch-none select-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        activeId.current = e.pointerId;
        actualizar(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activeId.current !== e.pointerId) return;
        actualizar(e.clientX, e.clientY);
      }}
      onPointerUp={soltar}
      onPointerCancel={soltar}
    >
      <div
        className="absolute h-12 w-12 rounded-full bg-white/70 shadow-lg"
        style={{
          left: `calc(50% + ${stick.x}px - 24px)`,
          top: `calc(50% + ${stick.y}px - 24px)`,
          transition: activeId.current === null ? "left 150ms ease-out, top 150ms ease-out" : "none",
        }}
      />
    </div>
  );
}
