"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save } from "lucide-react";
import { inputClass, labelClass, fmt } from "./shared";

type Sub = "activos" | "devueltos" | "todos";

export default function PrestamosTab({
  prestamos, setPrestamos, cuentas, setCuentas, setMovimientos,
}: { prestamos: any[]; setPrestamos: (fn: any) => void; cuentas: any[]; setCuentas: (fn: any) => void; setMovimientos: (fn: any) => void }) {
  const [sub, setSub] = useState<Sub>("activos");
  const [showNuevo, setShowNuevo] = useState(false);
  const [persona, setPersona] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [cuentaId, setCuentaId] = useState("");
  const [devolucionEsperada, setDevolucionEsperada] = useState("");
  const [motivo, setMotivo] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [devolviendo, setDevolviendo] = useState<any | null>(null);
  const [dvCuentaId, setDvCuentaId] = useState("");

  const activos = prestamos.filter((p) => p.estado === "pendiente");
  const totalAdeudadoPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    activos.forEach((p) => { map[p.moneda] = (map[p.moneda] || 0) + Number(p.monto); });
    return map;
  }, [activos]);

  const lista = sub === "todos" ? prestamos : prestamos.filter((p) => (sub === "activos" ? p.estado === "pendiente" : p.estado === "devuelto"));

  const abrirNuevo = () => { setPersona(""); setMonto(""); setMoneda("USD"); setFecha(new Date().toISOString().slice(0, 10)); setCuentaId(""); setDevolucionEsperada(""); setMotivo(""); setNotas(""); setShowNuevo(true); };

  const registrar = async () => {
    if (!persona.trim() || !monto || !cuentaId) return alert("Completá persona, monto y caja.");
    setGuardando(true);
    try {
      const { data: id, error } = await supabase2.rpc("registrar_prestamo_otorgado", {
        p_persona: persona.trim(), p_monto: Number(monto), p_moneda: moneda, p_fecha: fecha, p_cuenta_id: cuentaId,
        p_devolucion_esperada: devolucionEsperada || null, p_motivo: motivo || null, p_notas: notas || null,
      });
      if (error) throw error;
      const { data: fresh } = await supabase2.from("prestamos_otorgados").select("*").eq("id", id).single();
      setPrestamos((prev: any[]) => [fresh, ...prev]);
      const [{ data: nuevoMov }, { data: nuevoSaldo }] = await Promise.all([
        supabase2.from("movimientos_caja").select("*, cuenta:cuentas(nombre, moneda)").eq("id", fresh.movimiento_id).single(),
        supabase2.rpc("saldo_cuenta", { p_cuenta_id: cuentaId }),
      ]);
      if (nuevoMov) setMovimientos((prev: any[]) => [nuevoMov, ...prev]);
      setCuentas((prev: any[]) => prev.map((c) => (c.id === cuentaId ? { ...c, saldo: Number(nuevoSaldo) || 0 } : c)));
      setShowNuevo(false);
    } catch (err: any) {
      alert(err.message || "No se pudo registrar el préstamo.");
    } finally { setGuardando(false); }
  };

  const abrirDevolucion = (p: any) => { setDevolviendo(p); setDvCuentaId(cuentas.find((c) => c.moneda === p.moneda)?.id || ""); };

  const confirmarDevolucion = async () => {
    if (!devolviendo || !dvCuentaId) return alert("Elegí la caja.");
    setGuardando(true);
    try {
      const { error } = await supabase2.rpc("marcar_prestamo_devuelto", { p_id: devolviendo.id, p_cuenta_id: dvCuentaId });
      if (error) throw error;
      const { data: fresh } = await supabase2.from("prestamos_otorgados").select("*").eq("id", devolviendo.id).single();
      setPrestamos((prev: any[]) => prev.map((p) => (p.id === devolviendo.id ? fresh : p)));
      const [{ data: nuevoMov }, { data: nuevoSaldo }] = await Promise.all([
        supabase2.from("movimientos_caja").select("*, cuenta:cuentas(nombre, moneda)").eq("id", fresh.movimiento_devolucion_id).single(),
        supabase2.rpc("saldo_cuenta", { p_cuenta_id: dvCuentaId }),
      ]);
      if (nuevoMov) setMovimientos((prev: any[]) => [nuevoMov, ...prev]);
      setCuentas((prev: any[]) => prev.map((c) => (c.id === dvCuentaId ? { ...c, saldo: Number(nuevoSaldo) || 0 } : c)));
      setDevolviendo(null);
    } catch (err: any) {
      alert(err.message || "No se pudo marcar como devuelto.");
    } finally { setGuardando(false); }
  };

  const eliminar = async (p: any) => {
    if (!confirm(`¿Eliminar el préstamo a ${p.persona}? Revierte los movimientos generados.`)) return;
    try {
      await supabase2.rpc("eliminar_prestamo_otorgado", { p_id: p.id });
      setPrestamos((prev: any[]) => prev.filter((x) => x.id !== p.id));
      const { data: nuevoSaldo } = await supabase2.rpc("saldo_cuenta", { p_cuenta_id: p.cuenta_id });
      setCuentas((prev: any[]) => prev.map((c) => (c.id === p.cuenta_id ? { ...c, saldo: Number(nuevoSaldo) || 0 } : c)));
    } catch (err: any) { alert(err.message || "No se pudo eliminar."); }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-amber-600">Préstamos activos</p><p className="text-lg font-black">{activos.length}</p><p className="text-[10px] text-amber-600/70">Pendientes de devolución</p></div>
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-rose-500">Total adeudado</p>{Object.keys(totalAdeudadoPorMoneda).length === 0 ? <p className="text-lg font-black">USD 0</p> : Object.entries(totalAdeudadoPorMoneda).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}<p className="text-[10px] text-rose-500/70">Suma de activos</p></div>
      </div>

      <div className="flex items-center gap-1 mb-4">
        <button onClick={() => setSub("activos")} className={`px-4 py-2 rounded-lg text-sm font-bold ${sub === "activos" ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>Activos</button>
        <button onClick={() => setSub("devueltos")} className={`px-4 py-2 rounded-lg text-sm font-bold ${sub === "devueltos" ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>Devueltos</button>
        <button onClick={() => setSub("todos")} className={`px-4 py-2 rounded-lg text-sm font-bold ${sub === "todos" ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>Todos</button>
        <button onClick={abrirNuevo} className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Nuevo Préstamo</button>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin préstamos</p></div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 dark:border-white/10 text-left text-slate-400"><th className="p-2.5">Fecha</th><th className="p-2.5">Persona</th><th className="p-2.5">Monto</th><th className="p-2.5">Devolución esperada</th><th className="p-2.5">Motivo</th><th className="p-2.5">Estado</th><th className="p-2.5">Acciones</th></tr></thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 dark:border-white/5">
                  <td className="p-2.5">{p.fecha}</td>
                  <td className="p-2.5 font-bold">{p.persona}</td>
                  <td className="p-2.5 font-mono font-bold">{fmt(p.monto, p.moneda)}</td>
                  <td className="p-2.5">{p.devolucion_esperada || "—"}</td>
                  <td className="p-2.5 text-slate-400">{p.motivo || "—"}</td>
                  <td className="p-2.5">{p.estado === "pendiente" ? <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700">Pendiente</span> : <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700">Devuelto</span>}</td>
                  <td className="p-2.5 flex items-center gap-2">
                    {p.estado === "pendiente" && <button onClick={() => abrirDevolucion(p)} className="text-emerald-600 font-bold">Marcar devuelto</button>}
                    <button onClick={() => eliminar(p)} className="text-rose-500 font-bold">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevo(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Nuevo préstamo</h3><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Préstamos otorgados a una persona desde una caja. Genera un Egreso automático en Finanzas.</p>
            <label className={labelClass}>Persona / beneficiario *</label>
            <input value={persona} onChange={(e) => setPersona(e.target.value)} className={inputClass} />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>Monto *</label><input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Moneda *</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
              <div><label className={labelClass}>Fecha *</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Caja (afecta saldo)</label><select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} className={inputClass}><option value="">— Elegí —</option>{cuentas.filter((c) => c.moneda === moneda).map((c) => <option key={c.id} value={c.id}>{c.nombre} · saldo {fmt(c.saldo, c.moneda)}</option>)}</select></div>
              <div><label className={labelClass}>Devolución esperada</label><input type="date" value={devolucionEsperada} onChange={(e) => setDevolucionEsperada(e.target.value)} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Motivo / descripción</label>
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} className={inputClass} />
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={inputClass} />
            <p className="text-[10px] text-slate-400 mt-2">El préstamo nace activo y debita {monto ? fmt(Number(monto), moneda) : "el monto"} de la caja elegida. La marcación "devuelto" se hace después desde la lista.</p>
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={registrar} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Guardar préstamo</button></div>
          </div>
        </div>
      )}

      {devolviendo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDevolviendo(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-3"><h3 className="text-base font-bold">Marcar devuelto</h3><button onClick={() => setDevolviendo(null)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-sm font-bold mb-3">{devolviendo.persona} — {fmt(devolviendo.monto, devolviendo.moneda)}</p>
            <label className={labelClass}>Caja donde entra la devolución *</label>
            <select value={dvCuentaId} onChange={(e) => setDvCuentaId(e.target.value)} className={inputClass}><option value="">— Elegí —</option>{cuentas.filter((c) => c.moneda === devolviendo.moneda).map((c) => <option key={c.id} value={c.id}>{c.nombre} · saldo {fmt(c.saldo, c.moneda)}</option>)}</select>
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setDevolviendo(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={confirmarDevolucion} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Confirmar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
