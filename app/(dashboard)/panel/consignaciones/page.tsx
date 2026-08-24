import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Handshake, CarFront, DollarSign, MapPin, Tag } from "lucide-react";
import SolicitudesConsignacion from "./SolicitudesConsignacion";
import NotificacionesBell from "../../NotificacionesBell";

export default async function ConsignacionesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  // Traemos solo los vehículos que están a consignación
  const { data: consignados } = await supabase
    .from("vehiculos")
    .select("*, sucursales!vehiculos_sucursal_id_fkey(nombre)")
    .eq("origen", "Consignado")
    .in("estado", ["Disponible", "Reservado"])
    .order("created_at", { ascending: false });

  // Solicitudes entrantes: leads del formulario público de consignación (tabla cotizaciones)
  const { data: solicitudes } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq("tipo_peritaje", "consignacion")
    .order("created_at", { ascending: false });

  return (
    // Contenedor principal sin márgenes que ocupa 100%
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">

      {/* ================= HEADER FIJO ================= */}
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-[#002a6e] border border-emerald-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Handshake className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Consignaciones
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Control de unidades de terceros y comisiones de venta.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificacionesBell seccion="consignaciones" />
          <div className="hidden sm:flex items-center gap-2 bg-amber-50 dark:bg-[#002a6e] border border-amber-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg">
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{solicitudes?.filter((s) => s.estado === "Pendiente" || !s.estado).length || 0}</span>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-300">Solicitudes pendientes</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{consignados?.length || 0}</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Unidades Activas</span>
          </div>
        </div>
      </header>

      {/* ================= ÁREA SCROLLABLE ================= */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-8">

          {/* ================= SOLICITUDES ENTRANTES ================= */}
          <SolicitudesConsignacion solicitudes={solicitudes || []} />

          {/* ================= INVENTARIO CONSIGNADO ================= */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
              <Handshake className="w-3.5 h-3.5" /> Unidades en Consignación ({consignados?.length || 0})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {consignados?.map((auto) => {

            // Cálculos financieros
            const precioDuenio = Number(auto.precio_costo_usd) || 0;
            const precioVenta = Number(auto.precio_publicado_usd) || 0;
            const comisionAgencia = precioVenta - precioDuenio;

            // Colores por estado
            const esReservado = auto.estado === "Reservado";

            return (
              <div
                key={auto.id}
                className={`bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] border-l-4 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all flex flex-col ${esReservado ? "border-l-amber-400" : "border-l-emerald-400"}`}
              >
                {/* Cabecera de Tarjeta: Estado y Sucursal */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                    esReservado
                      ? "bg-amber-50 dark:bg-[#002a6e] text-amber-600 dark:text-amber-300 border-amber-200 dark:border-[#0a2a6b]"
                      : "bg-emerald-50 dark:bg-[#002a6e] text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-[#0a2a6b]"
                  }`}>
                    {auto.estado}
                  </span>

                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase tracking-widest">
                    <MapPin className="w-3 h-3" /> {auto.sucursales?.nombre}
                  </span>
                </div>

                {/* Vehículo e Identificación */}
                <div className="mb-5">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                    {auto.marca} {auto.modelo}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-slate-100 dark:bg-[#00246b] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#0a2a6b] px-2 py-0.5 rounded-md text-[11px] font-bold font-mono tracking-widest">
                      {auto.patente || "S/P"}
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">• {auto.anio}</span>
                  </div>
                </div>

                {/* Panel Financiero (Cálculos en USD) */}
                <div className="mt-auto bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-4 rounded-xl flex flex-col gap-3">

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Pactado con Dueño:</span>
                    <strong className="text-slate-700 dark:text-slate-200 font-mono">USD {precioDuenio.toLocaleString("es-AR")}</strong>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Precio Publicado:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">USD {precioVenta.toLocaleString("es-AR")}</strong>
                  </div>

                  {/* Divisor */}
                  <div className="h-px bg-slate-200 dark:bg-[#0a2a6b] w-full my-0.5"></div>

                  {/* Comisión (Destacada) */}
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-600 dark:text-sky-300 font-bold text-xs flex items-center gap-1 uppercase tracking-wider">
                      <Tag className="w-3.5 h-3.5"/> Comisión
                    </span>
                    <strong className="text-indigo-700 dark:text-sky-300 font-black font-mono text-[15px]">
                      USD {comisionAgencia.toLocaleString("es-AR")}
                    </strong>
                  </div>

                </div>
              </div>
            );
          })}

          {/* Estado Vacío */}
          {(!consignados || consignados.length === 0) && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-[#0a2a6b] rounded-2xl bg-white dark:bg-[#001c55]">
              <Handshake className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Sin autos a consignación</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Los vehículos de terceros marcados como "Consignado" aparecerán aquí.</p>
            </div>
          )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}