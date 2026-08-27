"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
import { LOGOS_MARCAS } from "@/lib/marcasLogos";

// ================= SUBCOMPONENTE DE TARJETA ESTÁNDAR =================
function MarcaCard({ marca }: { marca: { nombre: string; slug: string; logo: string } }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link 
      href={`/marcas/${marca.slug}`} 
      className="flex flex-col items-center justify-center gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-6 hover:border-blue-500 dark:hover:border-sky-400/50 hover:shadow-lg transition-all duration-300 group h-full focus:outline-none"
    >
      <div className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 mix-blend-multiply dark:mix-blend-normal p-2">
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
          <div className="w-full h-full rounded-full bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-sky-400/10 group-hover:border-blue-200 dark:group-hover:border-sky-400/30 transition-colors">
            <span className="text-2xl font-bold text-gray-400 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors uppercase">
              {marca.nombre.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <span className="text-xs font-semibold text-gray-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors text-center px-2 w-full truncate">
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
      className="relative flex flex-col items-center justify-center gap-2 md:gap-3 bg-gradient-to-br from-blue-50/80 via-white to-sky-50/50 dark:from-sky-400/10 dark:via-white/5 dark:to-blue-500/10 border-2 border-blue-500/40 dark:border-sky-400/30 rounded-2xl py-5 md:py-6 hover:border-blue-600 dark:hover:border-sky-400 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group h-full focus:outline-none overflow-hidden"
    >
      {/* Badge superior destello */}
      <div className="absolute top-2 right-2 bg-blue-600 dark:bg-sky-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
        <Sparkles className="w-2.5 h-2.5" /> Oficial
      </div>

      {/* Ícono más grande solo en mobile (w-24 base, vuelve a w-20 desde md);
         el padding/gap de la tarjeta se achicó un poco para compensar y que
         la tarjeta en sí no crezca. */}
      <div className="relative w-28 h-28 md:w-36 md:h-36 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 p-2">
        {!imgError ? (
          <Image
            src={marca.logo}
            alt={`Logo de ${marca.nombre}`}
            fill
            sizes="144px"
            className={`object-contain drop-shadow-sm ${marca.slug === "rely" ? "dark:brightness-0 dark:invert" : ""}`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full rounded-full bg-blue-100 dark:bg-sky-400/10 border border-blue-200 dark:border-sky-400/30 flex items-center justify-center">
            <span className="text-2xl font-black text-blue-600 dark:text-sky-300 uppercase">
              {marca.nombre.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <div className="text-center px-2 w-full">
        <span className="text-xs md:text-sm font-black text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors block truncate">
          {marca.nombre}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-blue-600/80 dark:text-sky-400/80 block mt-0.5">
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
    { nombre: "Volkswagen", slug: "volkswagen", logo: LOGOS_MARCAS["Volkswagen"] },
    { nombre: "Chevrolet", slug: "chevrolet", logo: LOGOS_MARCAS["Chevrolet"] },
    { nombre: "Toyota", slug: "toyota", logo: LOGOS_MARCAS["Toyota"] },
    { nombre: "Ford", slug: "ford", logo: LOGOS_MARCAS["Ford"] },
    { nombre: "Peugeot", slug: "peugeot", logo: LOGOS_MARCAS["Peugeot"] },
    { nombre: "Renault", slug: "renault", logo: LOGOS_MARCAS["Renault"] },
    { nombre: "Fiat", slug: "fiat", logo: LOGOS_MARCAS["Fiat"] },
    { nombre: "Nissan", slug: "nissan", logo: LOGOS_MARCAS["Nissan"] },
    { nombre: "Honda", slug: "honda", logo: LOGOS_MARCAS["Honda"] },
    { nombre: "Citroën", slug: "citroen", logo: LOGOS_MARCAS["Citroën"] },
    { nombre: "Hyundai", slug: "hyundai", logo: LOGOS_MARCAS["Hyundai"] },
    { nombre: "Kia", slug: "kia", logo: LOGOS_MARCAS["Kia"] },
    { nombre: "Jeep", slug: "jeep", logo: LOGOS_MARCAS["Jeep"] },
    { nombre: "RAM", slug: "ram", logo: LOGOS_MARCAS["RAM"] },
    { nombre: "Suzuki", slug: "suzuki", logo: LOGOS_MARCAS["Suzuki"] },
    { nombre: "Mitsubishi", slug: "mitsubishi", logo: LOGOS_MARCAS["Mitsubishi"] },
    { nombre: "Isuzu", slug: "isuzu", logo: LOGOS_MARCAS["Isuzu"] },
    { nombre: "Iveco", slug: "iveco", logo: LOGOS_MARCAS["Iveco"] },

    // Marcas Chinas / Asiáticas
    { nombre: "BAIC", slug: "baic", logo: LOGOS_MARCAS["BAIC"] },
    { nombre: "Chery", slug: "chery", logo: LOGOS_MARCAS["Chery"] },
    { nombre: "BYD", slug: "byd", logo: LOGOS_MARCAS["BYD"] },
    { nombre: "Geely", slug: "geely", logo: LOGOS_MARCAS["Geely"] },
    { nombre: "Haval", slug: "haval", logo: LOGOS_MARCAS["Haval"] },
    { nombre: "JAC", slug: "jac", logo: LOGOS_MARCAS["JAC"] },
    { nombre: "AION", slug: "aion", logo: LOGOS_MARCAS["AION"] },
    { nombre: "Arcfox", slug: "arcfox", logo: LOGOS_MARCAS["Arcfox"] },
    { nombre: "BAW", slug: "baw", logo: LOGOS_MARCAS["BAW"] },
    { nombre: "DFSK", slug: "dfsk", logo: LOGOS_MARCAS["DFSK"] },
    { nombre: "Dongfeng", slug: "dongfeng", logo: LOGOS_MARCAS["Dongfeng"] },
    { nombre: "FAW", slug: "faw", logo: LOGOS_MARCAS["FAW"] },
    { nombre: "Forthing", slug: "forthing", logo: LOGOS_MARCAS["Forthing"] },
    { nombre: "Foton", slug: "foton", logo: LOGOS_MARCAS["Foton"] },
    { nombre: "GAC Motor", slug: "gac-motor", logo: LOGOS_MARCAS["GAC Motor"] },
    { nombre: "GWM", slug: "gwm", logo: LOGOS_MARCAS["GWM"] },
    { nombre: "Jetour", slug: "jetour", logo: LOGOS_MARCAS["Jetour"] },
    { nombre: "JMC", slug: "jmc", logo: LOGOS_MARCAS["JMC"] },
    { nombre: "JMEV", slug: "jmev", logo: LOGOS_MARCAS["JMEV"] },
    { nombre: "Kaiyi", slug: "kaiyi", logo: LOGOS_MARCAS["Kaiyi"] },
    { nombre: "Leapmotor", slug: "leapmotor", logo: LOGOS_MARCAS["Leapmotor"] },
    { nombre: "Lynk & Co", slug: "lynk-and-co", logo: LOGOS_MARCAS["Lynk & Co"] },
    { nombre: "Maxus", slug: "maxus", logo: LOGOS_MARCAS["Maxus"] },
    { nombre: "MG", slug: "mg", logo: LOGOS_MARCAS["MG"] },
    { nombre: "ORA", slug: "ora", logo: LOGOS_MARCAS["ORA"] },
    { nombre: "Shineray", slug: "shineray", logo: LOGOS_MARCAS["Shineray"] },
    { nombre: "Skywell", slug: "skywell", logo: LOGOS_MARCAS["Skywell"] },
    { nombre: "KGM / SsangYong", slug: "ssangyong-kgm", logo: LOGOS_MARCAS["KGM / SsangYong"] },
    { nombre: "SWM", slug: "swm", logo: LOGOS_MARCAS["SWM"] },
    { nombre: "Tank", slug: "tank", logo: LOGOS_MARCAS["Tank"] },

    // Alta Gama
    { nombre: "Audi", slug: "audi", logo: LOGOS_MARCAS["Audi"] },
    { nombre: "BMW", slug: "bmw", logo: LOGOS_MARCAS["BMW"] },
    { nombre: "Mercedes-Benz", slug: "mercedes-benz", logo: LOGOS_MARCAS["Mercedes-Benz"] },
    { nombre: "Alfa Romeo", slug: "alfa-romeo", logo: LOGOS_MARCAS["Alfa Romeo"] },
    { nombre: "Aston Martin", slug: "aston-martin", logo: LOGOS_MARCAS["Aston Martin"] },
    { nombre: "DS Automobiles", slug: "ds-automobiles", logo: LOGOS_MARCAS["DS Automobiles"] },
    { nombre: "Ferrari", slug: "ferrari", logo: LOGOS_MARCAS["Ferrari"] },
    { nombre: "Jaguar", slug: "jaguar", logo: LOGOS_MARCAS["Jaguar"] },
    { nombre: "Land Rover", slug: "land-rover", logo: LOGOS_MARCAS["Land Rover"] },
    { nombre: "Lexus", slug: "lexus", logo: LOGOS_MARCAS["Lexus"] },
    { nombre: "Lotus", slug: "lotus", logo: LOGOS_MARCAS["Lotus"] },
    { nombre: "Maserati", slug: "maserati", logo: LOGOS_MARCAS["Maserati"] },
    { nombre: "McLaren", slug: "mclaren", logo: LOGOS_MARCAS["McLaren"] },
    { nombre: "MINI", slug: "mini", logo: LOGOS_MARCAS["MINI"] },
    { nombre: "Porsche", slug: "porsche", logo: LOGOS_MARCAS["Porsche"] },
    { nombre: "Volvo", slug: "volvo", logo: LOGOS_MARCAS["Volvo"] },
  ];

  return (
    <section className="w-full bg-[#f8f9fa] dark:bg-[#0a0a0f] pt-10 pb-10 md:pt-16 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* ================= ENCABEZADO ================= */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Buscá por marca
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-sky-400" /> Todas nuestras unidades cuentan con respaldo oficial.
            </p>
          </div>

          <Link
            href="/marcas"
            className="text-sm font-medium text-blue-600 dark:text-sky-400 hover:text-blue-800 dark:hover:text-sky-300 transition-colors flex items-center gap-1 group"
          >
            Ver todas las marcas
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* ================= SECCIÓN 1: MARCAS OFICIALES DESTACADAS (RELY Y KARRY) ================= */}
        <div className="mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-sky-300 bg-blue-50 dark:bg-sky-400/10 border border-blue-200/60 dark:border-sky-400/20 px-3 py-1 rounded-full inline-block mb-3">
            Concesionarios Oficiales
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:flex md:justify-center gap-4">
            {marcasDestacadas.map((marca) => (
              <div key={marca.slug} className="h-full md:w-56">
                <MarcaDestacadaCard marca={marca} />
              </div>
            ))}
          </div>
        </div>

        {/* ================= SECCIÓN 2: GRILLA DE MARCAS TRADICIONALES ================= */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 block mb-3">
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