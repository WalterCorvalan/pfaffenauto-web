import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ClipboardList, CheckCircle, Clock, Image as ImageIcon, Video, MapPin, MessageSquareText, Calculator } from "lucide-react";
import PrecioSugeridoEditor from "./PrecioSugeridoEditor";
import HistorialTasacionBadge from "./HistorialTasacionBadge";
import NotificacionesBell from "../../NotificacionesBell";

export default async function CotizacionesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  // FILTRO LOGÍSTICO: Solo cotizaciones (ventas a la agencia)
  const { data: cotizaciones } = await supabase
    .from("cotizaciones")
    .select("*")
    .neq("tipo_peritaje", "consignacion")
    .order("created_at", { ascending: false });

  // ================= MÉTRICAS INTEGRADAS =================
  const total = cotizaciones?.length || 0;
  const tasados = cotizaciones?.filter(c => c.precio_sugerido).length || 0;
  const pendientes = total - tasados;
  const presenciales = cotizaciones?.filter(c => c.tipo_peritaje?.toLowerCase().includes("presencial")).length || 0;

  // Historial: agrupamos por teléfono para detectar clientes con más de una tasación
  const historialPorTelefono = new Map<string, typeof cotizaciones>();
  (cotizaciones || []).forEach((c) => {
    const lista = historialPorTelefono.get(c.telefono) || [];
    lista.push(c);
    historialPorTelefono.set(c.telefono, lista);
  });

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">

      {/* ================= HEADER Y MÉTRICAS ================= */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-3.5 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-[#002a6e] border border-emerald-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">
              Solicitudes de Tasación
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Vehículos ingresados para venta directa o permuta
            </p>
          </div>
        </div>

        {/* Resumen de Métricas tipo Badges */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          <NotificacionesBell seccion="cotizaciones" />
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <ClipboardList className="w-3.5 h-3.5 text-slate-400" /> {total} Recibidas
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-700 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> {pendientes} Procesando
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-700 whitespace-nowrap">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {tasados} Tasados
          </div>
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md text-[11px] font-bold text-blue-700 whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 text-blue-500" /> {presenciales} Presenciales
          </div>
        </div>
      </header>

      {/* ================= ÁREA SCROLLABLE (TARJETAS DENSAS) ================= */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 max-w-[1800px] mx-auto">
          {cotizaciones?.map((cot) => {
            const esPresencial = cot.tipo_peritaje?.toLowerCase().includes("presencial");
            const anteriores = (historialPorTelefono.get(cot.telefono) || [])
              .filter((c) => c.id !== cot.id && new Date(c.created_at) < new Date(cot.created_at));

            return (
              <div
                key={cot.id}
                className={`bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] border-t-4 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all group ${cot.precio_sugerido ? "border-t-emerald-400" : "border-t-amber-400"}`}
              >
                {/* Top: Estado y Modalidad */}
                <div className="flex justify-between items-start mb-3">
                  {cot.precio_sugerido ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Tasado
                    </span>
                  ) : (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Procesando
                    </span>
                  )}
                  
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 border ${esPresencial ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 dark:bg-[#00246b] text-slate-500 dark:text-slate-300 border-slate-200 dark:border-[#0a2a6b]"}`}>
                    {esPresencial ? <MapPin className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    {esPresencial ? "Presencial" : "Online"}
                  </span>
                </div>

                {/* Info Cliente */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {cot.nombre.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-[14px] text-slate-900 dark:text-white truncate">
                    {cot.nombre}
                  </h3>
                </div>

                <HistorialTasacionBadge anteriores={anteriores} />

                {/* Info Auto (Caja compacta) */}
                <div className="bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] p-3 rounded-lg mb-4 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">
                      {cot.marca} • {cot.anio}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{cot.kilometraje.toLocaleString()} km</span>
                  </div>
                  <p className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-400 leading-tight truncate">
                    {cot.modelo}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {cot.version || "Sin versión"}
                  </p>
                </div>

                {/* Footer: Precio, Fotos y Acción */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#0a2a6b] flex items-center justify-between gap-2 mt-auto">
                  
                  {/* Precio */}
                  <PrecioSugeridoEditor
                    cotizacionId={cot.id}
                    precioSugerido={cot.precio_sugerido}
                    marca={cot.marca}
                    modelo={cot.modelo}
                    version={cot.version}
                    anio={cot.anio}
                    kilometraje={cot.kilometraje}
                  />

                  {/* Miniaturas superpuestas (Ahorro de espacio) */}
                  {cot.fotos_y_videos && cot.fotos_y_videos.length > 0 && (
                    <div className="flex -space-x-2 shrink-0">
                      {cot.fotos_y_videos.slice(0, 3).map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-slate-200 z-0 hover:z-10 hover:scale-110 transition-transform">
                          {url.includes("mp4") ? (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800"><Video className="w-3 h-3 text-white"/></div>
                          ) : (
                            <img src={url} alt="Evidencia" className="w-full h-full object-cover" />
                          )}
                        </a>
                      ))}
                      {cot.fotos_y_videos.length > 3 && (
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 z-10">
                          +{cot.fotos_y_videos.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botón WhatsApp */}
                  <a
                    href={`https://wa.me/${cot.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${cot.nombre}! Te escribimos de Pfaffen Autos respecto a la tasación de tu ${cot.marca} ${cot.modelo}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-green-50 hover:bg-green-100 text-green-600 p-1.5 rounded-md transition-colors shrink-0 ml-1"
                    title="Contactar por WhatsApp"
                  >
                    <MessageSquareText className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  </a>
                </div>

              </div>
            );
          })}
          
          {/* Estado Vacío */}
          {(!cotizaciones || cotizaciones.length === 0) && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-[#0a2a6b] rounded-2xl bg-white dark:bg-[#001c55]">
              <Calculator className="w-10 h-10 text-slate-300 mb-3" />
              <h3 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Sin cotizaciones activas</h3>
              <p className="text-slate-500 text-xs mt-1">Las tasaciones de compra o permuta aparecerán aquí.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}