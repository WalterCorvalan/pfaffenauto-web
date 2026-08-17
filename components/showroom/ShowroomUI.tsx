"use client";

import Image from "next/image";
import Link from "next/link";
import type { ShowroomVehicle, ShowroomView } from "@/lib/showroom/types";

type Props = {
  marca: "karry" | "rely";
  modelos: ShowroomVehicle[];
  activo: ShowroomVehicle | null;
  onSeleccionar: (v: ShowroomVehicle) => void;
  onVolver?: () => void;
  onVista: (view: ShowroomView) => void;
};

export default function ShowroomUI({ marca, modelos, activo, onSeleccionar, onVolver, onVista }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 text-white">
      {/* header: marca + selector de modelos */}
      <div className="pointer-events-auto flex items-center justify-between">
        {activo ? (
          <button onClick={onVolver} className="text-sm uppercase tracking-widest opacity-70 hover:opacity-100">
            ← Volver a la fila
          </button>
        ) : (
          <Link href={`/marcas/${marca}`} className="text-sm uppercase tracking-widest opacity-70 hover:opacity-100">
            ← {marca}
          </Link>
        )}
        <div className="flex gap-2">
          {modelos.map((m) => (
            <button
              key={m.id}
              onClick={() => onSeleccionar(m)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                activo?.id === m.id ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {m.nombre}
            </button>
          ))}
        </div>
      </div>

      {!activo && (
        <p className="pointer-events-none mx-auto text-center text-xs uppercase tracking-widest opacity-60">
          Tocá un auto para verlo de cerca
        </p>
      )}

      {/* panel de info del modelo activo */}
      {activo && (
        <div className="pointer-events-auto absolute right-6 top-24 w-72 rounded-2xl bg-black/50 p-5 backdrop-blur">
          <div className="relative mb-3 h-32 w-full overflow-hidden rounded-lg bg-black/30">
            <Image src={activo.image} alt={activo.nombre} fill className="object-cover" sizes="288px" />
          </div>
          <h3 className="text-lg font-semibold">{activo.nombre}</h3>
          <p className="mb-3 text-xs opacity-70">{activo.subtitulo}</p>
          <ul className="mb-4 space-y-1 text-xs opacity-90">
            {activo.specs.map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
          <a
            href={activo.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-full bg-emerald-500 px-4 py-2 text-center text-sm font-medium text-black hover:bg-emerald-400"
          >
            Cotizar por WhatsApp
          </a>
        </div>
      )}

      {/* controles de vista */}
      {activo && (
        <div className="pointer-events-auto mx-auto flex gap-3 rounded-full bg-black/40 px-4 py-3 backdrop-blur">
          <button onClick={() => onVista("exterior")} className="rounded-full bg-white/10 px-4 py-2 text-xs hover:bg-white/20">
            Vista 360°
          </button>
          <button onClick={() => onVista("interior")} className="rounded-full bg-white/10 px-4 py-2 text-xs hover:bg-white/20">
            Entrar al auto
          </button>
          <button onClick={() => onVista("trasera")} className="rounded-full bg-white/10 px-4 py-2 text-xs hover:bg-white/20">
            Ver caja/carga
          </button>
        </div>
      )}
    </div>
  );
}
