"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, ListPlus, DollarSign, Trash2 } from "lucide-react";
import { inputClass, labelClass, fmt, diasHasta, badgeVencimiento } from "./shared";

const FREQ_DIAS: Record<string, number> = { Mensual: 30, Bimestral: 60, Anual: 365 };

export default function CuotasPagarTab({ miId }: { miId: string }) {
  const [cuotas, setCuotas] = useState<any[]>([]);
  const [deudas, setDeudas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showNueva, setShowNueva] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  const [concepto, setConcepto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [monto, setMonto] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cuotaActual, setCuotaActual] = useState("");
  const [cuotaTotal, setCuotaTotal] = useState("");
  const [deudaId, setDeudaId] = useState("");
  const [acreedorBanco, setAcreedorBanco] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [pConceptoBase, setPConceptoBase] = useState("");
  const [pAcreedor, setPAcreedor] = useState("");
  const [pCantidad, setPCantidad] = useState("12");
  const [pFrecuencia, setPFrecuencia] = useState("Mensual");
  const [pMontoCuota, setPMontoCuota] = useState("");
  const [pMoneda, setPMoneda] = useState("USD");
  const [pPrimerVencimiento, setPPrimerVencimiento] = useState(new Date().toISOString().slice(0, 10));
  const [pNotas, setPNotas] = useState("");
  const [creandoPlan, setCreandoPlan] = useState(false);

  const [pagando, setPagando] = useState<any | null>(null);
  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoFecha, setPagoFecha] = useState(new Date().toISOString().slice(0, 10));
  const [pagoNotas, setPagoNotas] = useState("");
  const [guardandoPago, setGuardandoPago] = useState(false);

  const cargar = async () => {
    const [{ data: c }, { data: d }] = await Promise.all([
      supabase2.from("espacio_cuotas_pagar").select("*").eq("perfil_id", miId).order("vencimiento"),
      supabase2.from("espacio_deudas").select("id, acreedor, concepto").eq("perfil_id", miId).eq("pagada", false),
    ]);
    setCuotas(c || []);
    setDeudas(d || []);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, [miId]);

  const pendientes = cuotas.filter((c) => !c.pagada);
  const vencidas = pendientes.filter((c) => diasHasta(c.vencimiento) < 0);
  const mesActual = new Date().toISOString().slice(0, 7);
  const venceEsteMes = pendientes.filter((c) => c.vencimiento.slice(0, 7) === mesActual);
  const pagadoEsteMes = cuotas.filter((c) => c.pagada && c.vencimiento.slice(0, 7) === mesActual).reduce((a, c) => a + Number(c.monto_pagado), 0);
  const totalAdeudadoPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    pendientes.forEach((c) => { map[c.moneda] = (map[c.moneda] || 0) + (Number(c.monto) - Number(c.monto_pagado)); });
    return map;
  }, [pendientes]);

  const crear = async () => {
    if (!concepto.trim() || !vencimiento) return alert("Completá concepto y vencimiento.");
    setGuardando(true);
    try {
      const { data, error } = await supabase2.from("espacio_cuotas_pagar").insert({
        perfil_id: miId, concepto: concepto.trim(), moneda, monto: Number(monto) || 0, vencimiento,
        cuota_actual: cuotaActual ? Number(cuotaActual) : null, cuota_total: cuotaTotal ? Number(cuotaTotal) : null,
        deuda_id: deudaId || null, acreedor_banco: acreedorBanco || null, notas: notas || null,
      }).select().single();
      if (error) throw error;
      setCuotas((prev) => [...prev, data].sort((a, b) => a.vencimiento.localeCompare(b.vencimiento)));
      setShowNueva(false);
      setConcepto(""); setMonto(""); setVencimiento(""); setCuotaActual(""); setCuotaTotal(""); setDeudaId(""); setAcreedorBanco(""); setNotas("");
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
          acreedor_banco: pAcreedor || null, notas: pNotas || null,
        };
      });
      const { data, error } = await supabase2.from("espacio_cuotas_pagar").insert(filas).select();
      if (error) throw error;
      setCuotas((prev) => [...prev, ...(data || [])].sort((a, b) => a.vencimiento.localeCompare(b.vencimiento)));
      setShowPlan(false);
      setPConceptoBase(""); setPAcreedor(""); setPMontoCuota(""); setPNotas("");
    } catch { alert("No se pudo crear el plan."); } finally { setCreandoPlan(false); }
  };

  const eliminar = async (c: any) => {
    if (!confirm(`¿Eliminar la cuota "${c.concepto}"?`)) return;
    await supabase2.from("espacio_cuotas_pagar").delete().eq("id", c.id);
    setCuotas((prev) => prev.filter((x) => x.id !== c.id));
  };

  const abrirPago = (c: any) => { setPagando(c); setPagoMonto(String(Number(c.monto) - Number(c.monto_pagado))); setPagoFecha(new Date().toISOString().slice(0, 10)); setPagoNotas(""); };
  const saldoPendiente = pagando ? Number(pagando.monto) - Number(pagando.monto_pagado) : 0;

  const confirmarPago = async () => {
    if (!pagando) return;
    const m = Number(pagoMonto);
    if (!m || m <= 0) return alert("Ingresá un monto válido.");
    setGuardandoPago(true);
    try {
      await supabase2.from("espacio_pagos").insert({ perfil_id: miId, fecha: pagoFecha, concepto: pagando.concepto, moneda: pagando.moneda, monto: m, notas: pagoNotas || null, origen: "manual" });
      const nuevoPagado = Number(pagando.monto_pagado) + m;
      const pagadaCompleto = nuevoPagado >= Number(pagando.monto);
      await supabase2.from("espacio_cuotas_pagar").update({ monto_pagado: nuevoPagado, pagada: pagadaCompleto }).eq("id", pagando.id);
      setCuotas((prev) => prev.map((c) => (c.id === pagando.id ? { ...c, monto_pagado: nuevoPagado, pagada: pagadaCompleto } : c)));
      setPagando(null);
    } catch { alert("No se pudo registrar el pago."); } finally { setGuardandoPago(false); }
  };

  if (cargando) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div><p className="text-lg font-bold">Cuotas a pagar — {pendientes.length} pendiente{pendientes.length === 1 ? "" : "s"}</p><p className="text-xs text-slate-400">Tarjeta, hipoteca, préstamos — todo lo que pagás en cuotas.</p></div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setShowNueva(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Nueva cuota</button>
          <button onClick={() => setShowPlan(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold border border-slate-200 dark:border-white/10 rounded-lg"><ListPlus className="w-4 h-4" /> Plan automático</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-4"><p className="text-[10px] font-bold uppercase text-rose-500">Vencidas</p><p className="text-lg font-black">{vencidas.length}</p>{vencidas.length === 0 && <p className="text-[10px] text-emerald-600">Al día ✓</p>}</div>
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-4"><p className="text-[10px] font-bold uppercase text-amber-600">Vence este mes</p><p className="text-lg font-black">{venceEsteMes.length}</p>{venceEsteMes.length === 0 && <p className="text-[10px] text-slate-400">Sin vencimientos</p>}</div>
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4"><p className="text-[10px] font-bold uppercase text-emerald-600">Pagado este mes</p><p className="text-lg font-black">USD {pagadoEsteMes.toLocaleString("es-AR")}</p></div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4"><p className="text-[10px] font-bold uppercase text-slate-400">Total adeudado</p>{Object.keys(totalAdeudadoPorMoneda).length === 0 ? <p className="text-sm font-bold">Sin deudas</p> : Object.entries(totalAdeudadoPorMoneda).map(([m, n]) => <p key={m} className="text-sm font-black">{fmt(n, m)}</p>)}</div>
      </div>

      {cuotas.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center">
          <p className="text-sm font-bold">Sin cuotas registradas</p>
          <p className="text-xs text-slate-400 mt-1">Cargá tus deudas: tarjeta de crédito, hipoteca, préstamo, leasing, viaje en cuotas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cuotas.map((c) => {
            const b = badgeVencimiento(c.vencimiento);
            const deuda = deudas.find((d) => d.id === c.deuda_id);
            return (
              <div key={c.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-sm font-bold">{c.concepto}{c.cuota_actual && c.cuota_total ? ` (${c.cuota_actual}/${c.cuota_total})` : ""}</p>{c.acreedor_banco && <p className="text-xs text-slate-400">{c.acreedor_banco}</p>}</div>
                  {!c.pagada && <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${b.clase}`}>{b.texto}</span>}
                  {c.pagada && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">Pagada</span>}
                </div>
                <p className="text-lg font-black mt-1">{fmt(c.monto, c.moneda)}</p>
                <p className="text-[11px] text-slate-400">Vence: {c.vencimiento}{deuda && ` · ${deuda.acreedor}`}</p>
                {!c.pagada && (
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => abrirPago(c)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><DollarSign className="w-3.5 h-3.5" /> Registrar pago</button>
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
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Nueva cuota</h3><button onClick={() => setShowNueva(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Tarjeta de crédito, hipoteca, préstamo, leasing, viajes en cuotas...</p>
            <label className={labelClass}>Concepto *</label>
            <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Visa, hipoteca casa, préstamo BBVA..." className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Monto *</label><input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Moneda</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Vencimiento</label><input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Cuota X / Y</label><div className="flex items-center gap-1"><input type="number" value={cuotaActual} onChange={(e) => setCuotaActual(e.target.value)} placeholder="3" className={inputClass} /><span>/</span><input type="number" value={cuotaTotal} onChange={(e) => setCuotaTotal(e.target.value)} placeholder="12" className={inputClass} /></div></div>
            </div>
            <label className={labelClass + " mt-3"}>Vincular a deuda existente (opcional)</label>
            <select value={deudaId} onChange={(e) => setDeudaId(e.target.value)} className={inputClass}>
              <option value="">— Sin vincular (cuota suelta) —</option>
              {deudas.map((d) => <option key={d.id} value={d.id}>{d.acreedor}{d.concepto ? ` — ${d.concepto}` : ""}</option>)}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Si elegís una deuda, esta cuota cuenta como parte de ella y el saldo de la deuda se calcula automáticamente desde sus cuotas.</p>
            <label className={labelClass + " mt-3"}>Acreedor / Banco</label>
            <input value={acreedorBanco} onChange={(e) => setAcreedorBanco(e.target.value)} placeholder="BBVA, Galicia, Mercado Pago..." className={inputClass} />
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Detalles, beneficiario, intereses..." className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNueva(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crear} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Crear</button></div>
          </div>
        </div>
      )}

      {showPlan && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowPlan(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Plan automático</h3><button onClick={() => setShowPlan(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Crea N cuotas de un saque (hipoteca, crédito, tarjeta en cuotas, etc.) con la frecuencia y monto que elijas.</p>
            <label className={labelClass}>Concepto base *</label>
            <input value={pConceptoBase} onChange={(e) => setPConceptoBase(e.target.value)} placeholder="Hipoteca casa, Préstamo BBVA, Visa cuotificada..." className={inputClass} />
            <label className={labelClass + " mt-3"}>Acreedor / Banco</label>
            <input value={pAcreedor} onChange={(e) => setPAcreedor(e.target.value)} placeholder="BBVA, Galicia, Mercado Pago..." className={inputClass} />
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
            <label className={labelClass + " mt-3"}>Notas (opcional, comunes a todas)</label>
            <textarea value={pNotas} onChange={(e) => setPNotas(e.target.value)} rows={2} placeholder="Detalles del crédito, tasa, etc." className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowPlan(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crearPlan} disabled={creandoPlan} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><ListPlus className="w-4 h-4" /> Crear {pCantidad} cuotas</button></div>
          </div>
        </div>
      )}

      {pagando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPagando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-base font-bold">Pago de "{pagando.concepto}"</h3><button onClick={() => setPagando(null)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3 my-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Total cuota</span><strong>{fmt(Number(pagando.monto), pagando.moneda)}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Saldo pendiente</span><strong className="text-amber-600">{fmt(saldoPendiente, pagando.moneda)}</strong></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelClass}>Fecha *</label><input type="date" value={pagoFecha} onChange={(e) => setPagoFecha(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Monto ({pagando.moneda}) *</label><input type="number" value={pagoMonto} onChange={(e) => setPagoMonto(e.target.value)} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Notas (opcional)</label>
            <textarea value={pagoNotas} onChange={(e) => setPagoNotas(e.target.value)} rows={2} className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setPagando(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={confirmarPago} disabled={guardandoPago} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Registrar pago</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
