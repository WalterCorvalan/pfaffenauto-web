"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LOGOS_MARCAS } from "@/lib/marcasLogos";

const MarcaCard = ({
  marca,
}: {
  marca: { nombre: string; slug: string; logo: string | null };
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/marcas/${marca.slug}`}
      className="group flex flex-col items-center justify-center gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 aspect-square hover:border-blue-500 dark:hover:border-sky-400/50 hover:shadow-lg transition-all duration-300 focus:outline-none"
    >
      <div className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
        {marca.logo && !imgError ? (
          <Image
            src={marca.logo}
            alt={`Logo de ${marca.nombre}`}
            fill
            sizes="64px"
            className="object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-sky-400/10 group-hover:border-blue-200 dark:group-hover:border-sky-400/30 transition-colors">
            <span className="text-2xl font-bold text-gray-400 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors uppercase">
              {marca.nombre.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <span className="text-xs md:text-sm font-semibold text-gray-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors text-center">
        {marca.nombre}
      </span>
    </Link>
  );
};

const MARCAS: { nombre: string; slug: string }[] = [
  { nombre: "Volkswagen", slug: "volkswagen" },
  { nombre: "Chevrolet", slug: "chevrolet" },
  { nombre: "Toyota", slug: "toyota" },
  { nombre: "Ford", slug: "ford" },
  { nombre: "Peugeot", slug: "peugeot" },
  { nombre: "Renault", slug: "renault" },
  { nombre: "Fiat", slug: "fiat" },
  { nombre: "Nissan", slug: "nissan" },
  { nombre: "Honda", slug: "honda" },
  { nombre: "Citroën", slug: "citroen" },
  { nombre: "Hyundai", slug: "hyundai" },
  { nombre: "Kia", slug: "kia" },
  { nombre: "Jeep", slug: "jeep" },
  { nombre: "RAM", slug: "ram" },
  { nombre: "Suzuki", slug: "suzuki" },
  { nombre: "Mitsubishi", slug: "mitsubishi" },
  { nombre: "BAIC", slug: "baic" },
  { nombre: "Chery", slug: "chery" },
  { nombre: "BYD", slug: "byd" },
  { nombre: "Geely", slug: "geely" },
  { nombre: "Haval", slug: "haval" },
  { nombre: "JAC", slug: "jac" },
  { nombre: "Audi", slug: "audi" },
  { nombre: "BMW", slug: "bmw" },
  { nombre: "Mercedes-Benz", slug: "mercedes-benz" },
];

export default function MarcasClient() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0a0f] relative overflow-hidden pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        {/* Migas de pan y Título */}
        <div className="mb-10">
          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#0145F2] dark:hover:text-sky-300 transition-colors">
              Inicio
            </Link>
            <span className="text-gray-400 dark:text-slate-600">/</span>
            <span className="text-navy dark:text-white">Marcas</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-navy dark:text-white tracking-tight mb-3">
            Todas las Marcas
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xl">
            Elegí una marca para ver el stock disponible de 0km y usados seleccionados en Pfaffen Autos.
          </p>
        </div>

        {/* Grilla de Marcas */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
          {MARCAS.map((marca) => (
            <MarcaCard key={marca.slug} marca={{ ...marca, logo: LOGOS_MARCAS[marca.nombre] || null }} />
          ))}
        </div>
      </div>
    </div>
  );
}
