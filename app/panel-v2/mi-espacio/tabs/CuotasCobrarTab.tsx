"use client";

import { useState, useEffect } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, ListPlus, DollarSign, Trash2 } from "lucide-react";
import { inputClass, labelClass, fmt, diasHasta, badgeVencimiento } from "./shared";

const FREQ_DIAS: Record<string, number> = { Mensual: 30, Bimestral: 60, Anual: 365 };

export default function CuotasCobrarTab({ miId }: { miId: string }) {
  const [cuotas, setCuotas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showNueva, setShowNueva] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  const [concepto, setConcepto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [monto, setMonto] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cuotaActual, setCuotaActual] = useState("");
  const [cuotaTotal, setCuotaTotal] = useState("");
  const [deudor, setDeudor] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [pConceptoBase, setPConceptoBase] = useState("");
  const [pDeudor, setPDeudor] = useState("");
  const [pCantidad, setPCantidad] = useState("12");
  const [pFrecuencia, setPFrecuencia] = useState("Mensual");
  const [pMontoCuota, setPMontoCuota] = useState("");
  const [pMoneda, setPMoneda] = useState("USD");
  const [pPrimerVencimiento, setPPrimerVencimiento] = useState(new Date().toISOString().slice(0, 10));
  const [pNotas, setPNotas] = useState("");
  const [creandoPlan, setCreandoPlan] = useState(false);

  const [cobrando, setCobrando] = useState<any | null>(null);
  const [cobroMonto, setCobroMonto] = useState("");
  const [cobroFecha, setCobroFecha] = useState(new Date().toISOString().slice(0, 10));
  const [cobroNotas, setCobroNotas] = useState("");
  const [guardandoCobro, setGuardandoCobro] = useState(false);

  const cargar = async () => {
    const { data } = await supabase2.from("espacio_cuotas_cobrar").select("*").eq("perfil_id", miId).order("vencimiento");
    setCuotas(data || []);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, [miId]);

  const pendientes = cuotas.filter((c) => !c.cobrada);

  const crear = async () => {
    if (!concepto.trim() || !vencimiento) return alert("Completá concepto y vencimiento.");
    setGuardando(true);
    try {
      const { data, error } = await supabase2.from("espacio_cuotas_cobrar").insert({
        perfil_id: miId, concepto: concepto.trim(), moneda, monto: Number(monto) || 0, vencimiento,
        cuota_actual: cuotaActual ? Number(cuotaActual) : null, cuota_total: cuotaTotal ? Number(cuotaTotal) : null,
        deudor: deudor || null, notas: notas || null,
      }).select().single();
      if (error) throw error;
      setCuotas((prev) => [...prev, data].sort((a, b) => a.vencimiento.localeCompare(b.vencimiento)));
      setShowNueva(false);
      setConcepto(""); setMonto(""); setVencimiento(""); setCuotaActual(""); setCuotaTotal(""); setDeudor(""); setNotas("");
    } catch { alert("No se pudo crear la cuota."); } finally { setGuardando(false); }
  };

  const crearPlan = async () => {
    if (!pConceptoBase.trim() || !pCantidad || !pMontoCuota) return alert("Completá concepto, cantidad y monto por cuota.");
    setCreandoPlan(true);
    try {
      const n = Number(pCantidad);
      const filas = Array.from({ length: n }, (_, i) => {
        const v = new Date(pPrimerVencimiento + "T00:00:00");
        v.setDate(v.getDate() + FREQ_DIAS[pFrecuencia] * i);
        return {
          perfil_id: miId, concepto: pConceptoBase.trim(), moneda: pMoneda, monto: Number(pMontoCuota),
          vencimiento: v.toISOString().slice(0, 10), cuota_actual: i + 1, cuota_total: n,
          deudor: pDeudor || null, notas: pNotas || null,
        };
      });
      const { data, error } = await supabase2.from("espacio_cuotas_cobrar").insert(filas).select();
      if (error) throw error;
      setCuotas((prev) => [...prev, ...(data || [])].sort((a, b) => a.vencimiento.localeCompare(b.vencimiento)));
      setShowPlan(false);
      setPConceptoBase(""); setPDeudor(""); setPMontoCuota(""); setPNotas("");
    } catch { alert("No se pudo crear el plan."); } finally { setCreandoPlan(false); }
  };

  const eliminar = async (c: any) => {
    if (!confirm(`¿Eliminar la cuota "${c.concepto}"?`)) return;
    await supabase2.from("espacio_cuotas_cobrar").delete().eq("id", c.id);
    setCuotas((prev) => prev.filter((x) => x.id !== c.id));
  };

  const abrirCobro = (c: any) => { setCobrando(c); setCobroMonto(String(Number(c.monto) - Number(c.monto_cobrado))); setCobroFecha(new Date().toISOString().slice(0, 10)); setCobroNotas(""); };
  const saldoPendiente = cobrando ? Number(cobrando.monto) - Number(cobrando.monto_cobrado) : 0;

  const confirmarCobro = async () => {
    if (!cobrando) return;
    const m = Number(cobroMonto);
    if (!m || m <= 0) return alert("Ingresá un monto válido.");
    setGuardandoCobro(true);
    try {
      const nuevoCobrado = Number(cobrando.monto_cobrado) + m;
      const cobradaCompleto = nuevoCobrado >= Number(cobrando.monto);
      await supabase2.from("espacio_cuotas_cobrar").update({ monto_cobrado: nuevoCobrado, cobrada: cobradaCompleto }).eq("id", cobrando.id);
      setCuotas((prev) => prev.map((c) => (c.id === cobrando.id ? { ...c, monto_cobrado: nuevoCobrado, cobrada: cobradaCompleto } : c)));
      setCobrando(null);
    } catch { alert("No se pudo registrar el cobro."); } finally { setGuardandoCobro(false); }
  };

  if (cargando) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div><p className="text-lg font-bold">Cuotas a cobrar — {pendientes.length} pendiente{pendientes.length === 1 ? "" : "s"}</p><p className="text-xs text-slate-400">Plata que te tienen que pagar — préstamos personales, fiados, etc. Solo vos lo ves.</p></div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setShowNueva(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Nueva cuota</button>
          <button onClick={() => setShowPlan(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold border border-slate-200 dark:border-white/10 rounded-lg"><ListPlus className="w-4 h-4" /> Plan automático</button>
        </div>
      </div>

      {cuotas.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center">
          <p className="text-sm font-bold">Sin cuotas a cobrar</p>
          <p className="text-xs text-slate-400 mt-1">Anotá la plata que te deben — préstamos a amigos, fiados, ventas en cuotas privadas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cuotas.map((c) => {
            const b = badgeVencimiento(c.vencimiento);
            return (
              <div key={c.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-sm font-bold">{c.concepto}{c.cuota_actual && c.cuota_total ? ` (${c.cuota_actual}/${c.cuota_total})` : ""}</p>{c.deudor && <p className="text-xs text-slate-400">{c.deudor}</p>}</div>
                  {!c.cobrada && <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${b.clase}`}>{b.texto}</span>}
                  {c.cobrada && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">Cobrada</span>}
                </div>
                <p className="text-lg font-black mt-1">{fmt(c.monto, c.moneda)}</p>
                <p className="text-[11px] text-slate-400">Vence: {c.vencimiento}</p>
                {!c.cobrada && (
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => abrirCobro(c)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"><DollarSign className="w-3.5 h-3.5" /> Registrar cobro</button>
                    <button onClick={() => eliminar(c)} className="p-1.5 text-slate-400 hover:text-rose-600 ml-auto"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showNueva && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNueva(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4"><h3 className="text-lg font-bold">Nueva cuota a cobrar</h3><button onClick={() => setShowNueva(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <label className={labelClass}>Concepto *</label>
            <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Préstamo, venta en cuotas..." className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Monto *</label><input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Moneda</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Vencimiento</label><input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Cuota X / Y</label><div className="flex items-center gap-1"><input type="number" value={cuotaActual} onChange={(e) => setCuotaActual(e.target.value)} placeholder="3" className={inputClass} /><span>/</span><input type="number" value={cuotaTotal} onChange={(e) => setCuotaTotal(e.target.value)} placeholder="12" className={inputClass} /></div></div>
            </div>
            <label className={labelClass + " mt-3"}>Quién te debe</label>
            <input value={deudor} onChange={(e) => setDeudor(e.target.value)} placeholder="Nombre" className={inputClass} />
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNueva(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crear} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Crear</button></div>
          </div>
        </div>
      )}

      {showPlan && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowPlan(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4"><h3 className="text-lg font-bold">Plan automático</h3><button onClick={() => setShowPlan(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <label className={labelClass}>Concepto base *</label>
            <input value={pConceptoBase} onChange={(e) => setPConceptoBase(e.target.value)} placeholder="Préstamo a Juan, venta en cuotas..." className={inputClass} />
            <label className={labelClass + " mt-3"}>Quién te debe</label>
            <input value={pDeudor} onChange={(e) => setPDeudor(e.target.value)} className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Cantidad de cuotas *</label><input type="number" value={pCantidad} onChange={(e) => setPCantidad(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Frecuencia *</label><select value={pFrecuencia} onChange={(e) => setPFrecuencia(e.target.value)} className={inputClass}><option value="Mensual">Mensual</option><option value="Bimestral">Bimestral</option><option value="Anual">Anual</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Monto por cuota *</label><input type="number" value={pMontoCuota} onChange={(e) => setPMontoCuota(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Moneda *</label><select value={pMoneda} onChange={(e) => setPMoneda(e.target.value)} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
            </div>
            <label className={labelClass + " mt-3"}>Primer vencimiento *</label>
            <input type="date" value={pPrimerVencimiento} onChange={(e) => setPPrimerVencimiento(e.target.value)} className={inputClass} />
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={pNotas} onChange={(e) => setPNotas(e.target.value)} rows={2} className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowPlan(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crearPlan} disabled={creandoPlan} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><ListPlus className="w-4 h-4" /> Crear {pCantidad} cuotas</button></div>
          </div>
        </div>
      )}

      {cobrando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setCobrando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-base font-bold">Cobro de "{cobrando.concepto}"</h3><button onClick={() => setCobrando(null)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3 my-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Total cuota</span><strong>{fmt(Number(cobrando.monto), cobrando.moneda)}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Saldo pendiente</span><strong className="text-amber-600">{fmt(saldoPendiente, cobrando.moneda)}</strong></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelClass}>Fecha *</label><input type="date" value={cobroFecha} onChange={(e) => setCobroFecha(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Monto ({cobrando.moneda}) *</label><input type="number" value={cobroMonto} onChange={(e) => setCobroMonto(e.target.value)} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={cobroNotas} onChange={(e) => setCobroNotas(e.target.value)} rows={2} className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setCobrando(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={confirmarCobro} disabled={guardandoCobro} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Registrar cobro</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
