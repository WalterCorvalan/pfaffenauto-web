"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows, Loader } from "@react-three/drei";
import CameraRig, { type CameraRigHandle } from "./CameraRig";
import VehiculoPlaceholder from "./VehiculoPlaceholder";
import ShowroomUI from "./ShowroomUI";
import { SHOWROOM_VEHICULOS, type ShowroomVehicle } from "@/lib/showroom/types";

export default function Showroom3D({ marca }: { marca: "karry" | "rely" }) {
  const modelos = SHOWROOM_VEHICULOS.filter((v) => v.marca === marca);
  const [activo, setActivo] = useState<ShowroomVehicle>(modelos[0]);
  const rigRef = useRef<CameraRigHandle>(null);

  return (
    <div className="relative h-[100dvh] w-full bg-neutral-950">
      <Canvas shadows camera={{ position: [5, 2.5, 6], fov: 40 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[6, 8, 4]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <Environment preset="city" />
          <VehiculoPlaceholder key={activo.id} vehiculo={activo} />
          <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={12} blur={2} far={4} />
          <CameraRig ref={rigRef} autoRotate={false} />
        </Suspense>
      </Canvas>
      <Loader />

      <ShowroomUI
        marca={marca}
        modelos={modelos}
        activo={activo}
        onSeleccionar={(v) => {
          setActivo(v);
          rigRef.current?.goTo("exterior");
        }}
        onVista={(view) => rigRef.current?.goTo(view)}
      />
    </div>
  );
}
