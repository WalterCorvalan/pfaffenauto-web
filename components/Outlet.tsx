import { Tag, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Outlet({ vehiculos }: { vehiculos?: any[] }) {
  const outletCars = vehiculos || [];

  if (outletCars.length === 0) {
    return null; 
  }

  return (
    <section id="outlet" className="py-20 bg-[#0A0F16] border-t border-white/5 overflow-hidden">
      <div className="max-w-[85rem] mx-auto px-6">
        
        {/* Encabezado del Outlet */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <span className="flex items-center gap-2 text-[#FBBF24] text-[10px] font-bold uppercase tracking-[0.3em] mb-3">
              <Tag className="w-4 h-4" /> Liquidación y Oportunidades
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
              Outlet Pfaffen
            </h2>
          </div>
          <p className="text-gray-400 text-sm font-medium max-w-sm text-left md:text-right">
            Vehículos funcionales a precios muy accesibles. Ideales como primer auto o herramienta de trabajo cotidiano.
          </p>
        </div>

        {/* Grid compacta (4 columnas) para que ocupen poco espacio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {outletCars.slice(0, 4).map((auto, idx) => (
            <div key={idx} className="bg-[#050505] border border-white/10 rounded-2xl overflow-hidden group hover:border-[#FBBF24]/50 transition-colors">
              <div className="relative h-40 bg-gray-900">
                <img
                  src={auto.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"}
                  alt={`${auto.marca} ${auto.modelo}`}
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#FBBF24] text-black text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-md">
                  Outlet
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-white font-bold text-base uppercase leading-tight truncate">
                  {auto.marca} {auto.modelo}
                </h3>
                <div className="flex justify-between items-center mt-2 mb-4 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  <span>{auto.anio}</span>
                  <span>{auto.kilometraje?.toLocaleString("es-AR")} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#FBBF24] font-black text-lg tracking-tight">
                    ${auto.precio_publicado_ars?.toLocaleString("es-AR")}
                  </span>
                  <Link 
                    href={`/catalogo/${auto.slug}`} 
                    className="bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded-xl transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Enlace para ver todos si es que hay más de 4 */}
        {outletCars.length > 4 && (
          <div className="mt-8 flex justify-center">
            <Link 
              href="/catalogo?categoria=outlet" 
              className="text-[10px] font-bold text-gray-400 hover:text-[#FBBF24] uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              Ver todo el Outlet <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}