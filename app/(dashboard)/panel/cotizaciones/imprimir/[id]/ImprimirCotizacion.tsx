"use client";

import Link from "next/link";
import { Printer, ArrowLeft, ArrowRightLeft } from "lucide-react";

export default function ImprimirCotizacion({ cot: c, vehiculoObjetivo }: { cot: any; vehiculoObjetivo: any }) {
  const fecha = c.created_at ? new Date(c.created_at).toLocaleDateString("es-AR") : "—";
  const formatMoney = (v: number | null, moneda?: string | null) =>
    v == null ? "—" : `${moneda === "USD" ? "US$" : "$"} ${Number(v).toLocaleString("es-AR")}`;

  const precioObjetivo = vehiculoObjetivo?.precio_publicado_usd && !vehiculoObjetivo?.precio_publicado_ars
    ? vehiculoObjetivo.precio_publicado_usd
    : vehiculoObjetivo?.precio_publicado_ars;
  const resta = vehiculoObjetivo && c.precio_sugerido && precioObjetivo ? precioObjetivo - c.precio_sugerido : null;

  return (
    <div className="min-h-screen pb-20 text-slate-800 bg-[#F9FAFB] dark:bg-[#001233] print:bg-white pt-8 font-sans">
      <div className="print:hidden max-w-[210mm] mx-auto mb-8 bg-white dark:bg-[#001c55] p-6 rounded-2xl border border-slate-200 dark:border-[#0a2a6b] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/panel/cotizaciones" className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-2.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Vista Previa de la Cotización</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{c.marca} {c.modelo}</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm active:scale-95">
          <Printer className="w-4 h-4" /> Imprimir / PDF
        </button>
      </div>

      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white p-[15mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0">
        <div className="flex justify-between items-start border-b-[3px] border-slate-900 pb-5 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Pfaffen Autos</h1>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">{c.sucursal_preferida || "Casa Central"}</p>
          </div>
          <div className="text-right">
            <h2 className="text-[15px] font-bold text-slate-800 uppercase tracking-widest border-2 border-slate-200 px-4 py-1.5 rounded-lg bg-slate-50">
              {c.tipo_peritaje === "permuta" ? "Cotización de Permuta" : "Cotización de Vehículo"}
            </h2>
            <div className="mt-3 text-[11px] text-slate-500 font-medium space-y-1 uppercase tracking-widest">
              <p>Fecha: <span className="font-bold text-slate-900">{fecha}</span></p>
              <p>Modalidad: <span className="font-bold text-slate-900">{c.tipo_peritaje || "—"}</span></p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-3">Datos del Cliente</h3>
          <div className="grid grid-cols-3 gap-y-3 gap-x-4 text-xs">
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Nombre</span>
              <strong className="text-slate-900 text-[13px]">{c.nombre}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Teléfono</span>
              <strong className="text-slate-900 text-[13px]">{c.telefono}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Email</span>
              <strong className="text-slate-900">{c.email || "—"}</strong>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-3">Vehículo a Tasar</h3>
          <div className="grid grid-cols-4 gap-y-4 gap-x-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
            <div className="col-span-2">
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Marca y Modelo</span>
              <strong className="text-[14px] font-black uppercase">{c.marca} {c.modelo}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Año</span>
              <strong className="text-[14px] font-black">{c.anio}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Kilometraje</span>
              <strong className="text-[14px] font-black">{Number(c.kilometraje || 0).toLocaleString("es-AR")} km</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Versión</span>
              <strong className="text-slate-900">{c.version || "—"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">GNC</span>
              <strong className="text-slate-900">{c.gnc || "No"}</strong>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-6">
          <div className="flex-1 border border-slate-300 rounded-xl overflow-hidden">
            <h3 className="bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-300">Tasación</h3>
            <div className="p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center border-t-2 border-slate-900 pt-3">
                <span className="font-bold text-[13px] uppercase tracking-widest">Oferta:</span>
                <strong className="text-xl font-black text-slate-900 bg-slate-100 px-3 py-1 rounded">
                  {formatMoney(c.precio_sugerido, c.moneda_sugerida)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {vehiculoObjetivo && (
          <div className="mb-6 border border-indigo-200 rounded-xl overflow-hidden">
            <h3 className="bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 border-b border-indigo-200 flex items-center gap-1.5">
              <ArrowRightLeft className="w-3 h-3" /> Permuta por
            </h3>
            <div className="p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Vehículo de interés:</span>
                <strong className="text-[13px]">{vehiculoObjetivo.marca} {vehiculoObjetivo.modelo}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Precio del vehículo:</span>
                <strong className="text-[13px]">{formatMoney(precioObjetivo, vehiculoObjetivo.precio_publicado_usd && !vehiculoObjetivo.precio_publicado_ars ? "USD" : "ARS")}</strong>
              </div>
              {resta != null && (
                <div className="flex justify-between items-center border-t-2 border-indigo-900 pt-3 mt-3">
                  <span className="font-bold text-[13px] uppercase tracking-widest">Resta a pagar:</span>
                  <strong className="text-xl font-black text-indigo-900 bg-indigo-100 px-3 py-1 rounded">
                    $ {resta.toLocaleString("es-AR")}
                  </strong>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-[10px] text-slate-400 leading-relaxed text-justify mt-10">
          Esta cotización es un valor estimado sujeto a verificación física del vehículo y su documentación. El precio final se confirma en sucursal.
        </p>

        <div className="grid grid-cols-2 gap-16 mt-20 px-8">
          <div className="text-center border-t border-slate-400 pt-3">
            <span className="block font-bold text-sm">Firma del Cliente</span>
            <span className="block text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Aclaración y DNI</span>
          </div>
          <div className="text-center border-t border-slate-400 pt-3">
            <span className="block font-bold text-sm">Por Pfaffen Autos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
