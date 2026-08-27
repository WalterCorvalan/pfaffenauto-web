"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Clock, XCircle, ImageIcon, MapPin, MessageSquareText, Calculator, ArrowRightLeft } from "lucide-react";
import PrecioSugeridoEditor from "./PrecioSugeridoEditor";
import EstadoTasacionSelector from "./EstadoTasacionSelector";
import VendedorCotizacionEditor from "./VendedorCotizacionEditor";
import HistorialTasacionBadge from "./HistorialTasacionBadge";
import GaleriaFotos from "./GaleriaFotos";

interface Vendedor {
  id: string;
  nombre: string | null;
  rol?: string;
}

interface VehiculoObjetivo {
  id: string;
  marca: string;
  modelo: string;
  precio_publicado_ars: number | null;
  precio_publicado_usd: number | null;
}

interface Cotizacion {
  id: string;
  created_at: string;
  nombre: string;
  telefono: string;
  marca: string;
  modelo: string;
  version: string | null;
  anio: number;
  kilometraje: number;
  tipo_peritaje: string | null;
  precio_sugerido: number | null;
  moneda_sugerida: string | null;
  vehiculo_id: string | null;
  vendedor_id: string | null;
  estado_tasacion: string;
  fotos_y_videos: string[] | null;
}

type Tab = "pendientes" | "aprobadas" | "rechazadas";

const TABS: { id: Tab; label: string; estado: string }[] = [
  { id: "pendientes", label: "Pendientes", estado: "Pendiente" },
  { id: "aprobadas", label: "Aprobadas", estado: "Aprobada" },
  { id: "rechazadas", label: "Rechazadas", estado: "Rechazada" },
];

export default function CotizacionesClient({
  cotizaciones,
  vehiculoObjetivoPorId,
  historialPorTelefono,
  vendedores,
}: {
  cotizaciones: Cotizacion[];
  vehiculoObjetivoPorId: Record<string, VehiculoObjetivo>;
  historialPorTelefono: Record<string, Cotizacion[]>;
  vendedores: Vendedor[];
}) {
  const [tab, setTab] = useState<Tab>("pendientes");

  const conteos = useMemo(() => ({
    pendientes: cotizaciones.filter((c) => c.estado_tasacion === "Pendiente").length,
    aprobadas: cotizaciones.filter((c) => c.estado_tasacion === "Aprobada").length,
    rechazadas: cotizaciones.filter((c) => c.estado_tasacion === "Rechazada").length,
  }), [cotizaciones]);

  const filtradas = useMemo(() => {
    const estadoTab = TABS.find((t) => t.id === tab)!.estado;
    return cotizaciones.filter((c) => c.estado_tasacion === estadoTab);
  }, [cotizaciones, tab]);

  const vendedorPorId = useMemo(() => new Map(vendedores.map((v) => [v.id, v])), [vendedores]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-white dark:bg-[#001233] overflow-hidden">

      {/* ================= TABS POR ESTADO ================= */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#001c55] shrink-0 overflow-x-auto custom-scrollbar">
        {TABS.map((t) => {
          const count = conteos[t.id];
          const activo = tab === t.id;
          const Icono = t.id === "pendientes" ? Clock : t.id === "aprobadas" ? CheckCircle : XCircle;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-lg border transition-colors whitespace-nowrap ${
                activo
                  ? "bg-[#0145F2] border-[#0145F2] text-white shadow-sm"
                  : "bg-white dark:bg-[#00246b] border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#002a6e]"
              }`}
            >
              <Icono className="w-3.5 h-3.5" /> {t.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activo ? "bg-white/20" : "bg-slate-100 dark:bg-[#002a6e]"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ================= ÁREA SCROLLABLE (TARJETAS DENSAS) ================= */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 max-w-[1800px] mx-auto">
          {filtradas.map((cot) => {
            const esPresencial = cot.tipo_peritaje?.toLowerCase().includes("presencial");
            const anteriores = (historialPorTelefono[cot.telefono] || [])
              .filter((c) => c.id !== cot.id && new Date(c.created_at) < new Date(cot.created_at));
            const vehiculoObjetivo = cot.vehiculo_id ? vehiculoObjetivoPorId[cot.vehiculo_id] : null;
            const precioObjetivo = vehiculoObjetivo?.precio_publicado_ars || null;
            const resta = vehiculoObjetivo && cot.precio_sugerido && precioObjetivo
              ? precioObjetivo - cot.precio_sugerido
              : null;
            const vendedor = cot.vendedor_id ? vendedorPorId.get(cot.vendedor_id) : null;

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
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {cot.nombre.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-[14px] text-slate-900 dark:text-white truncate">
                    {cot.nombre}
                  </h3>
                </div>

                {/* Vendedor asignado */}
                <div className="mb-2 -ml-1.5">
                  <VendedorCotizacionEditor
                    cotizacionId={cot.id}
                    vendedorActualId={cot.vendedor_id}
                    vendedorActualNombre={vendedor?.nombre || null}
                    vendedores={vendedores}
                  />
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

                {/* Permuta: auto que el cliente quiere comprar + cuánto le resta pagar */}
                {vehiculoObjetivo && (
                  <div className="bg-indigo-50 dark:bg-indigo-400/10 border border-indigo-100 dark:border-indigo-400/20 p-2.5 rounded-lg mb-4 -mt-2">
                    <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-indigo-500 dark:text-indigo-300 mb-1">
                      <ArrowRightLeft className="w-3 h-3" /> Permuta por
                    </span>
                    <p className="text-[12px] font-bold text-indigo-900 dark:text-indigo-200 truncate">
                      {vehiculoObjetivo.marca} {vehiculoObjetivo.modelo}
                    </p>
                    {resta != null ? (
                      <p className="text-[12px] font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
                        Resta $ {resta.toLocaleString("es-AR")}
                      </p>
                    ) : (
                      <p className="text-[10px] text-indigo-500/70 dark:text-indigo-300/60 mt-0.5">Falta tasación para calcular el resto</p>
                    )}
                  </div>
                )}

                {/* Precio, Fotos y WhatsApp */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#0a2a6b] flex items-center justify-between gap-2">
                  <PrecioSugeridoEditor
                    cotizacionId={cot.id}
                    precioSugerido={cot.precio_sugerido}
                    monedaSugerida={cot.moneda_sugerida}
                    marca={cot.marca}
                    modelo={cot.modelo}
                    version={cot.version || undefined}
                    anio={cot.anio}
                    kilometraje={cot.kilometraje}
                  />

                  {cot.fotos_y_videos && cot.fotos_y_videos.length > 0 && (
                    <GaleriaFotos urls={cot.fotos_y_videos} />
                  )}

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

                {/* Aprobar / Rechazar */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-[#0a2a6b]">
                  <EstadoTasacionSelector cotizacionId={cot.id} estadoTasacion={cot.estado_tasacion} />
                </div>

              </div>
            );
          })}

          {filtradas.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-[#0a2a6b] rounded-2xl bg-white dark:bg-[#001c55]">
              <Calculator className="w-10 h-10 text-slate-300 mb-3" />
              <h3 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Sin tasaciones en esta vista</h3>
              <p className="text-slate-500 text-xs mt-1">Cambiá de pestaña o esperá nuevas solicitudes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
