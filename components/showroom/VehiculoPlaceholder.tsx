"use client";

import { Html } from "@react-three/drei";
import type { ShowroomVehicle } from "@/lib/showroom/types";

type Props = {
  vehiculo: ShowroomVehicle;
  posicionX?: number;
  posicionZ?: number;
  onClick?: () => void;
  mostrarMarcador?: boolean;
};

export default function VehiculoPlaceholder({ vehiculo, posicionX = 0, posicionZ = 0, onClick, mostrarMarcador = false }: Props) {
  const { largo, ancho, alto } = vehiculo.dimensiones;
  
  // Verificamos si hay una imagen real cargada
  const tieneImagenValida = vehiculo.image && vehiculo.image !== "/logo.png";

  return (
    <group
      position={[posicionX, alto / 2, posicionZ]}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      onPointerOver={onClick ? () => { document.body.style.cursor = "pointer"; } : undefined}
      onPointerOut={onClick ? () => { document.body.style.cursor = "auto"; } : undefined}
    >
      {/* ================= PANTALLA FLOTANTE (TIPO HOLOGRAMA / VIDEOJUEGO) ================= */}
      {mostrarMarcador && (
        <Html
          position={[0, alto / 2 + 0.8, 0]} // Posicionado flotando arriba del techo del auto
          center
          transform
          sprite // <--- LA MAGIA: Hace que la tarjeta siempre gire para mirar a la cámara
          distanceFactor={5} // Escala el tamaño dependiendo de qué tan lejos estés
          zIndexRange={[100, 0]}
        >
          <div
            className="flex flex-col items-center pointer-events-auto cursor-pointer group"
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          >
            {/* Foto del auto enmarcada */}
            {tieneImagenValida && (
              <div className="w-[220px] h-[130px] rounded-2xl overflow-hidden border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-3 bg-[#0a0a0f] relative transition-transform duration-300 group-hover:scale-105 group-hover:border-[#0145F2] group-hover:shadow-[#0145F2]/20">
                <img src={vehiculo.image} alt={vehiculo.nombre} className="w-full h-full object-cover opacity-90 group-hover:opacity-100" />
              </div>
            )}

            {/* Etiqueta del nombre */}
            <span className="rounded-full bg-white/90 backdrop-blur-sm text-slate-900 group-hover:text-white group-hover:bg-[#0145F2] transition-colors text-[10px] font-black uppercase tracking-[0.15em] px-4 py-2 shadow-xl whitespace-nowrap border border-white/20">
              {vehiculo.nombre}
            </span>

            {/* Rayita láser señalando hacia el auto */}
            <div className="w-[2px] h-8 bg-gradient-to-b from-white/50 to-transparent mt-1" />
          </div>
        </Html>
      )}

      {/* ================= DISEÑO DE LA CARROCERÍA (Caja Oscura Elegante) ================= */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[ancho, alto, largo]} />
        {/* Cambié el gris claro por un gris oscuro azulado para que se vea más premium */}
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Cabina (Vidrios) */}
      <mesh position={[0, alto * 0.35, largo * 0.15]} castShadow>
        <boxGeometry args={[ancho * 0.9, alto * 0.6, largo * 0.4]} />
        <meshStandardMaterial color="#020617" metalness={0.8} roughness={0.1} transparent opacity={0.8} />
      </mesh>

      {/* Caja/Carga trasera */}
      <mesh position={[0, alto * 0.1, -largo * 0.3]}>
        <boxGeometry args={[ancho * 0.95, alto * 0.5, largo * 0.35]} />
        <meshStandardMaterial color="#0f172a" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Ruedas */}
      {[
        [ancho / 2, -alto / 2, largo / 3],
        [-ancho / 2, -alto / 2, largo / 3],
        [ancho / 2, -alto / 2, -largo / 3],
        [-ancho / 2, -alto / 2, -largo / 3],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[alto * 0.22, alto * 0.22, ancho * 0.2, 24]} />
          <meshStandardMaterial color="#020617" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}