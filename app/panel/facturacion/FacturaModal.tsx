"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { X, Save, Loader2 } from "lucide-react";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0145F2] text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

const CATS = ["A", "B", "C", "Exenta"] as const;
const IVA_OPCIONES = [21, 10.5, 27, 0];

export interface VehiculoFactura {
  id: string; marca: string; modelo: string; anio: number | null; patente: string | null; estado: string; moneda_compra: string | null;
  facturado: boolean; factura_importe: number | null; factura_numero: string | null; factura_emisor: string | null; factura_archivo_url: string | null;
  factura_fecha: string | null; factura_tipo_comprobante: string | null; factura_iva_pct: number | null;
}

// Editor puntual de la facturación de un vehículo -- mismos campos que
// carga NuevoVehiculoModal.tsx en Stock, pero editable directo desde el
// módulo de Facturación sin tener que ir a Stock a buscarlo.
export default function FacturaModal({ vehiculo, onClose, onGuardado }: { vehiculo: VehiculoFactura; onClose: () => void; onGuardado: (v: VehiculoFactura) => void }) {
  const [facturado, setFacturado] = useState(vehiculo.facturado);
  const [importe, setImporte] = useState(vehiculo.factura_importe ? String(vehiculo.factura_importe) : "");
  const [numero, setNumero] = useState(vehiculo.factura_numero || "");
  const [emisor, setEmisor] = useState(vehiculo.factura_emisor || "");
  const [archivoUrl, setArchivoUrl] = useState(vehiculo.factura_archivo_url || "");
  const [fecha, setFecha] = useState(vehiculo.factura_fecha || "");
  const [tipoComprobante, setTipoComprobante] = useState(vehiculo.factura_tipo_comprobante || "");
  const [ivaPct, setIvaPct] = useState(vehiculo.factura_iva_pct != null ? String(vehiculo.factura_iva_pct) : "");
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const subirArchivo = async (file: File) => {
    setSubiendo(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("carpeta", "vehiculos");
      const res = await fetch("/api/panel/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error subiendo la factura");
      setArchivoUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la factura.");
    } finally {
      setSubiendo(false);
    }
  };

  const guardar = async () => {
    setGuardando(true);
    setError("");
    const payload = {
      facturado,
      factura_importe: facturado && importe ? Number(importe) : null,
      factura_numero: facturado ? (numero || null) : null,
      factura_emisor: facturado ? (emisor || null) : null,
      factura_archivo_url: facturado ? (archivoUrl || null) : null,
      factura_fecha: facturado ? (fecha || null) : null,
      factura_tipo_comprobante: facturado ? (tipoComprobante || null) : null,
      factura_iva_pct: facturado && ivaPct !== "" ? Number(ivaPct) : null,
    };
    const { data, error: dbError } = await supabase2.from("vehiculos").update(payload).eq("id", vehiculo.id).select("id, marca, modelo, anio, patente, estado, moneda_compra, facturado, factura_importe, factura_numero, factura_emisor, factura_archivo_url, factura_fecha, factura_tipo_comprobante, factura_iva_pct").single();
    setGuardando(false);
    if (dbError) return setError(dbError.message);
    onGuardado(data as VehiculoFactura);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start px-5 py-4 border-b border-slate-100 dark:border-white/10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Facturación</h2>
            <p className="text-xs text-slate-400">{vehiculo.marca} {vehiculo.modelo} {vehiculo.anio ? `(${vehiculo.anio})` : ""} {vehiculo.patente ? `· ${vehiculo.patente}` : ""}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={facturado} onChange={(e) => setFacturado(e.target.checked)} className="w-4 h-4 accent-[#0145F2]" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">¿Está facturado?</span>
          </label>

          {facturado && (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Importe de factura</label>
                <input type="text" inputMode="numeric" value={importe} onChange={(e) => setImporte(e.target.value.replace(/\D/g, ""))} placeholder="12000000" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>N° de factura</label>
                <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="0001-00012345" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Quién factura</label>
                <input type="text" value={emisor} onChange={(e) => setEmisor(e.target.value)} placeholder="Nombre o razón social" className={inputClass} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelClass}>Fecha</label>
                  <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Comprobante</label>
                  <select value={tipoComprobante} onChange={(e) => setTipoComprobante(e.target.value)} className={inputClass}>
                    <option value="">—</option>
                    {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>% IVA</label>
                  <select value={ivaPct} onChange={(e) => setIvaPct(e.target.value)} className={inputClass}>
                    <option value="">—</option>
                    {IVA_OPCIONES.map((v) => <option key={v} value={v}>{v}%</option>)}
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 -mt-1">Opcional. Si lo cargás, este vehículo aparece en Finanzas &gt; AFIP/IVA como crédito fiscal del período de la fecha de factura.</p>
              <div>
                <label className={labelClass}>Archivo de la factura</label>
                <div className="flex items-center gap-2">
                  <label className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer ${subiendo ? "opacity-60 pointer-events-none" : ""}`}>
                    {subiendo ? "Subiendo..." : "Adjuntar archivo"}
                    <input type="file" accept="image/*,.pdf" disabled={subiendo} className="hidden" onChange={(e) => e.target.files?.[0] && subirArchivo(e.target.files[0])} />
                  </label>
                  {archivoUrl && <a href={archivoUrl} target="_blank" rel="noreferrer" className="text-xs text-[#0145F2] hover:underline">Ver archivo</a>}
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-rose-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button>
            <button onClick={guardar} disabled={guardando || subiendo} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-lg disabled:opacity-50">
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
