"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { WalkState } from "./useWalkState";

const ALTURA_OJOS = 1.6;
const VELOCIDAD = 3.2; // unidades por segundo

type Props = {
  activo: boolean;
  walk: WalkState;
  limiteX: { min: number; max: number };
  limiteZ: { min: number; max: number };
  posicionInicial: { x: number; z: number };
  resetId: number; // cambia cada vez que hay que reubicar al usuario (nueva marca, "volver a la fila")
};

export default function WalkControls({ activo, walk, limiteX, limiteZ, posicionInicial, resetId }: Props) {
  const { camera } = useThree();
  const pos = useRef({ x: posicionInicial.x, z: posicionInicial.z });
  const lastResetId = useRef(-1);

  if (lastResetId.current !== resetId) {
    lastResetId.current = resetId;
    pos.current = { x: posicionInicial.x, z: posicionInicial.z };
    walk.mirar.current = { yaw: 0, pitch: 0 };
  }

  useFrame((_, delta) => {
    if (!activo) return;

    const { yaw, pitch } = walk.mirar.current;
    const { x: mx, z: mz } = walk.mover.current;

    if (mx !== 0 || mz !== 0) {
      // Adelante/atrás y costados son relativos a hacia dónde estás mirando (yaw),
      // como caminar de verdad — no ejes fijos del mundo.
      const forwardX = Math.sin(yaw);
      const forwardZ = -Math.cos(yaw);
      const rightX = Math.cos(yaw);
      const rightZ = Math.sin(yaw);

      const paso = VELOCIDAD * delta;
      pos.current.x += (forwardX * -mz + rightX * mx) * paso;
      pos.current.z += (forwardZ * -mz + rightZ * mx) * paso;

      pos.current.x = Math.max(limiteX.min, Math.min(limiteX.max, pos.current.x));
      pos.current.z = Math.max(limiteZ.min, Math.min(limiteZ.max, pos.current.z));
    }

    camera.position.set(pos.current.x, ALTURA_OJOS, pos.current.z);
    camera.rotation.order = "YXZ";
    camera.rotation.set(pitch, yaw, 0);
  });

  return null;
}
