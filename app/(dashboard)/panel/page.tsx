import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Plus, Car, Search, Edit2 } from "lucide-react";
import AccionesAuto from "./AccionesAuto";
import EdicionPrecio from "./EdicionPrecio";
import EdicionSucursal from "./EdicionSucursal";

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sucursal?: string }>;
}) {
  const cookieStore = await cookies();
  const { q = "", sucursal = "" } = await searchParams;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  let puedeGestionar = false;
  if (user) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();
    
    puedeGestionar = perfil?.rol === "admin" || perfil?.rol === "encargado";
  }

  const { data: sucursales } = await supabase
    .from("sucursales")
    .select("id, nombre")
    .order("nombre");

  let query = supabase
    .from("vehiculos")
    .select(`
      *,
      multimedia_vehiculos ( url_archivo ),
      sucursales ( id, nombre )
    `)
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`marca.ilike.%${q}%,modelo.ilike.%${q}%,patente.ilike.%${q}%`);
  }
  
  if (sucursal) {
    query = query.eq("sucursal_id", sucursal);
  }

  const { data: vehiculos, error } = await query;

  if (error) console.error("Error cargando autos:", error);

  return (
    <div className="min-h-screen bg-[#0b1329] pt-4 md:pt-8 pb-16 px-3 md:px-6 text-slate-100">
      <div className="max-w-6xl mx-auto">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif mb-1 text-white">Centro de Gestión</h1>
            <p className="text-xs md:text-sm text-slate-400">Administración de stock de Pfaffen Autos</p>
          </div>
          <Link
            href="/panel/vehiculo/nuevo"
            className="w-full md:w-auto justify-center bg-[#0ea5e9] hover:bg-[#0284c7] transition-colors px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" /> Ingresar Nuevo Auto
          </Link>
        </div>

        {/* Filtros */}
        <form method="GET" action="/panel" className="flex flex-col sm:flex-row gap-3 mb-6 bg-[#0f172a] p-4 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              name="q" 
              defaultValue={q} 
              placeholder="Buscar por marca, modelo o patente..." 
              className="w-full bg-[#0b1329] border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-[#0ea5e9] text-white placeholder:text-slate-500 transition-colors"
            />
          </div>

          <div className="sm:w-64 relative">
            <select 
              name="sucursal" 
              defaultValue={sucursal}
              className="w-full bg-[#0b1329] border border-slate-800 rounded-xl py-3 px-4 text-sm outline-none focus:border-[#0ea5e9] appearance-none text-white cursor-pointer transition-colors"
            >
              <option value="">Todas las sucursales</option>
              {sucursales?.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-slate-700">
            Filtrar
          </button>
        </form>

        {/* Lista de Vehículos */}
        <div>
          {vehiculos && vehiculos.length > 0 ? (
            <>
              {/* VISTA MÓVIL: Tarjetas separadas y más compactas */}
              <div className="flex flex-col gap-4 md:hidden">
                {vehiculos.map((auto) => (
                  <div key={auto.id} className="p-4 bg-[#0f172a] border border-slate-800 rounded-2xl flex flex-col gap-3 shadow-md hover:border-slate-700 transition-colors">
                    
                    {/* Fila Superior: Foto y Título/Precio */}
                    <div className="flex items-start gap-3">
                      {auto.multimedia_vehiculos?.[0] ? (
                        <img
                          src={auto.multimedia_vehiculos[0].url_archivo}
                          alt={auto.modelo}
                          className="w-20 h-16 object-cover rounded-xl shadow-sm border border-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-16 bg-[#0b1329] border border-slate-800 rounded-xl flex items-center justify-center shrink-0">
                          <Car className="w-6 h-6 text-slate-600" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-0.5">{auto.patente || "S/P"}</span>
                        <h3 className="font-black capitalize text-base text-white leading-tight truncate mb-1">
                          {auto.marca} {auto.modelo}
                        </h3>
                        <EdicionPrecio 
                          autoId={auto.id} 
                          precioArs={auto.precio_publicado_ars} 
                          precioUsd={auto.precio_publicado_usd} 
                          puedeGestionar={puedeGestionar} 
                        />
                      </div>
                    </div>
                    
                    {/* Caja de Datos Técnicos Compacta */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#0b1329] border border-slate-800/80 p-2.5 rounded-xl">
                      <div>
                        <span className="block text-slate-400 text-[9px] uppercase tracking-widest font-bold mb-0.5">Año / Km</span>
                        <span className="font-semibold text-slate-200">{auto.anio} • {auto.kilometraje?.toLocaleString()} km</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[9px] uppercase tracking-widest font-bold mb-0.5">Ubicación</span>
                        <EdicionSucursal 
                          autoId={auto.id}
                          sucursalActualId={auto.sucursal_id}
                          sucursalActualNombre={auto.sucursales?.nombre}
                          sucursales={sucursales || []}
                          puedeGestionar={puedeGestionar}
                        />
                      </div>
                    </div>

                    {/* Acciones Inferiores */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/80">
                      <div className="scale-90 origin-left">
                        <AccionesAuto 
                          autoId={auto.id} 
                          estadoActual={auto.estado} 
                          puedeGestionar={puedeGestionar} 
                        />
                      </div>
                      <Link 
                        href={`/panel/vehiculo/editar/${auto.id}`} 
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-xl transition-colors shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#0ea5e9]" /> Editar Todo
                      </Link>
                    </div>

                  </div>
                ))}
              </div>

              {/* VISTA DESKTOP: Tabla */}
              <div className="hidden md:block bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-widest font-bold">
                      <th className="p-4">Vehículo</th>
                      <th className="p-4">Año / Km</th>
                      <th className="p-4">Precio (ARS / USD)</th>
                      <th className="p-4">Sucursal</th>
                      <th className="p-4 text-right">Estado / Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehiculos.map((auto) => (
                      <tr key={auto.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {auto.multimedia_vehiculos?.[0] ? (
                              <img
                                src={auto.multimedia_vehiculos[0].url_archivo}
                                alt={auto.modelo}
                                className="w-16 h-12 object-cover rounded-lg shadow-sm border border-slate-800"
                              />
                            ) : (
                              <div className="w-16 h-12 bg-[#0b1329] border border-slate-800 rounded-lg flex items-center justify-center">
                                <Car className="w-6 h-6 text-slate-600" />
                              </div>
                            )}
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">{auto.patente}</span>
                              <span className="font-bold capitalize text-[15px] text-white">
                                {auto.marca} {auto.modelo}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300 font-medium text-sm">
                          {auto.anio} <span className="text-slate-600 mx-1">•</span> {auto.kilometraje?.toLocaleString()} km
                        </td>
                        <td className="p-4">
                          <EdicionPrecio 
                            autoId={auto.id} 
                            precioArs={auto.precio_publicado_ars} 
                            precioUsd={auto.precio_publicado_usd} 
                            puedeGestionar={puedeGestionar} 
                          />
                        </td>
                        <td className="p-4 text-slate-300 font-medium text-sm">
                          <EdicionSucursal 
                            autoId={auto.id}
                            sucursalActualId={auto.sucursal_id}
                            sucursalActualNombre={auto.sucursales?.nombre}
                            sucursales={sucursales || []}
                            puedeGestionar={puedeGestionar}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-3">
                            <AccionesAuto 
                              autoId={auto.id} 
                              estadoActual={auto.estado} 
                              puedeGestionar={puedeGestionar} 
                            />
                            <Link 
                              href={`/panel/vehiculo/editar/${auto.id}`} 
                              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all shadow-sm group"
                              title="Editar vehículo completo"
                            >
                              <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform text-[#0ea5e9]" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center bg-[#0f172a] rounded-2xl border border-slate-800">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="text-white font-bold text-lg mb-1">Sin resultados</h3>
              <p className="text-sm">No se encontraron vehículos con esos filtros.</p>
              {(q || sucursal) && (
                <Link href="/panel" className="mt-4 text-[#0ea5e9] hover:underline font-bold text-sm">
                  Limpiar filtros
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}