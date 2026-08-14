"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ShieldCheck, Sparkles } from "lucide-react";

// ================= SUBCOMPONENTE DE TARJETA ESTÁNDAR =================
function MarcaCard({ marca }: { marca: { nombre: string; slug: string; logo: string } }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link 
      href={`/marcas/${marca.slug}`} 
      className="flex flex-col items-center justify-center gap-3 bg-white border border-gray-200 rounded-2xl py-6 hover:border-blue-500 hover:shadow-lg transition-all duration-300 group h-full focus:outline-none"
    >
      <div className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 mix-blend-multiply p-2">
        {!imgError ? (
          <Image
            src={marca.logo}
            alt={`Logo de ${marca.nombre}`}
            fill
            sizes="64px"
            className="object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
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

// ================= SUBCOMPONENTE DE TARJETA DESTACADA (RELY Y KARRY) =================
function MarcaDestacadaCard({ marca }: { marca: { nombre: string; slug: string; logo: string } }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link 
      href={`/${marca.slug}`} 
      className="relative flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-blue-50/80 via-white to-sky-50/50 border-2 border-blue-500/40 rounded-2xl py-6 hover:border-blue-600 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group h-full focus:outline-none overflow-hidden"
    >
      {/* Badge superior destello */}
      <div className="absolute top-2 right-2 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
        <Sparkles className="w-2.5 h-2.5" /> Oficial
      </div>

      <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 p-2">
        {!imgError ? (
          <Image
            src={marca.logo}
            alt={`Logo de ${marca.nombre}`}
            fill
            sizes="80px"
            className="object-contain drop-shadow-sm"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
            <span className="text-2xl font-black text-blue-600 uppercase">
              {marca.nombre.charAt(0)}
            </span>
          </div>
        )}
      </div>
      
      <div className="text-center px-2 w-full">
        <span className="text-xs md:text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors block truncate">
          {marca.nombre}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-blue-600/80 block mt-0.5">
          Concesionario
        </span>
      </div>
    </Link>
  );
}

// ================= COMPONENTE PRINCIPAL =================
export default function Marcas() {
  // Marcas Oficiales Destacadas (Primeras en la fila)
  const marcasDestacadas = [
    { nombre: "Rely", slug: "rely", logo: "/RelyLogo.png" },
    { nombre: "Karry", slug: "karry", logo: "/logo-karry.webp" },
  ];

  const marcas = [
    // Marcas Tradicionales
    { nombre: "Volkswagen", slug: "volkswagen", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg" },
    { nombre: "Chevrolet", slug: "chevrolet", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Chevrolet-logo.png" },
    { nombre: "Toyota", slug: "toyota", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg" },
    { nombre: "Ford", slug: "ford", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg" },
    { nombre: "Peugeot", slug: "peugeot", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg" },
    { nombre: "Renault", slug: "renault", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_logo.svg" },
    { nombre: "Fiat", slug: "fiat", logo: "https://upload.wikimedia.org/wikipedia/commons/1/12/Fiat_Automobiles_logo.svg" },
    { nombre: "Nissan", slug: "nissan", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Nissan_logo.png" },
    { nombre: "Honda", slug: "honda", logo: "https://upload.wikimedia.org/wikipedia/commons/3/38/Honda.svg" },
    { nombre: "Citroën", slug: "citroen", logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Citroen_2021_Logo.svg" },
    { nombre: "Hyundai", slug: "hyundai", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg" },
    { nombre: "Kia", slug: "kia", logo: "https://upload.wikimedia.org/wikipedia/commons/4/47/KIA_logo2.svg" },
    { nombre: "Jeep", slug: "jeep", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Jeep_logo.svg" },
    { nombre: "RAM", slug: "ram", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Ram_Trucks_logo.svg" },
    { nombre: "Suzuki", slug: "suzuki", logo: "https://upload.wikimedia.org/wikipedia/commons/1/12/Suzuki_logo_2.svg" },
    { nombre: "Mitsubishi", slug: "mitsubishi", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Mitsubishi_logo.svg" },
    
    // Marcas Chinas / Asiáticas
    { nombre: "BAIC", slug: "baic", logo: "https://upload.wikimedia.org/wikipedia/commons/9/90/BAIC_logo.svg" },
    { nombre: "Chery", slug: "chery", logo: "https://upload.wikimedia.org/wikipedia/commons/2/23/Chery_logo.svg" },
    { nombre: "Changan", slug: "changan", logo: "https://upload.wikimedia.org/wikipedia/commons/2/29/Changan_Auto_logo.svg" },
    { nombre: "BYD", slug: "byd", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fb/BYD_logo.svg" },
    { nombre: "Geely", slug: "geely", logo: "https://upload.wikimedia.org/wikipedia/commons/a/af/Geely_logo.svg" },
    { nombre: "Haval", slug: "haval", logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Haval_logo.svg" },
    { nombre: "JAC", slug: "jac", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0c/JAC_Motors_logo.svg" },
    
    // Alta Gama
    { nombre: "Audi", slug: "audi", logo: "https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg" },
    { nombre: "BMW", slug: "bmw", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg" },
    { nombre: "Mercedes-Benz", slug: "mercedes-benz", logo: "https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg" },
  ];

  return (
    <section className="w-full bg-[#f8f9fa] pt-10 pb-10 md:pt-16 md:pb-20">
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

        {/* ================= SECCIÓN 1: MARCAS OFICIALES DESTACADAS (RELY Y KARRY) ================= */}
        <div className="mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full inline-block mb-3">
            Concesionarios Oficiales
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {marcasDestacadas.map((marca) => (
              <div key={marca.slug} className="h-full">
                <MarcaDestacadaCard marca={marca} />
              </div>
            ))}
          </div>
        </div>

        {/* ================= SECCIÓN 2: GRILLA DE MARCAS TRADICIONALES ================= */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">
            Otras marcas y multimarca
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
            {marcas.map((marca) => (
              <div key={marca.slug} className="h-full">
                <MarcaCard marca={marca} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}