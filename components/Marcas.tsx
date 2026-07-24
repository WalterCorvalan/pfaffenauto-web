"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

// Subcomponente para manejar el estado de cada imagen individualmente de forma segura en React
function MarcaCard({ marca }: { marca: { nombre: string; slug: string; logo: string } }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link 
      href={`/marcas/${marca.slug}`} 
      className="flex flex-col items-center justify-center gap-3 bg-white border border-gray-100 rounded-3xl py-4 md:py-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
    >
      <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
        {!imgError ? (
          <img 
            src={marca.logo} 
            alt={`Logo de ${marca.nombre}`} 
            className="w-full h-full object-contain mix-blend-multiply"
            onError={() => setImgError(true)} // Si falla la carga, cambia el estado de forma segura
          />
        ) : (
          // Fallback: Si no hay foto, mostramos la inicial grande y elegante
          <span className="text-3xl font-black text-gray-300 group-hover:text-primary transition-colors">
            {marca.nombre.charAt(0)}
          </span>
        )}
      </div>
      <span className="text-[10px] md:text-xs font-bold text-gray-500 group-hover:text-navy transition-colors">
        {marca.nombre}
      </span>
    </Link>
  );
}

export default function Marcas() {
  const marcas = [
    { nombre: "Volkswagen", slug: "volkswagen", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg" },
    { nombre: "Chevrolet", slug: "chevrolet", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Chevrolet-logo.png" },
    { nombre: "Toyota", slug: "toyota", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg" },
    { nombre: "Fiat", slug: "fiat", logo: "https://upload.wikimedia.org/wikipedia/commons/1/12/Fiat_Automobiles_logo.svg" },
    { nombre: "Peugeot", slug: "peugeot", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg" },
    { nombre: "Ford", slug: "ford", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg" },
    { nombre: "Renault", slug: "renault", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_logo.svg" },
    { nombre: "Hyundai", slug: "hyundai", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg" },
    { nombre: "Jeep", slug: "jeep", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Jeep_logo.svg" },
  ];

  return (
    <section className="w-full bg-background pt-10 pb-4">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-2xl md:text-3xl text-navy font-light tracking-tight">
            Buscá por <strong className="font-black">marca</strong>
          </h2>
          
          <Link href="/marcas" className="text-[11px] md:text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
            <span className="hidden sm:inline">Ver todas las marcas</span>
            <span className="inline sm:hidden">Ver todas</span>
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          </Link>
        </div>

        {/* GRILLA DE MARCAS */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-5">
          {marcas.map((marca) => (
            <MarcaCard key={marca.slug} marca={marca} />
          ))}
        </div>

      </div>
    </section>
  );
}