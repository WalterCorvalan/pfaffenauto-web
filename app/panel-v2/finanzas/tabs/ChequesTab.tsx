"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save } from "lucide-react";
import { inputClass, labelClass, fmt, diasHasta } from "./shared";

const emptyForm = { tipo: "a_cobrar", formato: "fisico", librador: "", numero: "", banco: "", cuitCuil: "", monto: "", moneda: "ARS", estado: "pendiente", fechaEmision: "", fechaCobro: "", cajaBancoPropio: "", notas: "" };

export default function ChequesTab({ cheques, setCheques }: { cheques: any[]; setCheques: (fn: any) => void }) {
  const [sub, setSub] = useState<"a_cobrar" | "emitido">("a_cobrar");
  const [showNuevo, setShowNuevo] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [guardando, setGuardando] = useState(false);

  const lista = cheques.filter((c) => c.tipo === sub);
  const hoy = new Date().toISOString().slice(0, 10);
  const mesActual = new Date().toISOString().slice(0, 7);

  const stats = useMemo(() => {
    const esteMes = lista.filter((c) => c.estado === "pendiente" && c.fecha_cobro.slice(0, 7) === mesActual);
    const pendientes = lista.filter((c) => c.estado === "pendiente");
    const vencidos = pendientes.filter((c) => c.fecha_cobro < hoy);
    return { esteMes, pendientes, vencidos };
  }, [lista]);

  const abrir = () => { setForm({ ...emptyForm, tipo: sub, fechaCobro: hoy }); setShowNuevo(true); };

  const crear = async () => {
    if (!form.librador.trim() || !form.monto || !form.fechaCobro) return alert("Completá librador, monto y fecha de cobro.");
    setGuardando(true);
    try {
      const { data, error } = await supabase2.from("cheques").insert({
        tipo: form.tipo, formato: form.formato, librador: form.librador.trim(), numero: form.numero || null, banco: form.banco || null,
        cuit_cuil: form.cuitCuil || null, monto: Number(form.monto), moneda: form.moneda, estado: form.estado,
        fecha_emision: form.fechaEmision || null, fecha_cobro: form.fechaCobro, caja_banco_propio: form.cajaBancoPropio || null, notas: form.notas || null,
      }).select().single();
      if (error) throw error;
      setCheques((prev: any[]) => [data, ...prev]);
      setShowNuevo(false);
    } catch { alert("No se pudo registrar el cheque."); } finally { setGuardando(false); }
  };

  const cambiarEstado = async (c: any, estado: string) => {
    await supabase2.from("cheques").update({ estado }).eq("id", c.id);
    setCheques((prev: any[]) => prev.map((x) => (x.id === c.id ? { ...x, estado } : x)));
  };

  const eliminar = async (c: any) => {
    if (!confirm(`¿Eliminar el cheque de ${c.librador}?`)) return;
    await supabase2.from("cheques").delete().eq("id", c.id);
    setCheques((prev: any[]) => prev.filter((x) => x.id !== c.id));
  };

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <button onClick={() => setSub("a_cobrar")} className={`px-4 py-2 rounded-lg text-sm font-bold ${sub === "a_cobrar" ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>📥 A cobrar</button>
        <button onClick={() => setSub("emitido")} className={`px-4 py-2 rounded-lg text-sm font-bold ${sub === "emitido" ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>📤 Emitidos</button>
        <button onClick={abrir} className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Nuevo cheque</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">A cobrar/pagar este mes</p><p className="text-lg font-black">{stats.esteMes.length === 0 ? "—" : stats.esteMes.length}</p><p className="text-[10px] text-slate-400">cheques · {new Date().toLocaleDateString("es-AR", { month: "short", year: "numeric" })}</p></div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Total pendiente</p><p className="text-lg font-black">{stats.pendientes.length === 0 ? "—" : stats.pendientes.length}</p><p className="text-[10px] text-slate-400">todos los meses</p></div>
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-rose-500">Vencidos sin resolver</p><p className="text-lg font-black">{stats.vencidos.length === 0 ? "—" : stats.vencidos.length}</p></div>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center">
          <p className="text-sm font-bold">No hay cheques {sub === "a_cobrar" ? "a cobrar" : "emitidos"}</p>
          <p className="text-xs text-slate-400 mt-1">Registrá el primero con "Nuevo cheque".</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 dark:border-white/10 text-left text-slate-400"><th className="p-2.5">Fecha cobro</th><th className="p-2.5">N°</th><th className="p-2.5">Librador</th><th className="p-2.5">Monto</th><th className="p-2.5">Formato</th><th className="p-2.5">Estado</th><th className="p-2.5">Acciones</th></tr></thead>
            <tbody>
              {lista.map((c) => {
                const vencido = c.estado === "pendiente" && c.fecha_cobro < hoy;
                return (
                  <tr key={c.id} className="border-b border-slate-50 dark:border-white/5">
                    <td className="p-2.5">{c.fecha_cobro}{vencido && <span className="ml-1 text-rose-500 font-bold">vencido</span>}</td>
                    <td className="p-2.5 text-slate-400">{c.numero || "—"}</td>
                    <td className="p-2.5 font-bold">{c.librador}{c.banco ? <span className="text-slate-400 font-normal"> · {c.banco}</span> : ""}</td>
                    <td className="p-2.5 font-mono font-bold">{fmt(c.monto, c.moneda)}</td>
                    <td className="p-2.5 text-slate-400">{c.formato === "echeque" ? "ECHEQ" : "Físico"}</td>
                    <td className="p-2.5">
                      <select value={c.estado} onChange={(e) => cambiarEstado(c, e.target.value)} className="text-[10px] font-bold uppercase bg-transparent border border-slate-200 dark:border-white/10 rounded-md px-1.5 py-0.5">
                        <option value="pendiente">Pendiente</option><option value="depositado">Depositado</option><option value="cobrado">Cobrado</option><option value="rechazado">Rechazado</option><option value="endosado">Endosado</option>
                      </select>
                    </td>
                    <td className="p-2.5"><button onClick={() => eliminar(c)} className="text-rose-500 font-bold">Eliminar</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevo(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Nuevo cheque</h3><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Registro de cheque. No mueve saldos de cajas — sirve para llevar el control de vencimientos e importes.</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelClass}>Tipo de cheque *</label><select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inputClass}><option value="a_cobrar">A cobrar (lo recibo)</option><option value="emitido">Emitido (lo pago)</option></select></div>
              <div><label className={labelClass}>Formato</label><select value={form.formato} onChange={(e) => setForm({ ...form, formato: e.target.value })} className={inputClass}><option value="fisico">Físico</option><option value="echeque">ECHEQ</option></select></div>
            </div>
            <label className={labelClass + " mt-3"}>Librador (quién lo firmó) *</label>
            <input value={form.librador} onChange={(e) => setForm({ ...form, librador: e.target.value })} placeholder="Nombre / razón social del librador" className={inputClass} />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>N° de cheque</label><input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="Ej: 12345678" className={inputClass} /></div>
              <div><label className={labelClass}>Banco</label><input value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })} placeholder="Galicia, Nación..." className={inputClass} /></div>
              <div><label className={labelClass}>CUIT/CUIL</label><input value={form.cuitCuil} onChange={(e) => setForm({ ...form, cuitCuil: e.target.value })} placeholder="20-12345678-9" className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>Monto *</label><input type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Moneda *</label><select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })} className={inputClass}><option value="ARS">ARS</option><option value="USD">USD</option></select></div>
              <div><label className={labelClass}>Estado *</label><select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className={inputClass}><option value="pendiente">Pendiente</option><option value="depositado">Depositado</option><option value="cobrado">Cobrado</option><option value="rechazado">Rechazado</option><option value="endosado">Endosado</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Fecha de emisión</label><input type="date" value={form.fechaEmision} onChange={(e) => setForm({ ...form, fechaEmision: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>Fecha de cobro *</label><input type="date" value={form.fechaCobro} onChange={(e) => setForm({ ...form, fechaCobro: e.target.value })} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Caja / banco propio</label>
            <input value={form.cajaBancoPropio} onChange={(e) => setForm({ ...form, cajaBancoPropio: e.target.value })} placeholder="Dónde lo depositás/pagás" className={inputClass} />
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} placeholder="Detalle, operación vinculada, etc." className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crear} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Registrar cheque</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
