"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save } from "lucide-react";
import { inputClass, labelClass, fmt, CATEGORIAS_MOVIMIENTO } from "./shared";

export default function PresupuestoTab({ presupuestos, setPresupuestos, movimientos }: { presupuestos: any[]; setPresupuestos: (fn: any) => void; movimientos: any[] }) {
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [showNuevo, setShowNuevo] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [tipo, setTipo] = useState("egreso");
  const [moneda, setMoneda] = useState("USD");
  const [categoria, setCategoria] = useState("");
  const [monto, setMonto] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const delMes = presupuestos.filter((p) => p.mes.slice(0, 7) === mes);

  const consumoReal = (p: any) => {
    return movimientos
      .filter((m) => !m.deleted_at && m.estado === "aprobado" && m.tipo === p.tipo && m.cuenta?.moneda === p.moneda && (m.tipo_movimiento || "") === p.categoria && m.fecha.slice(0, 7) === mes)
      .reduce((acc, m) => acc + Number(m.monto), 0);
  };

  const abrirNuevo = () => { setEditando(null); setTipo("egreso"); setMoneda("USD"); setCategoria(""); setMonto(""); setNotas(""); setShowNuevo(true); };
  const abrirEditar = (p: any) => { setEditando(p); setTipo(p.tipo); setMoneda(p.moneda); setCategoria(p.categoria); setMonto(String(p.monto_presupuestado)); setNotas(p.notas || ""); setShowNuevo(true); };

  const guardar = async () => {
    if (!categoria || !monto) return alert("Completá categoría y monto.");
    setGuardando(true);
    try {
      const payload = { mes: `${mes}-01`, tipo, moneda, categoria, monto_presupuestado: Number(monto), notas: notas || null };
      if (editando) {
        const { data, error } = await supabase2.from("finanzas_presupuestos").update(payload).eq("id", editando.id).select().single();
        if (error) throw error;
        setPresupuestos((prev: any[]) => prev.map((p) => (p.id === editando.id ? data : p)));
      } else {
        const { data, error } = await supabase2.from("finanzas_presupuestos").upsert(payload, { onConflict: "mes,tipo,moneda,categoria" }).select().single();
        if (error) throw error;
        setPresupuestos((prev: any[]) => [...prev.filter((p) => p.id !== data.id), data]);
      }
      setShowNuevo(false);
    } catch (err: any) {
      alert(err.message || "No se pudo guardar el presupuesto.");
    } finally { setGuardando(false); }
  };

  const eliminar = async (p: any) => {
    if (!confirm(`¿Eliminar el presupuesto de "${p.categoria}"?`)) return;
    await supabase2.from("finanzas_presupuestos").delete().eq("id", p.id);
    setPresupuestos((prev: any[]) => prev.filter((x) => x.id !== p.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <label className="flex items-center gap-2 text-sm font-bold">📅 Mes: <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={inputClass + " w-auto"} /></label>
        <button onClick={abrirNuevo} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Nuevo Presupuesto</button>
      </div>

      {delMes.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin presupuestos para este mes</p></div>
      ) : (
        <div className="space-y-3">
          {delMes.map((p) => {
            const real = consumoReal(p);
            const pct = p.monto_presupuestado > 0 ? Math.min(100, Math.round((real / p.monto_presupuestado) * 100)) : 0;
            const excedido = real > p.monto_presupuestado;
            return (
              <div key={p.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div><p className="text-sm font-bold">{p.categoria}</p><p className="text-xs text-slate-400">{fmt(p.monto_presupuestado, p.moneda)} / mes presupuestado ({p.tipo})</p></div>
                  <div className="text-right"><p className={`text-lg font-black ${excedido ? "text-rose-500" : ""}`}>{fmt(real, p.moneda)}</p><p className={`text-xs ${excedido ? "text-rose-500" : "text-slate-400"}`}>{pct}% consumido</p></div>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-white/10 rounded-full mt-2 overflow-hidden"><div className={`h-full ${excedido ? "bg-rose-500" : "bg-rose-600"}`} style={{ width: `${pct}%` }} /></div>
                <div className="flex items-center gap-3 mt-2"><button onClick={() => abrirEditar(p)} className="text-[11px] font-bold text-rose-500">Editar</button><button onClick={() => eliminar(p)} className="text-[11px] font-bold text-rose-500">Eliminar</button></div>
              </div>
            );
          })}
        </div>
      )}

      {showNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevo(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">{editando ? "Editar presupuesto" : "Nuevo presupuesto"}</h3><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Definí cuánto querés gastar este mes en una categoría. El consumo real se calcula automáticamente desde Movimientos.</p>
            <div className="grid grid-cols-3 gap-2">
              <div><label className={labelClass}>Mes *</label><input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Tipo *</label><select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputClass} disabled={!!editando}><option value="egreso">Egreso</option><option value="ingreso">Ingreso</option></select></div>
              <div><label className={labelClass}>Moneda *</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass} disabled={!!editando}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
            </div>
            <label className={labelClass + " mt-3"}>Categoría *</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputClass} disabled={!!editando}><option value="">— Elegí una categoría —</option>{CATEGORIAS_MOVIMIENTO.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            <label className={labelClass + " mt-3"}>Monto presupuestado *</label>
            <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Ej: 50000" className={inputClass} />
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Observaciones — supuestos, plan de ajuste, etc." className={inputClass} />
            <p className="text-[10px] text-slate-400 mt-2">El consumo real se computa al vuelo a partir de los movimientos que comparten mes, categoría, moneda y tipo — no se persiste en este doc.</p>
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={guardar} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> {editando ? "Guardar" : "Crear presupuesto"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
