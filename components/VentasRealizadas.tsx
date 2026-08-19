"use client";

import { Play, Camera, ArrowUpRight } from "lucide-react";

// TODO (Walter): reemplazar por publicaciones/videos reales de Instagram (imagen o thumbnail + link al posteo)
const PUBLICACIONES = [
  {
    id: 1,
    tipo: "video",
    imagen: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop",
    titulo: "Entrega Toyota Hilux 2023",
    link: "https://instagram.com/pfaffenautomotores",
  },
  {
    id: 2,
    tipo: "foto",
    imagen: "https://images.unsplash.com/photo-1494905998402-395d579af36f?q=80&w=600&auto=format&fit=crop",
    titulo: "Chevrolet Tracker recién entregada",
    link: "https://instagram.com/pfaffenautomotores",
  },
  {
    id: 3,
    tipo: "video",
    imagen: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=600&auto=format&fit=crop",
    titulo: "Volkswagen Amarok 0km entregada",
    link: "https://instagram.com/pfaffenautomotores",
  },
  {
    id: 4,
    tipo: "foto",
    imagen: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=600&auto=format&fit=crop",
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {PUBLICACIONES.map((p) => (
            <a
              key={p.id}
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              // CORRECCIÓN: Unificado a rounded-[24px] y sombras de sistema
              className="group relative aspect-[4/5] rounded-[24px] overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm hover:border-blue-400 dark:hover:border-sky-400/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0145F2]"
            >
              <img
                src={p.imagen}
                alt={p.titulo}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>

              {p.tipo === "video" && (
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md group-hover:bg-white group-hover:scale-110 transition-all">
                  <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600 ml-0.5" />
                </div>
              )}

              <span className="absolute bottom-4 left-4 right-4 text-white text-xs sm:text-sm font-bold leading-tight drop-shadow-md">
                {p.titulo}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}