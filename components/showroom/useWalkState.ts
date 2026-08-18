"use client";

import { useEffect, useRef } from "react";

// Estado compartido de la caminata en primera persona: teclado (desktop) +
// joystick táctil + arrastre para mirar alrededor (mobile/desktop con mouse).
// Vive en refs (no state) porque se lee en cada frame dentro de useFrame,
// no necesita re-renderizar React.
export function useWalkState() {
  const mover = useRef({ x: 0, z: 0 }); // -1..1, viene de teclado o joystick
  const mirar = useRef({ yaw: 0, pitch: 0 });
  const arrastrando = useRef(false);
  const ultimoPuntero = useRef({ x: 0, y: 0 });

  // ================= TECLADO (desktop) =================
  useEffect(() => {
    const teclas = new Set<string>();

    const actualizarMover = () => {
      let z = 0;
      let x = 0;
      if (teclas.has("arrowup") || teclas.has("w")) z -= 1;
      if (teclas.has("arrowdown") || teclas.has("s")) z += 1;
      if (teclas.has("arrowleft") || teclas.has("a")) x -= 1;
      if (teclas.has("arrowright") || teclas.has("d")) x += 1;
      mover.current = { x, z };
    };

    const onDown = (e: KeyboardEvent) => {
      teclas.add(e.key.toLowerCase());
      actualizarMover();
    };
    const onUp = (e: KeyboardEvent) => {
      teclas.delete(e.key.toLowerCase());
      actualizarMover();
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  // ================= ARRASTRE PARA MIRAR (mouse + touch) =================
  const iniciarArrastre = (x: number, y: number) => {
    arrastrando.current = true;
    ultimoPuntero.current = { x, y };
  };
  const moverArrastre = (x: number, y: number) => {
    if (!arrastrando.current) return;
    const dx = x - ultimoPuntero.current.x;
    const dy = y - ultimoPuntero.current.y;
    ultimoPuntero.current = { x, y };
    mirar.current = {
      yaw: mirar.current.yaw - dx * 0.0045,
      pitch: Math.max(-0.5, Math.min(0.5, mirar.current.pitch - dy * 0.0035)),
    };
  };
  const terminarArrastre = () => {
    arrastrando.current = false;
  };

  return { mover, mirar, iniciarArrastre, moverArrastre, terminarArrastre };
}

export type WalkState = ReturnType<typeof useWalkState>;
