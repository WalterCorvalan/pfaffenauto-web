import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Todas las Marcas de Autos 0KM y Usados | Pfaffen Autos",
  description: "Descubrí todas las marcas de vehículos que tenemos disponibles: Volkswagen, Chevrolet, Toyota, Ford, Peugeot y más.",
};

// Componente para aislar la carga de imagen (con fallback a la letra)
const MarcaCard = ({ marca }: { marca: { nombre: string; slug: string; logo: string } }) => {
  return (
    <Link 
      href={`/marcas/${marca.slug}`} 
      className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group"
    >
      <div className="w-12 h-12 flex items-center justify-center shrink-0">
        <img 
          src={marca.logo} 
          alt={`Logo de ${marca.nombre}`} 
          className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
        />
      </div>
      <span className="text-sm font-bold text-gray-600 group-hover:text-navy uppercase tracking-wider">
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
    <div className="min-h-screen bg-background pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Migas de pan y Título */}
        <div className="mb-8">
          <div className="text-xs text-gray-400 font-medium mb-2">
            <Link href="/" className="hover:text-primary">Inicio</Link> / <span className="text-gray-600">Marcas</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-navy tracking-tight">
            Marcas
          </h1>
        </div>

        {/* Grilla de Marcas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {marcas.map((marca) => (
            <MarcaCard key={marca.slug} marca={marca} />
          ))}
        </div>

      </div>
    </div>
  );
}