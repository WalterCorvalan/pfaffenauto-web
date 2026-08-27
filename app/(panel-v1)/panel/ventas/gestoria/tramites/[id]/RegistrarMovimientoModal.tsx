"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { X, Save, Loader2, Upload, Plus } from "lucide-react";

const CONCEPTOS = ["Honorarios", "Patente", "Infracción", "Transferencia", "Gasto extra", "Otro"];
const MEDIOS_PAGO = ["Efectivo", "Transferencia", "Depósito", "Tarjeta", "Pendiente"];

interface Props {
  tramiteId: string;
  vehiculoId: string;
  patente: string | null;
  clienteId: string | null;
}

export default function RegistrarMovimientoModal({ tramiteId, vehiculoId, patente, clienteId }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<"ingreso" | "egreso">("ingreso");
  const [concepto, setConcepto] = useState("Honorarios");
  const [monto, setMonto] = useState("");
  const [medioPago, setMedioPago] = useState("Efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const subirComprobante = async (file: File) => {
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-documento", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir el comprobante");
      setComprobanteUrl(data.publicUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al subir el comprobante.");
    } finally {
      setSubiendo(false);
    }
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) {
      alert("Cargá un monto válido.");
      return;
    }
    setGuardando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("movimientos_caja").insert({
        tramite_id: tramiteId,
        vehiculo_id: vehiculoId,
        patente,
        cliente_id: clienteId,
        tipo,
        tipo_movimiento: "Gestoría",
        concepto,
        monto: Number(monto),
        medio_pago: medioPago,
        comprobante_url: comprobanteUrl || null,
        observaciones: observaciones || null,
        vendedor_id: user?.id || null,
        fecha: new Date().toISOString().split("T")[0],
        aprobado: false,
      });
      if (error) throw error;
      setAbierto(false);
      setMonto("");
      setObservaciones("");
      setComprobanteUrl("");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("No se pudo registrar el movimiento.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Registrar movimiento
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !guardando && setAbierto(false)}></div>
          <div className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] w-full max-w-md rounded-2xl shadow-2xl p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registrar movimiento</h3>
              <button onClick={() => setAbierto(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => setTipo("ingreso")} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-xl border transition-colors ${tipo === "ingreso" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white dark:bg-[#00246b] border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400"}`}>Ingreso</button>
                <button type="button" onClick={() => setTipo("egreso")} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-xl border transition-colors ${tipo === "egreso" ? "bg-rose-600 border-rose-600 text-white" : "bg-white dark:bg-[#00246b] border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400"}`}>Egreso</button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Concepto</label>
                <select value={concepto} onChange={(e) => setConcepto(e.target.value)} className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white">
                  {CONCEPTOS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Monto</label>
                  <div className="flex items-center bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 focus-within:border-indigo-500 transition-colors">
                    <span className="text-slate-400 mr-2 font-bold">$</span>
                    <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" className="w-full bg-transparent py-2.5 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 font-mono" autoFocus />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Medio de pago</label>
                  <select value={medioPago} onChange={(e) => setMedioPago(e.target.value)} className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white">
                    {MEDIOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              {medioPago === "Pendiente" && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 -mt-2">Queda como pendiente de cobro hasta que se registre el pago real.</p>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Comprobante</label>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-[#0a2a6b] rounded-xl py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:border-indigo-300 transition-colors">
                  {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {comprobanteUrl ? "Comprobante cargado ✓" : subiendo ? "Subiendo..." : "Adjuntar foto o archivo"}
                  <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) subirComprobante(f); }} />
                </label>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Observación</label>
                <input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Opcional..." className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-[#0a2a6b] flex gap-3">
                <button type="button" onClick={() => setAbierto(false)} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-white dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#002a6e] text-slate-600 dark:text-slate-300 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={guardando || subiendo} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  {guardando ? "Guardando..." : <><Save className="w-3.5 h-3.5" /> Registrar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
