import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Plus, Car, Search, Edit2, ChevronLeft, ChevronRight, FileText, LayoutGrid, Megaphone } from "lucide-react";
import AccionesAuto from "./AccionesAuto";
import PublicarRedesBoton from "./PublicarRedesBoton";
import MiniaturaAuto from "./MiniaturaAuto";
import PrecioEditor from "./PrecioEditor";
import SucursalEditor from "./SucursalEditor";
import VendedorEditor from "./VendedorEditor";
import NotificacionesBell from "../NotificacionesBell";
import { tienePermiso } from "@/lib/permisos";

const ITEMS_POR_PAGINA = 10;

const COLOR_ESTADO_BORDE: Record<string, string> = {
  Disponible: "border-l-blue-400", Reservado: "border-l-amber-400", Vendido: "border-l-emerald-400",
  Archivado: "border-l-rose-400", Incompleto: "border-l-rose-400",
};

// Semáforo de antigüedad en stock: neutro hasta 30 días, amarillo de 31 a 60,
// rojo de 61 en adelante. Días exactos, no meses calendario (evita que un mes
// de 28 días dispare antes que uno de 31).
function semaforoAntiguedad(fechaIngreso: string | null): { color: string; label: string; dias: number } | null {
  if (!fechaIngreso) return null;
  const ingreso = new Date(fechaIngreso);
  const ahora = new Date();
  const dias = Math.floor((ahora.getTime() - ingreso.getTime()) / 86400000);
  if (dias > 60) return { color: "bg-rose-500 text-white", label: `${dias} días en stock`, dias };
  if (dias > 30) return { color: "bg-amber-400 text-white", label: `${dias} días en stock`, dias };
  return { color: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300", label: `${dias} días en stock`, dias };
}

export default async function PanelPage({ searchParams }: { searchParams: Promise<{ q?: string; sucursal?: string; page?: string }>; }) {
  const cookieStore = await cookies();
  const { q = "", sucursal = "", page = "1" } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  let puedeGestionar = false;
  if (user) {
    const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
    puedeGestionar = perfil?.rol === "admin" || perfil?.rol === "encargado";
  }
  const puedeCrearVehiculo = await tienePermiso(supabase, "vehiculos.crear");

  const { data: sucursales } = await supabase.from("sucursales").select("id, nombre").order("nombre");
  // Un auto se le puede asignar a cualquier miembro del equipo comercial, no solo vendedores
  // (un encargado o el dueño también pueden hacerse cargo de una venta puntual).
  const { data: vendedores } = await supabase.from("perfiles").select("id, nombre, sucursal_id, rol").in("rol", ["vendedor", "encargado", "admin"]).eq("activo", true).order("nombre");

  let query = supabase
    .from("vehiculos")
    .select(`*, multimedia_vehiculos ( url_archivo ), sucursales!vehiculos_sucursal_id_fkey ( id, nombre ), vendedor:vendedor_asignado_id ( id, nombre )`, { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) query = query.or(`marca.ilike.%${q}%,modelo.ilike.%${q}%,patente.ilike.%${q}%`);
  if (sucursal) query = query.eq("sucursal_id", sucursal);

  const from = (currentPage - 1) * ITEMS_POR_PAGINA;
  const to = from + ITEMS_POR_PAGINA - 1;
  query = query.range(from, to);

  const { data: vehiculos, count, error } = await query;
  if (error) console.error("Error cargando autos:", error);

  const totalPages = count ? Math.ceil(count / ITEMS_POR_PAGINA) : 1;

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">

      {/* HEADER Y FILTROS */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Gestión de Stock</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3 flex-wrap">
              Administración del inventario de unidades
              <span className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-wide">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />+30 días</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />+60 días</span>
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <NotificacionesBell seccion="stock" />
        </div>

        <form method="GET" action="/panel" className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex items-stretch gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" name="q" defaultValue={q} enterKeyHint="search" placeholder="Buscar..." className="w-full sm:w-48 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg py-1.5 pl-9 pr-3 text-[13px] outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
            </div>
            <button type="submit" className="shrink-0 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 transition-colors" title="Buscar">
              <Search className="w-4 h-4" />
            </button>
          </div>
          <select name="sucursal" defaultValue={sucursal} className="w-full sm:w-40 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg py-1.5 px-3 text-[13px] outline-none focus:border-indigo-500 text-slate-900 dark:text-white appearance-none cursor-pointer">
            <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Todas las sucursales</option>
            {sucursales?.map((s) => (<option key={s.id} value={s.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{s.nombre}</option>))}
          </select>

          {puedeCrearVehiculo && (
            <Link href="/panel/vehiculo/nuevo" className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-[13px] font-bold transition-colors shadow-sm sm:ml-2">
              <Plus className="w-4 h-4" /> Ingresar Auto
            </Link>
          )}
        </form>
      </header>

      {/* ÁREA SCROLLABLE */}
      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="w-full h-full flex flex-col">

          {vehiculos && vehiculos.length > 0 ? (
            <>
              {/* VISTA MÓVIL */}
              <div className="flex flex-col gap-3 p-4 md:hidden w-full">
                {vehiculos.map((auto) => {
                  const semaforo = auto.estado !== "Vendido" ? semaforoAntiguedad(auto.fecha_ingreso) : null;
                  return (
                  <div key={auto.id} className={`bg-white dark:bg-[#001c55] border rounded-xl p-4 flex flex-col gap-3 shadow-sm ${auto.pautado ? "border-orange-300 ring-1 ring-orange-200" : "border-slate-200 dark:border-[#0a2a6b]"}`}>
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        {auto.multimedia_vehiculos?.[0] ? (
                          <MiniaturaAuto src={auto.multimedia_vehiculos[0].url_archivo} alt={`${auto.marca} ${auto.modelo}`} className="w-20 h-16 object-cover rounded-lg border border-slate-200" />
                        ) : (
                          <div className="w-20 h-16 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center">
                            <Car className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        {auto.pautado && (
                          <span className="absolute -top-1.5 -left-1.5 bg-orange-500 text-white rounded-full p-1 shadow-sm" title={`Pautado${auto.canal_pauta ? ` · ${auto.canal_pauta}` : ""}`}>
                            <Megaphone className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-0.5 truncate flex items-center gap-1.5">
                          {auto.patente || "S/P"}
                        </span>
                        <h3 className="font-bold capitalize text-sm text-slate-900 dark:text-white leading-tight truncate mb-1">{auto.marca} {auto.modelo}</h3>
                        <PrecioEditor autoId={auto.id} autoMarca={auto.marca} autoModelo={auto.modelo} vendedorAsignadoId={auto.vendedor_asignado_id} precioArs={auto.precio_publicado_ars} precioUsd={auto.precio_publicado_usd} puedeGestionar={puedeGestionar} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] p-2.5 rounded-lg">
                      <div className="min-w-0">
                        <span className="block text-slate-400 dark:text-slate-400 uppercase tracking-widest font-bold mb-0.5">Año/Km</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate block">{auto.anio} • {auto.kilometraje?.toLocaleString()} km</span>
                      </div>
                      <div className="min-w-0">
                        <span className="block text-slate-400 uppercase tracking-widest font-bold mb-0.5">Ubicación</span>
                        <SucursalEditor autoId={auto.id} sucursalActualId={auto.sucursal_id} sucursalActualNombre={auto.sucursales?.nombre} sucursales={sucursales || []} puedeGestionar={puedeGestionar} />
                      </div>
                      <div className="min-w-0 col-span-2">
                        <span className="block text-slate-400 uppercase tracking-widest font-bold mb-0.5">Vendedor</span>
                        <VendedorEditor autoId={auto.id} autoMarca={auto.marca} autoModelo={auto.modelo} autoSucursalId={auto.sucursal_id} vendedorActualId={auto.vendedor_asignado_id} vendedorActualNombre={auto.vendedor?.nombre} vendedores={vendedores || []} puedeGestionar={puedeGestionar} />
                      </div>
                    </div>
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-[#0a2a6b]">
                      <div className="flex items-center gap-2">
                        <AccionesAuto autoId={auto.id} autoMarca={auto.marca} autoModelo={auto.modelo} vendedorAsignadoId={auto.vendedor_asignado_id} estadoActual={auto.estado} puedeGestionar={puedeGestionar} />
                        {puedeGestionar && <PublicarRedesBoton vehiculoId={auto.id} yaPublicado={!!auto.publicado_redes_at} />}
                        {semaforo && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${semaforo.color}`}>
                            {semaforo.dias}d en stock
                          </span>
                        )}
                      </div>
                      <Link href={`/panel/vehiculo/editar/${auto.id}`} className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-100 dark:hover:bg-[#002a6e] text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </Link>
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* VISTA DESKTOP */}
              <div className="hidden md:block bg-white dark:bg-[#001c55] border-b border-slate-200 dark:border-[#0a2a6b] w-full">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-800 dark:bg-[#00246b] border-b border-slate-200 dark:border-[#0a2a6b] text-white dark:text-slate-300 text-[10px] uppercase tracking-widest font-bold">
                      <th className="p-4 whitespace-nowrap font-bold">Vehículo</th>
                      <th className="p-4 whitespace-nowrap font-bold">Año / Km</th>
                      <th className="p-4 whitespace-nowrap font-bold">Precio (ARS / USD)</th>
                      <th className="p-4 whitespace-nowrap font-bold">Sucursal</th>
                      <th className="p-4 whitespace-nowrap font-bold">Vendedor</th>
                      <th className="p-4 text-right whitespace-nowrap font-bold">Estado / Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehiculos.map((auto) => {
                      const semaforo = auto.estado !== "Vendido" ? semaforoAntiguedad(auto.fecha_ingreso) : null;
                      return (
                      <tr key={auto.id} className={`border-b border-l-4 hover:bg-indigo-50/40 dark:hover:bg-[#00246b] transition-colors ${auto.pautado ? "border-l-orange-400 bg-orange-50/30 dark:bg-transparent border-b-slate-100 dark:border-b-[#0a2a6b]" : `${COLOR_ESTADO_BORDE[auto.estado] || "border-l-slate-200"} border-b-slate-100 dark:border-b-[#0a2a6b]`}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              {auto.multimedia_vehiculos?.[0] ? (
                                <MiniaturaAuto src={auto.multimedia_vehiculos[0].url_archivo} alt={`${auto.marca} ${auto.modelo}`} className="w-14 h-10 object-cover rounded-md border border-slate-200 shadow-sm" />
                              ) : (
                                <div className="w-14 h-10 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center">
                                  <Car className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                              {auto.pautado && (
                                <span className="absolute -top-1.5 -left-1.5 bg-orange-500 text-white rounded-full p-0.5 shadow-sm" title={`Pautado${auto.canal_pauta ? ` · ${auto.canal_pauta}` : ""}`}>
                                  <Megaphone className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate flex items-center gap-1.5">
                                {auto.patente}
                                {semaforo && (
                                  <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold normal-case tracking-normal ${semaforo.color}`}>
                                    {semaforo.dias}d
                                  </span>
                                )}
                              </span>
                              <span className="font-bold capitalize text-[13px] text-slate-900 dark:text-white block truncate leading-tight">{auto.marca} {auto.modelo}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300 font-medium text-[13px] whitespace-nowrap">
                          {auto.anio} <span className="text-slate-300 mx-1">•</span> {auto.kilometraje?.toLocaleString()} km
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <PrecioEditor autoId={auto.id} autoMarca={auto.marca} autoModelo={auto.modelo} vendedorAsignadoId={auto.vendedor_asignado_id} precioArs={auto.precio_publicado_ars} precioUsd={auto.precio_publicado_usd} puedeGestionar={puedeGestionar} />
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <SucursalEditor autoId={auto.id} sucursalActualId={auto.sucursal_id} sucursalActualNombre={auto.sucursales?.nombre} sucursales={sucursales || []} puedeGestionar={puedeGestionar} />
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <VendedorEditor autoId={auto.id} autoMarca={auto.marca} autoModelo={auto.modelo} autoSucursalId={auto.sucursal_id} vendedorActualId={auto.vendedor_asignado_id} vendedorActualNombre={auto.vendedor?.nombre} vendedores={vendedores || []} puedeGestionar={puedeGestionar} />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-3">
                            <AccionesAuto autoId={auto.id} autoMarca={auto.marca} autoModelo={auto.modelo} vendedorAsignadoId={auto.vendedor_asignado_id} estadoActual={auto.estado} puedeGestionar={puedeGestionar} />
                            {puedeGestionar && <PublicarRedesBoton vehiculoId={auto.id} yaPublicado={!!auto.publicado_redes_at} />}

                            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-[#0a2a6b] pl-3">
                              {puedeGestionar && (
                                <Link href={`/panel/vehiculo/boleto/${auto.id}`} className="p-1.5 text-slate-400 dark:text-slate-300 hover:text-emerald-600 transition-colors" title="Generar Boleto">
                                  <FileText className="w-4 h-4" />
                                </Link>
                              )}
                              <Link href={`/panel/vehiculo/editar/${auto.id}`} className="p-1.5 text-slate-400 dark:text-slate-300 hover:text-indigo-600 transition-colors" title="Editar">
                                <Edit2 className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINACIÓN */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 bg-white dark:bg-[#001c55] border-t border-slate-200 dark:border-[#0a2a6b] shrink-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Mostrando del <span className="text-slate-700 dark:text-slate-200">{from + 1}</span> al <span className="text-slate-700 dark:text-slate-200">{Math.min(to + 1, count || 0)}</span> de <span className="text-slate-700 dark:text-slate-200">{count}</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                    {currentPage > 1 ? (
                      <Link href={`/panel?q=${q}&sucursal=${sucursal}&page=${currentPage - 1}`} className="p-1.5 bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] rounded-md border border-slate-200 dark:border-[#0a2a6b] text-slate-600 dark:text-slate-300">
                        <ChevronLeft className="w-4 h-4" />
                      </Link>
                    ) : (
                      <button disabled className="p-1.5 bg-slate-50 dark:bg-[#00246b] opacity-50 rounded-md border border-slate-200 dark:border-[#0a2a6b] text-slate-400 cursor-not-allowed">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                    <div className="px-3 py-1 bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] rounded-md font-bold text-[11px] text-indigo-600 dark:text-sky-300">
                      {currentPage} / {totalPages}
                    </div>
                    {currentPage < totalPages ? (
                      <Link href={`/panel?q=${q}&sucursal=${sucursal}&page=${currentPage + 1}`} className="p-1.5 bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] rounded-md border border-slate-200 dark:border-[#0a2a6b] text-slate-600 dark:text-slate-300">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <button disabled className="p-1.5 bg-slate-50 dark:bg-[#00246b] opacity-50 rounded-md border border-slate-200 dark:border-[#0a2a6b] text-slate-400 cursor-not-allowed">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400">
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-500 mb-3" />
              <h3 className="text-slate-700 dark:text-slate-200 font-bold text-base mb-1">Sin resultados</h3>
              <p className="text-[13px]">No se encontraron vehículos con esos filtros.</p>
              {(q || sucursal) && (
                <Link href="/panel" className="mt-4 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-lg font-bold text-xs transition-colors">Limpiar filtros</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}