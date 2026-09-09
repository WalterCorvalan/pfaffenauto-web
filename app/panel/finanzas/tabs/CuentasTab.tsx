"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, Wallet, RotateCcw, GitCompare, Pencil } from "lucide-react";
import { inputClass, labelClass, fmt } from "./shared";

const emptyForm = { nombre: "", tipo: "Banco", moneda: "USD", saldoInicial: "0", entidad: "", numeroCuenta: "", notas: "", activa: true };

export default function CuentasTab({ cuentas, setCuentas, soyAdmin }: { cuentas: any[]; setCuentas: (fn: any) => void; soyAdmin: boolean }) {
  const [showNueva, setShowNueva] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [guardando, setGuardando] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [reseteando, setReseteando] = useState<any | null>(null);

  const abrirNueva = () => { setForm(emptyForm); setShowNueva(true); };
  const abrirEditar = (c: any) => {
    setForm({ nombre: c.nombre, tipo: c.tipo, moneda: c.moneda, saldoInicial: String(c.saldo_inicial), entidad: c.entidad || "", numeroCuenta: c.numero_cuenta || "", notas: c.notas || "", activa: c.activa });
    setEditando(c);
  };

  const crear = async () => {
    if (!form.nombre.trim()) return alert("Completá el nombre.");
    setGuardando(true);
    try {
      const { data, error } = await supabase2.from("cuentas").insert({
        nombre: form.nombre.trim(), tipo: form.tipo, moneda: form.moneda, saldo_inicial: Number(form.saldoInicial) || 0,
        entidad: form.entidad || null, numero_cuenta: form.numeroCuenta || null, notas: form.notas || null,
      }).select().single();
      if (error) throw error;
      setCuentas((prev: any[]) => [...prev, { ...data, saldo: Number(form.saldoInicial) || 0 }]);
      setShowNueva(false);
    } catch { alert("No se pudo crear la caja."); } finally { setGuardando(false); }
  };

  const guardarEdicion = async () => {
    if (!editando || !form.nombre.trim()) return alert("Completá el nombre.");
    setGuardando(true);
    try {
      const patch = {
        nombre: form.nombre.trim(), tipo: form.tipo, moneda: form.moneda, saldo_inicial: Number(form.saldoInicial) || 0,
        entidad: form.entidad || null, numero_cuenta: form.numeroCuenta || null, notas: form.notas || null, activa: form.activa,
      };
      const { error } = await supabase2.from("cuentas").update(patch).eq("id", editando.id);
      if (error) throw error;
      const { data: nuevoSaldo } = await supabase2.rpc("saldo_cuenta", { p_cuenta_id: editando.id });
      setCuentas((prev: any[]) => prev.map((c) => (c.id === editando.id ? { ...c, ...patch, saldo: Number(nuevoSaldo) || 0 } : c)).filter((c) => c.activa));
      setEditando(null);
    } catch { alert("No se pudo guardar."); } finally { setGuardando(false); }
  };

  const desactivar = async (c: any) => {
    if (!confirm(`¿Desactivar "${c.nombre}"? Deja de aparecer en los selectores, pero su historial queda.`)) return;
    await supabase2.from("cuentas").update({ activa: false }).eq("id", c.id);
    setCuentas((prev: any[]) => prev.filter((x) => x.id !== c.id));
  };

  const confirmarReset = async () => {
    if (!reseteando) return;
    setGuardando(true);
    try {
      const { error } = await supabase2.rpc("resetear_saldo_cuenta", { p_cuenta_id: reseteando.id });
      if (error) throw error;
      setCuentas((prev: any[]) => prev.map((c) => (c.id === reseteando.id ? { ...c, saldo_inicial: 0, saldo: c.saldo - c.saldo_inicial } : c)));
      setReseteando(null);
    } catch (err: any) {
      alert(err.message || "No se pudo resetear.");
    } finally { setGuardando(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-lg font-bold">Cuentas — {cuentas.length}</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDiff(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-white/10 rounded-lg"><GitCompare className="w-3.5 h-3.5" /> Ver diff</button>
          <button onClick={abrirNueva} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Nueva cuenta</button>
        </div>
      </div>

      {cuentas.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin cuentas</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cuentas.map((c) => (
            <div key={c.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-slate-400" /><div><p className="text-sm font-bold">{c.nombre}</p><p className="text-[11px] text-slate-400">{c.tipo} · {c.moneda}{c.entidad ? ` · ${c.entidad}` : ""}</p></div></div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => abrirEditar(c)} className="text-slate-400 hover:text-slate-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => desactivar(c)} className="text-[11px] font-bold text-rose-500">Desactivar</button>
                </div>
              </div>
              <p className="text-xl font-black mt-2">{fmt(c.saldo, c.moneda)}</p>
              <p className="text-[10px] text-slate-400">Saldo inicial: {fmt(c.saldo_inicial, c.moneda)}</p>
              {soyAdmin && <button onClick={() => setReseteando(c)} className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-500"><RotateCcw className="w-3 h-3" /> Resetear saldo</button>}
            </div>
          ))}
        </div>
      )}

      {(showNueva || editando) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setShowNueva(false); setEditando(null); }}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">{editando ? "Editar cuenta" : "Nueva cuenta"}</h3><button onClick={() => { setShowNueva(false); setEditando(null); }}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Creá una nueva caja, banco, tarjeta o billetera. Si arranca con un saldo, lo registramos como un movimiento "Saldo inicial" en el libro diario.</p>
            <label className={labelClass}>Nombre *</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Banco Galicia — Cta. Cte." className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Tipo *</label><select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inputClass}><option>Banco</option><option>Tarjeta</option><option>Efectivo</option><option>Otro</option></select></div>
              <div><label className={labelClass}>Moneda *</label><select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
            </div>
            <label className={labelClass + " mt-3"}>Saldo {editando ? "inicial" : "de apertura"}</label>
            <input type="number" value={form.saldoInicial} onChange={(e) => setForm({ ...form, saldoInicial: e.target.value })} className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Entidad (opcional)</label><input value={form.entidad} onChange={(e) => setForm({ ...form, entidad: e.target.value })} placeholder="Galicia, Mercado Pago, Visa..." className={inputClass} /></div>
              <div><label className={labelClass}>Número / CBU / Alias (opcional)</label><input value={form.numeroCuenta} onChange={(e) => setForm({ ...form, numeroCuenta: e.target.value })} placeholder="0001-23456-7" className={inputClass} /></div>
            </div>
            {editando && (
              <label className="flex items-center gap-2 mt-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} /> Cuenta activa
              </label>
            )}
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} className={inputClass} />
            <p className="text-[10px] text-slate-400 mt-2">{editando ? "Cambiar el saldo inicial acá corrige la contabilidad de la cuenta — usalo con cuidado." : 'El saldo de apertura queda asentado como un movimiento "Saldo inicial" en el libro diario. Después, los movimientos que elijan esta caja actualizan el saldo automáticamente.'}</p>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setShowNueva(false); setEditando(null); }} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button>
              <button onClick={editando ? guardarEdicion : crear} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> {editando ? "Guardar" : "Crear cuenta"}</button>
            </div>
          </div>
        </div>
      )}

      {showDiff && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowDiff(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-3"><h3 className="text-base font-bold">Conciliación</h3><button onClick={() => setShowDiff(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-3">En este sistema el saldo de cada cuenta NUNCA se guarda: se calcula en vivo como saldo inicial + movimientos aprobados cada vez que se muestra. Por diseño no existe un valor "cacheado" que pueda desincronizarse — así que acá nunca vas a ver una cuenta fuera de sync.</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Total cuentas</p><p className="text-lg font-black">{cuentas.length}</p></div>
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-emerald-600">En sync</p><p className="text-lg font-black">{cuentas.length}</p></div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-700 dark:text-emerald-300">✓ Todas las cuentas están al día. No hay nada para reconciliar.</div>
            <div className="flex justify-end mt-4"><button onClick={() => setShowDiff(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cerrar</button></div>
          </div>
        </div>
      )}

      {reseteando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setReseteando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <p className="text-xs text-slate-400 mb-4">Se resetea el saldo inicial de <b>{reseteando.nombre}</b>: {fmt(reseteando.saldo_inicial, reseteando.moneda)} → {fmt(0, reseteando.moneda)}. Usar SOLO si querés arrancar la contabilidad desde cero (típicamente después de borrar todos los movimientos). Reversible editando la cuenta.</p>
            <div className="flex justify-end gap-2"><button onClick={() => setReseteando(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={confirmarReset} disabled={guardando} className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50">Resetear saldo</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
