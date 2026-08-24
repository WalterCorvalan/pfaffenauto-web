"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import Showroom3D from "./Showroom3D";
import type { ShowroomVehicle } from "@/lib/showroom/types";

export default function ShowroomEntrada({
  sucursalNombre,
  fachadaSrc,
  vehiculos,
}: {
  sucursalNombre: string;
  fachadaSrc: string;
  vehiculos: ShowroomVehicle[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // la fachada se agranda (zoom "hacia adentro") y se desvanece a medida que scrolleás
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.6]);
  const opacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0]);

  return (
    <div ref={containerRef} className="relative h-[200vh]">
      {/* sección sticky: la fachada queda fija mientras se scrollea el alto extra del contenedor */}
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        <motion.div style={{ scale, opacity }} className="absolute inset-0">
          <Image
            src={fachadaSrc}
            alt={`Fachada Pfaffen Autos ${sucursalNombre}`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>

        <motion.div
          style={{ opacity }}
          className="pointer-events-none absolute inset-x-0 bottom-10 flex flex-col items-center text-white"
        >
          <p className="mb-2 text-sm uppercase tracking-widest opacity-80">Deslizá para entrar</p>
          <div className="h-8 w-5 rounded-full border-2 border-white/60 p-1">
            <div className="h-2 w-1 animate-bounce rounded-full bg-white" />
          </div>
        </motion.div>
      </div>

      {/* el showroom 3D queda debajo, se revela cuando la fachada termina de desvanecerse */}
      <div className="absolute inset-x-0 top-[100vh] h-[100dvh]">
        <Showroom3D vehiculos={vehiculos} />
      </div>
    </div>
  );
}
