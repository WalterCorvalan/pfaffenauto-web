"use client";

import { useState } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase2 } from "@/lib/supabase2/client";
import FirmaCanvas from "@/components/panelV2/FirmaCanvas";
import { numeroALetras } from "@/lib/numeroALetras";

interface Branding {
  branding_nombre?: string | null; branding_domicilio?: string | null; branding_telefono?: string | null; branding_cuit?: string | null;
  branding_logo_url?: string | null; branding_email?: string | null; branding_web?: string | null; branding_ingresos_brutos?: string | null;
}

export default function ImprimirVenta({ venta: v, branding, senaPrevia }: { venta: any; branding?: Branding | null; senaPrevia: number }) {
  const nombreEmpresa = branding?.branding_nombre || "Pfaffen Autos";
  const [firmaUrl, setFirmaUrl] = useState<string | null>(v.firma_url ?? null);
  const [firmaVendedorUrl, setFirmaVendedorUrl] = useState<string | null>(v.firma_vendedor_url ?? null);
  const [observaciones, setObservaciones] = useState(v.notas || "");
  const [guardandoObs, setGuardandoObs] = useState(false);

  const guardarObservaciones = async () => {
    if (observaciones === (v.notas || "")) return;
    setGuardandoObs(true);
    await supabase2.from("ventas").update({ notas: observaciones }).eq("id", v.id);
    setGuardandoObs(false);
  };

  const vendedor = v.perfiles?.nombre || "Administración";
  const moneda = v.moneda_venta || "ARS";
  const simbolo = moneda === "ARS" ? "$" : "US$";
  const formatMoney = (val: number) => `${simbolo} ${Number(val || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })} .-`;
  const enLetras = (val: number) => (moneda === "ARS" ? `(${numeroALetras(Number(val || 0))})` : "");
  const fecha = v.fecha_cierre ? new Date(`${v.fecha_cierre}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—";
  const domicilioCliente = v.cliente ? [[v.cliente.calle, v.cliente.numero_calle].filter(Boolean).join(" ") + (v.cliente.depto ? ` Dto. ${v.cliente.depto}` : ""), v.cliente.localidad, v.cliente.provincia ? `(${v.cliente.provincia})` : ""].filter(Boolean).join(", ") : "";

  const precioVenta = Number(v.precio_venta || 0);
  const adicionalTransferencia = Number(v.extra_cobrado_moneda === moneda ? v.extra_cobrado_monto || 0 : 0);
  const saldoAbonar = Math.max(0, precioVenta + adicionalTransferencia - senaPrevia);
  const financiado = v.metodo_pago === "Financiado" && Number(v.monto_financiacion || 0) > 0;
  const remanente = financiado ? Number(v.monto_financiacion || 0) : 0;
  const efectivo = Math.max(0, saldoAbonar - remanente);
  const esUsado = v.vehiculo_condicion && v.vehiculo_condicion !== "0km";

  return (
    <div className="min-h-screen pb-20 text-slate-800 bg-[#F9FAFB] dark:bg-[#0A0A0A] print:bg-white print:pb-0 print:min-h-0 pt-8 print:pt-0 font-sans">
      <div className="print:hidden max-w-[210mm] mx-auto mb-8 bg-white dark:bg-[#141414] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/panel-v2/ventas" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 p-2.5 rounded-lg border border-slate-200 dark:border-white/10"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Vista Previa de la Venta</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">N° {v.numero}</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm active:scale-95"><Printer className="w-4 h-4" /> Imprimir / PDF</button>
      </div>

      {/* Calcado del recibo de venta tradicional (Softcars) -- mismo formato
          que el recibo de seña, con el bloque de montos y forma de pago
          propio de una venta cerrada (descuenta señas ya aplicadas). */}
      <div className="w-[210mm] max-w-[210mm] min-h-[297mm] print:min-h-0 mx-auto bg-white p-[12mm] pb-[28mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:m-0 text-[11px] leading-snug box-border">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2 mb-2.5">
          <div className="flex items-start gap-3">
            {branding?.branding_logo_url ? (
              <img src={branding.branding_logo_url} alt={nombreEmpresa} className="h-14 w-auto object-contain shrink-0" />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-lg shrink-0">
                {nombreEmpresa.slice(0, 2).toUpperCase()}
              </div>
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
            <h2 className="text-[13px] font-black uppercase tracking-wide">RECIBO de VENTA Nro. {v.numero}</h2>
            <p className="text-[10px] text-slate-600 mt-1">FECHA: {fecha}</p>
            {branding?.branding_cuit && <p className="text-[10px] text-slate-600">Cuit: {branding.branding_cuit}</p>}
            {branding?.branding_ingresos_brutos && <p className="text-[10px] text-slate-600">Ing. Brutos: {branding.branding_ingresos_brutos}</p>}
          </div>
        </div>

        <p className="italic mb-2">En el día de la fecha recibi(mos) de:</p>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-2.5">
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Apellido y Nombre</span><strong>{v.comprador_nombre || "—"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">DNI Nro.</span><strong>{v.comprador_dni || "N/A"}</strong></div>
          {domicilioCliente && <div className="col-span-2 flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">con Domicilio en</span><strong>{domicilioCliente}</strong></div>}
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Teléfono</span><strong>{v.comprador_telefono || "—"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Email</span><strong>{v.comprador_email || "—"}</strong></div>
          {v.cliente?.cuit_cuil && <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Cuit/Cuil</span><strong>{v.cliente.cuit_cuil}</strong></div>}
          {v.cliente?.estado_civil && <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Estado Civil</span><strong className="capitalize">{v.cliente.estado_civil}</strong></div>}
          {v.cliente?.profesion && <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Profesión</span><strong className="capitalize">{v.cliente.profesion}</strong></div>}
        </div>

        <div className="space-y-1 mb-2.5">
          <div className="flex items-baseline gap-2 flex-wrap"><span className="w-64 shrink-0">por un precio de venta establecido en:</span><strong className="text-[14px]">{formatMoney(precioVenta)}</strong><span className="text-slate-500 italic">{enLetras(precioVenta)}</span></div>
          <div className="flex items-baseline gap-2 flex-wrap"><span className="w-64 shrink-0">más un adicional por Transferencia y/o Patentamiento de:</span><strong className="text-[14px]">{formatMoney(adicionalTransferencia)}</strong><span className="text-slate-500 italic">{enLetras(adicionalTransferencia)}</span></div>
          {senaPrevia > 0 && (
            <div className="flex items-baseline gap-2 flex-wrap"><span className="w-64 shrink-0">descontando una Seña previamente abonada de:</span><strong className="text-[14px]">{formatMoney(senaPrevia)}</strong><span className="text-slate-500 italic">{enLetras(senaPrevia)}</span></div>
          )}
          <div className="flex items-baseline gap-2 flex-wrap pt-1.5 border-t border-slate-900"><span className="w-64 shrink-0 font-bold">resultando un <em>SALDO</em> a abonar de:</span><strong className="text-[15px]">{formatMoney(saldoAbonar)}</strong><span className="text-slate-500 italic">{enLetras(saldoAbonar)}</span></div>
        </div>

        <p className="mb-1">El mismo se cancela de la siguiente manera:</p>
        <div className="space-y-1 mb-2.5">
          <div className="flex items-baseline gap-2 flex-wrap"><span className="w-64 shrink-0">se recibe en efectivo:</span><strong className="text-[14px]">{formatMoney(efectivo)}</strong><span className="text-slate-500 italic">{enLetras(efectivo)}</span></div>
          <div className="flex items-baseline gap-2 flex-wrap"><span className="w-64 shrink-0">restando cancelar un remanente de:</span><strong className="text-[14px]">{formatMoney(remanente)}</strong><span className="text-slate-500 italic">{enLetras(remanente)}</span></div>
        </div>

        <p className="mb-2.5 text-justify">
          Establecidos como precio por la venta de un(a) <strong className="uppercase">{v.vehiculo?.segmento || "vehículo"}</strong>, <strong className="uppercase">{esUsado ? "usado" : "0KM"}</strong>, en las condiciones vistas y que se encuentra libre de todo gravamen y/o deudas nacionales, municipales o provinciales, el cual ha sido revisado y probado a su entera satisfacción, dejando constancia que en la fecha el comprador toma posesión del mismo de conformidad.
        </p>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-2.5">
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Segmento</span><strong>{v.vehiculo?.segmento || "-"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Marca</span><strong>{v.vehiculo_marca}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Modelo</span><strong>{v.vehiculo_modelo}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Tipo</span><strong>{v.vehiculo?.tipo || "-"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Motor Marca</span><strong>{v.vehiculo?.marca_motor || "-"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Número de Motor</span><strong className="font-mono">{v.vehiculo?.numero_motor || "A verificar"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Chasis Marca</span><strong>{v.vehiculo?.marca_chasis || "-"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Número de Chasis</span><strong className="font-mono">{v.vehiculo?.numero_chasis || "A verificar"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Dominio</span><strong className="uppercase">{v.vehiculo_patente || "0KM"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Color</span><strong className="capitalize">{v.vehiculo_color || "-"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Año</span><strong>{v.vehiculo_anio}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">de la Localidad de</span><strong>{v.vehiculo?.radicado_localidad || "-"}</strong></div>
        </div>

        <p className="text-[9.5px] text-slate-700 leading-snug text-justify mb-2.5">
          Estableciendo sintonía con el mercado de cambio de divisas, se le notifica al cliente que todos los billetes deben estar en buenas condiciones esto implica no tener manchas de humedad, roturas, sellos y queda terminantemente prohibida la recepción de billetes de denominación vieja (conocidos como cara chica). Por consiguiente los billetes que presenten alguno de estos síntomas se solicitará su reemplazo o bien se procederá a una quita del 6% de su valor.
        </p>

        <div className="grid grid-cols-2 gap-x-8 mb-2">
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Vendedor</span><strong>{vendedor}</strong></div>
          {branding?.branding_telefono && <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Teléfono</span><strong>{branding.branding_telefono}</strong></div>}
        </div>

        <div className="mb-4">
          <p className="text-slate-500 mb-1">Observaciones Adicionales:</p>
          <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} onBlur={guardarObservaciones} placeholder="Sin observaciones." rows={2} className="w-full text-[10px] font-bold text-slate-800 leading-snug bg-transparent outline-none focus:bg-slate-50 print:bg-transparent resize-none border-b border-dotted border-slate-300 pb-1" />
          {guardandoObs && <span className="text-[9px] text-slate-400 print:hidden">guardando...</span>}
        </div>

        <p className="text-[9.5px] text-slate-700 leading-snug text-justify mb-2.5">
          Muy señores míos: Por la presente ratifico lo que verbalmente les manifestara con respecto al vehículo que les vendí el día de hoy, cuyo vehículo no reconoce gravámen de ninguna naturaleza por prenda, embargo, depósito o préstamo, haciendo presente bajo juramento que me hago responsable civil y criminalmente por cualquier inconveniente que les impidiera disponer libremente del mismo, comprometiéndome a asumir la defensa pertinente para el caso de evicción.
        </p>

        <p className="text-[9.5px] text-slate-700 mb-4">
          De conformidad se firman dos ejemplares del mismo tenor y a un solo efecto, el día de la fecha: {fecha}
        </p>

        <div className="grid grid-cols-2 gap-16 px-4">
          <div>
            <FirmaCanvas tabla="ventas" id={v.id} firmaUrlActual={firmaUrl} onGuardada={setFirmaUrl} />
            <div className="text-center border-t border-slate-400 pt-1.5 mt-1"><span className="block text-[11px]">firma del comprador</span></div>
          </div>
          <div>
            <FirmaCanvas tabla="ventas" id={v.id} campo="firma_vendedor_url" firmaUrlActual={firmaVendedorUrl} onGuardada={setFirmaVendedorUrl} />
            <div className="text-center border-t border-slate-400 pt-1.5 mt-1"><span className="block text-[11px]">firma del vendedor</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
