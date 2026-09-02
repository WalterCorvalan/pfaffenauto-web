"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Save, HandCoins } from "lucide-react";
import { inputClass, labelClass, fmt } from "./shared";

type Sub = "por_confirmar" | "acreditada" | "al_cliente" | "todas";

export default function DevolRegistroTab({
  devoluciones, setDevoluciones, cuentas, setCuentas, setMovimientos,
}: { devoluciones: any[]; setDevoluciones: (fn: any) => void; cuentas: any[]; setCuentas: (fn: any) => void; setMovimientos: (fn: any) => void }) {
  const [sub, setSub] = useState<Sub>("por_confirmar");
  const [busqueda, setBusqueda] = useState("");
  const [showNueva, setShowNueva] = useState(false);
  const [patente, setPatente] = useState("");
  const [cliente, setCliente] = useState("");
  const [gestora, setGestora] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [resolviendo, setResolviendo] = useState<any | null>(null);
  const [rsDestino, setRsDestino] = useState<"acreditada" | "al_cliente">("acreditada");
  const [rsCuentaId, setRsCuentaId] = useState("");

  const porConfirmar = devoluciones.filter((d) => d.estado === "por_confirmar");
  const acreditadas = devoluciones.filter((d) => d.estado === "acreditada");
  const alCliente = devoluciones.filter((d) => d.estado === "al_cliente");

  const sumaPorMoneda = (lista: any[]) => {
    const map: Record<string, number> = {};
    lista.forEach((d) => { map[d.moneda] = (map[d.moneda] || 0) + Number(d.monto); });
    return map;
  };
  const totalPorConfirmar = sumaPorMoneda(porConfirmar);
  const totalAcreditadas = sumaPorMoneda(acreditadas);
  const totalAlCliente = sumaPorMoneda(alCliente);

  const lista = useMemo(() => {
    let l = sub === "todas" ? devoluciones : devoluciones.filter((d) => d.estado === sub);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      l = l.filter((d) => (d.patente || "").toLowerCase().includes(q) || (d.cliente || "").toLowerCase().includes(q) || (d.gestora || "").toLowerCase().includes(q));
    }
    return l;
  }, [devoluciones, sub, busqueda]);

  const abrirNueva = () => { setPatente(""); setCliente(""); setGestora(""); setMonto(""); setMoneda("ARS"); setNotas(""); setShowNueva(true); };

  const crear = async () => {
    if (!monto) return alert("Completá el monto.");
    setGuardando(true);
    try {
      const { data, error } = await supabase2.from("devoluciones_registro").insert({
        patente: patente || null, cliente: cliente || null, gestora: gestora || null, monto: Number(monto), moneda, notas: notas || null,
      }).select().single();
      if (error) throw error;
      setDevoluciones((prev: any[]) => [data, ...prev]);
      setShowNueva(false);
    } catch { alert("No se pudo registrar la devolución."); } finally { setGuardando(false); }
  };

  const abrirResolucion = (d: any) => { setResolviendo(d); setRsDestino("acreditada"); setRsCuentaId(cuentas.find((c) => c.moneda === d.moneda)?.id || ""); };

  const confirmarResolucion = async () => {
    if (!resolviendo) return;
    if (rsDestino === "acreditada" && !rsCuentaId) return alert("Elegí la caja donde se acredita.");
    setGuardando(true);
    try {
      const { error } = await supabase2.rpc("resolver_devolucion_registro", { p_id: resolviendo.id, p_destino: rsDestino, p_cuenta_id: rsDestino === "acreditada" ? rsCuentaId : null });
      if (error) throw error;
      const { data: fresh } = await supabase2.from("devoluciones_registro").select("*").eq("id", resolviendo.id).single();
      setDevoluciones((prev: any[]) => prev.map((d) => (d.id === resolviendo.id ? fresh : d)));
      if (fresh.movimiento_id) {
        const [{ data: nuevoMov }, { data: nuevoSaldo }] = await Promise.all([
          supabase2.from("movimientos_caja").select("*, cuenta:cuentas(nombre, moneda)").eq("id", fresh.movimiento_id).single(),
          supabase2.rpc("saldo_cuenta", { p_cuenta_id: rsCuentaId }),
        ]);
        if (nuevoMov) setMovimientos((prev: any[]) => [nuevoMov, ...prev]);
        setCuentas((prev: any[]) => prev.map((c) => (c.id === rsCuentaId ? { ...c, saldo: Number(nuevoSaldo) || 0 } : c)));
      }
      setResolviendo(null);
    } catch (err: any) {
      alert(err.message || "No se pudo resolver.");
    } finally { setGuardando(false); }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase text-amber-600">⏳ Por confirmar</p>
          {Object.keys(totalPorConfirmar).length === 0 ? <p className="text-lg font-black">$ 0</p> : Object.entries(totalPorConfirmar).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}
          <p className="text-[10px] text-amber-600/70">{porConfirmar.length} devoluciónes esperando</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase text-emerald-600">✓ Acreditadas</p>
          {Object.keys(totalAcreditadas).length === 0 ? <p className="text-lg font-black">$ 0</p> : Object.entries(totalAcreditadas).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}
          <p className="text-[10px] text-emerald-600/70">{acreditadas.length} ya cobradas</p>
        </div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase text-slate-400">Devueltas al cliente</p>
          {Object.keys(totalAlCliente).length === 0 ? <p className="text-lg font-black">$ 0</p> : Object.entries(totalAlCliente).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}
          <p className="text-[10px] text-slate-400">{alCliente.length} — no pasan por la caja</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {([["por_confirmar", "Por confirmar"], ["acreditada", "Acreditadas"], ["al_cliente", "Al cliente"], ["todas", "Todas"]] as [Sub, string][]).map(([v, l]) => (
          <button key={v} onClick={() => setSub(v)} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${sub === v ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>{l}</button>
        ))}
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por patente, cliente o gestora..." className="ml-auto text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 outline-none" />
        <button onClick={abrirNueva} className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg">+ Nueva</button>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center">
          <HandCoins className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold">No hay devoluciones acá</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Las carga gestoría al finalizar una transferencia, cuando el registro reintegra parte del arancel.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 dark:border-white/10 text-left text-slate-400"><th className="p-2.5">Fecha</th><th className="p-2.5">Patente</th><th className="p-2.5">Cliente</th><th className="p-2.5">Gestora</th><th className="p-2.5">Monto</th><th className="p-2.5">Estado</th><th className="p-2.5">Acciones</th></tr></thead>
            <tbody>
              {lista.map((d) => (
                <tr key={d.id} className="border-b border-slate-50 dark:border-white/5">
                  <td className="p-2.5">{d.fecha}</td>
                  <td className="p-2.5 font-bold">{d.patente || "—"}</td>
                  <td className="p-2.5">{d.cliente || "—"}</td>
                  <td className="p-2.5 text-slate-400">{d.gestora || "—"}</td>
                  <td className="p-2.5 font-mono font-bold">{fmt(d.monto, d.moneda)}</td>
                  <td className="p-2.5">
                    {d.estado === "por_confirmar" && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700">Por confirmar</span>}
                    {d.estado === "acreditada" && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700">Acreditada</span>}
                    {d.estado === "al_cliente" && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500">Al cliente</span>}
                  </td>
                  <td className="p-2.5">{d.estado === "por_confirmar" && <button onClick={() => abrirResolucion(d)} className="text-emerald-600 font-bold">Resolver</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNueva && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNueva(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Nueva devolución</h3><button onClick={() => setShowNueva(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Arancel de registro que la gestoría reintegra al finalizar una transferencia.</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelClass}>Patente</label><input value={patente} onChange={(e) => setPatente(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Cliente</label><input value={cliente} onChange={(e) => setCliente(e.target.value)} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Gestora</label>
            <input value={gestora} onChange={(e) => setGestora(e.target.value)} className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Monto *</label><input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Moneda *</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="ARS">ARS</option><option value="USD">USD</option></select></div>
            </div>
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNueva(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crear} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Registrar</button></div>
          </div>
        </div>
      )}

      {resolviendo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setResolviendo(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-3"><h3 className="text-base font-bold">Resolver devolución</h3><button onClick={() => setResolviendo(null)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-sm font-bold mb-3">{resolviendo.patente || resolviendo.cliente || "Devolución"} — {fmt(resolviendo.monto, resolviendo.moneda)}</p>
            <label className={labelClass}>¿A dónde va la plata? *</label>
            <select value={rsDestino} onChange={(e) => setRsDestino(e.target.value as any)} className={inputClass}>
              <option value="acreditada">Se acredita en una caja de la agencia</option>
              <option value="al_cliente">Se devuelve directo al cliente (no toca caja)</option>
            </select>
            {rsDestino === "acreditada" && (
              <><label className={labelClass + " mt-3"}>Caja *</label><select value={rsCuentaId} onChange={(e) => setRsCuentaId(e.target.value)} className={inputClass}><option value="">— Elegí —</option>{cuentas.filter((c) => c.moneda === resolviendo.moneda).map((c) => <option key={c.id} value={c.id}>{c.nombre} · saldo {fmt(c.saldo, c.moneda)}</option>)}</select></>
            )}
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setResolviendo(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={confirmarResolucion} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Confirmar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
