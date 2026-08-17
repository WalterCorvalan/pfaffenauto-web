"use client";

import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ImprimirRespCivil({ registro: r }: { registro: any }) {
  const vendedor = r.perfiles?.nombre || "Administración";
  const fecha = r.fecha ? new Date(`${r.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—";
  const fechaNacimiento = r.fecha_nacimiento ? new Date(`${r.fecha_nacimiento}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "N/A";

  return (
    <div className="min-h-screen pb-20 text-slate-800 bg-[#F9FAFB] dark:bg-[#001233] print:bg-white pt-8 font-sans">
      <div className="print:hidden max-w-[210mm] mx-auto mb-8 bg-white dark:bg-[#001c55] p-6 rounded-2xl border border-slate-200 dark:border-[#0a2a6b] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/panel/resp-civil" className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-2.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Vista Previa de la Resp. Civil</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">N° {r.numero}</p>
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
              <p>Hora: <span className="font-bold text-slate-900">{r.hora ? r.hora.slice(0, 5) : "—"}</span></p>
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
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Fecha de Nacimiento</span>
              <strong className="text-slate-900">{fechaNacimiento}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Cuit/Cuil</span>
              <strong className="text-slate-900">{r.cuit_cuil || "N/A"}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Domicilio</span>
              <strong className="text-slate-900">{r.calle} {r.numero_calle}{r.depto ? ` Dto. ${r.depto}` : ""}, {r.localidad} ({r.provincia}) {r.codigo_postal ? `- CP ${r.codigo_postal}` : ""}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Celular</span>
              <strong className="text-slate-900">{r.telefono_celular || "N/A"}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Teléfono de Línea</span>
              <strong className="text-slate-900">{r.telefono_linea || "N/A"}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Email</span>
              <strong className="text-slate-900">{r.correo_electronico || "No registrado"}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Estado Civil</span>
              <strong className="text-slate-900 capitalize">{r.estado_civil || "N/A"}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Profesión</span>
              <strong className="text-slate-900 capitalize">{r.profesion || "N/A"}</strong>
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
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Segmento</span>
              <strong className="text-slate-900 capitalize">{r.segmento || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Tipo</span>
              <strong className="text-slate-900 capitalize">{r.tipo || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Color</span>
              <strong className="text-slate-900 capitalize">{r.color || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Marca de Motor</span>
              <strong className="text-slate-900 uppercase">{r.marca_motor || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Nro. de Motor</span>
              <strong className="text-slate-900 font-mono uppercase">{r.numero_motor || "A verificar"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Marca de Chasis</span>
              <strong className="text-slate-900 uppercase">{r.marca_chasis || "-"}</strong>
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
