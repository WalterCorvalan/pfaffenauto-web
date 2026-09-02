"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, Link2, Trash2, DollarSign } from "lucide-react";
import { inputClass, labelClass, fmt, badgeVencimiento } from "./shared";

export default function DeudasTab({ miId }: { miId: string }) {
  const [deudas, setDeudas] = useState<any[]>([]);
  const [cuotas, setCuotas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showNueva, setShowNueva] = useState(false);
  const [acreedor, setAcreedor] = useState("");
  const [concepto, setConcepto] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [monto, setMonto] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [pagando, setPagando] = useState<any | null>(null);
  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoFecha, setPagoFecha] = useState(new Date().toISOString().slice(0, 10));
  const [pagoNotas, setPagoNotas] = useState("");
  const [guardandoPago, setGuardandoPago] = useState(false);

  const [vinculando, setVinculando] = useState<any | null>(null);

  const cargar = async () => {
    const [{ data: d }, { data: c }] = await Promise.all([
      supabase2.from("espacio_deudas").select("*").eq("perfil_id", miId).order("vencimiento", { nullsFirst: false }),
      supabase2.from("espacio_cuotas_pagar").select("*").eq("perfil_id", miId),
    ]);
    setDeudas(d || []);
    setCuotas(c || []);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, [miId]);

  const saldoDeuda = (d: any) => {
    const ligadas = cuotas.filter((c) => c.deuda_id === d.id);
    if (ligadas.length > 0) return ligadas.reduce((a, c) => a + (Number(c.monto) - Number(c.monto_pagado)), 0);
    return Number(d.monto) - Number(d.monto_pagado);
  };

  const activas = deudas.filter((d) => !d.pagada);
  const totalUsd = activas.filter((d) => d.moneda === "USD").reduce((a, d) => a + saldoDeuda(d), 0);
  const totalArs = activas.filter((d) => d.moneda === "ARS").reduce((a, d) => a + saldoDeuda(d), 0);

  const crear = async () => {
    if (!acreedor.trim()) return alert("Completá el acreedor.");
    setGuardando(true);
    try {
      const { data, error } = await supabase2.from("espacio_deudas").insert({ perfil_id: miId, acreedor: acreedor.trim(), concepto: concepto || null, moneda, monto: Number(monto) || 0, vencimiento: vencimiento || null, notas: notas || null }).select().single();
      if (error) throw error;
      setDeudas((prev) => [...prev, data]);
      setShowNueva(false);
      setAcreedor(""); setConcepto(""); setMonto(""); setVencimiento(""); setNotas("");
    } catch { alert("No se pudo crear la deuda."); } finally { setGuardando(false); }
  };

  const eliminar = async (d: any) => {
    if (!confirm(`¿Eliminar la deuda con ${d.acreedor}?`)) return;
    await supabase2.from("espacio_deudas").delete().eq("id", d.id);
    setDeudas((prev) => prev.filter((x) => x.id !== d.id));
  };

  const abrirPago = (d: any) => { setPagando(d); setPagoMonto(String(saldoDeuda(d))); setPagoFecha(new Date().toISOString().slice(0, 10)); setPagoNotas(""); };
  const saldoPendiente = pagando ? saldoDeuda(pagando) : 0;

  const confirmarPago = async () => {
    if (!pagando) return;
    const m = Number(pagoMonto);
    if (!m || m <= 0) return alert("Ingresá un monto válido.");
    setGuardandoPago(true);
    try {
      await supabase2.from("espacio_pagos").insert({ perfil_id: miId, fecha: pagoFecha, concepto: `Deuda: ${pagando.acreedor}`, moneda: pagando.moneda, monto: m, notas: pagoNotas || null, origen: "manual" });
      const nuevoPagado = Number(pagando.monto_pagado) + m;
      const pagadaCompleto = nuevoPagado >= Number(pagando.monto);
      await supabase2.from("espacio_deudas").update({ monto_pagado: nuevoPagado, pagada: pagadaCompleto }).eq("id", pagando.id);
      setDeudas((prev) => prev.map((d) => (d.id === pagando.id ? { ...d, monto_pagado: nuevoPagado, pagada: pagadaCompleto } : d)));
      setPagando(null);
    } catch { alert("No se pudo registrar el pago."); } finally { setGuardandoPago(false); }
  };

  const cuotasVinculables = useMemo(() => vinculando ? cuotas.filter((c) => !c.deuda_id || c.deuda_id === vinculando.id) : [], [cuotas, vinculando]);
  const toggleVinculo = async (c: any) => {
    const nuevo = c.deuda_id === vinculando.id ? null : vinculando.id;
    await supabase2.from("espacio_cuotas_pagar").update({ deuda_id: nuevo }).eq("id", c.id);
    setCuotas((prev) => prev.map((x) => (x.id === c.id ? { ...x, deuda_id: nuevo } : x)));
  };

  if (cargando) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div><p className="text-lg font-bold">Deudas — {activas.length} activa{activas.length === 1 ? "" : "s"}</p><p className="text-xs text-slate-400">Plata que le debés a otras personas. Solo vos lo ves.</p></div>
        <button onClick={() => setShowNueva(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shrink-0"><Plus className="w-4 h-4" /> Nueva deuda</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-4"><p className="text-[10px] font-bold uppercase text-rose-500">Total adeudado USD</p><p className="text-lg font-black">USD {totalUsd.toLocaleString("es-AR")}</p></div>
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-4"><p className="text-[10px] font-bold uppercase text-amber-600">Total adeudado ARS</p><p className="text-lg font-black">{fmt(totalArs)}</p></div>
      </div>

      {deudas.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin deudas registradas</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {deudas.map((d) => {
            const ligadas = cuotas.filter((c) => c.deuda_id === d.id);
            const saldo = saldoDeuda(d);
            const b = d.vencimiento ? badgeVencimiento(d.vencimiento) : null;
            return (
              <div key={d.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-sm font-bold">{d.acreedor}</p>{d.concepto && <p className="text-xs text-slate-400">{d.concepto}</p>}</div>
                  {!d.pagada && b && <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${b.clase}`}>{b.texto}</span>}
                  {d.pagada && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">Pagada</span>}
                </div>
                <p className="text-lg font-black mt-1">{fmt(saldo, d.moneda)}</p>
                <p className="text-[11px] text-slate-400">Desde {d.fecha_inicio}{d.vencimiento ? ` · vence ${d.vencimiento}` : ""}{ligadas.length > 0 && ` · ${ligadas.length} cuota(s) vinculada(s)`}</p>
                {!d.pagada && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {ligadas.length === 0 && <button onClick={() => abrirPago(d)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><DollarSign className="w-3.5 h-3.5" /> Registrar pago</button>}
                    <button onClick={() => setVinculando(d)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5"><Link2 className="w-3.5 h-3.5" /> Vincular cuotas</button>
                    <button onClick={() => eliminar(d)} className="p-1.5 text-slate-400 hover:text-rose-600 ml-auto"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showNueva && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNueva(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-4"><h3 className="text-lg font-bold">Nueva deuda</h3><button onClick={() => setShowNueva(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <label className={labelClass}>Acreedor *</label>
            <input value={acreedor} onChange={(e) => setAcreedor(e.target.value)} placeholder="On city, un amigo, etc." className={inputClass} />
            <label className={labelClass + " mt-3"}>Concepto</label>
            <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Television, préstamo, etc." className={inputClass} />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>Moneda</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="ARS">ARS</option><option value="USD">USD</option></select></div>
              <div><label className={labelClass}>Monto</label><input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Vencimiento</label><input type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNueva(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crear} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Crear</button></div>
          </div>
        </div>
      )}

      {pagando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPagando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-base font-bold">Pago parcial sobre la deuda con {pagando.acreedor}.</h3><button onClick={() => setPagando(null)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3 my-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Deuda total</span><strong>{fmt(Number(pagando.monto), pagando.moneda)}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Saldo restante</span><strong className="text-amber-600">{fmt(saldoPendiente, pagando.moneda)}</strong></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelClass}>Fecha del pago *</label><input type="date" value={pagoFecha} onChange={(e) => setPagoFecha(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Monto ({pagando.moneda}) *</label><input type="number" value={pagoMonto} onChange={(e) => setPagoMonto(e.target.value)} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Notas (opcional)</label>
            <textarea value={pagoNotas} onChange={(e) => setPagoNotas(e.target.value)} rows={2} placeholder="Transferencia, efectivo, etc." className={inputClass} />
            {Number(pagoMonto) >= saldoPendiente && Number(pagoMonto) > 0 && <p className="text-xs text-emerald-600 font-semibold mt-2">✓ Con este pago la deuda queda saldada.</p>}
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setPagando(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={confirmarPago} disabled={guardandoPago} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Registrar pago</button></div>
          </div>
        </div>
      )}

      {vinculando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setVinculando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-end"><button onClick={() => setVinculando(null)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Marcá las cuotas que son parte de esta deuda. Su saldo se va a derivar de las cuotas vinculadas — los pagos se registran en la tab Cuotas a pagar.</p>
            {cuotasVinculables.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl py-8 text-center">
                <p className="text-sm font-bold">Sin cuotas para vincular</p>
                <p className="text-xs text-slate-400 mt-1 px-4">No tenés cuotas sueltas (sin deuda padre) ni vinculadas a esta deuda. Cargá cuotas primero desde la tab Cuotas a pagar.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {cuotasVinculables.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 rounded-lg p-3 cursor-pointer">
                    <input type="checkbox" checked={c.deuda_id === vinculando.id} onChange={() => toggleVinculo(c)} className="w-4 h-4 accent-rose-600" />
                    <span className="flex-1 text-sm">{c.concepto} — {fmt(Number(c.monto), c.moneda)}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center mt-4"><p className="text-xs text-slate-400">Sin cambios todavía.</p><button onClick={() => setVinculando(null)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-400 text-white rounded-lg"><Save className="w-4 h-4" /> Listo</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
