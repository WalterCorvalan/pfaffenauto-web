"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2, ClipboardCheck } from "lucide-react";

interface Vehiculo { id: string; marca: string; modelo: string; anio: number }
interface Props { vehiculo: Vehiculo; miId: string; onClose: () => void }

const ITEMS_CHECKLIST: { campo: "mecanica" | "tren_delantero" | "frenos" | "chapa_pintura" | "interior"; label: string }[] = [
  { campo: "mecanica", label: "Mecánica" },
  { campo: "tren_delantero", label: "Tren delantero" },
  { campo: "frenos", label: "Frenos" },
  { campo: "chapa_pintura", label: "Chapa y pintura" },
  { campo: "interior", label: "Interior" },
];
const OPCIONES = [
  { value: "ok", label: "OK", color: "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300" },
  { value: "observacion", label: "Observación", color: "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300" },
  { value: "revisar", label: "A revisar", color: "bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300" },
];

export default function PeritajeModal({ vehiculo, miId, onClose }: Props) {
  const [checklist, setChecklist] = useState<Record<string, string>>({});
  const [gomas, setGomas] = useState("");
  const [service, setService] = useState("");
  const [llaves, setLlaves] = useState("");
  const [unicoDueno, setUnicoDueno] = useState(false);
  const [kmVerificado, setKmVerificado] = useState(false);
  const [docTitulo, setDocTitulo] = useState(false);
  const [docVtv, setDocVtv] = useState(false);
  const [docLibreDeuda, setDocLibreDeuda] = useState(false);
  const [docTransferible, setDocTransferible] = useState(false);
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    setError("");
    try {
      const { error: dbError } = await supabase2.from("peritajes").insert({
        vehiculo_id: vehiculo.id,
        mecanica: checklist.mecanica || null, tren_delantero: checklist.tren_delantero || null, frenos: checklist.frenos || null,
        chapa_pintura: checklist.chapa_pintura || null, interior: checklist.interior || null,
        gomas: gomas || null, service: service || null, llaves: llaves || null,
        unico_dueno: unicoDueno, km_verificado: kmVerificado,
        doc_titulo: docTitulo, doc_vtv: docVtv, doc_libre_deuda: docLibreDeuda, doc_transferible: docTransferible,
        notas: notas || null, firmado_por: miId || null,
      });
      if (dbError) throw dbError;
      setGuardado(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el peritaje.");
    } finally {
      setGuardando(false);
    }
  };

  const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !guardando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-rose-600" /> Peritaje</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4 mt-5">
          <div className="space-y-2.5">
            {ITEMS_CHECKLIST.map((item) => (
              <div key={item.campo} className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.label}</span>
                <div className="flex gap-1.5">
                  {OPCIONES.map((o) => (
                    <button key={o.value} type="button" onClick={() => setChecklist((prev) => ({ ...prev, [item.campo]: o.value }))} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${checklist[item.campo] === o.value ? o.color : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400"}`}>{o.label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelClass}>Gomas</label><input value={gomas} onChange={(e) => setGomas(e.target.value)} placeholder="Ej: 70%" className={inputClass} /></div>
            <div><label className={labelClass}>Service</label><input value={service} onChange={(e) => setService(e.target.value)} placeholder="Al día" className={inputClass} /></div>
            <div><label className={labelClass}>Llaves</label><input value={llaves} onChange={(e) => setLlaves(e.target.value)} placeholder="2 juegos" className={inputClass} /></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              ["Único dueño", unicoDueno, setUnicoDueno], ["KM verificado", kmVerificado, setKmVerificado],
              ["Título", docTitulo, setDocTitulo], ["VTV", docVtv, setDocVtv],
              ["Libre de deuda", docLibreDeuda, setDocLibreDeuda], ["Transferible", docTransferible, setDocTransferible],
            ].map(([label, val, setter]: any) => (
              <label key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-pointer">
                <input type="checkbox" checked={val} onChange={(e) => setter(e.target.checked)} className="w-4 h-4 accent-rose-600" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>
              </label>
            ))}
          </div>

          <div><label className={labelClass}>Notas</label><textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={`${inputClass} resize-none`} /></div>

          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>}
          {guardado && <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg px-3 py-2">Peritaje guardado, firmado a tu nombre.</p>}

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl">Cerrar</button>
            <button type="button" onClick={guardar} disabled={guardando || guardado} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50">
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar peritaje"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
