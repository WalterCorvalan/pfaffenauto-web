import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Plus, Car, MapPin, DollarSign } from "lucide-react";
import AccionesAuto from "./AccionesAuto";

export default async function PanelPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    },
  );

  // 1. Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  
  // 2. Obtener rol para saber si puede cambiar los estados
  let puedeGestionar = false;
  if (user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();
    
    puedeGestionar = perfil?.rol === "admin" || perfil?.rol === "encargado";
  }

  // 3. Consultar vehículos
  const { data: vehiculos, error } = await supabase
    .from("vehiculos")
    .select(`
      *,
      multimedia_vehiculos ( url_archivo ),
      sucursales ( nombre )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando autos:", error);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24 pb-12 px-4 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif mb-2">Centro de Gestión</h1>
            <p className="text-gray-400">Administración de stock de Pfaffen Autos</p>
          </div>
          <Link
            href="/panel/vehiculo/nuevo"
            className="bg-[#0055A4] hover:bg-[#1E6FD9] transition-colors px-6 py-3 rounded font-bold flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Ingresar Nuevo Auto
          </Link>
        </div>

        <div className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden">
          {vehiculos && vehiculos.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/50 border-b border-white/10 text-gray-400 text-sm">
                  <th className="p-4 font-normal">Vehículo</th>
                  <th className="p-4 font-normal">Año / Km</th>
                  <th className="p-4 font-normal">Precio</th>
                  <th className="p-4 font-normal">Sucursal</th>
                  <th className="p-4 font-normal">Estado</th>
                </tr>
              </thead>
              <tbody>
                {vehiculos.map((auto) => (
                  <tr key={auto.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {auto.multimedia_vehiculos?.[0] ? (
                          <img
                            src={auto.multimedia_vehiculos[0].url_archivo}
                            alt={auto.modelo}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-[#0A0A0A] rounded flex items-center justify-center">
                            <Car className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                        <span className="font-bold capitalize">
                          {auto.marca} {auto.modelo}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">
                      {auto.anio} • {auto.kilometraje?.toLocaleString()} km
                    </td>
                    <td className="p-4 font-mono text-[#4A90E2]">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {/* Se actualizó a precio_publicado_usd */}
                        {auto.precio_publicado_usd?.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        {auto.sucursales?.nombre || "Sin sucursal"}
                      </div>
                    </td>
                    <td className="p-4">
                      {/* Se pasa la prop puedeGestionar al componente */}
                      <AccionesAuto 
                        autoId={auto.id} 
                        estadoActual={auto.estado} 
                        puedeGestionar={puedeGestionar} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay vehículos cargados en el sistema.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}