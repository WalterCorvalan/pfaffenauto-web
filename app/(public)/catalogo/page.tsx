import { createClient } from "@supabase/supabase-js";
import { Car, MapPin, Calendar, Gauge } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export const revalidate = 0; 

export default async function CatalogoPage() {
  const { data: vehiculos, error } = await supabase
    .from("vehiculos")
    .select(`
      *,
      multimedia_vehiculos ( url_archivo ),
      sucursales ( nombre )
    `)
    .in("estado", ["Disponible", "Reservado"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando el catálogo:", error);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24 pb-12 px-4 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-serif mb-4">Nuestro Catálogo</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Encontrá el vehículo perfecto para vos. Todos nuestros autos pasan por una rigurosa inspección para garantizar tu tranquilidad.
          </p>
        </div>

        {vehiculos && vehiculos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehiculos.map((auto) => (
              <div 
                key={auto.id} 
                className="bg-[#1A1A1A] rounded-xl overflow-hidden border border-white/10 hover:border-[#0055A4]/50 transition-colors group flex flex-col"
              >
                <div className="relative h-56 bg-gray-900 overflow-hidden">
                  {auto.multimedia_vehiculos?.[0] ? (
                    <img 
                      src={auto.multimedia_vehiculos[0].url_archivo} 
                      alt={`${auto.marca} ${auto.modelo}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <Car className="w-12 h-12 text-gray-700" />
                    </div>
                  )}
                  
                  {auto.estado === 'Reservado' && (
                    <div className="absolute top-3 right-3 bg-[#D4AF37] text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      RESERVADO
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <h2 className="text-xl font-bold capitalize mb-1 text-white">
                    {auto.marca} {auto.modelo}
                  </h2>
                  <div className="text-3xl font-bold text-[#4A90E2] mb-6">
                    ${auto.precio_usd?.toLocaleString()} USD
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 mb-8 flex-grow">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{auto.anio}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-gray-500" />
                      <span>{auto.kilometraje?.toLocaleString()} km</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{auto.sucursales?.nombre || "Sin sucursal"}</span>
                    </div>
                  </div>

                  <a 
                    href={`https://wa.me/5491100000000?text=Hola,%20me%20interesa%20el%20${auto.marca}%20${auto.modelo}%20año%20${auto.anio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center w-full bg-white/5 hover:bg-[#0055A4] text-white py-3 rounded-lg font-bold transition-colors"
                  >
                    Consultar por WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#1A1A1A] rounded-xl border border-white/10">
            <Car className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-bold mb-2">No hay vehículos disponibles</h3>
            <p className="text-gray-400">En este momento estamos actualizando nuestro stock. ¡Volvé a consultar pronto!</p>
          </div>
        )}
      </div>
    </div>
  );
}