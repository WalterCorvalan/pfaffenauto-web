"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save } from "lucide-react";
import { inputClass, labelClass, fmt } from "./shared";

export default function TarjetaTab({
  consumos, setConsumos, cuentas, setCuentas, setMovimientos,
}: { consumos: any[]; setConsumos: (fn: any) => void; cuentas: any[]; setCuentas: (fn: any) => void; setMovimientos: (fn: any) => void }) {
  const [showNuevo, setShowNuevo] = useState(false);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [cuotasTotales, setCuotasTotales] = useState("1");
  const [cuotaActual, setCuotaActual] = useState("1");
  const [estado, setEstado] = useState("pendiente");
  const [cuentaId, setCuentaId] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [pagando, setPagando] = useState<any | null>(null);
  const [pgCuentaId, setPgCuentaId] = useState("");

  const pendientesPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    consumos.filter((c) => c.estado === "pendiente").forEach((c) => { map[c.moneda] = (map[c.moneda] || 0) + Number(c.monto); });
    return map;
  }, [consumos]);

  const abrir = () => { setConcepto(""); setMonto(""); setMoneda("ARS"); setFecha(new Date().toISOString().slice(0, 10)); setCuotasTotales("1"); setCuotaActual("1"); setEstado("pendiente"); setCuentaId(""); setShowNuevo(true); };

  const registrar = async () => {
    if (!concepto.trim() || !monto) return alert("Completá concepto y monto.");
    if (estado === "pagado" && !cuentaId) return alert("Elegí la caja de origen para un consumo pagado.");
    setGuardando(true);
    try {
      const { data: id, error } = await supabase2.rpc("crear_consumo_tarjeta", {
        p_concepto: concepto.trim(), p_monto: Number(monto), p_moneda: moneda, p_fecha: fecha,
        p_cuotas_totales: Number(cuotasTotales) || 1, p_cuota_actual: Number(cuotaActual) || 1, p_estado: estado, p_cuenta_id: cuentaId || null,
      });
      if (error) throw error;
      const { data: fresh } = await supabase2.from("consumos_tarjeta").select("*").eq("id", id).single();
      setConsumos((prev: any[]) => [fresh, ...prev]);

      if (fresh.movimiento_id) {
        const [{ data: nuevoMov }, { data: nuevoSaldo }] = await Promise.all([
          supabase2.from("movimientos_caja").select("*, cuenta:cuentas(nombre, moneda)").eq("id", fresh.movimiento_id).single(),
          supabase2.rpc("saldo_cuenta", { p_cuenta_id: cuentaId }),
        ]);
        if (nuevoMov) setMovimientos((prev: any[]) => [nuevoMov, ...prev]);
        setCuentas((prev: any[]) => prev.map((c) => (c.id === cuentaId ? { ...c, saldo: Number(nuevoSaldo) || 0 } : c)));
      }
      setShowNuevo(false);
    } catch (err: any) {
      alert(err.message || "No se pudo registrar el gasto.");
    } finally { setGuardando(false); }
  };

  const abrirPago = (c: any) => { setPagando(c); setPgCuentaId(cuentas.find((x) => x.moneda === c.moneda)?.id || ""); };

  const confirmarPago = async () => {
    if (!pagando || !pgCuentaId) return alert("Elegí la caja.");
    setGuardando(true);
    try {
      const { error } = await supabase2.rpc("marcar_consumo_tarjeta_pagado", { p_id: pagando.id, p_cuenta_id: pgCuentaId });
      if (error) throw error;
      const { data: fresh } = await supabase2.from("consumos_tarjeta").select("*").eq("id", pagando.id).single();
      setConsumos((prev: any[]) => prev.map((c) => (c.id === pagando.id ? fresh : c)));
      const [{ data: nuevoMov }, { data: nuevoSaldo }] = await Promise.all([
        supabase2.from("movimientos_caja").select("*, cuenta:cuentas(nombre, moneda)").eq("id", fresh.movimiento_id).single(),
        supabase2.rpc("saldo_cuenta", { p_cuenta_id: pgCuentaId }),
      ]);
      if (nuevoMov) setMovimientos((prev: any[]) => [nuevoMov, ...prev]);
      setCuentas((prev: any[]) => prev.map((c) => (c.id === pgCuentaId ? { ...c, saldo: Number(nuevoSaldo) || 0 } : c)));
      setPagando(null);
    } catch (err: any) {
      alert(err.message || "No se pudo marcar como pagado.");
    } finally { setGuardando(false); }
  };

  const eliminar = async (c: any) => {
    if (!confirm(`¿Eliminar "${c.concepto}"? ${c.estado === "pagado" ? "Se revierte el egreso en la caja." : ""}`)) return;
    try {
      await supabase2.rpc("eliminar_consumo_tarjeta", { p_id: c.id });
      setConsumos((prev: any[]) => prev.filter((x) => x.id !== c.id));
      if (c.movimiento_id && c.cuenta_id) {
        const { data: nuevoSaldo } = await supabase2.rpc("saldo_cuenta", { p_cuenta_id: c.cuenta_id });
        setCuentas((prev: any[]) => prev.map((x) => (x.id === c.cuenta_id ? { ...x, saldo: Number(nuevoSaldo) || 0 } : x)));
      }
    } catch (err: any) { alert(err.message || "No se pudo eliminar."); }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase text-rose-500">Total pendiente</p>
          {Object.keys(pendientesPorMoneda).length === 0 ? <p className="text-sm">—</p> : Object.entries(pendientesPorMoneda).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}
        </div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Total registros</p><p className="text-lg font-black">{consumos.length}</p></div>
      </div>

      <button onClick={abrir} className="flex items-center gap-1.5 px-4 py-2 mb-4 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Nuevo Gasto</button>

      {consumos.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin consumos registrados</p></div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 dark:border-white/10 text-left text-slate-400"><th className="p-2.5">Fecha</th><th className="p-2.5">Concepto</th><th className="p-2.5">Monto</th><th className="p-2.5">Cuota</th><th className="p-2.5">Estado</th><th className="p-2.5">Acciones</th></tr></thead>
            <tbody>
              {consumos.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 dark:border-white/5">
                  <td className="p-2.5">{c.fecha}</td>
                  <td className="p-2.5 font-bold">{c.concepto}</td>
                  <td className="p-2.5 font-mono font-bold">{fmt(c.monto, c.moneda)}</td>
                  <td className="p-2.5 text-slate-400">{c.cuotas_totales > 1 ? `${c.cuota_actual}/${c.cuotas_totales}` : "Contado"}</td>
                  <td className="p-2.5"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.estado === "pagado" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700" : "bg-amber-100 dark:bg-amber-500/20 text-amber-700"}`}>{c.estado}</span></td>
                  <td className="p-2.5 flex items-center gap-2">
                    {c.estado === "pendiente" && <button onClick={() => abrirPago(c)} className="text-emerald-600 font-bold">Pagar</button>}
                    <button onClick={() => eliminar(c)} className="text-rose-500 font-bold">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevo(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Nuevo gasto</h3><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Registrá un consumo de tarjeta. Si lo cargás como Pagado, se debita la caja y se crea un movimiento auto-generado.</p>
            <label className={labelClass}>Concepto *</label>
            <input value={concepto} onChange={(e) => setConcepto(e.target.value)} className={inputClass} />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>Monto *</label><input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Moneda *</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="ARS">ARS</option><option value="USD">USD</option></select></div>
              <div><label className={labelClass}>Fecha *</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>Cuotas totales</label><input type="number" value={cuotasTotales} onChange={(e) => setCuotasTotales(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Cuota actual</label><input type="number" value={cuotaActual} onChange={(e) => setCuotaActual(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Estado *</label><select value={estado} onChange={(e) => setEstado(e.target.value)} className={inputClass}><option value="pendiente">Pendiente</option><option value="pagado">Pagado</option></select></div>
            </div>
            {estado === "pagado" && (
              <><label className={labelClass + " mt-3"}>Caja origen *</label><select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} className={inputClass}><option value="">— Elegí —</option>{cuentas.filter((c) => c.moneda === moneda).map((c) => <option key={c.id} value={c.id}>{c.nombre} · saldo {fmt(c.saldo, c.moneda)}</option>)}</select></>
            )}
            <p className="text-[10px] text-slate-400 mt-2">{estado === "pendiente" ? "Pendiente solo registra el consumo; no toca caja ni Finanzas hasta que pase a Pagado." : "Se debita la caja elegida al instante."}</p>
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={registrar} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Registrar gasto</button></div>
          </div>
        </div>
      )}

      {pagando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPagando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-3"><h3 className="text-base font-bold">Marcar pagado</h3><button onClick={() => setPagando(null)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-sm font-bold mb-2">{pagando.concepto} — {fmt(pagando.monto, pagando.moneda)}</p>
            <label className={labelClass}>Caja *</label>
            <select value={pgCuentaId} onChange={(e) => setPgCuentaId(e.target.value)} className={inputClass}><option value="">— Elegí —</option>{cuentas.filter((c) => c.moneda === pagando.moneda).map((c) => <option key={c.id} value={c.id}>{c.nombre} · saldo {fmt(c.saldo, c.moneda)}</option>)}</select>
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setPagando(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={confirmarPago} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Confirmar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
