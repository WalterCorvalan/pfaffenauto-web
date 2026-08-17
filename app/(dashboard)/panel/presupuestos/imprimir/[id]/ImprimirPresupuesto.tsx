"use client";

import { Printer, ArrowLeft, Share2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ImprimirPresupuesto({ presupuesto: p }: { presupuesto: any }) {
  const vendedor = p.perfiles?.nombre || "Administración";
  const formatMoney = (val: number) => `$ ${Number(val || 0).toLocaleString("es-AR")}`;
  const fecha = p.fecha ? new Date(`${p.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—";

  const linkPublico = p.token_publico ? `${typeof window !== "undefined" ? window.location.origin : ""}/presupuesto/${p.token_publico}` : null;

  const compartir = () => {
    if (!linkPublico) return;
    navigator.clipboard.writeText(linkPublico);
    alert("Link copiado. Te va a llegar una notificación cada vez que el cliente lo abra.");
  };

  return (
    <div className="min-h-screen pb-20 text-slate-800 bg-[#F9FAFB] dark:bg-[#001233] print:bg-white pt-8 font-sans">
      <div className="print:hidden max-w-[210mm] mx-auto mb-8 bg-white dark:bg-[#001c55] p-6 rounded-2xl border border-slate-200 dark:border-[#0a2a6b] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/panel/presupuestos" className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-2.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Impresión de Presupuesto</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">N° {p.numero}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {p.precio_confirmado === false && (
            <span className="flex items-center gap-1.5 bg-amber-50 dark:bg-[#002a6e] text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-[#0a2a6b] px-3 py-2 rounded-xl text-xs font-bold">
              <AlertTriangle className="w-4 h-4" /> Precio a confirmar
            </span>
          )}
          {linkPublico && (
            <button onClick={compartir} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm active:scale-95">
              <Share2 className="w-4 h-4" /> Compartir
            </button>
          )}
          <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm active:scale-95">
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white p-[15mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0">
        <div className="flex justify-between items-start border-b-[3px] border-slate-900 pb-5 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Pfaffen Autos</h1>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Concesionaria Oficial y Usados Seleccionados</p>
          </div>
          <div className="text-right">
            <h2 className="text-[15px] font-bold text-slate-800 uppercase tracking-widest border-2 border-slate-200 px-4 py-1.5 rounded-lg bg-slate-50">
              Presupuesto
            </h2>
            <div className="mt-3 text-[11px] text-slate-500 font-medium space-y-1 uppercase tracking-widest">
              <p>Número: <span className="font-mono font-bold text-slate-900">{p.numero}</span></p>
              <p>Fecha: <span className="font-bold text-slate-900">{fecha}</span></p>
              <p>Vendedor: <span className="font-bold text-slate-900">{vendedor}</span></p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-3">Cliente</h3>
          <strong className="text-slate-900 text-[15px]">{p.cliente}</strong>
        </div>

        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-3">Información del Vehículo</h3>
          <div className="grid grid-cols-4 gap-y-4 gap-x-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Dominio</span>
              <strong className="text-[14px] font-black uppercase">{p.dominio || "0KM"}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Marca y Modelo</span>
              <strong className="text-[14px] font-black uppercase">{p.marca} {p.modelo}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Segmento</span>
              <strong className="text-slate-900 capitalize">{p.segmento || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Tipo</span>
              <strong className="text-slate-900">{p.tipo || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Año</span>
              <strong className="text-slate-900">{p.modelo_anio || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Color</span>
              <strong className="text-slate-900 capitalize">{p.color || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Kilómetros</span>
              <strong className="text-slate-900">{p.kilometros?.toLocaleString("es-AR") || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Combustible</span>
              <strong className="text-slate-900">{p.combustible || "-"}</strong>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-6">
          <div className="flex-1 border border-slate-300 rounded-xl overflow-hidden">
            <h3 className="bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-300">Precio de venta</h3>
            <div className="p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Precio de Venta u$s:</span>
                <strong className="text-[14px]">{p.precio_venta_usd ? `u$s ${Number(p.precio_venta_usd).toLocaleString("es-AR")}` : "u$s 0,00"}</strong>
              </div>
              <div className="flex justify-between items-center border-t-2 border-slate-900 pt-3 mt-3">
                <span className="font-bold text-[13px] uppercase tracking-widest">Precio Venta $:</span>
                <strong className="text-xl font-black text-slate-900 bg-slate-100 px-3 py-1 rounded">
                  {p.precio_venta_ars ? formatMoney(p.precio_venta_ars) : "A convenir"}
                </strong>
              </div>
              {p.imprimir_en && (
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-600 font-medium">Imprimir en:</span>
                  <strong className="text-slate-900">{p.imprimir_en}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {p.observaciones && (
          <div className="mb-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-2">Observaciones</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
              {p.observaciones}
            </p>
          </div>
        )}

        <p className="text-[10px] italic text-slate-400 mt-10">
          El presente documento es de carácter meramente informativo y no constituye una reserva del vehículo ni congela el valor del mismo. El stock y los precios están sujetos a modificaciones sin previo aviso hasta la efectiva seña de la unidad.
        </p>
      </div>
    </div>
  );
}
