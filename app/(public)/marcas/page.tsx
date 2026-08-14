import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Todas las Marcas de Autos 0KM y Usados | Pfaffen Autos",
  description:
    "Descubrí todas las marcas de vehículos que tenemos disponibles: Volkswagen, Chevrolet, Toyota, Ford, Peugeot y más.",
};

const MarcaCard = ({
  marca,
}: {
  marca: { nombre: string; slug: string; logo: string };
}) => {
  return (
    <Link
      href={`/marcas/${marca.slug}`}
      className="group relative flex flex-col items-center justify-center gap-4 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[28px] p-8 aspect-square shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(1,69,242,0.12)] hover:border-white hover:bg-white/70 hover:-translate-y-1 transition-all duration-500 overflow-hidden focus:outline-none"
    >
      {/* Reflejo de luz interior al hacer hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 z-10">
        <Image
          src={marca.logo}
          alt={`Logo de ${marca.nombre}`}
          fill
          sizes="80px"
          className="object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 mix-blend-multiply drop-shadow-sm"
        />
      </div>

      <span className="text-xs md:text-sm font-black text-gray-500 group-hover:text-navy uppercase tracking-widest transition-colors relative z-10 text-center">
        {marca.nombre}
      </span>

      <div className="absolute bottom-4 right-4 w-7 h-7 rounded-full bg-white/0 group-hover:bg-white flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 z-10">
        <ChevronRight className="w-3.5 h-3.5 text-[#0145F2]" />
      </div>
    </Link>
  );
};

export default function MarcasPage() {
  // Logos servidos desde el propio CDN (Bunny). Wikimedia bloquea el hotlinking
  // vía next/image y devuelve 404 en producción — no usar upload.wikimedia.org acá.
  const CDN = process.env.BUNNY_CDN_URL || "";
  const marcas = [
    { nombre: "Audi", slug: "audi", logo: `${CDN}/marcas/audi.svg` },
    { nombre: "BMW", slug: "bmw", logo: `${CDN}/marcas/bmw.svg` },
    { nombre: "Chevrolet", slug: "chevrolet", logo: `${CDN}/marcas/chevrolet.svg` },
    { nombre: "Citroën", slug: "citroen", logo: `${CDN}/marcas/citroen.svg` },
    { nombre: "Fiat", slug: "fiat", logo: `${CDN}/marcas/fiat.svg` },
    { nombre: "Ford", slug: "ford", logo: `${CDN}/marcas/ford.svg` },
    { nombre: "Hyundai", slug: "hyundai", logo: `${CDN}/marcas/hyundai.svg` },
    { nombre: "Jeep", slug: "jeep", logo: `${CDN}/marcas/jeep.svg` },
    { nombre: "Kia", slug: "kia", logo: `${CDN}/marcas/kia.svg` },
    { nombre: "Nissan", slug: "nissan", logo: `${CDN}/marcas/nissan.svg` },
    { nombre: "Peugeot", slug: "peugeot", logo: `${CDN}/marcas/peugeot.svg` },
    { nombre: "Renault", slug: "renault", logo: `${CDN}/marcas/renault.svg` },
    { nombre: "Toyota", slug: "toyota", logo: `${CDN}/marcas/toyota.svg` },
    { nombre: "Volkswagen", slug: "volkswagen", logo: `${CDN}/marcas/volkswagen.svg` },
  ];

  return (
    <div className="min-h-screen bg-[#E9ECEF] relative overflow-hidden pt-12 pb-24">
      {/* Luces Ambientales */}
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-slate-400/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-[#0145F2]/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        {/* Migas de pan y Título */}
        <div className="mb-10">
          <div className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#0145F2] transition-colors">
              Inicio
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-navy">Marcas</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-navy tracking-tighter drop-shadow-sm mb-3">
            Todas las{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy to-[#0145F2]">
              Marcas
            </span>
          </h1>
          <p className="text-sm text-gray-500 font-medium max-w-xl">
            Elegí una marca para ver el stock disponible de 0km y usados
            seleccionados en Pfaffen Autos.
          </p>
        </div>

        {/* Grilla de Marcas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {marcas.map((marca) => (
            <MarcaCard key={marca.slug} marca={marca} />
          ))}
        </div>
      </div>
    </div>
  );
}