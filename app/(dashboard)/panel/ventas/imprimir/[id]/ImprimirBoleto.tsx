"use client";

import { Printer, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

export default function ImprimirBoleto({ operacion }: { operacion: any }) {
  const auto = operacion.vehiculos;
  const cliente = operacion.clientes;
  const vendedor = operacion.perfiles?.nombre || "Administración";

  const handlePrint = () => {
    window.print();
  };

  // Dependiendo del tipo, cambia el título del PDF
  const tituloDocumento = 
    operacion.tipo_operacion === "Presupuesto" ? "Presupuesto Formal" :
    operacion.tipo_operacion === "Seña" ? "Recibo de Seña" :
    "Boleto de Compraventa";

  // Formateador de moneda
  const formatMoney = (val: number) => `$ ${Number(val || 0).toLocaleString("es-AR")}`;

  // Formateador de fecha argentina
  const fechaOperacion = new Date(operacion.fecha_venta).toLocaleDateString("es-AR", { timeZone: "UTC" });

  return (
    <div className="min-h-screen pb-20 text-slate-800 bg-[#0b1329] print:bg-white pt-8">
      
      {/* ================= PANEL DE CONTROL (Oculto al imprimir) ================= */}
      <div className="print:hidden max-w-[210mm] mx-auto mb-8 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 text-white shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/panel" className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2.5 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-serif text-[#0ea5e9]">Impresión de {operacion.tipo_operacion}</h2>
            <p className="text-xs text-slate-400 font-mono mt-1">Ref: OP-{operacion.id.split("-")[0].toUpperCase()}</p>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95"
        >
          <Printer className="w-4 h-4" /> Imprimir Documento
        </button>
      </div>

      {/* ================= HOJA A4 PARA IMPRIMIR ================= */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white p-[15mm] shadow-2xl print:shadow-none print:p-0 print:m-0">
        
        {/* CABECERA (Header) */}
        <div className="flex justify-between items-start border-b-[3px] border-slate-900 pb-5 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Pfaffen Autos</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Concesionaria Oficial y Usados Seleccionados</p>
            <p className="text-xs text-slate-500 mt-1">{auto?.sucursales?.direccion || "Buenos Aires, Argentina"}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-widest border border-slate-300 px-4 py-2 rounded-lg bg-slate-50">
              {tituloDocumento}
            </h2>
            <div className="mt-3 text-xs text-slate-600 font-medium space-y-1">
              <p>Fecha: <span className="font-bold text-slate-900">{fechaOperacion}</span></p>
              <p>Operación N°: <span className="font-mono font-bold text-slate-900">{operacion.id.split("-")[0].toUpperCase()}</span></p>
              <p>Vendedor: <span className="font-bold text-slate-900">{vendedor}</span></p>
            </div>
          </div>
        </div>

        {/* DATOS DEL CLIENTE */}
        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-3">Información del Cliente</h3>
          <div className="grid grid-cols-4 gap-y-3 gap-x-4 text-xs">
            <div className="col-span-2">
              <span className="text-slate-500 block">Apellido y Nombre:</span>
              <strong className="text-slate-900 text-sm">{cliente?.apellido}, {cliente?.nombre}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">D.N.I. / CUIT:</span>
              <strong className="text-slate-900 text-sm">{cliente?.dni || cliente?.cuit_cuil || "N/A"}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Teléfono Celular:</span>
              <strong className="text-slate-900">{cliente?.telefono_celular || "N/A"}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Domicilio:</span>
              <strong className="text-slate-900">{cliente?.calle} {cliente?.numero}, {cliente?.localidad} ({cliente?.provincia})</strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Correo Electrónico:</span>
              <strong className="text-slate-900">{cliente?.correo_electronico || "No registrado"}</strong>
            </div>
          </div>
        </div>

        {/* DATOS DEL VEHÍCULO */}
        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-3">Información del Vehículo</h3>
          <div className="grid grid-cols-4 gap-y-3 gap-x-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block mb-0.5">Dominio (Patente)</span>
              <strong className="text-sm font-black uppercase">{auto?.patente || "0KM - A PATENTAR"}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block mb-0.5">Marca y Modelo</span>
              <strong className="text-sm font-black uppercase">{auto?.marca} {auto?.modelo}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Año</span>
              <strong className="text-sm font-black">{auto?.anio}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Color</span>
              <strong className="text-slate-900 capitalize">{auto?.color || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Kilometraje</span>
              <strong className="text-slate-900">{auto?.kilometraje === 0 ? "0 KM" : `${auto?.kilometraje?.toLocaleString("es-AR")} KM`}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Nro. de Motor</span>
              <strong className="text-slate-900 font-mono uppercase">{auto?.numero_motor || "A verificar"}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Nro. de Chasis</span>
              <strong className="text-slate-900 font-mono uppercase">{auto?.numero_chasis || "A verificar"}</strong>
            </div>
          </div>
        </div>

        {/* LIQUIDACIÓN COMERCIAL (Dinámica) */}
        <div className="mb-6 flex gap-6">
          <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden">
            <h3 className="bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-slate-200">
              Liquidación Comercial
            </h3>
            <div className="p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Precio de Venta Vehículo:</span>
                <strong className="text-base">{formatMoney(operacion.precio_final_ars)}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Gastos de Patentamiento / Transferencia:</span>
                <strong>{formatMoney(operacion.gastos_transferencia)}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Seña / Anticipo / Permuta entregada:</span>
                <strong className="text-slate-900">- {formatMoney(operacion.seña_ars)}</strong>
              </div>
              
              {operacion.datos_prenda?.monto > 0 && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Financiación ({operacion.datos_prenda.banco} - {operacion.datos_prenda.cuotas} cuotas):</span>
                  <strong className="text-slate-900">- {formatMoney(operacion.datos_prenda.monto)}</strong>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-slate-300 pt-3 mt-3">
                <span className="font-bold text-sm">SALDO A ABONAR:</span>
                <strong className="text-xl font-black text-slate-900 bg-slate-100 px-3 py-1 rounded">
                  {formatMoney(operacion.saldo_pendiente)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* OBSERVACIONES Y TEXTO LEGAL */}
        <div className="mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-2">Observaciones y Condiciones</h3>
          <div className="text-xs text-slate-700 leading-relaxed text-justify space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            {operacion.observaciones ? (
              <p className="font-medium whitespace-pre-wrap uppercase text-[11px] mb-4 pb-4 border-b border-slate-200">
                {operacion.observaciones}
              </p>
            ) : null}

            {/* TEXTOS LEGALES CONDICIONALES */}
            {operacion.tipo_operacion === "Presupuesto" && (
              <p className="italic text-slate-500">
                El presente documento es de carácter meramente informativo y no constituye una reserva del vehículo ni congela el valor del mismo. El stock y los precios están sujetos a modificaciones sin previo aviso hasta la efectiva seña de la unidad.
              </p>
            )}

            {operacion.tipo_operacion === "Seña" && (
              <p>
                La suma entregada en este acto en concepto de <strong>SEÑA Y PRINCIPIO DE EJECUCIÓN DE COMPRA</strong> otorga a El Comprador el derecho a la reserva de la unidad. El saldo restante deberá ser abonado dentro de los próximos <strong>siete (7) días hábiles</strong>. En caso de que El Comprador desistiera de la operación o no integrara el saldo en el plazo estipulado, perderá la suma entregada en concepto de indemnización, quedando La Agencia en libre disponibilidad del vehículo.
              </p>
            )}

            {operacion.tipo_operacion === "Venta" && (
              <p>
                El vehículo objeto del presente Boleto de Compraventa se entrega en el estado en que se encuentra y que El Comprador declara conocer y aceptar de plena conformidad tras su revisión. La transferencia de la titularidad del dominio es obligatoria e ineludible.
              </p>
            )}
          </div>
        </div>

        {/* ESPACIO PARA FIRMAS */}
        <div className="grid grid-cols-2 gap-16 mt-20 px-8">
          <div className="text-center border-t border-slate-400 pt-3">
            <span className="block font-bold text-sm">Firma del Comprador</span>
            <span className="block text-xs text-slate-500 mt-1">Aclaración y DNI</span>
          </div>
          <div className="text-center border-t border-slate-400 pt-3">
            <span className="block font-bold text-sm">Por Pfaffen Autos</span>
            <span className="block text-xs text-slate-500 mt-1">{vendedor}</span>
          </div>
        </div>

      </div>
    </div>
  );
}