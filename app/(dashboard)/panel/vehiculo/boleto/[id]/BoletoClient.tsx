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
    <div className="min-h-screen pb-20 text-slate-800">
      
      {/* PANEL DE CONTROL (Oculto al imprimir) */}
      <div className="print:hidden max-w-4xl mx-auto mb-8 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/panel" className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-serif flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0ea5e9]" /> Generador de Boleto
            </h2>
          </div>
          <button 
            onClick={handlePrint}
            className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg"
          >
            <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Nombre Completo</label>
            <input type="text" value={comprador} onChange={e => setComprador(e.target.value)} className="w-full bg-[#0b1329] border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0ea5e9]" placeholder="Ej: Juan Pérez" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">DNI / CUIT</label>
            <input type="text" value={dni} onChange={e => setDni(e.target.value)} className="w-full bg-[#0b1329] border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0ea5e9]" placeholder="Sin puntos" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Domicilio</label>
            <input type="text" value={domicilio} onChange={e => setDomicilio(e.target.value)} className="w-full bg-[#0b1329] border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0ea5e9]" placeholder="Ej: Av. San Martín 123" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Monto de Seña ($)</label>
            <input type="number" value={montoSena} onChange={e => setMontoSena(e.target.value)} className="w-full bg-[#0b1329] border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0ea5e9]" placeholder="Ej: 500000" />
          </div>
        </div>
      </div>

      {/* HOJA A4 PARA IMPRIMIR (Visible siempre, se aísla al imprimir) */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white p-[20mm] shadow-2xl print:shadow-none print:p-0 print:m-0">
        
        {/* Cabecera del Boleto */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Pfaffen Autos</h1>
            <p className="text-sm font-medium text-slate-600 mt-1">Concesionaria Oficial y Usados Seleccionados</p>
            <p className="text-xs text-slate-500">{auto.sucursales?.direccion || "Buenos Aires, Argentina"}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-widest border border-slate-300 px-4 py-2 rounded-lg">Boleto de Reserva</h2>
            <p className="text-sm text-slate-600 mt-3 font-medium">Fecha: <span className="font-bold text-slate-900">{fecha}</span></p>
            <p className="text-sm text-slate-600 mt-1 font-medium">Ref: <span className="font-bold text-slate-900">#RES-{auto.id.slice(0,6).toUpperCase()}</span></p>
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
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl grid grid-cols-2 gap-y-4 gap-x-8 my-6">
            <div><span className="text-xs text-slate-500 uppercase tracking-widest block">Marca y Modelo</span><strong className="text-base uppercase">{auto.marca} {auto.modelo}</strong></div>
            <div><span className="text-xs text-slate-500 uppercase tracking-widest block">Patente (Dominio)</span><strong className="text-base uppercase">{auto.patente || "A PATENTAR (0KM)"}</strong></div>
            <div><span className="text-xs text-slate-500 uppercase tracking-widest block">Año</span><strong className="text-base">{auto.anio}</strong></div>
            <div><span className="text-xs text-slate-500 uppercase tracking-widest block">Precio Total Publicado</span><strong className="text-base">$ {auto.precio_publicado_ars?.toLocaleString("es-AR")}</strong></div>
            <div><span className="text-xs text-slate-500 uppercase tracking-widest block">N° de Motor</span><strong className="text-base">{auto.numero_motor || "A verificar"}</strong></div>
            <div><span className="text-xs text-slate-500 uppercase tracking-widest block">N° de Chasis</span><strong className="text-base">{auto.numero_chasis || "A verificar"}</strong></div>
          </div>

          <p>
            El saldo restante deberá ser abonado dentro de los próximos <strong>siete (7) días hábiles</strong>. En caso de que El Comprador desistiera de la operación o no integrara el saldo en el plazo estipulado, perderá la suma entregada en este acto en concepto de indemnización, quedando La Agencia en libre disponibilidad del vehículo.
          </p>
          
          <p>
            El vehículo se entrega en el estado en que se encuentra y que El Comprador declara conocer y aceptar tras su revisión presencial, o sujeto a la entrega de la unidad 0km por parte de la terminal.
          </p>

          {/* Firmas */}
          <div className="grid grid-cols-2 gap-10 mt-24">
            <div className="text-center border-t border-slate-400 pt-3">
              <span className="block font-bold">Firma del Comprador</span>
              <span className="block text-xs text-slate-500 mt-1">Aclaración y DNI</span>
            </div>
            <div className="text-center border-t border-slate-400 pt-3">
              <span className="block font-bold">Firma por Pfaffen Autos</span>
              <span className="block text-xs text-slate-500 mt-1">Recibí conforme</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}