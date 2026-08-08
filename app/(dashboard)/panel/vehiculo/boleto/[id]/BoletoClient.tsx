"use client";

import { useState } from "react";
import { Printer, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default function BoletoClient({ auto }: { auto: any }) {
  const [comprador, setComprador] = useState("");
  const [dni, setDni] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [montoSena, setMontoSena] = useState("");
  const [fecha] = useState(new Date().toLocaleDateString("es-AR"));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-8 pb-20 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* ================= PANEL DE CONTROL (Oculto al imprimir) ================= */}
      <div className="print:hidden max-w-5xl mx-auto mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/panel" 
              className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-200"
              title="Volver al inventario"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900 flex items-center gap-2 leading-tight">
                <FileText className="w-5 h-5 text-indigo-600" /> Generador de Boleto
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Completá los datos del comprador para el PDF</p>
            </div>
          </div>
          <button 
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Nombre Completo</label>
            <input type="text" value={comprador} onChange={e => setComprador(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-colors placeholder:text-slate-400" placeholder="Ej: Juan Pérez" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">DNI / CUIT</label>
            <input type="text" value={dni} onChange={e => setDni(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-colors placeholder:text-slate-400" placeholder="Sin puntos" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Domicilio</label>
            <input type="text" value={domicilio} onChange={e => setDomicilio(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-colors placeholder:text-slate-400" placeholder="Ej: Av. San Martín 123" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Monto de Seña ($)</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:border-indigo-500 focus-within:bg-white transition-colors">
              <span className="text-slate-400 font-bold mr-1">$</span>
              <input type="number" value={montoSena} onChange={e => setMontoSena(e.target.value)} className="w-full bg-transparent py-2.5 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 font-mono" placeholder="Ej: 500000" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= HOJA A4 PARA IMPRIMIR ================= */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white p-[20mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0">
        
        {/* Cabecera del Boleto */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Pfaffen Autos</h1>
            <p className="text-sm font-medium text-slate-600 mt-1">Concesionaria Oficial y Usados Seleccionados</p>
            <p className="text-xs text-slate-500 mt-0.5">{auto.sucursales?.direccion || "Buenos Aires, Argentina"}</p>
          </div>
          <div className="text-right">
            <h2 className="text-[17px] font-bold text-slate-800 uppercase tracking-widest border-2 border-slate-300 px-4 py-2 rounded-lg">Boleto de Reserva</h2>
            <p className="text-sm text-slate-600 mt-3 font-medium">Fecha: <span className="font-bold text-slate-900">{fecha}</span></p>
            <p className="text-sm text-slate-600 mt-1 font-medium">Ref: <span className="font-bold text-slate-900 font-mono">#RES-{auto.id.slice(0,6).toUpperCase()}</span></p>
          </div>
        </div>

        {/* Cuerpo Legal */}
        <div className="space-y-6 text-sm leading-relaxed text-justify text-slate-800">
          <p>
            Conste por el presente documento que la firma <strong>PFAFFEN AUTOS</strong>, en adelante "La Agencia", recibe en este acto del/la Sr./Sra. <span className="border-b border-dashed border-slate-400 font-bold px-2">{comprador || "___________________________"}</span>, titular del DNI/CUIT N° <span className="border-b border-dashed border-slate-400 font-bold px-2">{dni || "_______________"}</span>, con domicilio en <span className="border-b border-dashed border-slate-400 font-bold px-2">{domicilio || "_________________________________"}</span>, en adelante "El Comprador".
          </p>

          <p>
            La suma de Pesos: <strong>$ {montoSena ? Number(montoSena).toLocaleString("es-AR") : "___________________"}</strong> en concepto de <strong>SEÑA Y PRINCIPIO DE EJECUCIÓN DE COMPRA</strong> (congelando o no el valor total según condiciones pactadas por separado), por la adquisición del siguiente vehículo:
          </p>

          {/* Caja de datos del vehículo */}
          <div className="bg-slate-50 border-2 border-slate-200 p-5 rounded-xl grid grid-cols-2 gap-y-5 gap-x-8 my-8 print:bg-white print:border-slate-300">
            <div><span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Marca y Modelo</span><strong className="text-[15px] uppercase">{auto.marca} {auto.modelo}</strong></div>
            <div><span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Patente (Dominio)</span><strong className="text-[15px] uppercase">{auto.patente || "A PATENTAR (0KM)"}</strong></div>
            <div><span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Año</span><strong className="text-[15px]">{auto.anio}</strong></div>
            <div><span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Precio Publicado</span><strong className="text-[15px]">$ {auto.precio_publicado_ars?.toLocaleString("es-AR")}</strong></div>
            <div><span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">N° de Motor</span><strong className="text-[15px]">{auto.numero_motor || "A verificar"}</strong></div>
            <div><span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">N° de Chasis</span><strong className="text-[15px]">{auto.numero_chasis || "A verificar"}</strong></div>
          </div>

          <p>
            El saldo restante deberá ser abonado dentro de los próximos <strong>siete (7) días hábiles</strong>. En caso de que El Comprador desistiera de la operación o no integrara el saldo en el plazo estipulado, perderá la suma entregada en este acto en concepto de indemnización, quedando La Agencia en libre disponibilidad del vehículo.
          </p>
          
          <p>
            El vehículo se entrega en el estado en que se encuentra y que El Comprador declara conocer y aceptar tras su revisión presencial, o sujeto a la entrega de la unidad 0km por parte de la terminal.
          </p>

          {/* Firmas */}
          <div className="grid grid-cols-2 gap-12 mt-32">
            <div className="text-center border-t border-slate-400 pt-3">
              <span className="block font-bold">Firma del Comprador</span>
              <span className="block text-[11px] text-slate-500 mt-1 uppercase tracking-widest">Aclaración y DNI</span>
            </div>
            <div className="text-center border-t border-slate-400 pt-3">
              <span className="block font-bold">Firma por Pfaffen Autos</span>
              <span className="block text-[11px] text-slate-500 mt-1 uppercase tracking-widest">Recibí conforme</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}