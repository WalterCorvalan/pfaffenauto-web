"use client";

import { useState, useEffect } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, Trash2, CheckCircle2, Circle } from "lucide-react";
import { inputClass, labelClass } from "./shared";

const PRIORIDAD_COLOR: Record<string, string> = { Baja: "bg-slate-100 dark:bg-white/10 text-slate-500", Media: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300", Alta: "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300" };

export default function PendientesTab({ miId, autoAbrir, onAutoAbierto }: { miId: string; autoAbrir?: boolean; onAutoAbierto?: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showNueva, setShowNueva] = useState(false);

  useEffect(() => { if (autoAbrir) { setShowNueva(true); onAutoAbierto?.(); } }, [autoAbrir]);
  const [titulo, setTitulo] = useState("");
  const [prioridad, setPrioridad] = useState("Media");
  const [vencimiento, setVencimiento] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    const { data } = await supabase2.from("espacio_pendientes").select("*").eq("perfil_id", miId).order("completada").order("vencimiento", { nullsFirst: false });
    setItems(data || []);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, [miId]);

  const crear = async () => {
    if (!titulo.trim()) return alert("Completá el título.");
    setGuardando(true);
    try {
      const { data, error } = await supabase2.from("espacio_pendientes").insert({ perfil_id: miId, titulo: titulo.trim(), prioridad, vencimiento: vencimiento || null, notas: notas || null }).select().single();
      if (error) throw error;
      setItems((prev) => [data, ...prev]);
      setShowNueva(false);
      setTitulo(""); setPrioridad("Media"); setVencimiento(""); setNotas("");
    } catch { alert("No se pudo crear la tarea."); } finally { setGuardando(false); }
  };

  const toggle = async (i: any) => {
    const nuevo = !i.completada;
    await supabase2.from("espacio_pendientes").update({ completada: nuevo }).eq("id", i.id);
    setItems((prev) => prev.map((x) => (x.id === i.id ? { ...x, completada: nuevo } : x)));
  };

  const eliminar = async (i: any) => {
    if (!confirm(`¿Eliminar "${i.titulo}"?`)) return;
    await supabase2.from("espacio_pendientes").delete().eq("id", i.id);
    setItems((prev) => prev.filter((x) => x.id !== i.id));
  };

  const sinCompletar = items.filter((i) => !i.completada).length;
  if (cargando) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-lg font-bold">Mis pendientes — {sinCompletar} sin completar</p>
        <button onClick={() => setShowNueva(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Nueva tarea</button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin pendientes</p></div>
      ) : (
        <div className="space-y-1.5">
          {items.map((i) => (
            <div key={i.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
              <button onClick={() => toggle(i)} className="shrink-0">{i.completada ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-300" />}</button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${i.completada ? "line-through text-slate-400" : ""}`}>{i.titulo} <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${PRIORIDAD_COLOR[i.prioridad]}`}>{i.prioridad}</span></p>
                {i.vencimiento && <p className="text-[11px] text-slate-400">Vence {i.vencimiento}</p>}
              </div>
              <button onClick={() => eliminar(i)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      {showNueva && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNueva(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Nueva tarea</h3><button onClick={() => setShowNueva(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Tu agenda personal — solo vos ves estas tareas.</p>
            <label className={labelClass}>Título *</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Llamar al contador, renovar registro..." className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Prioridad</label><select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} className={inputClass}><option>Baja</option><option>Media</option><option>Alta</option></select></div>
              <div><label className={labelClass}>Vencimiento</label><input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Detalles, contactos a llamar, recordatorios..." className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNueva(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crear} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Crear</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
