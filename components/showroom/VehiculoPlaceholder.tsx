"use client";

import { Html } from "@react-three/drei";
import type { ShowroomVehicle } from "@/lib/showroom/types";

// Caja geométrica temporal. Reemplazar por <primitive object={gltf.scene} /> cuando haya modelUrl (.glb).
// Vista "interior" no funciona con placeholder (mesh sólido, sin cabina hueca) — pendiente hasta cargar .glb real.
type Props = {
  vehiculo: ShowroomVehicle;
  posicionX?: number; // offset horizontal (columna)
  posicionZ?: number; // offset de profundidad (fila)
  onClick?: () => void;
  mostrarMarcador?: boolean; // pin clickeable tipo Street View, para el modo caminata
};

export default function VehiculoPlaceholder({ vehiculo, posicionX = 0, posicionZ = 0, onClick, mostrarMarcador = false }: Props) {
  const { largo, ancho, alto } = vehiculo.dimensiones;

  return (
    <group
      position={[posicionX, alto / 2, posicionZ]}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      onPointerOver={onClick ? () => { document.body.style.cursor = "pointer"; } : undefined}
      onPointerOut={onClick ? () => { document.body.style.cursor = "auto"; } : undefined}
    >
      {mostrarMarcador && (
        <Html position={[0, alto * 0.9, 0]} center distanceFactor={8} zIndexRange={[10, 0]}>
          <button
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            className="pointer-events-auto flex flex-col items-center gap-1 cursor-pointer select-none"
          >
            <span className="rounded-full bg-white text-black text-[11px] font-bold px-3 py-1.5 shadow-lg whitespace-nowrap border-2 border-[#0145F2]">
              {vehiculo.nombre}
            </span>
            <span className="h-3 w-3 rotate-45 bg-white border-b-2 border-r-2 border-[#0145F2] -mt-2.5" />
          </button>
        </Html>
      )}
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
