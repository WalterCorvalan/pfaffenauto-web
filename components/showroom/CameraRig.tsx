"use client";

import { useRef, useImperativeHandle, forwardRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import type { ShowroomView } from "@/lib/showroom/types";

const VIEW_POSITIONS: Record<Exclude<ShowroomView, "cenital">, { pos: [number, number, number]; target: [number, number, number] }> = {
  exterior: { pos: [5, 2.5, 6], target: [0, 0.8, 0] },
  interior: { pos: [0.4, 1.1, 0.2], target: [0.4, 1.1, 2] },
  trasera: { pos: [0, 1.3, -5], target: [0, 0.8, 0] },
};

// Posición cenital: depende de cuántos autos hay en la fila para que entren todos en cámara.
function getCenitalPosition(cantidad: number): { pos: [number, number, number]; target: [number, number, number] } {
  const distanciaX = Math.max(cantidad * 3.2, 6); // ancho total de la fila
  return {
    pos: [0, distanciaX * 0.9, 0.1], // arriba, casi puramente cenital (Z chico evita gimbal lock de OrbitControls)
    target: [0, 0, 0],
  };
}

export type CameraRigHandle = {
  goTo: (view: ShowroomView, cantidadAutos?: number) => void;
};

const CameraRig = forwardRef<CameraRigHandle, { autoRotate: boolean }>(function CameraRig(
  { autoRotate },
  ref
) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    goTo(view: ShowroomView, cantidadAutos = 1) {
      const { pos, target } = view === "cenital" ? getCenitalPosition(cantidadAutos) : VIEW_POSITIONS[view];
      const controls = controlsRef.current;
      if (!controls) return;

      controls.enabled = view === "exterior";

      gsap.to(camera.position, {
        x: pos[0],
        y: pos[1],
        z: pos[2],
        duration: 1.4,
        ease: "power3.inOut",
      });
      gsap.to(controls.target, {
        x: target[0],
        y: target[1],
        z: target[2],
        duration: 1.4,
        ease: "power3.inOut",
        onUpdate: () => controls.update(),
      });
    },
  }));

  useFrame(() => {
    controlsRef.current?.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={2.5}
      maxDistance={10}
      maxPolarAngle={Math.PI / 2.1}
      autoRotate={autoRotate}
      autoRotateSpeed={0.6}
    />
  );
});

export default CameraRig;
