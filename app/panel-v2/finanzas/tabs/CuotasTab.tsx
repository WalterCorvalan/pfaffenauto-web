"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, ListPlus, DollarSign, Trash2 } from "lucide-react";
import { inputClass, labelClass, fmt, diasHasta } from "./shared";

const FREQ_DIAS: Record<string, number> = { Mensual: 30, Bimestral: 60, Anual: 365 };

function badge(fecha: string) {
  const d = diasHasta(fecha);
  if (d < 0) return { texto: `Vencida ${-d}d`, clase: "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300" };
  if (d <= 7) return { texto: `Vence en ${d}d`, clase: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300" };
  return { texto: `En fecha (${d}d)`, clase: "bg-slate-100 dark:bg-white/10 text-slate-500" };
}

export default function CuotasTab({
  cuotasCobrar, setCuotasCobrar, cuotasPagar, setCuotasPagar, cuentas, setCuentas, setMovimientos, clientes, vehiculos, miId,
}: { cuotasCobrar: any[]; setCuotasCobrar: (fn: any) => void; cuotasPagar: any[]; setCuotasPagar: (fn: any) => void; cuentas: any[]; setCuentas: (fn: any) => void; setMovimientos: (fn: any) => void; clientes: any[]; vehiculos: any[]; miId: string }) {
  const [sub, setSub] = useState<"cobrar" | "pagar">("cobrar");

  // A cobrar
  const [showNuevaC, setShowNuevaC] = useState(false);
  const [cClienteId, setCClienteId] = useState("");
  const [cConcepto, setCConcepto] = useState("");
  const [cMoneda, setCMoneda] = useState("USD");
  const [cMonto, setCMonto] = useState("");
  const [cVencimiento, setCVencimiento] = useState("");
  const [guardandoC, setGuardandoC] = useState(false);

  // A pagar
  const [showNuevaP, setShowNuevaP] = useState(false);
  const [pAcreedor, setPAcreedor] = useState("");
  const [pTipoDeuda, setPTipoDeuda] = useState("compra");
  const [pConcepto, setPConcepto] = useState("");
  const [pVehiculoId, setPVehiculoId] = useState("");
  const [pMoneda, setPMoneda] = useState("USD");
  const [pMontoCuota, setPMontoCuota] = useState("");
  const [pCantidad, setPCantidad] = useState("1");
  const [pFrecuencia, setPFrecuencia] = useState("Mensual");
  const [pPrimerVencimiento, setPPrimerVencimiento] = useState(new Date().toISOString().slice(0, 10));
  const [pNotas, setPNotas] = useState("");
  const [guardandoP, setGuardandoP] = useState(false);

  const [pagando, setPagando] = useState<{ cuota: any; direccion: "cobrar" | "pagar" } | null>(null);
  const [pgMonto, setPgMonto] = useState("");
  const [pgCajaId, setPgCajaId] = useState("");
  const [pgFormaPago, setPgFormaPago] = useState("");
  const [pgFecha, setPgFecha] = useState(new Date().toISOString().slice(0, 10));
  const [pgNotas, setPgNotas] = useState("");
  const [guardandoPg, setGuardandoPg] = useState(false);

  const pendientesCobrar = cuotasCobrar.filter((c) => !c.cobrada);
  const pendientesPagar = cuotasPagar.filter((c) => !c.pagada);

  const totales = (lista: any[], campoMonto: string, campoPagado: string) => {
    const map: Record<string, number> = {};
    lista.forEach((c) => { map[c.moneda] = (map[c.moneda] || 0) + (Number(c[campoMonto]) - Number(c[campoPagado])); });
    return map;
  };
  const pendienteCobrarPorMoneda = totales(pendientesCobrar, "monto", "monto_cobrado");
  const pendientePagarPorMoneda = totales(pendientesPagar, "monto", "monto_pagado");

  const crearCuotaCobrar = async () => {
    if (!cConcepto.trim() || !cMonto || !cVencimiento) return alert("Completá concepto, monto y vencimiento.");
    setGuardandoC(true);
    try {
      const { data, error } = await supabase2.from("cuotas_cobrar_clientes").insert({
        cliente_id: cClienteId || null, concepto: cConcepto.trim(), moneda: cMoneda, monto: Number(cMonto), vencimiento: cVencimiento, creado_por: miId,
      }).select("*, cliente:clientes(nombre)").single();
      if (error) throw error;
      setCuotasCobrar((prev: any[]) => [...prev, data]);
      setShowNuevaC(false);
      setCClienteId(""); setCConcepto(""); setCMonto(""); setCVencimiento("");
    } catch { alert("No se pudo crear la cuota."); } finally { setGuardandoC(false); }
  };

  const crearCuotaPagar = async () => {
    if (!pAcreedor.trim() || !pMontoCuota) return alert("Completá acreedor y monto por cuota.");
    setGuardandoP(true);
    try {
      const n = Number(pCantidad) || 1;
      const filas = Array.from({ length: n }, (_, i) => {
        const v = new Date(pPrimerVencimiento + "T00:00:00");
        v.setDate(v.getDate() + FREQ_DIAS[pFrecuencia] * i);
        return {
          acreedor: pAcreedor.trim(), tipo_deuda: pTipoDeuda, concepto: pConcepto || null, vehiculo_id: pTipoDeuda === "auto_cuotas" ? (pVehiculoId || null) : null,
          moneda: pMoneda, monto: Number(pMontoCuota), vencimiento: v.toISOString().slice(0, 10), cuota_actual: i + 1, cuota_total: n, notas: pNotas || null, creado_por: miId,
        };
      });
      const { data, error } = await supabase2.from("cuotas_pagar_agencia").insert(filas).select();
      if (error) throw error;
      setCuotasPagar((prev: any[]) => [...prev, ...(data || [])]);
      setShowNuevaP(false);
      setPAcreedor(""); setPConcepto(""); setPVehiculoId(""); setPMontoCuota(""); setPNotas("");
    } catch { alert("No se pudo crear la deuda."); } finally { setGuardandoP(false); }
  };

  const abrirPago = (cuota: any, direccion: "cobrar" | "pagar") => {
    setPagando({ cuota, direccion });
    const campoPagado = direccion === "cobrar" ? "monto_cobrado" : "monto_pagado";
    setPgMonto(String(Number(cuota.monto) - Number(cuota[campoPagado])));
    setPgCajaId(cuentas.find((c) => c.moneda === cuota.moneda)?.id || "");
    setPgFormaPago(""); setPgFecha(new Date().toISOString().slice(0, 10)); setPgNotas("");
  };

  const confirmarPago = async () => {
    if (!pagando || !pgCajaId || !pgMonto) return alert("Completá caja y monto.");
    setGuardandoPg(true);
    try {
      const rpcName = pagando.direccion === "cobrar" ? "cobrar_cuota_cliente" : "pagar_cuota_agencia";
      const { data: movId, error } = await supabase2.rpc(rpcName, { p_cuota_id: pagando.cuota.id, p_monto: Number(pgMonto), p_cuenta_id: pgCajaId, p_forma_pago: pgFormaPago || null, p_fecha: pgFecha, p_notas: pgNotas || null });
      if (error) throw error;

      if (pagando.direccion === "cobrar") {
        const { data: fresh } = await supabase2.from("cuotas_cobrar_clientes").select("*, cliente:clientes(nombre)").eq("id", pagando.cuota.id).single();
        setCuotasCobrar((prev: any[]) => prev.map((c) => (c.id === pagando.cuota.id ? fresh : c)));
      } else {
        const { data: fresh } = await supabase2.from("cuotas_pagar_agencia").select("*").eq("id", pagando.cuota.id).single();
        setCuotasPagar((prev: any[]) => prev.map((c) => (c.id === pagando.cuota.id ? fresh : c)));
      }

      const [{ data: nuevoMov }, { data: nuevoSaldo }] = await Promise.all([
        supabase2.from("movimientos_caja").select("*, cuenta:cuentas(nombre, moneda)").eq("id", movId).single(),
        supabase2.rpc("saldo_cuenta", { p_cuenta_id: pgCajaId }),
      ]);
      if (nuevoMov) setMovimientos((prev: any[]) => [nuevoMov, ...prev]);
      setCuentas((prev: any[]) => prev.map((c) => (c.id === pgCajaId ? { ...c, saldo: Number(nuevoSaldo) || 0 } : c)));

      setPagando(null);
    } catch (err: any) {
      alert(err.message || "No se pudo registrar el movimiento.");
    } finally {
      setGuardandoPg(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <button onClick={() => setSub("cobrar")} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 ${sub === "cobrar" ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>💰 A cobrar</button>
        <button onClick={() => setSub("pagar")} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 ${sub === "pagar" ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>💸 A pagar</button>
      </div>

      {sub === "cobrar" && (
        <div>
          <p className="text-xs text-slate-400 mb-3">Las financiaciones de los clientes y su estado. Un mismo cliente puede tener varias.</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Pendiente</p>{Object.keys(pendienteCobrarPorMoneda).length === 0 ? <p className="text-sm">—</p> : Object.entries(pendienteCobrarPorMoneda).map(([m, n]) => <p key={m} className="text-sm font-black">{fmt(n, m)}</p>)}</div>
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Cuotas pendientes</p><p className="text-lg font-black">{pendientesCobrar.length}</p></div>
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-rose-500">Vencidas</p><p className="text-lg font-black">{pendientesCobrar.filter((c) => diasHasta(c.vencimiento) < 0).length}</p></div>
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-indigo-600">Próx. 7 días</p><p className="text-lg font-black">{pendientesCobrar.filter((c) => { const d = diasHasta(c.vencimiento); return d >= 0 && d <= 7; }).length}</p></div>
            <button onClick={() => setShowNuevaC(true)} className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl"><Plus className="w-4 h-4" /> Nueva cuota</button>
          </div>

          {cuotasCobrar.length === 0 ? <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Aún no hay cuotas</p></div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cuotasCobrar.map((c) => {
                const b = badge(c.vencimiento);
                return (
                  <div key={c.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div><p className="text-sm font-bold">{c.cliente?.nombre || "Sin cliente"}</p><p className="text-xs text-slate-400">{c.concepto}{c.cuota_actual ? ` (${c.cuota_actual}/${c.cuota_total})` : ""}</p></div>
                      {!c.cobrada && <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${b.clase}`}>{b.texto}</span>}
                      {c.cobrada && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 shrink-0">Cobrada</span>}
                    </div>
                    <p className="text-lg font-black mt-1">{fmt(c.monto, c.moneda)}</p>
                    {c.monto_cobrado > 0 && !c.cobrada && <p className="text-[11px] text-slate-400">Cobrado: {fmt(c.monto_cobrado, c.moneda)}</p>}
                    <p className="text-[11px] text-slate-400">Vence: {c.vencimiento}</p>
                    {!c.cobrada && <button onClick={() => abrirPago(c, "cobrar")} className="mt-2 flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"><DollarSign className="w-3.5 h-3.5" /> Marcar cobrada / parcial</button>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {sub === "pagar" && (
        <div>
          <p className="text-xs text-slate-400 mb-3">Lo que la agencia debe en cuotas: autos comprados financiados, deudas con financieras o bancos, compras a proveedores. Cada pago sale de una caja y queda registrado como egreso.</p>
          <button onClick={() => setShowNuevaP(true)} className="flex items-center gap-1.5 px-4 py-2 mb-4 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Nueva deuda en cuotas</button>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Deuda pendiente</p>{Object.keys(pendientePagarPorMoneda).length === 0 ? <p className="text-sm">—</p> : Object.entries(pendientePagarPorMoneda).map(([m, n]) => <p key={m} className="text-sm font-black">{fmt(n, m)}</p>)}<p className="text-[10px] text-slate-400">{pendientesPagar.length} cuotas sin pagar</p></div>
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-rose-500">Vencidas</p><p className="text-lg font-black">{pendientesPagar.filter((c) => diasHasta(c.vencimiento) < 0).length}</p><p className="text-[10px] text-slate-400">cuotas pasadas de fecha</p></div>
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-amber-600">Vencen en 7 días</p><p className="text-lg font-black">{pendientesPagar.filter((c) => { const d = diasHasta(c.vencimiento); return d >= 0 && d <= 7; }).length}</p></div>
          </div>

          {cuotasPagar.length === 0 ? (
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center">
              <p className="text-sm font-bold">Todavía no hay deudas cargadas</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Cargá acá lo que la agencia paga en cuotas: un auto comprado financiado, una deuda con una financiera, una compra a un proveedor. Después cada pago descuenta de la caja que elijas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cuotasPagar.map((c) => {
                const b = badge(c.vencimiento);
                return (
                  <div key={c.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div><p className="text-sm font-bold">{c.acreedor}</p><p className="text-xs text-slate-400">{c.concepto}{c.cuota_actual ? ` (${c.cuota_actual}/${c.cuota_total})` : ""}</p></div>
                      {!c.pagada && <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${b.clase}`}>{b.texto}</span>}
                      {c.pagada && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 shrink-0">Pagada</span>}
                    </div>
                    <p className="text-lg font-black mt-1">{fmt(c.monto, c.moneda)}</p>
                    {c.monto_pagado > 0 && !c.pagada && <p className="text-[11px] text-slate-400">Pagado: {fmt(c.monto_pagado, c.moneda)}</p>}
                    <p className="text-[11px] text-slate-400">Vence: {c.vencimiento}</p>
                    {!c.pagada && <button onClick={() => abrirPago(c, "pagar")} className="mt-2 flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><DollarSign className="w-3.5 h-3.5" /> Pagar / parcial</button>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showNuevaC && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevaC(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-4"><h3 className="text-lg font-bold">Nueva cuota a cobrar</h3><button onClick={() => setShowNuevaC(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <label className={labelClass}>Cliente</label>
            <select value={cClienteId} onChange={(e) => setCClienteId(e.target.value)} className={inputClass}><option value="">— Sin cliente —</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
            <label className={labelClass + " mt-3"}>Concepto *</label>
            <input value={cConcepto} onChange={(e) => setCConcepto(e.target.value)} placeholder="Financiación saldo, cuota 3/12..." className={inputClass} />
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>Monto *</label><input type="number" value={cMonto} onChange={(e) => setCMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Moneda</label><select value={cMoneda} onChange={(e) => setCMoneda(e.target.value)} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
              <div><label className={labelClass}>Vencimiento *</label><input type="date" value={cVencimiento} onChange={(e) => setCVencimiento(e.target.value)} className={inputClass} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevaC(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crearCuotaCobrar} disabled={guardandoC} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Crear</button></div>
          </div>
        </div>
      )}

      {showNuevaP && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevaP(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Nueva deuda en cuotas</h3><button onClick={() => setShowNuevaP(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Lo que la agencia va a pagar en cuotas. Se generan los vencimientos solos.</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelClass}>¿A quién se le paga? *</label><input value={pAcreedor} onChange={(e) => setPAcreedor(e.target.value)} placeholder="Ej: Banco Nación" className={inputClass} /><p className="text-[10px] text-slate-400 mt-0.5">Financiera, banco, proveedor, particular</p></div>
              <div><label className={labelClass}>Tipo de deuda</label><select value={pTipoDeuda} onChange={(e) => setPTipoDeuda(e.target.value)} className={inputClass}><option value="compra">Compra / gasto</option><option value="auto_cuotas">Auto comprado en cuotas</option><option value="financiera">Financiera / banco</option></select></div>
            </div>
            <label className={labelClass + " mt-3"}>¿De qué es la deuda?</label>
            <input value={pConcepto} onChange={(e) => setPConcepto(e.target.value)} placeholder="Ej: Ford Ranger 0km / aire acondicionado del salón" className={inputClass} />
            <p className="text-[10px] text-slate-400 mt-0.5">Queda en el concepto del egreso</p>
            {pTipoDeuda === "auto_cuotas" && (
              <><label className={labelClass + " mt-3"}>Vincular auto del stock</label><select value={pVehiculoId} onChange={(e) => setPVehiculoId(e.target.value)} className={inputClass}><option value="">— Sin vincular —</option>{vehiculos.map((v) => <option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.patente ? `— ${v.patente}` : ""}</option>)}</select></>
            )}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Importe de cada cuota *</label><input type="number" value={pMontoCuota} onChange={(e) => setPMontoCuota(e.target.value)} placeholder="2500" className={inputClass} /></div>
              <div><label className={labelClass}>Moneda</label><select value={pMoneda} onChange={(e) => setPMoneda(e.target.value)} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Cantidad de cuotas *</label><input type="number" value={pCantidad} onChange={(e) => setPCantidad(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Frecuencia</label><select value={pFrecuencia} onChange={(e) => setPFrecuencia(e.target.value)} className={inputClass}><option>Mensual</option><option>Bimestral</option><option>Anual</option></select></div>
            </div>
            <label className={labelClass + " mt-3"}>Primer vencimiento *</label>
            <input type="date" value={pPrimerVencimiento} onChange={(e) => setPPrimerVencimiento(e.target.value)} className={inputClass} />
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={pNotas} onChange={(e) => setPNotas(e.target.value)} rows={2} className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevaP(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crearCuotaPagar} disabled={guardandoP} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><ListPlus className="w-4 h-4" /> Crear plan</button></div>
          </div>
        </div>
      )}

      {pagando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPagando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-3"><h3 className="text-base font-bold">{pagando.direccion === "cobrar" ? "Cobrar" : "Pagar"} cuota</h3><button onClick={() => setPagando(null)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelClass}>Monto ({pagando.cuota.moneda}) *</label><input type="number" value={pgMonto} onChange={(e) => setPgMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Caja *</label><select value={pgCajaId} onChange={(e) => setPgCajaId(e.target.value)} className={inputClass}><option value="">— Elegí —</option>{cuentas.filter((c) => c.moneda === pagando.cuota.moneda).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Fecha</label><input type="date" value={pgFecha} onChange={(e) => setPgFecha(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Forma de pago</label><input value={pgFormaPago} onChange={(e) => setPgFormaPago(e.target.value)} placeholder="Efectivo, transferencia..." className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={pgNotas} onChange={(e) => setPgNotas(e.target.value)} rows={2} className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setPagando(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={confirmarPago} disabled={guardandoPg} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Confirmar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
