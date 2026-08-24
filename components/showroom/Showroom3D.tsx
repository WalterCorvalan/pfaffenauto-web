"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Loader, Grid } from "@react-three/drei";
import Image from "next/image";
import CameraRig, { type CameraRigHandle } from "./CameraRig";
import VehiculoPlaceholder from "./VehiculoPlaceholder";
import WalkControls from "./WalkControls";
import WalkJoystick from "./WalkJoystick";
import { useWalkState } from "./useWalkState";
import ShowroomUI from "./ShowroomUI";
import type { ShowroomVehicle } from "@/lib/showroom/types";

const COLUMNAS = 5; // autos por fila — a partir de acá arma filas hacia atrás, no una línea infinita
const ESPACIADO_COLUMNA = 3.2; // distancia entre autos de una misma fila (eje X)
const ESPACIADO_FILA_Z = 6; // distancia entre una fila y la siguiente (eje Z) — deja pasillo para caminar entre filas
const Z_INICIAL = 4; // dónde arranca parado el visitante (vereda frente a la primera fila)

export default function Showroom3D({ vehiculos }: { vehiculos: ShowroomVehicle[] }) {
  const modelos = vehiculos;
  // Stock real: cada vehículo ya es una unidad física individual (disponibles
  // siempre 1), así que acá no hay que repetir instancias por cantidad.
  const instancias = modelos.map((v) => ({ vehiculo: v, unidad: 0 }));
  // null = estamos caminando por la fila en primera persona, sin selección confirmada.
  const [activo, setActivo] = useState<ShowroomVehicle | null>(null);
  // auto tocado en la fila, esperando confirmación en la tarjeta flotante.
  const [candidato, setCandidato] = useState<ShowroomVehicle | null>(null);
  const [resetId, setResetId] = useState(0);
  const rigRef = useRef<CameraRigHandle>(null);
  const walk = useWalkState();

  const filas = Math.max(1, Math.ceil(instancias.length / COLUMNAS));

  // Salón abierto: el ancho es siempre el de una fila completa (5 autos) y el
  // fondo crece con la cantidad de filas — así hay lugar para caminar libre
  // incluso con pocas unidades, y espacio real detrás de cada fila con muchas.
  const anchoSalon = (COLUMNAS - 1) / 2 * ESPACIADO_COLUMNA + 2;
  const limiteX = { min: -Math.max(anchoSalon, 14), max: Math.max(anchoSalon, 14) };
  const limiteZ = { min: -(filas * ESPACIADO_FILA_Z) - 2, max: Z_INICIAL + 2 };

  useEffect(() => {
    rigRef.current?.goTo("cenital");
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
    setResetId((r) => r + 1);
    rigRef.current?.goTo("cenital");
  }

  // Arrastre para mirar alrededor (mouse en desktop, dedo en mobile) — en
  // toda la pantalla salvo el joystick, que captura su propio puntero.
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
      className="relative h-[100dvh] w-full bg-neutral-950 touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <Canvas shadows camera={{ position: [0, 1.6, Z_INICIAL], fov: 60 }}>
        <Suspense fallback={null}>
          <color attach="background" args={["#14161f"]} />
          <fog attach="fog" args={["#14161f", 10, 34]} />

          <ambientLight intensity={0.5} />
          <directionalLight
            position={[6, 8, 4]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight position={[-6, 4, -4]} intensity={0.5} />

          {/* Piso: sin esto el suelo era el mismo negro que el fondo, imposible
              distinguir dónde termina uno y empieza el otro (sin sensación de
              profundidad). La grilla marca distancia recorrida al caminar. */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -50]} receiveShadow>
            <planeGeometry args={[160, 160]} />
            <meshStandardMaterial color="#1f2230" />
          </mesh>
          <Grid
            position={[0, 0.01, 0]}
            args={[160, 160]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#3a3f56"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#565d80"
            fadeDistance={60}
            fadeStrength={1.5}
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

          <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={24} blur={2} far={4} />
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

      {/* joystick táctil — solo en modo caminata */}
      {!activo && !candidato && <WalkJoystick walk={walk} />}

      {/* tarjeta de confirmación al tocar un auto en la fila */}
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
        modelos={modelos}
        activo={activo}
        onSeleccionar={confirmarSeleccion}
        onVolver={activo ? volverALaFila : undefined}
        onVista={(view) => rigRef.current?.goTo(view)}
      />
    </div>
  );
}
