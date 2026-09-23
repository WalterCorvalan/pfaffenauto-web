"use client";

import { Camera, ArrowUpRight } from "lucide-react";
import MediaReel, { type ReelItem } from "./MediaReel";

// TODO (Walter): reemplazar por publicaciones/videos reales de Instagram (imagen o thumbnail + link al posteo)
// "imagen" queda como src del reel -- para un ítem "video" real, apuntar a
// un .mp4 propio (no un thumbnail estático), MediaReel lo reproduce autoplay/mudo.
const PUBLICACIONES: ReelItem[] = [
  {
    id: 1,
    tipo: "foto",
    src: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop",
    titulo: "Entrega Toyota Hilux 2023",
    link: "https://instagram.com/pfaffenautomotores",
  },
  {
    id: 2,
    tipo: "foto",
    src: "https://images.unsplash.com/photo-1494905998402-395d579af36f?q=80&w=600&auto=format&fit=crop",
    titulo: "Chevrolet Tracker recién entregada",
    link: "https://instagram.com/pfaffenautomotores",
  },
  {
    id: 3,
    tipo: "foto",
    src: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=600&auto=format&fit=crop",
    titulo: "Volkswagen Amarok 0km entregada",
    link: "https://instagram.com/pfaffenautomotores",
  },
  {
    id: 4,
    tipo: "foto",
    src: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=600&auto=format&fit=crop",
    titulo: "Ford Ranger lista para trabajar",
    link: "https://instagram.com/pfaffenautomotores",
  },
];

export default function VentasRealizadas() {
  return (
    <section className="py-10 md:py-24 bg-[#f8f9fa] dark:bg-[#0a0a0f] border-t border-gray-200 dark:border-transparent">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div className="max-w-2xl">
            <span className="text-blue-600 dark:text-sky-300 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Camera className="w-3.5 h-3.5" /> Entregas reales
            </span>
            <h2 className="text-3xl md:text-5xl text-gray-900 dark:text-white font-black tracking-tight leading-tight">
              Autos que ya <span className="text-blue-600 dark:text-sky-300">entregamos.</span>
            </h2>
          </div>
          <a
            href="https://instagram.com/pfaffenautomotores"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-sky-300 hover:text-blue-800 dark:hover:text-sky-200 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0145F2] rounded-md"
          >
            Seguinos en Instagram <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        <div className="flex justify-center">
          <MediaReel items={PUBLICACIONES} className="h-[28rem] w-full max-w-sm" />
        </div>
      </div>
    </section>
  );
}