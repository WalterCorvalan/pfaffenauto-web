"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, Trash2, Pencil, TrendingUp, Landmark, CreditCard } from "lucide-react";
import { inputClass, labelClass } from "./shared";

export default function PatrimonioTab({ miId, miNombre, soyAdmin }: { miId: string; miNombre: string; soyAdmin: boolean }) {
  const [cargando, setCargando] = useState(true);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [autos, setAutos] = useState<any[]>([]);
  const [cuotasCobrar, setCuotasCobrar] = useState<any[]>([]);
  const [movsAgencia, setMovsAgencia] = useState<any[]>([]);
  const [cuotasPagar, setCuotasPagar] = useState<any[]>([]);
  const [deudas, setDeudas] = useState<any[]>([]);
  const [stockPropioUsd, setStockPropioUsd] = useState(0);
  const [incluirStock, setIncluirStock] = useState(false);

  const [showNueva, setShowNueva] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("Banco");
  const [moneda, setMoneda] = useState("USD");
  const [saldo, setSaldo] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    const [{ data: c }, { data: a }, { data: cc }, { data: ma }, { data: cp }, { data: d }] = await Promise.all([
      supabase2.from("espacio_cuentas_personales").select("*").eq("perfil_id", miId).order("created_at"),
      supabase2.from("espacio_autos_personales").select("valor_estimado_usd").eq("perfil_id", miId),
      supabase2.from("espacio_cuotas_cobrar").select("monto, monto_cobrado, moneda").eq("perfil_id", miId).eq("cobrada", false),
      supabase2.from("espacio_movimientos_agencia").select("tipo, monto, moneda").eq("perfil_id", miId).eq("saldado", false),
      supabase2.from("espacio_cuotas_pagar").select("monto, monto_pagado, moneda").eq("perfil_id", miId).eq("pagada", false),
      supabase2.from("espacio_deudas").select("monto, monto_pagado, moneda").eq("perfil_id", miId).eq("pagada", false),
    ]);
    setCuentas(c || []);
    setAutos(a || []);
    setCuotasCobrar(cc || []);
    setMovsAgencia(ma || []);
    setCuotasPagar(cp || []);
    setDeudas(d || []);
    if (soyAdmin) {
      const { data: v } = await supabase2.from("vehiculos").select("precio_venta").eq("propio_agencia", true).eq("estado", "disponible").eq("moneda_venta", "USD");
      setStockPropioUsd((v || []).reduce((acc, x) => acc + Number(x.precio_venta), 0));
    }
    setCargando(false);
  };
  useEffect(() => { cargar(); }, [miId]);

  const porMoneda = (lista: any[], campoTotal: string, campoPagado: string) => {
    const map: Record<string, number> = {};
    lista.forEach((x) => { map[x.moneda] = (map[x.moneda] || 0) + (Number(x[campoTotal]) - Number(x[campoPagado])); });
    return map;
  };

  const cuentasPorMoneda = useMemo(() => { const m: Record<string, number> = {}; cuentas.forEach((c) => { m[c.moneda] = (m[c.moneda] || 0) + Number(c.saldo_actual); }); return m; }, [cuentas]);
  const autosUsd = autos.reduce((a, x) => a + Number(x.valor_estimado_usd || 0), 0);
  const cobrosPendientes = porMoneda(cuotasCobrar, "monto", "monto_cobrado");
  const agenciaMeDebe = movsAgencia.filter((m) => m.tipo === "saque").reduce((acc, m) => { acc[m.moneda] = (acc[m.moneda] || 0) + Number(m.monto); return acc; }, {} as Record<string, number>);
  const yoDeboAgencia = movsAgencia.filter((m) => m.tipo === "aporte").reduce((acc, m) => { acc[m.moneda] = (acc[m.moneda] || 0) + Number(m.monto); return acc; }, {} as Record<string, number>);
  const cuotasPendientes = porMoneda(cuotasPagar, "monto", "monto_pagado");
  const deudasPersonales = porMoneda(deudas, "monto", "monto_pagado");

  const activosUsd = (cuentasPorMoneda.USD || 0) + autosUsd + (cobrosPendientes.USD || 0) + (agenciaMeDebe.USD || 0) - (yoDeboAgencia.USD || 0) + (incluirStock ? stockPropioUsd : 0);
  const activosArs = (cuentasPorMoneda.ARS || 0) + (cobrosPendientes.ARS || 0) + (agenciaMeDebe.ARS || 0) - (yoDeboAgencia.ARS || 0);
  const pasivosUsd = (cuotasPendientes.USD || 0) + (deudasPersonales.USD || 0);
  const pasivosArs = (cuotasPendientes.ARS || 0) + (deudasPersonales.ARS || 0);
  const netoUsd = activosUsd - pasivosUsd;
  const netoArs = activosArs - pasivosArs;

  const abrirNueva = () => { setEditando(null); setNombre(""); setTipo("Banco"); setMoneda("USD"); setSaldo(""); setNotas(""); setShowNueva(true); };
  const abrirEdicion = (c: any) => { setEditando(c); setNombre(c.nombre); setTipo(c.tipo); setMoneda(c.moneda); setSaldo(String(c.saldo_actual)); setNotas(c.notas || ""); setShowNueva(true); };

  const guardar = async () => {
    if (!nombre.trim()) return alert("Completá el nombre.");
    setGuardando(true);
    try {
      const payload = { nombre: nombre.trim(), tipo, moneda, saldo_actual: Number(saldo) || 0, notas: notas || null };
      if (editando) {
        const { data, error } = await supabase2.from("espacio_cuentas_personales").update(payload).eq("id", editando.id).select().single();
        if (error) throw error;
        setCuentas((prev) => prev.map((c) => (c.id === editando.id ? data : c)));
      } else {
        const { data, error } = await supabase2.from("espacio_cuentas_personales").insert({ perfil_id: miId, ...payload }).select().single();
        if (error) throw error;
        setCuentas((prev) => [...prev, data]);
      }
      setShowNueva(false);
    } catch { alert("No se pudo guardar."); } finally { setGuardando(false); }
  };

  const eliminar = async (c: any) => {
    if (!confirm(`¿Eliminar "${c.nombre}"?`)) return;
    await supabase2.from("espacio_cuentas_personales").delete().eq("id", c.id);
    setCuentas((prev) => prev.filter((x) => x.id !== c.id));
  };

  if (cargando) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div><p className="text-lg font-bold">Resumen patrimonial — {miNombre}</p><p className="text-xs text-slate-400">Vista consolidada de activos y pasivos personales. Cada moneda se calcula por separado — el tipo de cambio es volátil.</p></div>
        {soyAdmin && <label className="flex items-center gap-2 text-xs font-semibold shrink-0"><input type="checkbox" checked={incluirStock} onChange={(e) => setIncluirStock(e.target.checked)} className="w-4 h-4 accent-rose-600" /> Incluir stock propio (USD)</label>}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-5 mb-4">
        <p className="text-[10px] font-bold uppercase text-indigo-600 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Patrimonio neto estimado (USD)</p>
        <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300">USD {netoUsd.toLocaleString("es-AR")}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">+ $ {netoArs.toLocaleString("es-AR")} en pesos</p>
        <p className="text-[11px] text-slate-400 mt-1">Activos: USD {activosUsd.toLocaleString("es-AR")} · $ {activosArs.toLocaleString("es-AR")}   Pasivos: USD {pasivosUsd.toLocaleString("es-AR")} · $ {pasivosArs.toLocaleString("es-AR")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 mb-2"><Landmark className="w-3.5 h-3.5" /> Activos</p>
          <Fila label="Cuentas y billeteras (USD)" valor={`USD ${(cuentasPorMoneda.USD || 0).toLocaleString("es-AR")}`} />
          <Fila label="Cuentas y billeteras (ARS)" valor={`$ ${(cuentasPorMoneda.ARS || 0).toLocaleString("es-AR")}`} />
          <Fila label="Autos personales (estim.)" valor={`USD ${autosUsd.toLocaleString("es-AR")}`} />
          <Fila label="Cobros pendientes (USD)" valor={`+ USD ${(cobrosPendientes.USD || 0).toLocaleString("es-AR")}`} verde />
          <Fila label="Agencia me debe (USD)" valor={`+ USD ${(agenciaMeDebe.USD || 0).toLocaleString("es-AR")}`} verde />
          {incluirStock && <Fila label="Stock propio agencia (USD)" valor={`+ USD ${stockPropioUsd.toLocaleString("es-AR")}`} verde />}
        </div>
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-4">
          <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5 mb-2"><CreditCard className="w-3.5 h-3.5" /> Pasivos</p>
          <Fila label="Cuotas pendientes (USD)" valor={`USD ${(cuotasPendientes.USD || 0).toLocaleString("es-AR")}`} rojo />
          <Fila label="Cuotas pendientes (ARS)" valor={`$ ${(cuotasPendientes.ARS || 0).toLocaleString("es-AR")}`} rojo />
          <Fila label="Deudas personales (ARS)" valor={`$ ${(deudasPersonales.ARS || 0).toLocaleString("es-AR")}`} rojo />
          <Fila label="Deudas personales (USD)" valor={`USD ${(deudasPersonales.USD || 0).toLocaleString("es-AR")}`} rojo />
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold">Mis cuentas personales — {cuentas.length} cargada{cuentas.length === 1 ? "" : "s"}</p>
        <button onClick={abrirNueva} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Nueva cuenta</button>
      </div>
      {cuentas.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-12 text-center">
          <p className="text-sm font-bold">Sin cuentas registradas</p>
          <p className="text-xs text-slate-400 mt-1">Cargá tus cuentas: caja de ahorro, dólares cash, Mercado Pago, FCI, plazo fijo...</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {cuentas.map((c) => (
            <div key={c.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
              <div><p className="text-sm font-bold">{c.nombre} <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded ml-1">{c.tipo}</span></p><p className="text-sm font-bold text-emerald-600">{c.moneda === "ARS" ? "$" : "USD"} {Number(c.saldo_actual).toLocaleString("es-AR")}</p></div>
              <div className="flex gap-1"><button onClick={() => abrirEdicion(c)} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => eliminar(c)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button></div>
            </div>
          ))}
        </div>
      )}

      {showNueva && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNueva(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-end mb-1"><button onClick={() => setShowNueva(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Bancos, billeteras, dólares en mano, plazo fijo, FCI...</p>
            <label className={labelClass}>Nombre *</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Caja ahorro Galicia, Dólares casa, Mercado Pago..." className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Tipo</label><select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputClass}><option>Banco</option><option>Billetera digital</option><option>Efectivo</option><option>Plazo fijo</option><option>FCI</option><option>Otro</option></select></div>
              <div><label className={labelClass}>Moneda</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
            </div>
            <label className={labelClass + " mt-3"}>Saldo actual</label>
            <input type="number" value={saldo} onChange={(e) => setSaldo(e.target.value)} className={inputClass} />
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Banco, alias, número de cuenta..." className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNueva(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={guardar} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> {editando ? "Guardar cambios" : "Crear"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Fila({ label, valor, verde, rojo }: { label: string; valor: string; verde?: boolean; rojo?: boolean }) {
  return (
    <div className="flex justify-between text-xs py-1"><span className="text-slate-500 dark:text-slate-400">{label}</span><strong className={verde ? "text-emerald-600" : rojo ? "text-rose-600" : ""}>{valor}</strong></div>
  );
}
