"use client";

import type { ShowroomVehicle } from "@/lib/showroom/types";

// Caja geométrica temporal. Reemplazar por <primitive object={gltf.scene} /> cuando haya modelUrl (.glb).
// Vista "interior" no funciona con placeholder (mesh sólido, sin cabina hueca) — pendiente hasta cargar .glb real.
export default function VehiculoPlaceholder({ vehiculo }: { vehiculo: ShowroomVehicle }) {
  const { largo, ancho, alto } = vehiculo.dimensiones;

  return (
    <group position={[0, alto / 2, 0]}>
      {/* carrocería */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[ancho, alto, largo]} />
        <meshStandardMaterial color={vehiculo.colorPlaceholder} metalness={0.4} roughness={0.35} />
      </mesh>
      {/* cabina (marca vista interior) */}
      <mesh position={[0, alto * 0.35, largo * 0.15]} castShadow>
        <boxGeometry args={[ancho * 0.9, alto * 0.6, largo * 0.4]} />
        <meshStandardMaterial color="#111" metalness={0.1} roughness={0.2} transparent opacity={0.85} />
      </mesh>
      {/* caja/carga (marca vista trasera) */}
      <mesh position={[0, alto * 0.1, -largo * 0.3]}>
        <boxGeometry args={[ancho * 0.95, alto * 0.5, largo * 0.35]} />
        <meshStandardMaterial color="#333" metalness={0.2} roughness={0.6} />
      </mesh>
      {/* ruedas */}
      {[
        [ancho / 2, -alto / 2, largo / 3],
        [-ancho / 2, -alto / 2, largo / 3],
        [ancho / 2, -alto / 2, -largo / 3],
        [-ancho / 2, -alto / 2, -largo / 3],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[alto * 0.22, alto * 0.22, ancho * 0.2, 16]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
