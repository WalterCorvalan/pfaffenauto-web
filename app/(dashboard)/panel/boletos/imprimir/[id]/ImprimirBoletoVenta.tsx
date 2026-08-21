"use client";

import { useState } from "react";
import { Printer, ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { notificarRespuestaPrecio } from "@/lib/notificaciones";
import ConfirmarPrecioEncargadoModal from "../../../ConfirmarPrecioEncargadoModal";
import FirmaCanvas from "../../../FirmaCanvas";

export default function ImprimirBoletoVenta({ boleto: b }: { boleto: any }) {
  const [precioConfirmado, setPrecioConfirmado] = useState(b.precio_confirmado);
  const [ventaArs, setVentaArs] = useState(b.venta_ars);
  const [ventaUsd, setVentaUsd] = useState(b.venta_usd);
  const [firmaUrl, setFirmaUrl] = useState(b.firma_url);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const confirmarPrecio = async (nuevoArs: number | null, nuevoUsd: number | null) => {
    setConfirmando(true);
    const { error } = await supabase
      .from("boletos_venta")
      .update({ precio_confirmado: true, venta_ars: nuevoArs, venta_usd: nuevoUsd })
      .eq("id", b.id);
    setConfirmando(false);
    if (error) return alert("No se pudo confirmar el precio.");

    const cambio = nuevoArs !== b.venta_ars || nuevoUsd !== b.venta_usd;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: perfil } = user ? await supabase.from("perfiles").select("nombre").eq("id", user.id).maybeSingle() : { data: null };
    const nombreEncargado = perfil?.nombre || "El encargado";
    const formatMoneyLocal = (v: number | null) => (v ? `$ ${Number(v).toLocaleString("es-AR")}` : null);
    const precioTexto = [formatMoneyLocal(nuevoArs), nuevoUsd ? `US$ ${Number(nuevoUsd).toLocaleString("es-AR")}` : null].filter(Boolean).join(" / ");
    await notificarRespuestaPrecio(
      supabase,
      b.vendedor_id,
      cambio
        ? `${nombreEncargado} corrigió el precio de la Venta N° ${b.numero}: ahora es ${precioTexto}.`
        : `${nombreEncargado} confirmó el precio de la Venta N° ${b.numero}: ${precioTexto}.`,
      `/panel/boletos/imprimir/${b.id}`,
      "boletos"
    );

    setVentaArs(nuevoArs);
    setVentaUsd(nuevoUsd);
    setPrecioConfirmado(true);
    setMostrarModal(false);
  };

  const vendedor = b.perfiles?.nombre || "Administración";
  const formatMoney = (val: number) => `$ ${Number(val || 0).toLocaleString("es-AR")}`;
  const fecha = b.fecha ? new Date(`${b.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—";
  const fechaNacimiento = b.fecha_nacimiento ? new Date(`${b.fecha_nacimiento}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "N/A";

  return (
    <div className="min-h-screen pb-20 text-slate-800 bg-[#F9FAFB] dark:bg-[#001233] print:bg-white pt-8 font-sans">
      <div className="print:hidden max-w-[210mm] mx-auto mb-8 bg-white dark:bg-[#001c55] p-6 rounded-2xl border border-slate-200 dark:border-[#0a2a6b] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/panel/boletos" className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-2.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Boleto de Compraventa</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">N° {b.numero}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {precioConfirmado === false && (
            <button
              onClick={() => setMostrarModal(true)}
              className="flex items-center gap-1.5 bg-amber-50 dark:bg-[#002a6e] hover:bg-amber-100 dark:hover:bg-[#0a2a6b] text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-[#0a2a6b] px-3 py-2 rounded-xl text-xs font-bold transition-colors"
              title="El vendedor no estaba seguro de este precio — clickeá para revisarlo"
            >
              <AlertTriangle className="w-4 h-4" /> Precio a confirmar
            </button>
          )}
          {precioConfirmado === true && b.precio_confirmado === false && (
            <span className="flex items-center gap-1.5 bg-emerald-50 dark:bg-[#002a6e] text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-[#0a2a6b] px-3 py-2 rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" /> Precio confirmado
            </span>
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
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">{b.sucursales?.nombre || "Casa Central"}</p>
            <p className="text-[11px] text-slate-500 mt-1">{b.sucursales?.direccion || "Buenos Aires, Argentina"}</p>
          </div>
          <div className="text-right">
            <h2 className="text-[15px] font-bold text-slate-800 uppercase tracking-widest border-2 border-slate-200 px-4 py-1.5 rounded-lg bg-slate-50">Boleto de Compraventa</h2>
            <div className="mt-3 text-[11px] text-slate-500 font-medium space-y-1 uppercase tracking-widest">
              <p>Número: <span className="font-mono font-bold text-slate-900">{b.numero}</span></p>
              <p>Fecha: <span className="font-bold text-slate-900">{fecha}</span></p>
              <p>Vendedor: <span className="font-bold text-slate-900">{vendedor}</span></p>
              {b.numero_sena && <p>N° de Seña: <span className="font-mono font-bold text-slate-900">{b.numero_sena}</span></p>}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-3">Información del Cliente</h3>
          <div className="grid grid-cols-4 gap-y-3 gap-x-4 text-xs">
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Apellido y Nombre</span>
              <strong className="text-slate-900 text-[13px]">{b.apellido}, {b.nombre}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">D.N.I.</span>
              <strong className="text-slate-900 text-[13px]">{b.dni || "N/A"}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Fecha de Nacimiento</span>
              <strong className="text-slate-900">{fechaNacimiento}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Cuit/Cuil</span>
              <strong className="text-slate-900">{b.cuit_cuil || "N/A"}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Domicilio</span>
              <strong className="text-slate-900">{b.calle} {b.numero_calle}{b.depto ? ` Dto. ${b.depto}` : ""}, {b.localidad} ({b.provincia}) {b.codigo_postal ? `- CP ${b.codigo_postal}` : ""}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Celular</span>
              <strong className="text-slate-900">{b.telefono_celular || "N/A"}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Teléfono de Línea</span>
              <strong className="text-slate-900">{b.telefono_linea || "N/A"}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Email</span>
              <strong className="text-slate-900">{b.correo_electronico || "No registrado"}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Estado Civil</span>
              <strong className="text-slate-900 capitalize">{b.estado_civil || "N/A"}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Profesión</span>
              <strong className="text-slate-900 capitalize">{b.profesion || "N/A"}</strong>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-3">Información del Vehículo</h3>
          <div className="grid grid-cols-4 gap-y-4 gap-x-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Dominio</span>
              <strong className="text-[14px] font-black uppercase">{b.dominio || "0KM"}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Marca y Modelo</span>
              <strong className="text-[14px] font-black uppercase">{b.marca} {b.modelo}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Año</span>
              <strong className="text-[14px] font-black">{b.modelo_anio}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Segmento</span>
              <strong className="text-slate-900 capitalize">{b.segmento || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Tipo</span>
              <strong className="text-slate-900 capitalize">{b.tipo || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Color</span>
              <strong className="text-slate-900 capitalize">{b.color || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Marca de Motor</span>
              <strong className="text-slate-900 uppercase">{b.marca_motor || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Nro. de Motor</span>
              <strong className="text-slate-900 font-mono uppercase">{b.numero_motor || "A verificar"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Marca de Chasis</span>
              <strong className="text-slate-900 uppercase">{b.marca_chasis || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Nro. de Chasis</span>
              <strong className="text-slate-900 font-mono uppercase">{b.numero_chasis || "A verificar"}</strong>
            </div>
          </div>
        </div>

        {b.cuenta_orden_apellido_nombre && (
          <div className="mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-3">Por Cuenta y Orden de</h3>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div><span className="text-slate-400 font-bold text-[9px] uppercase block">Apellido y Nombre</span><strong className="text-slate-900">{b.cuenta_orden_apellido_nombre}</strong></div>
              <div><span className="text-slate-400 font-bold text-[9px] uppercase block">DNI</span><strong className="text-slate-900">{b.cuenta_orden_dni}</strong></div>
              <div><span className="text-slate-400 font-bold text-[9px] uppercase block">Dirección</span><strong className="text-slate-900">{b.cuenta_orden_direccion}</strong></div>
            </div>
          </div>
        )}

        <div className="mb-6 flex gap-6">
          <div className="flex-1 border border-slate-300 rounded-xl overflow-hidden">
            <h3 className="bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-300">Datos Comerciales</h3>
            <div className="p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Venta:</span>
                <strong className="text-[14px]">{formatMoney(ventaArs)} {ventaUsd ? `/ US$ ${Number(ventaUsd).toLocaleString("es-AR")}` : ""}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Seña:</span>
                <strong className="text-slate-900">{formatMoney(b.sena_ars)} {b.sena_usd ? `/ US$ ${Number(b.sena_usd).toLocaleString("es-AR")}` : ""}</strong>
              </div>
              {!!b.tipo_cambio && (
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>Tipo de Cambio:</span>
                  <strong>$ {Number(b.tipo_cambio).toLocaleString("es-AR")}</strong>
                </div>
              )}
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Patentamiento / Transferencia:</span>
                <strong>{formatMoney(b.patentamiento_transferencia_ars)}</strong>
              </div>
            </div>
          </div>
        </div>

        {(b.efectivo_ars > 0 || b.efectivo_usd > 0 || b.permuta_vehiculo_id || b.remanente_ars > 0) && (
          <div className="mb-6 flex gap-6">
            <div className="flex-1 border border-slate-300 rounded-xl overflow-hidden">
              <h3 className="bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-300">Forma de Pago</h3>
              <div className="p-4 space-y-3 text-xs">
                {(b.efectivo_ars > 0 || b.efectivo_usd > 0) && (
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>En Efectivo:</span>
                    <strong className="text-slate-900">{formatMoney(b.efectivo_ars)} {b.efectivo_usd ? `/ US$ ${Number(b.efectivo_usd).toLocaleString("es-AR")}` : ""}</strong>
                  </div>
                )}
                {b.permuta_vehiculo && (
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Auto en Permuta:</span>
                    <strong className="text-slate-900">{b.permuta_vehiculo.marca} {b.permuta_vehiculo.modelo} {b.permuta_vehiculo.patente ? `(${b.permuta_vehiculo.patente})` : ""} — Tasado {formatMoney(b.permuta_tasado_ars)}</strong>
                  </div>
                )}
                <div className="flex justify-between items-center border-t-2 border-slate-900 pt-3 mt-3">
                  <span className="font-bold text-[13px] uppercase tracking-widest">Remanente:</span>
                  <strong className="text-[14px]">{formatMoney(b.remanente_ars)}</strong>
                </div>
                {b.cant_cuotas_remanente > 0 && (
                  <>
                    <div className="flex justify-between items-center text-slate-600 font-medium">
                      <span>Fecha 1ª Cuota:</span>
                      <strong className="text-slate-900">{b.fecha_primera_cuota_remanente ? new Date(`${b.fecha_primera_cuota_remanente}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "-"}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 font-medium">
                      <span>Cant. de Cuotas:</span>
                      <strong className="text-slate-900">{b.cant_cuotas_remanente}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 font-medium">
                      <span>Cuota:</span>
                      <strong className="text-slate-900">{formatMoney(b.cuota_remanente_ars)}</strong>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {(b.banco_prenda || b.prenda_monto > 0) && (
          <div className="mb-6 flex gap-6">
            <div className="flex-1 border border-slate-300 rounded-xl overflow-hidden">
              <h3 className="bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-300">Datos de Prenda</h3>
              <div className="p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>Banco de la Prenda:</span>
                  <strong className="text-slate-900">{b.banco_prenda || "-"}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>Prenda:</span>
                  <strong className="text-slate-900">{formatMoney(b.prenda_monto)}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>Cant. Cuotas Prenda:</span>
                  <strong className="text-slate-900">{b.cant_cuotas_prenda || "-"}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>Cuota de Prenda:</span>
                  <strong className="text-slate-900">{formatMoney(b.cuota_prenda_ars)}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600 font-medium">
                  <span>Seguro de Prenda:</span>
                  <strong className="text-slate-900">{formatMoney(b.seguro_prenda_ars)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 bg-slate-900 rounded-xl p-4 flex justify-between items-center">
          <span className="font-bold text-[13px] uppercase tracking-widest text-white">Saldo a Abonar:</span>
          <strong className="text-xl font-black text-white bg-white/10 px-3 py-1 rounded">
            {formatMoney(b.saldo_abonar_ars)} {b.saldo_abonar_usd ? `/ US$ ${Number(b.saldo_abonar_usd).toLocaleString("es-AR")}` : ""}
          </strong>
        </div>

        {b.seguro_compania && (
          <div className="mb-6 text-xs">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-2">Seguro</h3>
            <p className="text-slate-700">{b.seguro_compania} — {formatMoney(b.seguro_importe_mensual)}/mes</p>
          </div>
        )}

        {b.observaciones && (
          <div className="mb-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-2">Observaciones</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
              {b.observaciones}
            </p>
          </div>
        )}

        <p className="text-[11px] text-slate-600 leading-relaxed text-justify mb-10">
          El vehículo objeto del presente Boleto de Compraventa se entrega en el estado en que se encuentra y que El Comprador declara conocer y aceptar de plena conformidad tras su revisión. La transferencia de la titularidad del dominio es obligatoria e ineludible.
        </p>

        <div className="grid grid-cols-2 gap-16 mt-12 px-8">
          <div>
            <FirmaCanvas tabla="boletos_venta" id={b.id} firmaUrlActual={firmaUrl} onGuardada={setFirmaUrl} />
            <div className="text-center border-t border-slate-400 pt-3 mt-2">
              <span className="block font-bold text-sm">Firma Digital del Comprador</span>
              <span className="block text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Aclaración y DNI</span>
            </div>
          </div>
          <div className="text-center border-t border-slate-400 pt-3 self-end">
            <span className="block font-bold text-sm">Por Pfaffen Autos</span>
            <span className="block text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{vendedor}</span>
          </div>
        </div>
      </div>

      {mostrarModal && (
        <ConfirmarPrecioEncargadoModal
          precioArsActual={ventaArs}
          precioUsdActual={ventaUsd}
          guardando={confirmando}
          onConfirmar={confirmarPrecio}
          onClose={() => setMostrarModal(false)}
        />
      )}
    </div>
  );
}
