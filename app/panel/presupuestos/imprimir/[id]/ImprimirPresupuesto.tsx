"use client";

import { useState } from "react";
import { Printer, ArrowLeft, Share2, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { supabase2 } from "@/lib/supabase/client";
import { notificarRespuestaPrecio } from "@/lib/panel/notificaciones";
import ConfirmarPrecioEncargadoModal from "@/components/panel/ConfirmarPrecioEncargadoModal";

interface Branding {
  branding_nombre?: string | null; branding_domicilio?: string | null; branding_telefono?: string | null; branding_cuit?: string | null;
  branding_logo_url?: string | null; branding_email?: string | null; branding_web?: string | null; branding_ingresos_brutos?: string | null;
}

export default function ImprimirPresupuesto({ presupuesto: p, branding }: { presupuesto: any; branding?: Branding | null }) {
  const nombreEmpresa = branding?.branding_nombre || "Pfaffen Cars";
  const [precioConfirmado, setPrecioConfirmado] = useState(p.precio_confirmado);
  const [precioArs, setPrecioArs] = useState(p.precio_ars);
  const [precioUsd, setPrecioUsd] = useState(p.precio_usd);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const confirmarPrecio = async (nuevoArs: number | null, nuevoUsd: number | null) => {
    setConfirmando(true);
    const { error } = await supabase2.from("presupuestos").update({ precio_confirmado: true, precio_ars: nuevoArs, precio_usd: nuevoUsd }).eq("id", p.id);
    setConfirmando(false);
    if (error) return alert("No se pudo confirmar el precio.");

    const cambio = nuevoArs !== p.precio_ars || nuevoUsd !== p.precio_usd;
    const { data: { user } } = await supabase2.auth.getUser();
    const { data: perfil } = user ? await supabase2.from("perfiles").select("nombre").eq("id", user.id).maybeSingle() : { data: null };
    const nombreEncargado = perfil?.nombre || "El encargado";
    const formatMoneyLocal = (v: number | null) => (v ? `$ ${Number(v).toLocaleString("es-AR")}` : null);
    const precioTexto = [formatMoneyLocal(nuevoArs), nuevoUsd ? `US$ ${Number(nuevoUsd).toLocaleString("es-AR")}` : null].filter(Boolean).join(" / ");
    await notificarRespuestaPrecio(
      supabase2, p.vendedor_id,
      cambio ? `${nombreEncargado} corrigió el precio del Presupuesto N° ${p.numero}: ahora es ${precioTexto}.` : `${nombreEncargado} confirmó el precio del Presupuesto N° ${p.numero}: ${precioTexto}.`,
      `/panel/presupuestos/imprimir/${p.id}`,
      { categoriaNotif: "taller", modulo: "presupuestos" }
    );

    setPrecioArs(nuevoArs);
    setPrecioUsd(nuevoUsd);
    setPrecioConfirmado(true);
    setMostrarModal(false);
  };

  const vendedor = p.perfiles?.nombre || "Administración";
  const formatMoney = (val: number) => `$ ${Number(val || 0).toLocaleString("es-AR")}`;
  const fecha = p.fecha ? new Date(`${p.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—";
  const linkPublico = p.token_publico ? `${typeof window !== "undefined" ? window.location.origin : ""}/presupuestos/${p.token_publico}` : null;

  const compartir = () => {
    if (!linkPublico) return;
    navigator.clipboard.writeText(linkPublico);
    alert("Link copiado. Te va a llegar una notificación cuando el cliente lo abra.");
  };

  return (
    <div className="min-h-screen pb-20 text-slate-800 bg-[#F9FAFB] dark:bg-[#0A0A0A] print:bg-white print:pb-0 print:min-h-0 pt-8 print:pt-0 font-sans">
      <div className="print:hidden max-w-[210mm] mx-auto mb-8 bg-white dark:bg-[#141414] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/panel/presupuestos" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 p-2.5 rounded-lg border border-slate-200 dark:border-white/10"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Impresión de Presupuesto</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">N° {p.numero}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {precioConfirmado === false && (
            <button onClick={() => setMostrarModal(true)} className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl text-xs font-bold transition-colors"><AlertTriangle className="w-4 h-4" /> Precio a confirmar</button>
          )}
          {precioConfirmado === true && p.precio_confirmado === false && (
            <span className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2 rounded-xl text-xs font-bold"><CheckCircle2 className="w-4 h-4" /> Precio confirmado</span>
          )}
          {linkPublico && <button onClick={compartir} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm active:scale-95"><Share2 className="w-4 h-4" /> Compartir</button>}
          <button onClick={() => window.print()} className="bg-[#0145F2] hover:bg-[#0138c9] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm active:scale-95"><Printer className="w-4 h-4" /> Imprimir / PDF</button>
        </div>
      </div>

      {/* Mismo formato de membrete/recibo que Venta y Seña (ImprimirVenta.tsx,
          ImprimirSena.tsx) -- sin bloque de firma, porque un presupuesto no
          se firma, solo se cotiza. */}
      <div className="w-[210mm] max-w-[210mm] min-h-[297mm] print:min-h-0 mx-auto bg-white p-[12mm] pb-[14mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:m-0 text-[11px] leading-snug box-border">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2 mb-2.5">
          <div className="flex items-start gap-3">
            {branding?.branding_logo_url ? (
              <img src={branding.branding_logo_url} alt={nombreEmpresa} className="h-14 w-auto object-contain shrink-0" />
            ) : (
              <div className="relative shrink-0">
                <img src="/logo.png" alt={nombreEmpresa} className="h-8 w-auto object-contain" />
                <img src="/r.png" alt="Marca Registrada" className="absolute -top-1 -right-2 w-2 h-2 object-contain brightness-0 opacity-80" />
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
            <h2 className="text-[13px] font-black uppercase tracking-wide">PRESUPUESTO Nro. {p.numero}</h2>
            <p className="text-[10px] text-slate-600 mt-1">FECHA: {fecha}</p>
            {branding?.branding_cuit && <p className="text-[10px] text-slate-600">Cuit: {branding.branding_cuit}</p>}
            {branding?.branding_ingresos_brutos && <p className="text-[10px] text-slate-600">Ing. Brutos: {branding.branding_ingresos_brutos}</p>}
          </div>
        </div>

        <p className="italic mb-2">A continuación le brindamos la cotización solicitada por:</p>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-2.5">
          <div className="col-span-2 flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Apellido y Nombre</span><strong>{p.cliente_nombre || "—"}</strong></div>
        </div>

        <div className="space-y-1 mb-2.5">
          <div className="flex items-baseline gap-2 flex-wrap"><span className="w-64 shrink-0">Precio de Venta u$s:</span><strong className="text-[14px]">{precioUsd ? `u$s ${Number(precioUsd).toLocaleString("es-AR")}` : "—"}</strong></div>
          <div className="flex items-baseline gap-2 flex-wrap pt-1.5 border-t border-slate-900"><span className="w-64 shrink-0 font-bold">Precio de Venta $:</span><strong className="text-[15px]">{precioArs ? formatMoney(precioArs) : "A convenir"}</strong></div>
          {p.imprimir_en && <div className="flex items-baseline gap-2 flex-wrap"><span className="w-64 shrink-0">Imprimir en:</span><strong>{p.imprimir_en}</strong></div>}
        </div>

        <p className="mb-2.5 text-justify">
          Cotización correspondiente a un(a) <strong className="uppercase">{p.segmento || "vehículo"}</strong>, <strong className="uppercase">{p.dominio ? "usado" : "0KM"}</strong>, en las condiciones informadas por el cliente.
        </p>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-2.5">
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Segmento</span><strong>{p.segmento || "-"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Marca</span><strong>{p.marca}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Modelo</span><strong>{p.modelo}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Tipo</span><strong>{p.tipo || "-"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Dominio</span><strong className="uppercase">{p.dominio || "0KM"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Color</span><strong className="capitalize">{p.color || "-"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Año</span><strong>{p.modelo_anio || "-"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Kilómetros</span><strong>{p.kilometros?.toLocaleString("es-AR") || "-"}</strong></div>
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Combustible</span><strong>{p.combustible || "-"}</strong></div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 mb-2">
          <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Vendedor</span><strong>{vendedor}</strong></div>
          {branding?.branding_telefono && <div className="flex justify-between border-b border-dotted border-slate-300 pb-0.5"><span className="text-slate-500">Teléfono</span><strong>{branding.branding_telefono}</strong></div>}
        </div>

        {p.observaciones && (
          <div className="mb-4">
            <p className="text-slate-500 mb-1">Observaciones Adicionales:</p>
            <p className="text-[10px] font-bold text-slate-800 leading-snug whitespace-pre-wrap border-b border-dotted border-slate-300 pb-1">{p.observaciones}</p>
          </div>
        )}

        <p className="text-[9.5px] text-slate-700 leading-snug text-justify mb-2.5">
          El presente documento es de carácter meramente informativo y no constituye una reserva del vehículo ni congela el valor del mismo. El stock y los precios están sujetos a modificaciones sin previo aviso hasta la efectiva seña de la unidad.
        </p>
      </div>

      {mostrarModal && <ConfirmarPrecioEncargadoModal precioArsActual={precioArs} precioUsdActual={precioUsd} guardando={confirmando} onConfirmar={confirmarPrecio} onClose={() => setMostrarModal(false)} />}
    </div>
  );
}
