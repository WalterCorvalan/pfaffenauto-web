"use client";

import { useState, useEffect } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, Trash2 } from "lucide-react";
import { inputClass, labelClass } from "./shared";

const CATEGORIA_COLOR: Record<string, string> = {
  Familia: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300",
  Salud: "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300",
  Vacaciones: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300",
  Cumpleaños: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300",
  Personal: "bg-slate-100 dark:bg-white/10 text-slate-500",
  Otro: "bg-slate-100 dark:bg-white/10 text-slate-500",
};

export default function CalendarioTab({ miId, autoAbrir, onAutoAbierto }: { miId: string; autoAbrir?: boolean; onAutoAbierto?: () => void }) {
  const [eventos, setEventos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showNuevo, setShowNuevo] = useState(false);

  useEffect(() => { if (autoAbrir) { setShowNuevo(true); onAutoAbierto?.(); } }, [autoAbrir]);
  const [evento, setEvento] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [categoria, setCategoria] = useState("Personal");
  const [recordarAntes, setRecordarAntes] = useState("1 día antes");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    const { data } = await supabase2.from("espacio_eventos").select("*").eq("perfil_id", miId).order("fecha");
    setEventos(data || []);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, [miId]);

  const crear = async () => {
    if (!evento.trim() || !fecha) return alert("Completá evento y fecha.");
    setGuardando(true);
    try {
      const { data, error } = await supabase2.from("espacio_eventos").insert({ perfil_id: miId, evento: evento.trim(), fecha, hora: hora || null, categoria, recordar_antes: recordarAntes, notas: notas || null }).select().single();
      if (error) throw error;
      setEventos((prev) => [...prev, data].sort((a, b) => a.fecha.localeCompare(b.fecha)));
      setShowNuevo(false);
      setEvento(""); setFecha(""); setHora(""); setNotas("");
    } catch { alert("No se pudo crear el evento."); } finally { setGuardando(false); }
  };

  const eliminar = async (e: any) => {
    if (!confirm(`¿Eliminar "${e.evento}"?`)) return;
    await supabase2.from("espacio_eventos").delete().eq("id", e.id);
    setEventos((prev) => prev.filter((x) => x.id !== e.id));
  };

  const hoy = new Date().toISOString().slice(0, 10);
  const proximos = eventos.filter((e) => e.fecha >= hoy);
  if (cargando) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div><p className="text-lg font-bold">Mi calendario personal — {eventos.length} evento{eventos.length === 1 ? "" : "s"}</p><p className="text-xs text-slate-400">Eventos no laborales: cumpleaños familia, médico, vacaciones, eventos de los chicos...</p></div>
        <button onClick={() => setShowNuevo(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shrink-0"><Plus className="w-4 h-4" /> Nuevo evento</button>
      </div>

      {eventos.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin eventos cargados</p></div>
      ) : (
        <>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Próximos ({proximos.length})</p>
          {proximos.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Sin eventos próximos.</p>
          ) : (
            <div className="space-y-1.5">
              {proximos.map((e) => (
                <div key={e.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold flex items-center gap-1.5">{e.evento} <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${CATEGORIA_COLOR[e.categoria]}`}>{e.categoria}</span></p>
                    <p className="text-[11px] text-slate-400">{e.fecha}{e.hora ? ` ${e.hora}` : ""} · 🔔 {e.recordar_antes}</p>
                  </div>
                  <button onClick={() => eliminar(e)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevo(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Nuevo evento</h3><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Solo vos ves este evento — no aparece en el calendario compartido del CRM.</p>
            <label className={labelClass}>Evento *</label>
            <input value={evento} onChange={(e) => setEvento(e.target.value)} placeholder="Cumple Niki, Reumatólogo, Vacaciones..." className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Fecha *</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Hora (opcional)</label><input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Categoría</label><select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputClass}><option>Familia</option><option>Salud</option><option>Vacaciones</option><option>Cumpleaños</option><option>Personal</option><option>Otro</option></select></div>
              <div><label className={labelClass}>Recordar antes</label><select value={recordarAntes} onChange={(e) => setRecordarAntes(e.target.value)} className={inputClass}><option>El mismo día</option><option>1 día antes</option><option>3 días antes</option><option>1 semana antes</option></select></div>
            </div>
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Detalles, dirección, gente que va..." className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crear} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Crear</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
