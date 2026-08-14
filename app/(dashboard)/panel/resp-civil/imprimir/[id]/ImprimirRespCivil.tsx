"use client";

import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ImprimirRespCivil({ registro: r }: { registro: any }) {
  const vendedor = r.perfiles?.nombre || "Administración";
  const fecha = r.fecha ? new Date(`${r.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—";

  return (
    <div className="min-h-screen pb-20 text-slate-800 bg-[#F9FAFB] print:bg-white pt-8 font-sans">
      <div className="print:hidden max-w-[210mm] mx-auto mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/panel/resp-civil" className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2.5 rounded-lg border border-slate-200">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 leading-tight">Vista Previa de la Resp. Civil</h2>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">N° {r.numero}</p>
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
          </div>
          <div className="text-right">
            <h2 className="text-[15px] font-bold text-slate-800 uppercase tracking-widest border-2 border-slate-200 px-4 py-1.5 rounded-lg bg-slate-50">Responsabilidad Civil</h2>
            <div className="mt-3 text-[11px] text-slate-500 font-medium space-y-1 uppercase tracking-widest">
              <p>Número: <span className="font-mono font-bold text-slate-900">{r.numero}</span></p>
              <p>Fecha: <span className="font-bold text-slate-900">{fecha}</span></p>
              <p>Hora: <span className="font-bold text-slate-900">{r.hora || "—"}</span></p>
              <p>Vendedor: <span className="font-bold text-slate-900">{vendedor}</span></p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-3">Información del Cliente</h3>
          <div className="grid grid-cols-4 gap-y-3 gap-x-4 text-xs">
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Apellido y Nombre</span>
              <strong className="text-slate-900 text-[13px]">{r.apellido}, {r.nombre}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">D.N.I.</span>
              <strong className="text-slate-900 text-[13px]">{r.dni || "N/A"}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Celular</span>
              <strong className="text-slate-900">{r.telefono_celular || "N/A"}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Domicilio</span>
              <strong className="text-slate-900">{r.calle} {r.numero_calle}, {r.localidad} ({r.provincia})</strong>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Email</span>
              <strong className="text-slate-900">{r.correo_electronico || "No registrado"}</strong>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-3">Información del Vehículo</h3>
          <div className="grid grid-cols-4 gap-y-4 gap-x-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Dominio</span>
              <strong className="text-[14px] font-black uppercase">{r.dominio || "0KM"}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Marca y Modelo</span>
              <strong className="text-[14px] font-black uppercase">{r.marca} {r.modelo}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Año</span>
              <strong className="text-[14px] font-black">{r.modelo_anio}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Color</span>
              <strong className="text-slate-900 capitalize">{r.color || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Nro. de Motor</span>
              <strong className="text-slate-900 font-mono uppercase">{r.numero_motor || "A verificar"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Nro. de Chasis</span>
              <strong className="text-slate-900 font-mono uppercase">{r.numero_chasis || "A verificar"}</strong>
            </div>
          </div>
        </div>

        {r.observaciones && (
          <div className="mb-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-2">Observaciones</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap font-bold uppercase bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
              {r.observaciones}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-16 mt-20 px-8">
          <div className="text-center border-t border-slate-400 pt-3">
            <span className="block font-bold text-sm">Firma del Comprador</span>
            <span className="block text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Aclaración y DNI</span>
          </div>
          <div className="text-center border-t border-slate-400 pt-3">
            <span className="block font-bold text-sm">Por Pfaffen Autos</span>
            <span className="block text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{vendedor}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
