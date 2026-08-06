"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";

// ================= SUBCOMPONENTE DE TARJETA (CLEAN COMMERCE) =================
function MarcaCard({ marca }: { marca: { nombre: string; slug: string; logo: string } }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link 
      href={`/marcas/${marca.slug}`} 
      className="flex flex-col items-center justify-center gap-3 bg-white border border-gray-200 rounded-2xl py-6 hover:border-blue-500 hover:shadow-lg transition-all duration-300 group h-full focus:outline-none"
    >
      <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 mix-blend-multiply">
        {!imgError ? (
          <img 
            src={marca.logo} 
            alt={`Logo de ${marca.nombre}`} 
            className="w-full h-full object-contain"
            onError={() => setImgError(true)} 
          />
        ) : (
          // Fallback: Si no hay foto, mostramos la inicial
          <div className="w-full h-full rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
            <span className="text-2xl font-bold text-gray-400 group-hover:text-blue-600 transition-colors uppercase">
              {marca.nombre.charAt(0)}
            </span>
          </div>
        )}
      </div>
      
      <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-600 transition-colors text-center px-2 w-full truncate">
        {marca.nombre}
      </span>
    </Link>
  );
}

// ================= COMPONENTE PRINCIPAL =================
export default function Marcas() {
  const marcas = [
    { nombre: "Volkswagen", slug: "volkswagen", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg" },
    { nombre: "Chevrolet", slug: "chevrolet", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Chevrolet-logo.png" },
    { nombre: "Toyota", slug: "toyota", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg" },
    { nombre: "Ford", slug: "ford", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg" },
    { nombre: "Peugeot", slug: "peugeot", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg" },
    { nombre: "Renault", slug: "renault", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_logo.svg" },
    { nombre: "Fiat", slug: "fiat", logo: "https://upload.wikimedia.org/wikipedia/commons/1/12/Fiat_Automobiles_logo.svg" },
    { nombre: "Nissan", slug: "nissan", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Nissan_logo.png" },
    { nombre: "Honda", slug: "honda", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg" },
    { nombre: "Citroën", slug: "citroen", logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Citroen_2021_Logo.svg" },
    { nombre: "Hyundai", slug: "hyundai", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg" },
    { nombre: "Jeep", slug: "jeep", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Jeep_logo.svg" },
    { nombre: "Audi", slug: "audi", logo: "https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg" },
    { nombre: "BMW", slug: "bmw", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg" },
    { nombre: "Mercedes-Benz", slug: "mercedes-benz", logo: "https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg" },
  ];

  return (
    <section className="w-full bg-[#f8f9fa] pt-16 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* ================= ENCABEZADO ================= */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Buscá por marca
            </h2>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Todas nuestras unidades cuentan con respaldo oficial.
            </p>
          </div>
          
          <Link 
            href="/marcas" 
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 group"
          >
            Ver todas las marcas
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* ================= GRILLA DE MARCAS ================= */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {marcas.map((marca) => (
            <div key={marca.slug} className="h-full">
              <MarcaCard marca={marca} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}