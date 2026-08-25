"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Loader, Grid, Environment } from "@react-three/drei";
import Image from "next/image";
import CameraRig, { type CameraRigHandle } from "./CameraRig";
import VehiculoPlaceholder from "./VehiculoPlaceholder";
import WalkControls from "./WalkControls";
import WalkJoystick from "./WalkJoystick";
import { useWalkState } from "./useWalkState";
import ShowroomUI from "./ShowroomUI";
import type { ShowroomVehicle } from "@/lib/showroom/types";

const COLUMNAS = 5; 
const ESPACIADO_COLUMNA = 3.2; 
const ESPACIADO_FILA_Z = 6; 
const Z_INICIAL = 4; 

export default function Showroom3D({ vehiculos }: { vehiculos: ShowroomVehicle[] }) {
  const modelos = vehiculos;
  const instancias = modelos.map((v) => ({ vehiculo: v, unidad: 0 }));
  
  const [activo, setActivo] = useState<ShowroomVehicle | null>(null);
  const [candidato, setCandidato] = useState<ShowroomVehicle | null>(null);
  const [resetId, setResetId] = useState(0);
  const rigRef = useRef<CameraRigHandle>(null);
  const walk = useWalkState();

  const filas = Math.max(1, Math.ceil(instancias.length / COLUMNAS));
  const anchoSalon = (COLUMNAS - 1) / 2 * ESPACIADO_COLUMNA + 2;
  const limiteX = { min: -Math.max(anchoSalon, 14), max: Math.max(anchoSalon, 14) };
  const limiteZ = { min: -(filas * ESPACIADO_FILA_Z) - 2, max: Z_INICIAL + 2 };

  useEffect(() => {
    rigRef.current?.goTo("cenital");
  }, []);

  function confirmarSeleccion(v: ShowroomVehicle) {
    setActivo(v);
    setCandidato(null);
    rigRef.current?.goTo("exterior");
  }

  function volverALaFila() {
    setActivo(null);
    setCandidato(null);
    setResetId((r) => r + 1);
    rigRef.current?.goTo("cenital");
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (activo) return;
    walk.iniciarArrastre(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (activo) return;
    walk.moverArrastre(e.clientX, e.clientY);
  };
  const onPointerUp = () => walk.terminarArrastre();

  return (
    <div
      className="relative h-[100dvh] w-full bg-[#0a0a0f] touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <Canvas shadows camera={{ position: [0, 1.6, Z_INICIAL], fov: 60 }}>
        <Suspense fallback={null}>
          
          {/* ================= ENTORNO 360 (FONDO) ================= */}
          {/* 
            Si tienes tu propia foto de la sucursal en 360 grados, colócala en public/ y cambia esto a: 
            <Environment files="/tu-foto-360.jpg" background /> 
            
            Mientras tanto, usamos el preset "warehouse" (depósito) que le da una iluminación 
            industrial súper realista y reflejos a la carrocería. 
          */}
          <Environment preset="warehouse" background blur={0.06} />
          
          {/* Luces de refuerzo */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[6, 8, 4]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />

          {/* ================= PISO REFLECTANTE ================= */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -50]} receiveShadow>
            <planeGeometry args={[160, 160]} />
            {/* Piso oscuro brillante que refleja el entorno y los autos */}
            <meshStandardMaterial color="#050505" roughness={0.15} metalness={0.6} />
          </mesh>
          
          {/* Grilla sutil sobre el piso */}
          <Grid
            position={[0, 0.01, 0]}
            args={[160, 160]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#1e293b"
            sectionSize={5}
            sectionThickness={1.5}
            sectionColor="#334155"
            fadeDistance={40}
            fadeStrength={2}
            infiniteGrid
          />

          {activo ? (
            <VehiculoPlaceholder key={activo.id} vehiculo={activo} />
          ) : (
            instancias.map(({ vehiculo: v, unidad }, i) => {
              const col = i % COLUMNAS;
              const fila = Math.floor(i / COLUMNAS);
              return (
                <VehiculoPlaceholder
                  key={`${v.id}-${unidad}`}
                  vehiculo={v}
                  posicionX={(col - (COLUMNAS - 1) / 2) * ESPACIADO_COLUMNA}
                  posicionZ={-fila * ESPACIADO_FILA_Z}
                  onClick={() => setCandidato(v)}
                  mostrarMarcador
                />
              );
            })
          )}

          <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={24} blur={2.5} far={4} />
          <CameraRig ref={rigRef} autoRotate={false} />
          <WalkControls
            activo={!activo}
            walk={walk}
            limiteX={limiteX}
            limiteZ={limiteZ}
            posicionInicial={{ x: 0, z: Z_INICIAL }}
            resetId={resetId}
          />
        </Suspense>
      </Canvas>
      <Loader />

      {!activo && !candidato && <WalkJoystick walk={walk} />}

      {/* ================= TARJETA FLOTANTE DE CONFIRMACIÓN ================= */}
      {candidato && !activo && (
        <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="w-80 rounded-[2rem] border border-white/10 bg-[#0a0a0f]/90 p-8 text-center text-white shadow-2xl">
            <span className="mb-5 inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-[10px] font-black tracking-widest text-emerald-400 uppercase">
              {candidato.disponibles ?? 1} unidad{(candidato.disponibles ?? 1) > 1 ? "es" : ""} lista{(candidato.disponibles ?? 1) > 1 ? "s" : ""}
            </span>
            <div className="relative mx-auto mb-6 h-36 w-full overflow-hidden rounded-2xl bg-white/5 shadow-inner">
              <Image src={candidato.image} alt={candidato.nombre} fill className="object-contain p-2" sizes="256px" />
            </div>
            <h3 className="text-2xl font-black tracking-tight leading-tight">{candidato.nombre}</h3>
            <p className="mb-8 mt-1 text-sm font-medium text-slate-400">{candidato.subtitulo}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setCandidato(null)}
                className="flex-1 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmarSeleccion(candidato)}
                className="flex-1 rounded-xl bg-[#0145F2] hover:bg-blue-600 shadow-lg shadow-blue-500/20 px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-white transition-all active:scale-95"
              >
                Ingresar
              </button>
            </div>
          </div>
        </div>
      )}

      <ShowroomUI
        modelos={modelos}
        activo={activo}
        onSeleccionar={confirmarSeleccion}
        onVolver={activo ? volverALaFila : undefined}
        onVista={(view) => rigRef.current?.goTo(view)}
      />
    </div>
  );
}