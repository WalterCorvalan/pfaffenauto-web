"use client";

import { useState } from "react";
import { Printer, ArrowLeft, AlertTriangle, CheckCircle2, Copy, Check } from "lucide-react";
import Link from "next/link";
import { supabase2 } from "@/lib/supabase2/client";
import { notificarRespuestaPrecio } from "@/lib/panelV2/notificaciones";
import ConfirmarPrecioEncargadoModal from "@/components/panelV2/ConfirmarPrecioEncargadoModal";
import FirmaCanvas from "@/components/panelV2/FirmaCanvas";
import { numeroALetras } from "@/lib/numeroALetras";

interface Branding {
  branding_nombre?: string | null; branding_domicilio?: string | null; branding_telefono?: string | null; branding_cuit?: string | null;
  branding_logo_url?: string | null; branding_email?: string | null; branding_web?: string | null; branding_ingresos_brutos?: string | null;
}

export default function ImprimirSena({ sena: s, branding }: { sena: any; branding?: Branding | null }) {
  const nombreEmpresa = branding?.branding_nombre || "Pfaffen Autos";
  const [precioConfirmado, setPrecioConfirmado] = useState(s.precio_confirmado);
  const [ventaArs, setVentaArs] = useState(s.venta_ars);
  const [ventaUsd, setVentaUsd] = useState(s.venta_usd);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [firmaUrl, setFirmaUrl] = useState<string | null>(s.firma_url ?? null);
  const [firmaVendedorUrl, setFirmaVendedorUrl] = useState<string | null>(s.firma_vendedor_url ?? null);
  const [observaciones, setObservaciones] = useState(s.notas || "");
  const [guardandoObs, setGuardandoObs] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const guardarObservaciones = async () => {
    if (observaciones === (s.notas || "")) return;
    setGuardandoObs(true);
    await supabase2.from("senas").update({ notas: observaciones }).eq("id", s.id);
    setGuardandoObs(false);
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(s.codigo_seguimiento);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  };

  const confirmarPrecio = async (nuevoArs: number | null, nuevoUsd: number | null) => {
    setConfirmando(true);
    const { error } = await supabase2.from("senas").update({ precio_confirmado: true, venta_ars: nuevoArs, venta_usd: nuevoUsd }).eq("id", s.id);
    setConfirmando(false);
    if (error) return alert("No se pudo confirmar el precio.");

    const cambio = nuevoArs !== s.venta_ars || nuevoUsd !== s.venta_usd;
    const { data: { user } } = await supabase2.auth.getUser();
    const { data: perfil } = user ? await supabase2.from("perfiles").select("nombre").eq("id", user.id).maybeSingle() : { data: null };
    const nombreEncargado = perfil?.nombre || "El encargado";
    const formatMoneyLocal = (v: number | null) => (v ? `$ ${Number(v).toLocaleString("es-AR")}` : null);
    const precioTexto = [formatMoneyLocal(nuevoArs), nuevoUsd ? `US$ ${Number(nuevoUsd).toLocaleString("es-AR")}` : null].filter(Boolean).join(" / ");
    await notificarRespuestaPrecio(
      supabase2, s.vendedor_id,
      cambio ? `${nombreEncargado} corrigió el precio de la Seña N° ${s.numero}: ahora es ${precioTexto}.` : `${nombreEncargado} confirmó el precio de la Seña N° ${s.numero}: ${precioTexto}.`,
      `/panel-v2/senas/imprimir/${s.id}`
    );

    setVentaArs(nuevoArs);
    setVentaUsd(nuevoUsd);
    setPrecioConfirmado(true);
    setMostrarModal(false);
  };

  const vendedor = s.perfiles?.nombre || "Administración";
  const formatMoney = (val: number) => `$ ${Number(val || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })} .-`;
  const enLetras = (val: number) => `(${numeroALetras(Number(val || 0))})`;
  const fecha = s.fecha ? new Date(`${s.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—";
  const fechaNacimiento = s.fecha_nacimiento ? new Date(`${s.fecha_nacimiento}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "N/A";
  const domicilioCliente = [[s.calle, s.numero_calle].filter(Boolean).join(" ") + (s.depto ? ` Dto. ${s.depto}` : ""), s.localidad, s.provincia ? `(${s.provincia})` : ""].filter(Boolean).join(", ");
  const adicionalTransferencia = Number(s.patentamiento_transferencia_ars || 0);
  const saldoAbonar = Number(s.saldo_abonar_ars || 0);

  return (
    <div className="min-h-screen pb-20 text-slate-800 bg-[#F9FAFB] dark:bg-[#0A0A0A] print:bg-white print:pb-0 print:min-h-0 pt-8 print:pt-0 font-sans">
      <div className="print:hidden max-w-[210mm] mx-auto mb-8 bg-white dark:bg-[#141414] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/panel-v2/senas" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 p-2.5 rounded-lg border border-slate-200 dark:border-white/10"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Vista Previa de la Seña</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">N° {s.numero}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {s.codigo_seguimiento && (
            <button onClick={copiarCodigo} className={`flex items-center gap-1.5 border px-3 py-2 rounded-xl text-xs font-bold font-mono transition-colors ${copiado ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20" : "bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"}`} title="Copiar código de seguimiento">
              {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copiado ? "Copiado" : s.codigo_seguimiento}
            </button>
          )}
          {precioConfirmado === false && (
            <button onClick={() => setMostrarModal(true)} className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl text-xs font-bold transition-colors" title="El vendedor no estaba seguro de este precio">
              <AlertTriangle className="w-4 h-4" /> Precio a confirmar
            </button>
          )}
          {precioConfirmado === true && s.precio_confirmado === false && (
            <span className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2 rounded-xl text-xs font-bold"><CheckCircle2 className="w-4 h-4" /> Precio confirmado</span>
          )}
          <button onClick={() => window.print()} className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm active:scale-95"><Printer className="w-4 h-4" /> Imprimir / PDF</button>
        </div>
      </div>

      {/* Calcado del recibo de seña tradicional (Softcars): membrete con logo,
          texto legal con montos en letras, ficha del vehículo en 2 columnas y
          firma digital dual al pie. */}
      <div className="w-[210mm] max-w-[210mm] min-h-[297mm] mx-auto bg-white p-[15mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:m-0 text-[12px] leading-snug box-border">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
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
            <h2 className="text-[13px] font-black uppercase tracking-wide">RECIBO de Seña Nro. {s.numero}</h2>
            <p className="text-[10px] text-slate-600 mt-1">FECHA: {fecha}</p>
            {branding?.branding_cuit && <p className="text-[10px] text-slate-600">Cuit: {branding.branding_cuit}</p>}
            {branding?.branding_ingresos_brutos && <p className="text-[10px] text-slate-600">Ing. Brutos: {branding.branding_ingresos_brutos}</p>}
          </div>
        </div>

        <p className="italic mb-3">En el día de la fecha recibi(mos) de:</p>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 mb-4">
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Apellido y Nombre</span><strong>{s.apellido}, {s.nombre}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">DNI Nro.</span><strong>{s.dni || "N/A"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Teléfono de Línea</span><strong>{s.telefono_linea || "—"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Teléfono Celular</span><strong>{s.telefono_celular || "—"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Email</span><strong>{s.correo_electronico || "—"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Cuit/Cuil</span><strong>{s.cuit_cuil || "N/A"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Estado Civil</span><strong className="capitalize">{s.estado_civil || "N/A"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Profesión</span><strong className="capitalize">{s.profesion || "N/A"}</strong></div>
          {domicilioCliente && <div className="col-span-2 flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Domicilio</span><strong>{domicilioCliente}</strong></div>}
        </div>

        <p className="mb-3">como reserva y ad referendum de la firma vendedora</p>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-baseline gap-2 flex-wrap"><span className="w-64 shrink-0">la Cantidad de:</span><strong className="text-[14px]">{formatMoney(s.sena_ars)}</strong><span className="text-slate-500 italic">{enLetras(s.sena_ars)}</span></div>
          <div className="flex items-baseline gap-2 flex-wrap"><span className="w-64 shrink-0">por un precio de venta establecido en:</span><strong className="text-[14px]">{formatMoney(ventaArs)}</strong><span className="text-slate-500 italic">{enLetras(ventaArs)}</span></div>
          <div className="flex items-baseline gap-2 flex-wrap"><span className="w-64 shrink-0">más un adicional por Transferencia y/o Patentamiento de:</span><strong className="text-[14px]">{formatMoney(adicionalTransferencia)}</strong><span className="text-slate-500 italic">{enLetras(adicionalTransferencia)}</span></div>
          <div className="flex items-baseline gap-2 flex-wrap pt-1.5 border-t border-slate-900"><span className="w-64 shrink-0 font-bold">Quedando un <em>Saldo</em> a abonar de:</span><strong className="text-[15px]">{formatMoney(saldoAbonar)}</strong><span className="text-slate-500 italic">{enLetras(saldoAbonar)}</span></div>
        </div>

        <p className="mb-4 text-justify">
          Establecidos como precio por la venta de un(a) <strong className="uppercase">{s.segmento || "vehículo"}</strong>, <strong className="uppercase">{Number(s.modelo_anio) >= new Date().getFullYear() ? "0KM" : "usado"}</strong>, en las condiciones vistas y que se encuentra libre de todo gravamen y/o deudas nacionales, municipales o provinciales, el cual ha sido revisado y probado a su entera satisfacción.
        </p>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 mb-4">
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Segmento</span><strong>{s.segmento || "-"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Marca</span><strong>{s.marca}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Modelo</span><strong>{s.modelo}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Tipo</span><strong>{s.tipo || "-"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Motor Marca</span><strong>{s.marca_motor || "-"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Número de Motor</span><strong className="font-mono">{s.numero_motor || "A verificar"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Chasis Marca</span><strong>{s.marca_chasis || "-"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Número de Chasis</span><strong className="font-mono">{s.numero_chasis || "A verificar"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Dominio</span><strong className="uppercase">{s.dominio || "0KM"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Color</span><strong className="capitalize">{s.color || "-"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Año</span><strong>{s.modelo_anio}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">de la Localidad de</span><strong>{s.localidad || s.sucursales?.nombre || "-"}</strong></div>
        </div>

        <p className="text-[10.5px] text-slate-700 leading-relaxed text-justify mb-1.5">
          El comprador deberá abonar el saldo de su compra en el domicilio del vendedor dentro de los ______ días a contar desde la fecha sin necesidad de ningún requerimiento.
        </p>
        <p className="text-[10.5px] text-slate-700 leading-relaxed text-justify mb-1.5">
          En el caso que el comprador no abonara el saldo de precio dentro del plazo establecido incurrirá en mora de pleno derecho por el mero vencimiento del plazo pactado y automáticamente sin necesidad de requerimiento alguno, el vendedor queda facultado para dar por rescindido sin más trámite el contrato, sin necesidad de intervención judicial alguna, quedando a su exclusivo beneficio la suma percibida como reserva. En las operaciones de créditos los gastos de Estampillado y Prenda son POR CUENTA EXCLUSIVA DEL COMPRADOR.
        </p>
        <p className="text-[10.5px] text-slate-700 leading-relaxed text-justify mb-1.5">
          Se deja constancia al día de la fecha y con conformidad de ambas partes, en caso que el dólar blue sufriese un incremento en su cotización superior al 1%, se realizará el ajuste pertinente en referencia a la cotización de dicha moneda al día de la seña.
        </p>
        <p className="text-[10.5px] text-slate-700 leading-relaxed text-justify mb-4">
          A su vez estableciendo sintonía con el mercado de cambio de divisas, se le notifica al cliente que todos los billetes deben estar en buenas condiciones esto implica no tener manchas de humedad, roturas, sellos y queda terminantemente prohibida la recepción de billetes de denominación vieja (conocidos como cara chica). Por consiguiente que los billetes que presenten alguno de estos síntomas se solicitará su reemplazo o bien se procederá a una quita del 6% de su valor.
        </p>

        {(s.efectivo_ars > 0 || s.efectivo_usd > 0 || s.permuta_vehiculo_id || s.remanente_ars > 0 || s.banco_prenda || s.prenda_monto > 0) && (
          <div className="mb-4 space-y-1.5">
            {(s.efectivo_ars > 0 || s.efectivo_usd > 0) && <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">En Efectivo</span><strong>{formatMoney(s.efectivo_ars)} {s.efectivo_usd ? `/ US$ ${Number(s.efectivo_usd).toLocaleString("es-AR")}` : ""}</strong></div>}
            {s.permuta_vehiculo && <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Auto en Permuta</span><strong>{s.permuta_vehiculo.marca} {s.permuta_vehiculo.modelo} {s.permuta_vehiculo.patente ? `(${s.permuta_vehiculo.patente})` : ""} — Tasado {formatMoney(s.permuta_tasado_ars)}</strong></div>}
            {s.remanente_ars > 0 && <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Remanente</span><strong>{formatMoney(s.remanente_ars)}</strong></div>}
            {s.cant_cuotas_remanente > 0 && (
              <>
                <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Fecha 1ª Cuota</span><strong>{s.fecha_primera_cuota_remanente ? new Date(`${s.fecha_primera_cuota_remanente}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "-"}</strong></div>
                <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Cant. de Cuotas / Cuota</span><strong>{s.cant_cuotas_remanente} de {formatMoney(s.cuota_remanente_ars)}</strong></div>
              </>
            )}
            {(s.banco_prenda || s.prenda_monto > 0) && (
              <>
                <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Banco de la Prenda</span><strong>{s.banco_prenda || "-"}</strong></div>
                <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Prenda</span><strong>{formatMoney(s.prenda_monto)}</strong></div>
                <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Cuotas / Cuota de Prenda</span><strong>{s.cant_cuotas_prenda || "-"} de {formatMoney(s.cuota_prenda_ars)}</strong></div>
                <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Seguro de Prenda</span><strong>{formatMoney(s.seguro_prenda_ars)}</strong></div>
              </>
            )}
            {s.seguro_compania && <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Seguro</span><strong>{s.seguro_compania} — {formatMoney(s.seguro_importe_mensual)}/mes</strong></div>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-8 mb-3">
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Vendedor</span><strong>{vendedor}</strong></div>
          {branding?.branding_telefono && <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Teléfono</span><strong>{branding.branding_telefono}</strong></div>}
        </div>

        <div className="mb-8">
          <p className="text-slate-500 mb-1">Observaciones Adicionales:</p>
          <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} onBlur={guardarObservaciones} placeholder="Sin observaciones." rows={2} className="w-full text-[11px] font-bold text-slate-800 leading-relaxed bg-transparent outline-none focus:bg-slate-50 print:bg-transparent resize-none border-b border-dotted border-slate-300 pb-1" />
          {guardandoObs && <span className="text-[9px] text-slate-400 print:hidden">guardando...</span>}
        </div>

        <p className="text-[10.5px] text-slate-700 mb-10">
          De conformidad se firman dos ejemplares del mismo tenor y a un solo efecto, el día de la fecha: {fecha}
        </p>

        <div className="grid grid-cols-2 gap-16 px-4">
          <div>
            <FirmaCanvas tabla="senas" id={s.id} firmaUrlActual={firmaUrl} onGuardada={setFirmaUrl} />
            <div className="text-center border-t border-slate-400 pt-1.5 mt-1"><span className="block text-[11px]">firma del comprador</span></div>
          </div>
          <div>
            <FirmaCanvas tabla="senas" id={s.id} campo="firma_vendedor_url" firmaUrlActual={firmaVendedorUrl} onGuardada={setFirmaVendedorUrl} />
            <div className="text-center border-t border-slate-400 pt-1.5 mt-1"><span className="block text-[11px]">firma del vendedor</span></div>
          </div>
        </div>
      </div>

      {mostrarModal && <ConfirmarPrecioEncargadoModal precioArsActual={ventaArs} precioUsdActual={ventaUsd} guardando={confirmando} onConfirmar={confirmarPrecio} onClose={() => setMostrarModal(false)} />}
    </div>
  );
}
