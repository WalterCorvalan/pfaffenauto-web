"use client";

import { useState } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import FirmaCanvas from "@/components/panel/FirmaCanvas";
import { simboloMoneda, type Moneda } from "@/lib/moneda";

interface Branding {
  branding_nombre?: string | null; branding_domicilio?: string | null; branding_telefono?: string | null; branding_cuit?: string | null;
  branding_logo_url?: string | null; branding_email?: string | null; branding_web?: string | null; branding_ingresos_brutos?: string | null;
}

const CONDICION_PAGO_LABEL: Record<string, string> = { inmediata: "Inmediata", "30_dias": "A 30 días", "45_dias": "A 45 días" };

export default function ImprimirMandato({ mandato: m, branding }: { mandato: any; branding?: Branding | null }) {
  const nombreEmpresa = branding?.branding_nombre || "Pfaffen Autos";
  const [firmaUrl, setFirmaUrl] = useState<string | null>(m.firma_url ?? null);
  const [firmaRetiroUrl, setFirmaRetiroUrl] = useState<string | null>(m.firma_retiro_url ?? null);

  const fecha = m.fecha ? new Date(`${m.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—";
  const moneda: Moneda = m.moneda === "ARS" ? "ARS" : "USD";
  const formatMoney = (val: number | null) => (val ? `${simboloMoneda(moneda)} ${Number(val).toLocaleString("es-AR")}` : "—");

  return (
    <div className="min-h-screen pb-20 text-slate-800 bg-[#F9FAFB] dark:bg-[#0A0A0A] print:bg-white print:pb-0 print:min-h-0 pt-8 print:pt-0 font-sans">
      <div className="print:hidden max-w-[210mm] mx-auto mb-8 bg-white dark:bg-[#141414] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/panel/stock" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 p-2.5 rounded-lg border border-slate-200 dark:border-white/10"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Mandato de Consignación</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{m.vehiculo_marca} {m.vehiculo_modelo} {m.vehiculo_anio}</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="bg-[#0145F2] hover:bg-[#0138c9] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm active:scale-95"><Printer className="w-4 h-4" /> Imprimir / PDF</button>
      </div>

      {/* Página 1: datos del mandato -- calcado del formulario de papel de
          talonario (mismo layout, tipografía serif formal, sin los datos
          fiscales del papel real porque este PDF no es un comprobante
          fiscal -- ver ARCHITECTURE.md de stock si existe una nota al respecto). */}
      <div className="w-[210mm] max-w-[210mm] min-h-[297mm] print:min-h-0 mx-auto bg-white p-[12mm] pb-[14mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:m-0 text-[11px] leading-snug box-border font-serif">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2 mb-3">
          <div className="flex items-start gap-3">
            {branding?.branding_logo_url ? (
              <img src={branding.branding_logo_url} alt={nombreEmpresa} className="h-14 w-auto object-contain shrink-0" />
            ) : (
              <img src="/logo.png" alt={nombreEmpresa} className="h-8 w-auto object-contain" />
            )}
            <div>
              <p className="text-[10px] text-slate-600">
                {branding?.branding_domicilio && <span className="block">{branding.branding_domicilio}</span>}
                {(branding?.branding_telefono || branding?.branding_email || branding?.branding_web) && (
                  <span className="block">{[branding?.branding_telefono, branding?.branding_email, branding?.branding_web].filter(Boolean).join(" / ")}</span>
                )}
              </p>
            </div>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase self-center">{nombreEmpresa}</h1>
          <div className="text-right shrink-0">
            <h2 className="text-[13px] font-black uppercase tracking-wide">MANDATO DE CONSIGNACIÓN</h2>
            <p className="text-[10px] text-slate-600 mt-1">FECHA: {fecha}</p>
            {branding?.branding_cuit && <p className="text-[10px] text-slate-600">Cuit: {branding.branding_cuit}</p>}
            {branding?.branding_ingresos_brutos && <p className="text-[10px] text-slate-600">Ing. Brutos: {branding.branding_ingresos_brutos}</p>}
          </div>
        </div>

        <p className="font-bold uppercase text-[10px] tracking-widest text-slate-500 mb-1.5">Mandante o Comitente</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-3">
          <div className="col-span-2 flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Apellido y Nombre</span><strong>{m.mandante_nombre}</strong></div>
          <div className="col-span-2 flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Domicilio</span><strong>{m.mandante_domicilio}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">CUIT/CUIL/DNI</span><strong>{m.mandante_dni_cuit || "—"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Tel.</span><strong>{m.mandante_telefono || "—"}</strong></div>
          <div className="col-span-2 flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">E-mail</span><strong>{m.mandante_email || "—"}</strong></div>
        </div>

        <p className="font-bold uppercase text-[10px] tracking-widest text-slate-500 mb-1.5">Identificación del automotor</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-3">
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Tipo</span><strong>{m.tipo_carroceria || "—"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Dominio</span><strong className="uppercase">{m.vehiculo_patente || "—"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Marca</span><strong>{m.vehiculo_marca}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Motor</span><strong className="font-mono">{m.motor_nro || "—"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Modelo</span><strong>{m.vehiculo_modelo}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Carrocería</span><strong>{m.tipo_carroceria || "—"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Año</span><strong>{m.vehiculo_anio}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Chasis/Cuadro</span><strong className="font-mono">{m.chasis_nro || "—"}</strong></div>
        </div>

        <div className="flex justify-between items-baseline border-b border-dotted border-slate-300 pb-1 mb-3">
          <span className="text-slate-500">Monto fijado para la venta</span>
          <strong className="text-[13px]">{formatMoney(m.valor)}</strong>
          <span className="text-slate-500">Menos la comisión del</span>
          <strong>{m.comision_pct != null ? `${m.comision_pct}%` : "—"}</strong>
        </div>

        {/* Compra asegurada — mismas 3 columnas de precio que trae el
            talonario de papel (Inmediata / A 30 días / A 45 días). Solo se
            completa la columna que corresponde a condicion_pago; el resto
            queda en blanco, igual que en el papel cuando no aplica esa
            modalidad. */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-slate-500">Compra asegurada</span>
          <span className={`w-5 h-5 flex items-center justify-center rounded border font-bold text-[10px] ${m.compra_asegurada === "si" ? "bg-emerald-50 border-emerald-500 border-2 text-emerald-700" : "border-slate-400"}`}>{m.compra_asegurada === "si" ? "SI" : ""}</span>
          <span className="text-slate-400">SI</span>
          <span className={`w-5 h-5 flex items-center justify-center rounded border font-bold text-[10px] ml-2 ${m.compra_asegurada === "no" ? "bg-rose-50 border-rose-500 border-2 text-rose-700" : "border-slate-400"}`}>{m.compra_asegurada === "no" ? "NO" : ""}</span>
          <span className="text-slate-400">NO</span>
        </div>
        <div className="grid grid-cols-3 gap-x-6 mb-3">
          {(["inmediata", "30_dias", "45_dias"] as const).map((key) => (
            <div key={key} className="flex justify-between border-b border-dotted border-slate-300 pb-0.5">
              <span className="text-slate-500">{CONDICION_PAGO_LABEL[key]} $</span>
              <strong>{m.compra_asegurada === "si" && m.condicion_pago === key ? formatMoney(m.monto_condicion_pago) : "—"}</strong>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-1.5">
          <span><span className="text-slate-500">Documentación 08 N°</span> <strong>{m.doc_08_nro || "—"}</strong></span>
          <span><span className="text-slate-500">V. Policial</span> <strong>{m.doc_verificacion_policial || "—"}</strong></span>
          <span><span className="text-slate-500">Título, Cédula, Deuda $</span> <strong>{m.doc_titulo_cedula_deuda != null ? Number(m.doc_titulo_cedula_deuda).toLocaleString("es-AR") : "—"}</strong></span>
        </div>
        <p className="mb-3">{m.doc_a_cargo_vendedor ? "a cargo del vendedor." : "a cargo de la agencia."}</p>

        <p className="text-[10px] text-slate-700 mb-4">El mandante será directamente responsable por cualquier vicio oculto que tuviera dicho vehículo.</p>

        <div className="grid grid-cols-2 gap-x-8 mb-4">
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Mandatario</span><strong>{m.mandatario}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Plazo</span><strong>{m.plazo_dias} días</strong></div>
        </div>

        {/* Firma | Aclaración | DNI, como en el formulario de papel -- los
            dos últimos ya se cargan en el modal "Nuevo mandato" (nombre y
            DNI/CUIT del mandante), no hace falta pedirlos de nuevo acá. */}
        <div className="grid grid-cols-3 gap-8 px-4 mt-10 break-inside-avoid">
          <div>
            <FirmaCanvas tabla="mandatos" id={m.id} firmaUrlActual={firmaUrl} onGuardada={setFirmaUrl} />
            <div className="text-center border-t border-slate-400 pt-1.5 mt-1"><span className="block text-[11px]">firma</span></div>
          </div>
          <div className="text-center">
            <div className="h-20 flex items-end justify-center pb-1"><span className="text-[11px] font-bold">{m.mandante_nombre}</span></div>
            <div className="border-t border-slate-400 pt-1.5"><span className="block text-[11px]">aclaración</span></div>
          </div>
          <div className="text-center">
            <div className="h-20 flex items-end justify-center pb-1"><span className="text-[11px] font-bold">{m.mandante_dni_cuit || "—"}</span></div>
            <div className="border-t border-slate-400 pt-1.5"><span className="block text-[11px]">DNI</span></div>
          </div>
        </div>
      </div>

      {/* Página 2: condiciones fijas del mandato (texto legal estático, igual para todos). */}
      <div className="w-[210mm] max-w-[210mm] min-h-[297mm] print:min-h-0 mx-auto bg-white p-[15mm] mt-6 print:mt-0 shadow-lg border border-slate-200 print:shadow-none print:border-none print:m-0 print:break-before-page text-[11px] leading-relaxed box-border">
        <h2 className="text-center font-black uppercase text-[13px] mb-6">Condiciones para el Mandato</h2>

        <p className="mb-3 text-justify">
          El mandante o comitente deberá abonar en el caso de que no lo traiga hecho los siguientes gastos al retirar su unidad o al ser vendida por {nombreEmpresa}: Lavado de motor y carrocería, pulido, limpieza de tapizados, publicaciones en Mercado Libre, Verificación Policial, VTV, GP 01, Gravado de Cristales, combustible, accesorios o repuestos, reparación de chapa pintura, descuento por oferta.
        </p>
        <p className="mb-3 text-justify">
          El Mandante o comitente deberá tener y entregar en el caso que se requiera la siguiente documentación: 08 firmado, verificación policial, libre de deuda de patentes, libre de deuda de infracciones mediante formulario 13, VTV vigente, gravado de partes, manuales y copia de llaves.
        </p>
        <p className="mb-3 text-justify">
          En el caso de que la unidad fuera vendida y surgiera algún inconveniente para la transferencia que impida continuar con la venta por parte del mandante o comitente, el mandante o comitente deberá abonar la comisión y gastos por la venta según boleto de seña.
        </p>
        <p className="mb-3 text-justify">
          En el caso de que el mandante o comitente desista la venta anticipadamente por cualquier motivo fuera, deberá abonar los gastos más una estadía diaria de $450 desde la fecha del mandato hasta el retiro de la unidad. Durante la vigencia de este mandato el comitente no podrá ofrecer la unidad bajo ningún medio gráfico, electrónico, etc., como tampoco ejecutar la venta de la unidad durante la misma vigencia.
        </p>
        <p className="mb-3 text-justify">
          En el caso de recibir un automóvil en permuta y/o parte de pago, {nombreEmpresa} deberá comprar dicha unidad y abonar al contado el total del vehículo en consignación salvo caso en el cual el mandante o comitente decida aceptar recibir una permuta para luego comercializarla, menos la comisión y gastos que pudieran corresponder.
        </p>
        <p className="mb-3 text-justify">
          En el caso de que la unidad se vendiera mediante un crédito prendario, el mandante o comitente deberá entregar toda la documentación para poder realizarse la transferencia de la unidad, ya que en este sistema de créditos se inscribe la transferencia y luego se presenta la documentación al banco para liquidar el saldo del crédito. {nombreEmpresa} tendrá 6 días hábiles a partir de la fecha de ingreso de la transferencia para abonar el total del auto al mandante o comitente, esto puede ser abonado en efectivo más una parte en cheque para cobrar en ventanilla, si el mandante o comitente no pudiera recibir los cheques correspondientes a la liquidación {nombreEmpresa} tendrá un plazo adicional de hasta 48hs hábiles para entregar el efectivo.
        </p>
        <p className="mb-3 text-justify">
          El valor de venta final puede variar si existiera una oferta por la parte compradora, y el mandante o comitente lo acepta.
        </p>
        <p className="mb-3 text-justify">
          El mandante o comitente tendrá responsabilidad sobre vicios que pudiera tener la unidad en consignación, ante un posible reclamo del comprador.
        </p>

        <p className="mt-10 font-bold">Recibí original del presente comprobante (firma del mandante o comitente):</p>
        <div className="mt-4 max-w-xs break-inside-avoid">
          <FirmaCanvas tabla="mandatos" id={m.id} firmaUrlActual={firmaRetiroUrl} onGuardada={setFirmaRetiroUrl} campo="firma_retiro_url" />
          <div className="text-center border-t border-slate-400 pt-1.5 mt-1"><span className="block text-[11px]">firma</span></div>
        </div>
      </div>
    </div>
  );
}
