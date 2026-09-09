"use client";

import { useState, useEffect } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, Trash2, Pencil } from "lucide-react";
import { inputClass, labelClass } from "./shared";

export default function MisAutosTab({ miId }: { miId: string }) {
  const [autos, setAutos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showNuevo, setShowNuevo] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [f, setF] = useState<any>({});
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    const { data } = await supabase2.from("espacio_autos_personales").select("*").eq("perfil_id", miId).order("created_at", { ascending: false });
    setAutos(data || []);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, [miId]);

  const abrirNuevo = () => { setEditando(null); setF({}); setShowNuevo(true); };
  const abrirEdicion = (a: any) => { setEditando(a); setF(a); setShowNuevo(true); };

  const guardar = async () => {
    if (!f.marca?.trim()) return alert("Completá al menos la marca.");
    setGuardando(true);
    try {
      const payload = {
        marca: f.marca.trim(), modelo: f.modelo || null, anio: f.anio ? Number(f.anio) : null, patente: f.patente || null,
        titular: f.titular || null, km: f.km ? Number(f.km) : null, valor_estimado_usd: f.valor_estimado_usd ? Number(f.valor_estimado_usd) : null,
        vence_vtv: f.vence_vtv || null, vence_seguro: f.vence_seguro || null, vence_patente: f.vence_patente || null,
        compania_seguro: f.compania_seguro || null, notas: f.notas || null,
      };
      if (editando) {
        const { data, error } = await supabase2.from("espacio_autos_personales").update(payload).eq("id", editando.id).select().single();
        if (error) throw error;
        setAutos((prev) => prev.map((a) => (a.id === editando.id ? data : a)));
      } else {
        const { data, error } = await supabase2.from("espacio_autos_personales").insert({ perfil_id: miId, ...payload }).select().single();
        if (error) throw error;
        setAutos((prev) => [data, ...prev]);
      }
      setShowNuevo(false);
    } catch { alert("No se pudo guardar."); } finally { setGuardando(false); }
  };

  const eliminar = async (a: any) => {
    if (!confirm(`¿Eliminar ${a.marca} ${a.modelo || ""}?`)) return;
    await supabase2.from("espacio_autos_personales").delete().eq("id", a.id);
    setAutos((prev) => prev.filter((x) => x.id !== a.id));
  };

  const valorTotal = autos.reduce((a, x) => a + Number(x.valor_estimado_usd || 0), 0);

  if (cargando) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div><p className="text-lg font-bold">Mis autos personales — {autos.length} registrado{autos.length === 1 ? "" : "s"}</p><p className="text-xs text-slate-400">Valor estimado total: USD {valorTotal.toLocaleString("es-AR")}</p></div>
        <button onClick={abrirNuevo} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shrink-0"><Plus className="w-4 h-4" /> Nuevo auto personal</button>
      </div>

      {autos.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin autos registrados</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {autos.map((a) => (
            <div key={a.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-sm font-bold">{a.marca} {a.modelo} {a.anio}</p>{a.patente && <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{a.patente}</span>}</div>
                <div className="flex gap-1 shrink-0"><button onClick={() => abrirEdicion(a)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => eliminar(a)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Titular: {a.titular || "—"} {a.km ? `· ${Number(a.km).toLocaleString("es-AR")} km` : ""} {a.valor_estimado_usd ? <span className="font-bold text-emerald-600">· USD {Number(a.valor_estimado_usd).toLocaleString("es-AR")}</span> : ""}</p>
              <p className="text-[11px] text-slate-400 mt-1">{a.vence_vtv && `VTV: ${a.vence_vtv}`} {a.vence_seguro && ` · Seguro: ${a.vence_seguro}${a.compania_seguro ? ` (${a.compania_seguro})` : ""}`} {a.vence_patente && ` · Patente: ${a.vence_patente}`}</p>
            </div>
          ))}
        </div>
      )}

      {showNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevo(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-end mb-1"><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Tus autos personales — separados del stock de la agencia.</p>
            <div className="grid grid-cols-3 gap-2">
              <div><label className={labelClass}>Marca *</label><input value={f.marca || ""} onChange={(e) => setF({ ...f, marca: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Modelo</label><input value={f.modelo || ""} onChange={(e) => setF({ ...f, modelo: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Año</label><input type="number" value={f.anio || ""} onChange={(e) => setF({ ...f, anio: e.target.value })} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>Patente</label><input value={f.patente || ""} onChange={(e) => setF({ ...f, patente: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Titular</label><input value={f.titular || ""} onChange={(e) => setF({ ...f, titular: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Kilómetros</label><input type="number" value={f.km || ""} onChange={(e) => setF({ ...f, km: e.target.value })} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Valor estimado (USD)</label>
            <input type="number" value={f.valor_estimado_usd || ""} onChange={(e) => setF({ ...f, valor_estimado_usd: e.target.value })} className={inputClass} />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>Vence VTV</label><input type="date" value={f.vence_vtv || ""} onChange={(e) => setF({ ...f, vence_vtv: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Vence Seguro</label><input type="date" value={f.vence_seguro || ""} onChange={(e) => setF({ ...f, vence_seguro: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Vence Patente (cuota)</label><input type="date" value={f.vence_patente || ""} onChange={(e) => setF({ ...f, vence_patente: e.target.value })} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Compañía Seguro</label>
            <input value={f.compania_seguro || ""} onChange={(e) => setF({ ...f, compania_seguro: e.target.value })} className={inputClass} />
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={f.notas || ""} onChange={(e) => setF({ ...f, notas: e.target.value })} rows={2} className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={guardar} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> {editando ? "Guardar cambios" : "Crear"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
