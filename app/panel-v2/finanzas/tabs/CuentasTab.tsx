"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, Wallet } from "lucide-react";
import { inputClass, labelClass, fmt } from "./shared";

export default function CuentasTab({ cuentas, setCuentas }: { cuentas: any[]; setCuentas: (fn: any) => void }) {
  const [showNueva, setShowNueva] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("Banco");
  const [moneda, setMoneda] = useState("USD");
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [guardando, setGuardando] = useState(false);

  const crear = async () => {
    if (!nombre.trim()) return alert("Completá el nombre.");
    setGuardando(true);
    try {
      const { data, error } = await supabase2.from("cuentas").insert({ nombre: nombre.trim(), tipo, moneda, saldo_inicial: Number(saldoInicial) || 0 }).select().single();
      if (error) throw error;
      setCuentas((prev: any[]) => [...prev, { ...data, saldo: Number(saldoInicial) || 0 }]);
      setShowNueva(false);
      setNombre(""); setSaldoInicial("0");
    } catch { alert("No se pudo crear la caja."); } finally { setGuardando(false); }
  };

  const desactivar = async (c: any) => {
    if (!confirm(`¿Desactivar "${c.nombre}"? Deja de aparecer en los selectores, pero su historial queda.`)) return;
    await supabase2.from("cuentas").update({ activa: false }).eq("id", c.id);
    setCuentas((prev: any[]) => prev.filter((x) => x.id !== c.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-lg font-bold">Cuentas — {cuentas.length}</p>
        <button onClick={() => setShowNueva(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Nueva cuenta</button>
      </div>

      {cuentas.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin cuentas</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cuentas.map((c) => (
            <div key={c.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-slate-400" /><div><p className="text-sm font-bold">{c.nombre}</p><p className="text-[11px] text-slate-400">{c.tipo} · {c.moneda}</p></div></div>
                <button onClick={() => desactivar(c)} className="text-[11px] font-bold text-rose-500">Desactivar</button>
              </div>
              <p className="text-xl font-black mt-2">{fmt(c.saldo, c.moneda)}</p>
              <p className="text-[10px] text-slate-400">Saldo inicial: {fmt(c.saldo_inicial, c.moneda)}</p>
            </div>
          ))}
        </div>
      )}

      {showNueva && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNueva(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-4"><h3 className="text-lg font-bold">Nueva cuenta</h3><button onClick={() => setShowNueva(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <label className={labelClass}>Nombre *</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Banco Galicia, Caja chica..." className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Tipo</label><select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputClass}><option>Banco</option><option>Tarjeta</option><option>Efectivo</option><option>Otro</option></select></div>
              <div><label className={labelClass}>Moneda</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
            </div>
            <label className={labelClass + " mt-3"}>Saldo inicial</label>
            <input type="number" value={saldoInicial} onChange={(e) => setSaldoInicial(e.target.value)} className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNueva(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crear} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Crear</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
