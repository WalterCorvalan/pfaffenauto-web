import { Tag, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Outlet({ vehiculos }: { vehiculos?: any[] }) {
  const outletCars = vehiculos || [];

  if (outletCars.length === 0) {
    return null; 
  }

  return (
    <section id="outlet" className="py-16 bg-background border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* ================= ENCABEZADO ================= */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-gray-100 pb-6">
          <div>
            <span className="flex items-center gap-2 text-orange-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2">
              <Tag className="w-4 h-4" /> Liquidación y Oportunidades
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-navy tracking-tight">
              Outlet <strong className="font-black">Pfaffen</strong>
            </h2>
          </div>
          <p className="text-gray-500 text-sm font-medium max-w-sm text-left md:text-right">
            Vehículos funcionales a precios muy accesibles. Ideales como primer auto o herramienta de trabajo cotidiano.
          </p>
        </div>

        {/* ================= GRILLA DE TARJETAS BLANCAS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {outletCars.slice(0, 4).map((auto, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-2xl overflow-hidden group hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col">
              
              {/* Imagen */}
              <div className="relative h-[160px] bg-gray-50 flex items-center justify-center p-4">
                <img
                  src={auto.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"}
                  alt={`${auto.marca} ${auto.modelo}`}
                  className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-orange-100 text-orange-600 border border-orange-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">
                  Outlet
                </div>
              </div>
              
              {/* Información */}
              <div className="p-4 md:p-5 flex flex-col flex-grow">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                  {auto.marca}
                </span>
                <h3 className="text-base font-black text-navy uppercase leading-tight truncate">
                  {auto.modelo}
                </h3>
                
                <div className="flex gap-2 items-center mt-2 mb-4 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  <span>{auto.anio}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span>{auto.kilometraje?.toLocaleString("es-AR")} km</span>
                </div>
                
                {/* Precio y Botón */}
                <div className="mt-auto pt-4 flex items-end justify-between border-t border-gray-50">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">
                      Precio final
                    </span>
                    <span className="text-navy font-black text-lg tracking-tight">
                      $ {auto.precio_publicado_ars?.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <Link 
                    href={`/catalogo/${auto.slug}`} 
                    className="bg-sky-50 hover:bg-primary border border-sky-100 group/btn p-2 rounded-xl transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-primary group-hover/btn:text-white" />
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
        
        {/* ================= BOTÓN VER TODO ================= */}
        {outletCars.length > 4 && (
          <div className="mt-8 flex justify-center">
            <Link 
              href="/catalogo?categoria=outlet" 
              className="bg-white border border-gray-200 hover:border-primary text-gray-600 hover:text-primary text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full transition-colors flex items-center gap-2 shadow-sm"
            >
              Ver todo el Outlet <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}