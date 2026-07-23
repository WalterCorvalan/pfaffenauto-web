import { createClient } from "@supabase/supabase-js";
import { Search, ChevronDown, MapPin, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export const revalidate = 60;

export default async function CatalogoPage() {
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(`
      *,
      multimedia_vehiculos ( url_archivo ),
      sucursales ( nombre )
    `)
    .in("estado", ["Disponible", "Reservado"])
    .order("created_at", { ascending: false });

  const totalResultados = vehiculos?.length || 0;

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-20 font-sans">
      <div className="max-w-[90rem] mx-auto px-4 md:px-6">
        
        <div className="mb-8">
          <h1 className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mb-4">
            Autos Usados y 0KM
          </h1>
          
          <div className="w-full bg-[#0A0F16] border border-white/10 rounded-2xl flex items-center px-4 py-3 shadow-lg">
            <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
            <input 
              type="text" 
              placeholder="Buscá por marca, modelo o año..."
              className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-600 text-sm md:text-base"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="flex items-center gap-2 text-white font-black uppercase tracking-widest text-sm mb-6">
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </div>

            <div className="flex flex-col gap-1 text-sm text-gray-300 font-medium">
              {[
                "Precio",
                "Ubicación",
                "Marca",
                "Modelo",
                "Año y Kilometraje",
                "Tipo de Auto",
                "Transmisión"
              ].map((filtro, idx) => (
                <button key={idx} className="flex justify-between items-center py-4 border-b border-white/5 hover:text-white transition-colors group">
                  {filtro}
                  <ChevronDown className="w-4 h-4 text-gray-600 group-hover:text-[#0145F2] transition-colors" />
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-400 text-sm font-medium">
                <span className="text-white font-bold">{totalResultados}</span> Resultados
              </span>
              <button className="hidden sm:flex items-center gap-2 bg-[#0A0F16] hover:bg-white/5 border border-white/10 px-5 py-2.5 rounded-full text-white text-xs font-bold uppercase tracking-widest transition-colors">
                <ArrowUpDown className="w-4 h-4 text-[#0145F2]" /> Relevancia
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {vehiculos?.map((auto) => (
                // ENLACE USANDO EL SLUG AMIGABLE
                <Link href={`/catalogo/${auto.slug}`} key={auto.id} className="block h-full">
                  <div className="bg-[#0A0F16] rounded-2xl border border-white/5 hover:border-[#0145F2]/50 overflow-hidden flex flex-col group transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(1,69,242,0.1)] h-full">
                    
                    <div className="relative h-[220px] w-full bg-[#050505] overflow-hidden">
                      <img
                        src={auto.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"}
                        alt={`${auto.marca} ${auto.modelo}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-md border border-white/10 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded flex items-center gap-1 shadow-lg">
                        <span className="text-[#0145F2]">↑</span> Nuevo Ingreso
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-white font-black text-lg uppercase tracking-tight truncate">
                        {auto.marca} <span className="text-gray-500 mx-1">•</span> {auto.modelo}
                      </h3>
                      
                      <p className="text-gray-400 text-xs font-medium mt-1.5 truncate">
                        {auto.anio} • {auto.kilometraje?.toLocaleString("es-AR")} km • {auto.transmision || "Manual"} 
                      </p>

                      <div className="flex-grow"></div>

                      <div className="mt-6 mb-5">
                        <p className="text-gray-500 text-[9px] uppercase tracking-[0.2em] mb-1 font-bold">
                          Precio de contado
                        </p>
                        <p className="text-white font-black text-2xl tracking-tight">
                          ${auto.precio_publicado_ars?.toLocaleString("es-AR")}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-gray-500 text-[10px] uppercase tracking-widest font-bold">
                        <MapPin className="w-3.5 h-3.5" />
                        {auto.sucursales?.nombre || "Casa Central"}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
} 