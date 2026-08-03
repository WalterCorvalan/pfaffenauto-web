import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  Plus,
  Car,
  Search,
  Edit2,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutGrid,
} from "lucide-react";
import AccionesAuto from "./AccionesAuto";
import EdicionPrecio from "./EdicionPrecio";
import EdicionSucursal from "./EdicionSucursal";

const ITEMS_POR_PAGINA = 10;

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sucursal?: string; page?: string }>;
}) {
  const cookieStore = await cookies();
  const { q = "", sucursal = "", page = "1" } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    .select(
      `
      *,
      multimedia_vehiculos ( url_archivo ),
      sucursales ( id, nombre )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `marca.ilike.%${q}%,modelo.ilike.%${q}%,patente.ilike.%${q}%`,
    );
  }

  if (sucursal) {
    query = query.eq("sucursal_id", sucursal);
  }

  const from = (currentPage - 1) * ITEMS_POR_PAGINA;
  const to = from + ITEMS_POR_PAGINA - 1;
  query = query.range(from, to);

  const { data: vehiculos, count, error } = await query;

  if (error) console.error("Error cargando autos:", error);

  const totalPages = count ? Math.ceil(count / ITEMS_POR_PAGINA) : 1;

  return (
    <div className="bg-[#0b1329] pt-4 md:pt-8 pb-16 px-3 md:px-6 text-slate-100 w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-7 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-5 h-5 text-[#0ea5e9]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">
                Centro de Gestión
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Administración de stock · Pfaffen Autos
              </p>
            </div>
          </div>
          <Link
            href="/panel/vehiculo/nuevo"
            className="w-full md:w-auto justify-center bg-[#0ea5e9] hover:bg-[#0284c7] transition-colors px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-sky-950/40 shrink-0"
          >
            <Plus className="w-4 h-4" /> Ingresar Nuevo Auto
          </Link>
        </div>

        {/* Filtros */}
        <form
          method="GET"
          action="/panel"
          className="flex flex-col sm:flex-row gap-3 mb-6 bg-[#111827] p-3.5 rounded-2xl border border-[#1e293b] shadow-sm w-full"
        >
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar por marca, modelo o patente..."
              className="w-full bg-[#0b1329] border border-[#1e293b] rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#0ea5e9]/60 focus:ring-2 focus:ring-[#0ea5e9]/10 text-white placeholder:text-slate-600 transition-all"
            />
          </div>

          <div className="w-full sm:w-64 relative shrink-0">
            <select
              name="sucursal"
              defaultValue={sucursal}
              className="w-full bg-[#0b1329] border border-[#1e293b] rounded-xl py-2.5 px-4 text-sm outline-none focus:border-[#0ea5e9]/60 focus:ring-2 focus:ring-[#0ea5e9]/10 appearance-none text-white cursor-pointer transition-all"
            >
              <option value="">Todas las sucursales</option>
              {sucursales?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto shrink-0 bg-[#1e293b] hover:bg-[#263447] text-slate-200 px-6 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-colors border border-[#2d3d54]"
          >
            Filtrar
          </button>
        </form>

        {/* Lista de Vehículos */}
        <div className="w-full">
          {vehiculos && vehiculos.length > 0 ? (
            <>
              {/* VISTA MÓVIL */}
              <div className="flex flex-col gap-3.5 md:hidden w-full">
                {vehiculos.map((auto) => (
                  <div
                    key={auto.id}
                    className="relative p-4 bg-[#111827] border border-[#1e293b] rounded-2xl flex flex-col gap-3 shadow-sm hover:border-[#2d3d54] transition-colors w-full overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#0ea5e9]/60 via-[#0ea5e9]/10 to-transparent" />
                    <div className="flex items-start gap-3">
                      {auto.multimedia_vehiculos?.[0] ? (
                        <img
                          src={auto.multimedia_vehiculos[0].url_archivo}
                          alt={auto.modelo}
                          className="w-20 h-16 object-cover rounded-xl shadow-sm border border-[#1e293b] shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-16 bg-[#0b1329] border border-[#1e293b] rounded-xl flex items-center justify-center shrink-0">
                          <Car className="w-6 h-6 text-slate-700" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block mb-0.5 truncate">
                          {auto.patente || "S/P"}
                        </span>
                        <h3 className="font-bold capitalize text-base text-white leading-tight truncate mb-1">
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

                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#0b1329] border border-[#1e293b] p-2.5 rounded-xl">
                      <div className="min-w-0">
                        <span className="block text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-0.5 truncate">
                          Año / Km
                        </span>
                        <span className="font-semibold text-slate-200 truncate block">
                          {auto.anio} • {auto.kilometraje?.toLocaleString()} km
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="block text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-0.5 truncate">
                          Ubicación
                        </span>
                        <EdicionSucursal
                          autoId={auto.id}
                          sucursalActualId={auto.sucursal_id}
                          sucursalActualNombre={auto.sucursales?.nombre}
                          sucursales={sucursales || []}
                          puedeGestionar={puedeGestionar}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#1e293b]">
                      <div className="scale-90 origin-left">
                        <AccionesAuto
                          autoId={auto.id}
                          estadoActual={auto.estado}
                          puedeGestionar={puedeGestionar}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {puedeGestionar && (
                          <Link
                            href={`/panel/vehiculo/boleto/${auto.id}`}
                            className="p-2.5 bg-[#0b1329] hover:bg-[#1e293b] border border-[#1e293b] rounded-xl text-slate-400 hover:text-white transition-all"
                            title="Generar Boleto"
                          >
                            <FileText className="w-4 h-4 text-emerald-400" />
                          </Link>
                        )}
                        <Link
                          href={`/panel/vehiculo/editar/${auto.id}`}
                          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-[#0b1329] hover:bg-[#1e293b] border border-[#1e293b] text-slate-200 px-3 py-2 rounded-xl transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#0ea5e9]" />{" "}
                          <span className="hidden sm:inline">Editar</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* VISTA DESKTOP */}
              <div className="hidden md:block bg-[#111827] border border-[#1e293b] rounded-2xl overflow-x-auto shadow-sm max-w-full">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-[#0b1329]/60 border-b border-[#1e293b] text-slate-500 text-[11px] uppercase tracking-widest font-bold">
                      <th className="p-4 whitespace-nowrap">Vehículo</th>
                      <th className="p-4 whitespace-nowrap">Año / Km</th>
                      <th className="p-4 whitespace-nowrap">
                        Precio (ARS / USD)
                      </th>
                      <th className="p-4 whitespace-nowrap">Sucursal</th>
                      <th className="p-4 text-right whitespace-nowrap">
                        Estado / Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehiculos.map((auto) => (
                      <tr
                        key={auto.id}
                        className="border-b border-[#1e293b]/70 hover:bg-[#0ea5e9]/[0.03] transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {auto.multimedia_vehiculos?.[0] ? (
                              <img
                                src={auto.multimedia_vehiculos[0].url_archivo}
                                alt={auto.modelo}
                                className="w-16 h-12 object-cover rounded-lg shadow-sm border border-[#1e293b] shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-12 bg-[#0b1329] border border-[#1e293b] rounded-lg flex items-center justify-center shrink-0">
                                <Car className="w-6 h-6 text-slate-700" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-[10px] text-slate-500 font-bold block truncate">
                                {auto.patente}
                              </span>
                              <span className="font-semibold capitalize text-[15px] text-white block truncate">
                                {auto.marca} {auto.modelo}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300 font-medium text-sm whitespace-nowrap">
                          {auto.anio}{" "}
                          <span className="text-slate-600 mx-1">•</span>{" "}
                          {auto.kilometraje?.toLocaleString()} km
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <EdicionPrecio
                            autoId={auto.id}
                            precioArs={auto.precio_publicado_ars}
                            precioUsd={auto.precio_publicado_usd}
                            puedeGestionar={puedeGestionar}
                          />
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <EdicionSucursal
                            autoId={auto.id}
                            sucursalActualId={auto.sucursal_id}
                            sucursalActualNombre={auto.sucursales?.nombre}
                            sucursales={sucursales || []}
                            puedeGestionar={puedeGestionar}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2.5">
                            <AccionesAuto
                              autoId={auto.id}
                              estadoActual={auto.estado}
                              puedeGestionar={puedeGestionar}
                            />

                            <Link
                              href={`/panel/vehiculo/boleto/${auto.id}`}
                              className="p-2.5 bg-[#0b1329] hover:bg-[#1e293b] border border-[#1e293b] rounded-xl text-slate-400 hover:text-white transition-all group shrink-0"
                              title="Generar Boleto de Reserva"
                            >
                              <FileText className="w-4 h-4 group-hover:scale-110 transition-transform text-emerald-400" />
                            </Link>

                            <Link
                              href={`/panel/vehiculo/editar/${auto.id}`}
                              className="p-2.5 bg-[#0b1329] hover:bg-[#1e293b] border border-[#1e293b] rounded-xl text-slate-400 hover:text-white transition-all group shrink-0"
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

              {/* PAGINACIÓN */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-5 bg-[#111827] border border-[#1e293b] p-4 rounded-2xl gap-4 w-full">
                  <p className="text-sm text-slate-500 text-center sm:text-left">
                    Mostrando del{" "}
                    <span className="font-semibold text-white">{from + 1}</span> al{" "}
                    <span className="font-semibold text-white">
                      {Math.min(to + 1, count || 0)}
                    </span>{" "}
                    de <span className="font-semibold text-white">{count}</span>{" "}
                    resultados
                  </p>

                  <div className="flex items-center gap-2">
                    {currentPage > 1 ? (
                      <Link
                        href={`/panel?q=${q}&sucursal=${sucursal}&page=${currentPage - 1}`}
                        className="p-2 bg-[#0b1329] hover:bg-[#1e293b] rounded-lg transition-colors text-slate-300 border border-[#1e293b]"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="p-2 bg-[#0b1329]/50 rounded-lg text-slate-700 cursor-not-allowed border border-[#1e293b]"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    )}

                    <div className="px-4 py-2 bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 rounded-lg font-bold text-sm text-[#0ea5e9]">
                      {currentPage} / {totalPages}
                    </div>

                    {currentPage < totalPages ? (
                      <Link
                        href={`/panel?q=${q}&sucursal=${sucursal}&page=${currentPage + 1}`}
                        className="p-2 bg-[#0b1329] hover:bg-[#1e293b] rounded-lg transition-colors text-slate-300 border border-[#1e293b]"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="p-2 bg-[#0b1329]/50 rounded-lg text-slate-700 cursor-not-allowed border border-[#1e293b]"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center bg-[#111827] rounded-2xl border border-[#1e293b] w-full">
              <div className="w-12 h-12 rounded-xl bg-[#0b1329] border border-[#1e293b] flex items-center justify-center mb-4">
                <Search className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">
                Sin resultados
              </h3>
              <p className="text-sm">
                No se encontraron vehículos con esos filtros.
              </p>
              {(q || sucursal) && (
                <Link
                  href="/panel"
                  className="mt-4 text-[#0ea5e9] hover:underline font-semibold text-sm"
                >
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