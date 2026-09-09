"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, Trash2 } from "lucide-react";
import { inputClass, labelClass } from "./shared";

export default function GastosFijosTab({ miId, autoAbrir, onAutoAbierto }: { miId: string; autoAbrir?: boolean; onAutoAbierto?: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showNuevo, setShowNuevo] = useState(false);

  useEffect(() => { if (autoAbrir) { setShowNuevo(true); onAutoAbierto?.(); } }, [autoAbrir]);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [frecuencia, setFrecuencia] = useState("Mensual");
  const [diaDelMes, setDiaDelMes] = useState("");
  const [categoria, setCategoria] = useState("Otros");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    const { data } = await supabase2.from("espacio_gastos_fijos").select("*").eq("perfil_id", miId).order("created_at");
    setItems(data || []);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, [miId]);

  const crear = async () => {
    if (!concepto.trim() || !monto) return alert("Completá concepto y monto.");
    setGuardando(true);
    try {
      const { data, error } = await supabase2.from("espacio_gastos_fijos").insert({ perfil_id: miId, concepto: concepto.trim(), monto: Number(monto), moneda, frecuencia, dia_del_mes: diaDelMes ? Number(diaDelMes) : null, categoria, notas: notas || null }).select().single();
      if (error) throw error;
      setItems((prev) => [...prev, data]);
      setShowNuevo(false);
      setConcepto(""); setMonto(""); setDiaDelMes(""); setNotas("");
    } catch { alert("No se pudo crear el gasto fijo."); } finally { setGuardando(false); }
  };

  const eliminar = async (i: any) => {
    if (!confirm(`¿Eliminar "${i.concepto}"?`)) return;
    await supabase2.from("espacio_gastos_fijos").delete().eq("id", i.id);
    setItems((prev) => prev.filter((x) => x.id !== i.id));
  };

  const totalPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.moneda] = (map[i.moneda] || 0) + Number(i.monto); });
    return map;
  }, [items]);
  if (cargando) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div><p className="text-lg font-bold">Gastos fijos / Suscripciones — {items.length} items</p><p className="text-xs text-slate-400">Total cargado: {Object.keys(totalPorMoneda).length === 0 ? "—" : Object.entries(totalPorMoneda).map(([m, n]) => `${m === "ARS" ? "$" : "USD"} ${n.toLocaleString("es-AR")}`).join(" · ")}</p></div>
        <button onClick={() => setShowNuevo(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shrink-0"><Plus className="w-4 h-4" /> Nuevo gasto fijo</button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin gastos fijos cargados</p></div>
      ) : (
        <div className="space-y-1.5">
          {items.map((i) => (
            <div key={i.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
              <div><p className="text-sm font-bold">{i.concepto} <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded ml-1">{i.categoria}</span></p><p className="text-sm font-bold text-rose-600">{i.moneda === "ARS" ? "$" : "USD"} {Number(i.monto).toLocaleString("es-AR")} <span className="text-[11px] font-normal text-slate-400">{i.frecuencia.toLowerCase()}{i.dia_del_mes ? ` · día ${i.dia_del_mes}` : ""}</span></p></div>
              <div className="flex gap-1"><button onClick={() => eliminar(i)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button></div>
            </div>
          ))}
        </div>
      )}

      {showNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevo(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Nuevo gasto fijo</h3><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Suscripciones y gastos recurrentes — solo vos los ves.</p>
            <label className={labelClass}>Concepto *</label>
            <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Alquiler casa, Netflix, ABL..." className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Monto *</label><input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Moneda</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Frecuencia</label><select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} className={inputClass}><option>Mensual</option><option>Bimestral</option><option>Anual</option></select></div>
              <div><label className={labelClass}>Día del mes</label><input type="number" value={diaDelMes} onChange={(e) => setDiaDelMes(e.target.value)} placeholder="5" className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Categoría</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputClass}><option>Suscripciones</option><option>Vivienda</option><option>Servicios</option><option>Otros</option></select>
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Detalles adicionales..." className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crear} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Crear</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
