"use client";

import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { fmtFechaLocal } from "@/lib/panel/fechas";

interface Branding {
  branding_nombre?: string | null; branding_domicilio?: string | null; branding_telefono?: string | null; branding_cuit?: string | null;
  branding_logo_url?: string | null; branding_email?: string | null; branding_web?: string | null; branding_ingresos_brutos?: string | null;
}

const PLAZO_TRANSFERENCIA_DIAS = 15;

export default function ImprimirExpediente({
  expediente: e, branding, hitos, checklist, gastos, perfilMap, dias,
}: { expediente: any; branding?: Branding | null; hitos: any[]; checklist: any[]; gastos: any[]; perfilMap: Record<string, string>; dias: number }) {
  const nombreEmpresa = branding?.branding_nombre || "Pfaffen Autos";
  const v = e.venta || {};
  const demorado = dias > PLAZO_TRANSFERENCIA_DIAS;

  const fmtMoneda = (n: number, moneda: string) => `${moneda === "ARS" ? "$" : "US$"} ${Number(n || 0).toLocaleString("es-AR")}`;

  return (
    <div className="min-h-screen pb-20 text-slate-800 bg-[#F9FAFB] dark:bg-[#0A0A0A] print:bg-white print:pb-0 print:min-h-0 pt-8 print:pt-0 font-sans">
      <div className="print:hidden max-w-[210mm] mx-auto mb-8 bg-white dark:bg-[#141414] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/panel/expedientes" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 p-2.5 rounded-lg border border-slate-200 dark:border-white/10"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Vista Previa del Expediente</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{e.titulo || `EXP — ${v.vehiculo_marca || ""} ${v.vehiculo_modelo || ""}`}</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm active:scale-95"><Printer className="w-4 h-4" /> Imprimir / PDF</button>
      </div>

      <div className="w-[210mm] max-w-[210mm] min-h-[297mm] print:min-h-0 mx-auto bg-white p-[12mm] pb-[14mm] shadow-lg border border-slate-200 print:shadow-none print:border-none print:m-0 text-[11px] leading-snug box-border">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2 mb-3">
          <div className="flex items-start gap-3">
            {branding?.branding_logo_url ? <img src={branding.branding_logo_url} alt={nombreEmpresa} className="h-14 w-auto object-contain shrink-0" /> : null}
            <div>
              <p className="font-black text-base">{nombreEmpresa}</p>
              {branding?.branding_domicilio && <p className="text-[10px] text-slate-500">{branding.branding_domicilio}</p>}
              {branding?.branding_cuit && <p className="text-[10px] text-slate-500">CUIT {branding.branding_cuit}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="font-black text-sm">Expediente de transferencia</p>
            <p className="text-[10px] text-slate-500">Apertura: {fmtFechaLocal(e.fecha_apertura || e.created_at)}</p>
            {e.vencimiento && <p className="text-[10px] text-slate-500">Vencimiento: {fmtFechaLocal(e.vencimiento)}</p>}
          </div>
        </div>

        {demorado && (
          <div className="border border-rose-300 bg-rose-50 rounded-lg px-3 py-2 mb-3">
            <p className="font-bold text-rose-700">⚠ Demorado — {dias}d (+{dias - PLAZO_TRANSFERENCIA_DIAS}d sobre el plazo de {PLAZO_TRANSFERENCIA_DIAS}d)</p>
            {e.motivo_demora && <p className="text-rose-700/80 mt-0.5">{e.motivo_demora}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="font-black uppercase text-[10px] text-slate-400 mb-1.5">Vehículo</p>
            <p className="font-bold">{v.vehiculo_marca} {v.vehiculo_modelo} {v.vehiculo_anio}</p>
            <p className="text-slate-500">Patente: {v.vehiculo_patente || "—"}</p>
          </div>
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="font-black uppercase text-[10px] text-slate-400 mb-1.5">Estado del trámite</p>
            <p className="font-bold">{e.estado === "cerrado" ? "Finalizado" : "En proceso"}</p>
            <p className="text-slate-500">Gestor asignado: {e.gestor_asignado_id ? perfilMap[e.gestor_asignado_id] || "—" : "—"}</p>
          </div>
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="font-black uppercase text-[10px] text-slate-400 mb-1.5">Parte vendedora</p>
            <p className="font-bold">{v.propietario_nombre || "—"}</p>
            <p className="text-slate-500">{e.confirmado_consignacion ? `✅ Confirmado${e.confirmado_consignacion_en ? " " + fmtFechaLocal(e.confirmado_consignacion_en) : ""}` : "⏳ Pendiente de confirmación"}</p>
          </div>
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="font-black uppercase text-[10px] text-slate-400 mb-1.5">Parte compradora</p>
            <p className="font-bold">{v.comprador_nombre || "—"}</p>
            <p className="text-slate-500">{e.confirmado_comprador ? `✅ Confirmado${e.confirmado_comprador_en ? " " + fmtFechaLocal(e.confirmado_comprador_en) : ""}` : "⏳ Pendiente de confirmación"}</p>
          </div>
        </div>

        {hitos.length > 0 && (
          <div className="mb-3">
            <p className="font-black uppercase text-[10px] text-slate-400 mb-1.5">Hitos de transferencia — {hitos.filter((h) => h.completado).length}/{hitos.length}</p>
            <div className="flex flex-wrap gap-1.5">
              {hitos.map((h) => (
                <span key={h.id} className={`px-2 py-1 rounded-full border text-[10px] font-bold ${h.completado ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                  {h.completado ? "✓" : "○"} {h.nombre}
                </span>
              ))}
            </div>
          </div>
        )}

        {checklist.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-3">
            {(["vendedora", "compradora"] as const).map((parte) => {
              const items = checklist.filter((c) => c.parte === parte);
              if (items.length === 0) return null;
              return (
                <div key={parte} className="border border-slate-200 rounded-lg p-3">
                  <p className="font-black uppercase text-[10px] text-slate-400 mb-1.5">Docs {parte === "vendedora" ? "vendedor" : "comprador"} — {items.filter((c) => c.completado).length}/{items.length}</p>
                  <ul>
                    {items.map((c) => <li key={c.id} className="text-slate-600">{c.completado ? "✓" : "○"} {c.nombre}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {gastos.length > 0 && (
          <div className="mb-3">
            <p className="font-black uppercase text-[10px] text-slate-400 mb-1.5">Gastos</p>
            <table className="w-full text-left">
              <thead><tr className="text-[9px] uppercase text-slate-400 border-b border-slate-200"><th className="py-1">Concepto</th><th className="py-1">A cargo de</th><th className="py-1 text-right">Monto</th></tr></thead>
              <tbody>
                {gastos.map((g) => (
                  <tr key={g.id} className="border-b border-slate-100">
                    <td className="py-1">{g.concepto}</td>
                    <td className="py-1 text-slate-500 capitalize">{g.a_cargo_de}</td>
                    <td className="py-1 text-right font-bold">{fmtMoneda(g.monto, g.moneda)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[9px] text-slate-400 mt-6 pt-2 border-t border-slate-200">Documento generado por el sistema de {nombreEmpresa} — {new Date().toLocaleDateString("es-AR")}.</p>
      </div>
    </div>
  );
}
