"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, Trash2, Pencil } from "lucide-react";
import { inputClass, labelClass } from "./shared";

export default function SaldoAgenciaTab({ miId }: { miId: string }) {
  const [movs, setMovs] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showNuevo, setShowNuevo] = useState(false);
  const [tipo, setTipo] = useState("saque");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [motivo, setMotivo] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    const { data } = await supabase2.from("espacio_movimientos_agencia").select("*").eq("perfil_id", miId).order("fecha", { ascending: false });
    setMovs(data || []);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, [miId]);

  const sinSaldar = movs.filter((m) => !m.saldado);

  const totales = useMemo(() => {
    const map: Record<string, { meDebe: number; leDebo: number }> = {};
    sinSaldar.forEach((m) => {
      if (!map[m.moneda]) map[m.moneda] = { meDebe: 0, leDebo: 0 };
      if (m.tipo === "saque") map[m.moneda].meDebe += Number(m.monto);
      else map[m.moneda].leDebo += Number(m.monto);
    });
    return map;
  }, [sinSaldar]);

  const monedas = Array.from(new Set([...Object.keys(totales), "USD", "ARS"]));

  const crear = async () => {
    if (!monto) return alert("Ingresá un monto.");
    setGuardando(true);
    try {
      const { data, error } = await supabase2.from("espacio_movimientos_agencia").insert({ perfil_id: miId, tipo, monto: Number(monto), moneda, fecha, motivo: motivo || null, notas: notas || null }).select().single();
      if (error) throw error;
      setMovs((prev) => [data, ...prev]);
      setShowNuevo(false);
      setMonto(""); setMotivo(""); setNotas("");
    } catch { alert("No se pudo crear el movimiento."); } finally { setGuardando(false); }
  };

  const toggleSaldado = async (m: any) => {
    const nuevo = !m.saldado;
    await supabase2.from("espacio_movimientos_agencia").update({ saldado: nuevo }).eq("id", m.id);
    setMovs((prev) => prev.map((x) => (x.id === m.id ? { ...x, saldado: nuevo } : x)));
  };

  const eliminar = async (m: any) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    await supabase2.from("espacio_movimientos_agencia").delete().eq("id", m.id);
    setMovs((prev) => prev.filter((x) => x.id !== m.id));
  };

  if (cargando) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div><p className="text-lg font-bold">Préstamos cruzados con la agencia — {sinSaldar.length} sin saldar</p><p className="text-xs text-slate-400">Registrá cuando sacás plata de la caja para uso personal o cuando ponés tuya en la agencia.</p></div>
        <button onClick={() => setShowNuevo(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shrink-0"><Plus className="w-4 h-4" /> Nuevo movimiento</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase text-emerald-600">↙ Agencia me debe</p>
          {monedas.map((m) => <p key={m} className="text-lg font-black">{m === "ARS" ? "$" : "USD"} {(totales[m]?.meDebe || 0).toLocaleString("es-AR")}</p>)}
        </div>
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase text-rose-500">↗ Yo debo a agencia</p>
          {monedas.map((m) => <p key={m} className="text-lg font-black">{m === "ARS" ? "$" : "USD"} {(totales[m]?.leDebo || 0).toLocaleString("es-AR")}</p>)}
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase text-indigo-600">Neto</p>
          {monedas.map((m) => {
            const neto = (totales[m]?.meDebe || 0) - (totales[m]?.leDebo || 0);
            return <p key={m} className="text-lg font-black">{m === "ARS" ? "$" : "USD"} {Math.abs(neto).toLocaleString("es-AR")} <span className="text-[10px] font-normal text-slate-400">{neto >= 0 ? "a favor mío" : "a favor agencia"}</span></p>;
          })}
        </div>
      </div>

      {movs.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center">
          <p className="text-sm font-bold">Sin movimientos</p>
          <p className="text-xs text-slate-400 mt-1">Registrá cuando sacás plata de la caja para gastos personales o cuando ponés tuya a la agencia.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {movs.map((m) => (
            <div key={m.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
              <button onClick={() => toggleSaldado(m)} className={`w-4 h-4 rounded-full border-2 shrink-0 ${m.saldado ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-white/20"}`} />
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${m.tipo === "saque" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700" : "bg-rose-50 dark:bg-rose-500/10 text-rose-700"}`}>{m.tipo === "saque" ? "AG→yo" : "yo→AG"}</span>
              <span className="font-bold text-sm">{m.moneda} {Number(m.monto).toLocaleString("es-AR")}</span>
              {m.motivo && <span className="text-xs text-slate-400">{m.motivo}</span>}
              <span className="text-[11px] text-slate-400 ml-auto shrink-0">{m.fecha}</span>
              <button className="p-1.5 text-slate-400"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => eliminar(m)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      {showNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevo(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Nuevo movimiento</h3><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Plata que sale o entra de la caja para uso personal.</p>
            <label className={labelClass}>Tipo *</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputClass}>
              <option value="saque">Saqué de la caja (agencia → yo)</option>
              <option value="aporte">Puse de mi bolsillo (yo → agencia)</option>
            </select>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Monto *</label><input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Moneda</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
            </div>
            <label className={labelClass + " mt-3"}>Fecha *</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
            <label className={labelClass + " mt-3"}>Motivo</label>
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Vacaciones, compra personal, urgencia agencia..." className={inputClass} />
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crear} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Crear</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
