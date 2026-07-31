import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Todas las Marcas de Autos 0KM y Usados | Pfaffen Autos",
  description: "Descubrí todas las marcas de vehículos que tenemos disponibles: Volkswagen, Chevrolet, Toyota, Ford, Peugeot y más.",
};

// Componente para aislar la carga de imagen con Glassmorphism
const MarcaCard = ({ marca }: { marca: { nombre: string; slug: string; logo: string } }) => {
  return (
    <Link 
      href={`/marcas/${marca.slug}`} 
      className="flex items-center gap-4 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[28px] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(1,69,242,0.12)] hover:border-white hover:bg-white/70 transition-all duration-500 group relative overflow-hidden focus:outline-none"
    >
      {/* Reflejo de luz interior al hacer hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

      <div className="w-12 h-12 flex items-center justify-center shrink-0 relative z-10">
        <img 
          src={marca.logo} 
          alt={`Logo de ${marca.nombre}`} 
          className="w-full h-full object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 mix-blend-multiply drop-shadow-sm"
        />
      </div>
      <span className="text-xs md:text-sm font-black text-gray-500 group-hover:text-navy uppercase tracking-widest transition-colors relative z-10">
        {marca.nombre}
      </span>
    </Link>
  );
};

export default function MarcasPage() {
  const marcas = [
    { nombre: "Audi", slug: "audi", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Audi_logo.svg" },
    { nombre: "BMW", slug: "bmw", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg" },
    { nombre: "Chevrolet", slug: "chevrolet", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Chevrolet-logo.png" },
    { nombre: "Citroën", slug: "citroen", logo: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Citroen_logo_%282022%29.svg" },
    { nombre: "Fiat", slug: "fiat", logo: "https://upload.wikimedia.org/wikipedia/commons/1/12/Fiat_Automobiles_logo.svg" },
    { nombre: "Ford", slug: "ford", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg" },
    { nombre: "Hyundai", slug: "hyundai", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg" },
    { nombre: "Jeep", slug: "jeep", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Jeep_logo.svg" },
    { nombre: "Kia", slug: "kia", logo: "https://upload.wikimedia.org/wikipedia/commons/4/47/KIA_logo2.svg" },
    { nombre: "Nissan", slug: "nissan", logo: "https://upload.wikimedia.org/wikipedia/commons/2/23/Nissan_2020_logo.svg" },
    { nombre: "Peugeot", slug: "peugeot", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg" },
    { nombre: "Renault", slug: "renault", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_logo.svg" },
    { nombre: "Toyota", slug: "toyota", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg" },
    { nombre: "Volkswagen", slug: "volkswagen", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg" },
  ];

  return (
    <div className="min-h-screen bg-[#E9ECEF] relative overflow-hidden pt-12 pb-24">
      
      {/* Luces Ambientales */}
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-slate-400/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-[#0145F2]/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* Migas de pan y Título */}
        <div className="mb-10">
          <div className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#0145F2] transition-colors">Inicio</Link> 
            <span className="text-gray-400">/</span> 
            <span className="text-navy">Marcas</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-navy tracking-tighter drop-shadow-sm">
            Todas las <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy to-[#0145F2]">Marcas</span>
          </h1>
        </div>

        {/* Grilla de Marcas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {marcas.map((marca) => (
            <MarcaCard key={marca.slug} marca={marca} />
          ))}
        </div>

      </div>
    </div>
  );
}