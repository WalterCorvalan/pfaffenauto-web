"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Loader } from "@react-three/drei";
import Image from "next/image";
import CameraRig, { type CameraRigHandle } from "./CameraRig";
import VehiculoPlaceholder from "./VehiculoPlaceholder";
import ShowroomUI from "./ShowroomUI";
import { SHOWROOM_VEHICULOS, type ShowroomVehicle } from "@/lib/showroom/types";

const ESPACIADO_FILA = 3.2; // distancia entre autos en la fila cenital

export default function Showroom3D({ marca }: { marca: "karry" | "rely" }) {
  const modelos = SHOWROOM_VEHICULOS.filter((v) => v.marca === marca);
  // Una entrada por unidad disponible, para que la fila muestre 1 caja por auto real en stock.
  const instancias = modelos.flatMap((v) =>
    Array.from({ length: v.disponibles ?? 1 }, (_, unidad) => ({ vehiculo: v, unidad }))
  );
  // null = estamos en la vista cenital (fila completa), sin selección confirmada.
  const [activo, setActivo] = useState<ShowroomVehicle | null>(null);
  // auto tocado en la fila, esperando confirmación en la tarjeta flotante.
  const [candidato, setCandidato] = useState<ShowroomVehicle | null>(null);
  const rigRef = useRef<CameraRigHandle>(null);

  useEffect(() => {
    rigRef.current?.goTo("cenital", instancias.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function confirmarSeleccion(v: ShowroomVehicle) {
    setActivo(v);
    setCandidato(null);
    rigRef.current?.goTo("exterior");
  }

  function volverALaFila() {
    setActivo(null);
    setCandidato(null);
    rigRef.current?.goTo("cenital", instancias.length);
  }

  return (
    <div className="relative h-[100dvh] w-full bg-neutral-950">
      <Canvas shadows camera={{ position: [0, instancias.length * 2.9, 0.1], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[6, 8, 4]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight position={[-6, 4, -4]} intensity={0.5} />

          {activo ? (
            <VehiculoPlaceholder key={activo.id} vehiculo={activo} />
          ) : (
            instancias.map(({ vehiculo: v, unidad }, i) => (
              <VehiculoPlaceholder
                key={`${v.id}-${unidad}`}
                vehiculo={v}
                posicionX={(i - (instancias.length - 1) / 2) * ESPACIADO_FILA}
                onClick={() => setCandidato(v)}
              />
            ))
          )}

          <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={24} blur={2} far={4} />
          <CameraRig ref={rigRef} autoRotate={false} />
        </Suspense>
      </Canvas>
      <Loader />

      {/* tarjeta de confirmación al tocar un auto en la vista cenital */}
      {candidato && !activo && (
        <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-72 rounded-3xl bg-[#0b1440] p-6 text-center text-white shadow-2xl">
            <span className="mb-4 inline-block rounded-full bg-lime-300 px-3 py-1 text-xs font-bold text-black">
              {candidato.disponibles ?? 1} disponible{(candidato.disponibles ?? 1) > 1 ? "s" : ""}
            </span>
            <div className="relative mx-auto mb-4 h-28 w-28 overflow-hidden rounded-2xl border-2 border-white/40 bg-white/5">
              <Image src={candidato.image} alt={candidato.nombre} fill className="object-cover" sizes="112px" />
            </div>
            <h3 className="text-lg font-bold">{candidato.nombre}</h3>
            <p className="mb-4 text-sm opacity-70">{candidato.subtitulo}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCandidato(null)}
                className="flex-1 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmarSeleccion(candidato)}
                className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400"
              >
                Ver auto
              </button>
            </div>
          </div>
        </div>
      )}

      <ShowroomUI
        marca={marca}
        modelos={modelos}
        activo={activo}
        onSeleccionar={confirmarSeleccion}
        onVolver={activo ? volverALaFila : undefined}
        onVista={(view) => rigRef.current?.goTo(view)}
      />
    </div>
  );
}
