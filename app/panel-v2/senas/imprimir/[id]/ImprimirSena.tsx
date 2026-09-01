"use client";

import { useState } from "react";
import { Printer, ArrowLeft, AlertTriangle, CheckCircle2, Copy, Check } from "lucide-react";
import Link from "next/link";
import { supabase2 } from "@/lib/supabase2/client";
import { notificarRespuestaPrecio } from "@/lib/panelV2/notificaciones";
import ConfirmarPrecioEncargadoModal from "@/components/panelV2/ConfirmarPrecioEncargadoModal";
import FirmaCanvas from "@/components/panelV2/FirmaCanvas";

export default function ImprimirSena({ sena: s }: { sena: any }) {
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
  const formatMoney = (val: number) => `$ ${Number(val || 0).toLocaleString("es-AR")}`;
  const fecha = s.fecha ? new Date(`${s.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—";
  const fechaNacimiento = s.fecha_nacimiento ? new Date(`${s.fecha_nacimiento}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "N/A";

  return (
    <div className="min-h-screen pb-20 text-slate-800 bg-[#F9FAFB] dark:bg-[#0A0A0A] print:bg-white pt-8 font-sans">
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

      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white p-[15mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0">
        <div className="flex justify-between items-start border-b-[3px] border-slate-900 pb-5 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Pfaffen Autos</h1>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">{s.sucursales?.nombre || "Casa Central"}</p>
          </div>
          <div className="text-right">
            <h2 className="text-[15px] font-bold text-slate-800 uppercase tracking-widest border-2 border-slate-200 px-4 py-1.5 rounded-lg bg-slate-50">Recibo de Seña</h2>
            <div className="mt-3 text-[11px] text-slate-500 font-medium space-y-1 uppercase tracking-widest">
              <p>Número: <span className="font-mono font-bold text-slate-900">{s.numero}</span></p>
              <p>Fecha: <span className="font-bold text-slate-900">{fecha}</span></p>
              <p>Vendedor: <span className="font-bold text-slate-900">{vendedor}</span></p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-3">Información del Cliente</h3>
          <div className="grid grid-cols-4 gap-y-3 gap-x-4 text-xs">
            <div className="col-span-2"><span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Apellido y Nombre</span><strong className="text-slate-900 text-[13px]">{s.apellido}, {s.nombre}</strong></div>
            <div><span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">D.N.I.</span><strong className="text-slate-900 text-[13px]">{s.dni || "N/A"}</strong></div>
            <div><span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Fecha de Nacimiento</span><strong className="text-slate-900">{fechaNacimiento}</strong></div>
            <div><span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Cuit/Cuil</span><strong className="text-slate-900">{s.cuit_cuil || "N/A"}</strong></div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Domicilio</span>
              <strong className="text-slate-900">
                {[[s.calle, s.numero_calle].filter(Boolean).join(" ") + (s.depto ? ` Dto. ${s.depto}` : ""), s.localidad, s.provincia ? `(${s.provincia})` : "", s.codigo_postal ? `CP ${s.codigo_postal}` : ""].filter(Boolean).join(", ") || "N/A"}
              </strong>
            </div>
            <div><span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Celular</span><strong className="text-slate-900">{s.telefono_celular || "N/A"}</strong></div>
            <div><span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Teléfono de Línea</span><strong className="text-slate-900">{s.telefono_linea || "N/A"}</strong></div>
            <div className="col-span-2"><span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Email</span><strong className="text-slate-900">{s.correo_electronico || "No registrado"}</strong></div>
            <div><span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Estado Civil</span><strong className="text-slate-900 capitalize">{s.estado_civil || "N/A"}</strong></div>
            <div><span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">Profesión</span><strong className="text-slate-900 capitalize">{s.profesion || "N/A"}</strong></div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-3">Información del Vehículo</h3>
          <div className="grid grid-cols-4 gap-y-4 gap-x-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300">
            <div><span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Dominio</span><strong className="text-[14px] font-black uppercase">{s.dominio || "0KM"}</strong></div>
            <div className="col-span-2"><span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Marca y Modelo</span><strong className="text-[14px] font-black uppercase">{s.marca} {s.modelo}</strong></div>
            <div><span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Año</span><strong className="text-[14px] font-black">{s.modelo_anio}</strong></div>
            <div><span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Segmento</span><strong className="text-slate-900 capitalize">{s.segmento || "-"}</strong></div>
            <div><span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Tipo</span><strong className="text-slate-900 capitalize">{s.tipo || "-"}</strong></div>
            <div><span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Color</span><strong className="text-slate-900 capitalize">{s.color || "-"}</strong></div>
            <div><span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Marca de Motor</span><strong className="text-slate-900 uppercase">{s.marca_motor || "-"}</strong></div>
            <div><span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Nro. de Motor</span><strong className="text-slate-900 font-mono uppercase">{s.numero_motor || "A verificar"}</strong></div>
            <div><span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Marca de Chasis</span><strong className="text-slate-900 uppercase">{s.marca_chasis || "-"}</strong></div>
            <div><span className="text-slate-400 font-bold tracking-widest text-[9px] uppercase block mb-0.5">Nro. de Chasis</span><strong className="text-slate-900 font-mono uppercase">{s.numero_chasis || "A verificar"}</strong></div>
          </div>
        </div>

        <div className="mb-6 flex gap-6">
          <div className="flex-1 border border-slate-300 rounded-xl overflow-hidden">
            <h3 className="bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-300">Datos Comerciales</h3>
            <div className="p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Venta:</span><strong className="text-[14px]">{formatMoney(ventaArs)} {ventaUsd ? `/ US$ ${Number(ventaUsd).toLocaleString("es-AR")}` : ""}</strong></div>
              <div className="flex justify-between items-center border-t-2 border-slate-900 pt-3 mt-3">
                <span className="font-bold text-[13px] uppercase tracking-widest">SEÑA:</span>
                <strong className="text-xl font-black text-slate-900 bg-slate-100 px-3 py-1 rounded">{formatMoney(s.sena_ars)} {s.sena_usd ? `/ US$ ${Number(s.sena_usd).toLocaleString("es-AR")}` : ""}</strong>
              </div>
              {!!s.tipo_cambio && <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Tipo de Cambio:</span><strong className="text-[13px]">$ {Number(s.tipo_cambio).toLocaleString("es-AR")}</strong></div>}
              <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Patent. / Transf.:</span><strong className="text-[13px]">{formatMoney(s.patentamiento_transferencia_ars)}</strong></div>
            </div>
          </div>
        </div>

        {(s.efectivo_ars > 0 || s.efectivo_usd > 0 || s.permuta_vehiculo_id || s.remanente_ars > 0) && (
          <div className="mb-6 flex gap-6">
            <div className="flex-1 border border-slate-300 rounded-xl overflow-hidden">
              <h3 className="bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-300">Forma de Pago</h3>
              <div className="p-4 space-y-3 text-xs">
                {(s.efectivo_ars > 0 || s.efectivo_usd > 0) && <div className="flex justify-between items-center text-slate-600 font-medium"><span>En Efectivo:</span><strong className="text-slate-900">{formatMoney(s.efectivo_ars)} {s.efectivo_usd ? `/ US$ ${Number(s.efectivo_usd).toLocaleString("es-AR")}` : ""}</strong></div>}
                {s.permuta_vehiculo && <div className="flex justify-between items-center text-slate-600 font-medium"><span>Auto en Permuta:</span><strong className="text-slate-900">{s.permuta_vehiculo.marca} {s.permuta_vehiculo.modelo} {s.permuta_vehiculo.patente ? `(${s.permuta_vehiculo.patente})` : ""} — Tasado {formatMoney(s.permuta_tasado_ars)}</strong></div>}
                <div className="flex justify-between items-center border-t-2 border-slate-900 pt-3 mt-3"><span className="font-bold text-[13px] uppercase tracking-widest">Remanente:</span><strong className="text-[14px]">{formatMoney(s.remanente_ars)}</strong></div>
                {s.cant_cuotas_remanente > 0 && (
                  <>
                    <div className="flex justify-between items-center text-slate-600 font-medium"><span>Fecha 1ª Cuota:</span><strong className="text-slate-900">{s.fecha_primera_cuota_remanente ? new Date(`${s.fecha_primera_cuota_remanente}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "-"}</strong></div>
                    <div className="flex justify-between items-center text-slate-600 font-medium"><span>Cant. de Cuotas:</span><strong className="text-slate-900">{s.cant_cuotas_remanente}</strong></div>
                    <div className="flex justify-between items-center text-slate-600 font-medium"><span>Cuota:</span><strong className="text-slate-900">{formatMoney(s.cuota_remanente_ars)}</strong></div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {(s.banco_prenda || s.prenda_monto > 0) && (
          <div className="mb-6 flex gap-6">
            <div className="flex-1 border border-slate-300 rounded-xl overflow-hidden">
              <h3 className="bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-300">Datos de Prenda</h3>
              <div className="p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-600 font-medium"><span>Banco de la Prenda:</span><strong className="text-slate-900">{s.banco_prenda || "-"}</strong></div>
                <div className="flex justify-between items-center text-slate-600 font-medium"><span>Prenda:</span><strong className="text-slate-900">{formatMoney(s.prenda_monto)}</strong></div>
                <div className="flex justify-between items-center text-slate-600 font-medium"><span>Cant. Cuotas Prenda:</span><strong className="text-slate-900">{s.cant_cuotas_prenda || "-"}</strong></div>
                <div className="flex justify-between items-center text-slate-600 font-medium"><span>Cuota de Prenda:</span><strong className="text-slate-900">{formatMoney(s.cuota_prenda_ars)}</strong></div>
                <div className="flex justify-between items-center text-slate-600 font-medium"><span>Seguro de Prenda:</span><strong className="text-slate-900">{formatMoney(s.seguro_prenda_ars)}</strong></div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 bg-slate-900 rounded-xl p-4 flex justify-between items-center">
          <span className="font-bold text-[13px] uppercase tracking-widest text-white">Saldo a Abonar:</span>
          <strong className="text-xl font-black text-white bg-white/10 px-3 py-1 rounded">{formatMoney(s.saldo_abonar_ars)}</strong>
        </div>

        {s.seguro_compania && (
          <div className="mb-6 text-xs">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-2">Seguro</h3>
            <p className="text-slate-700">{s.seguro_compania} — {formatMoney(s.seguro_importe_mensual)}/mes</p>
          </div>
        )}

        <div className="mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-1 mb-2">Observaciones {guardandoObs && <span className="normal-case font-normal text-slate-400">(guardando...)</span>}</h3>
          <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} onBlur={guardarObservaciones} placeholder="Escribí acá cualquier observación adicional..." rows={3} className="w-full text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap font-bold uppercase bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-300 print:p-0 outline-none focus:border-rose-400 resize-none" />
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed text-justify mb-10">
          La suma entregada en este acto en concepto de <strong>SEÑA Y PRINCIPIO DE EJECUCIÓN DE COMPRA</strong> otorga a El Comprador el derecho a la reserva de la unidad. El saldo restante deberá ser abonado dentro de los próximos <strong>siete (7) días hábiles</strong>. En caso de que El Comprador desistiera de la operación o no integrara el saldo en el plazo estipulado, perderá la suma entregada en concepto de indemnización, quedando La Agencia en libre disponibilidad del vehículo.
        </p>

        <div className="grid grid-cols-2 gap-16 mt-12 px-8">
          <div>
            <FirmaCanvas tabla="senas" id={s.id} firmaUrlActual={firmaUrl} onGuardada={setFirmaUrl} />
            <div className="text-center border-t border-slate-400 pt-3 mt-2"><span className="block font-bold text-sm">Firma Digital del Comprador</span><span className="block text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Aclaración y DNI</span></div>
          </div>
          <div>
            <FirmaCanvas tabla="senas" id={s.id} campo="firma_vendedor_url" firmaUrlActual={firmaVendedorUrl} onGuardada={setFirmaVendedorUrl} />
            <div className="text-center border-t border-slate-400 pt-3 mt-2"><span className="block font-bold text-sm">Por Pfaffen Autos</span><span className="block text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{vendedor}</span></div>
          </div>
        </div>
      </div>

      {mostrarModal && <ConfirmarPrecioEncargadoModal precioArsActual={ventaArs} precioUsdActual={ventaUsd} guardando={confirmando} onConfirmar={confirmarPrecio} onClose={() => setMostrarModal(false)} />}
    </div>
  );
}
