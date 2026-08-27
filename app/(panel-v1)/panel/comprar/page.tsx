import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Wallet, CheckCircle, Clock, ImageIcon, MapPin, MessageSquareText, Calculator, CarFront } from "lucide-react";
import PrecioSugeridoEditor from "../cotizaciones/PrecioSugeridoEditor";
import HistorialTasacionBadge from "../cotizaciones/HistorialTasacionBadge";
import GaleriaFotos from "../cotizaciones/GaleriaFotos";
import NotificacionesBell from "../../NotificacionesBell";

// "Comprar": nos ofrecen SU auto para comprárselo (tipo_peritaje = "venta").
// No confundir con /panel/boletos ("Ventas" — nosotros vendiendo del stock).
export default async function ComprarPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: cotizaciones } = await supabase
    .from("cotizaciones")
    .select("*")
    .eq("tipo_peritaje", "venta")
    .order("created_at", { ascending: false });

  const total = cotizaciones?.length || 0;
  const tasados = cotizaciones?.filter((c) => c.precio_sugerido).length || 0;
  const pendientes = total - tasados;
  const presenciales = cotizaciones?.filter((c) => c.puede_venir_sucursal).length || 0;

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
          <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-[#002a6e] border border-orange-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-orange-600 dark:text-orange-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">
              Comprar
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Particulares que nos ofrecen su auto para comprarlo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          <NotificacionesBell seccion="comprar" />
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <Wallet className="w-3.5 h-3.5 text-slate-400" /> {total} Recibidas
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-700 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> {pendientes} Procesando
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-700 whitespace-nowrap">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {tasados} Tasados
          </div>
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-md text-[11px] font-bold text-orange-700 whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 text-orange-500" /> {presenciales} Presenciales
          </div>
        </div>
      </header>

      {/* ================= ÁREA SCROLLABLE (TARJETAS DENSAS) ================= */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 max-w-[1800px] mx-auto">
          {cotizaciones?.map((cot) => {
            const anteriores = (historialPorTelefono.get(cot.telefono) || [])
              .filter((c) => c.id !== cot.id && new Date(c.created_at) < new Date(cot.created_at));

            return (
              <div
                key={cot.id}
                className={`bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] border-t-4 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all group ${cot.precio_sugerido ? "border-t-emerald-400" : "border-t-amber-400"}`}
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

                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 border ${cot.puede_venir_sucursal ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-slate-100 dark:bg-[#00246b] text-slate-500 dark:text-slate-300 border-slate-200 dark:border-[#0a2a6b]"}`}>
                    {cot.puede_venir_sucursal ? <MapPin className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    {cot.puede_venir_sucursal ? "Presencial" : "Online"}
                  </span>
                </div>

                {/* Info Cliente */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
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
                  <p className="text-[13px] font-semibold text-orange-700 dark:text-orange-400 leading-tight truncate">
                    {cot.modelo}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {cot.version || "Sin versión"}
                  </p>
                </div>

                {/* Footer: Precio, Fotos y Acción */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#0a2a6b] flex items-center justify-between gap-2 mt-auto">

                  <PrecioSugeridoEditor
                    cotizacionId={cot.id}
                    precioSugerido={cot.precio_sugerido}
                    monedaSugerida={cot.moneda_sugerida}
                    marca={cot.marca}
                    modelo={cot.modelo}
                    version={cot.version}
                    anio={cot.anio}
                    kilometraje={cot.kilometraje}
                  />

                  {cot.fotos_y_videos && cot.fotos_y_videos.length > 0 && (
                    <GaleriaFotos urls={cot.fotos_y_videos} />
                  )}

                  {cot.precio_sugerido && (
                    <Link
                      href={`/panel/vehiculo/nuevo?${new URLSearchParams({
                        marca: cot.marca || "",
                        modelo: cot.modelo || "",
                        anio: cot.anio ? String(cot.anio) : "",
                        kilometraje: cot.kilometraje != null ? String(cot.kilometraje) : "",
                        origen: "Comprado",
                        [cot.moneda_sugerida === "USD" ? "precio_costo_usd" : "precio_costo_ars"]: String(cot.precio_sugerido),
                      }).toString()}`}
                      className="bg-orange-50 hover:bg-orange-100 text-orange-600 p-1.5 rounded-md transition-colors shrink-0 ml-1"
                      title="Convertir a compra (cargar al stock)"
                    >
                      <CarFront className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    </Link>
                  )}

                  <a
                    href={`https://wa.me/${cot.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${cot.nombre}! Te escribimos de Pfaffen Autos respecto a la compra de tu ${cot.marca} ${cot.modelo}.`)}`}
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
              <h3 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Sin ofertas de compra</h3>
              <p className="text-slate-500 text-xs mt-1">Los particulares que quieran vendernos su auto aparecerán acá.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
