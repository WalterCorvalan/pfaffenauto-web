"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, DollarSign } from "lucide-react";
import { inputClass, labelClass, fmt } from "./shared";

type Filtro = "todos" | "sin_cobrar" | "parciales" | "vencidos" | "ya_abonado";

export default function PagosDispTab({
  pagos, setPagos, cuentas, setCuentas, setMovimientos, expedientes,
}: { pagos: any[]; setPagos: (fn: any) => void; cuentas: any[]; setCuentas: (fn: any) => void; setMovimientos: (fn: any) => void; expedientes: any[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [showNuevo, setShowNuevo] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [cuentaId, setCuentaId] = useState("");
  const [expedienteId, setExpedienteId] = useState("");
  const [clientePropietario, setClientePropietario] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cobrando, setCobrando] = useState<any | null>(null);
  const [cbMonto, setCbMonto] = useState("");
  const [cbCuentaId, setCbCuentaId] = useState("");

  const hoy = new Date().toISOString().slice(0, 10);

  const pendientesPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    let n = 0;
    pagos.filter((p) => !p.cobrado).forEach((p) => { map[p.moneda] = (map[p.moneda] || 0) + (Number(p.monto) - Number(p.monto_cobrado)); n++; });
    return { map, n };
  }, [pagos]);

  const abonadoPorMoneda = useMemo(() => {
    const map: Record<string, number> = {};
    let n = 0;
    pagos.filter((p) => p.cobrado).forEach((p) => { map[p.moneda] = (map[p.moneda] || 0) + Number(p.monto_cobrado); n++; });
    return { map, n };
  }, [pagos]);

  const filtrados = useMemo(() => {
    let l = pagos;
    if (filtro === "sin_cobrar") l = l.filter((p) => !p.cobrado && Number(p.monto_cobrado) === 0);
    if (filtro === "parciales") l = l.filter((p) => !p.cobrado && Number(p.monto_cobrado) > 0);
    if (filtro === "vencidos") l = l.filter((p) => !p.cobrado && p.fecha < hoy);
    if (filtro === "ya_abonado") l = l.filter((p) => p.cobrado);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      l = l.filter((p) => p.descripcion.toLowerCase().includes(q) || (p.cliente_propietario || "").toLowerCase().includes(q));
    }
    return l;
  }, [pagos, filtro, busqueda]);

  const abrirNuevo = () => { setDescripcion(""); setMonto(""); setMoneda("USD"); setFecha(hoy); setCuentaId(""); setExpedienteId(""); setClientePropietario(""); setNotas(""); setShowNuevo(true); };

  const crear = async () => {
    if (!descripcion.trim() || !monto) return alert("Completá descripción y monto.");
    setGuardando(true);
    try {
      const { data, error } = await supabase2.from("pagos_disponibles").insert({
        descripcion: descripcion.trim(), monto: Number(monto), moneda, fecha, cuenta_id: cuentaId || null,
        expediente_id: expedienteId || null, cliente_propietario: clientePropietario || null, notas: notas || null,
      }).select().single();
      if (error) throw error;
      setPagos((prev: any[]) => [data, ...prev]);
      setShowNuevo(false);
    } catch { alert("No se pudo registrar el pago."); } finally { setGuardando(false); }
  };

  const abrirCobro = (p: any) => {
    setCobrando(p);
    setCbMonto(String(Number(p.monto) - Number(p.monto_cobrado)));
    setCbCuentaId(p.cuenta_id || cuentas.find((c) => c.moneda === p.moneda)?.id || "");
  };

  const confirmarCobro = async () => {
    if (!cobrando || !cbCuentaId || !cbMonto) return alert("Completá caja y monto.");
    setGuardando(true);
    try {
      const { data: movId, error } = await supabase2.rpc("cobrar_pago_disponible", { p_id: cobrando.id, p_monto: Number(cbMonto), p_cuenta_id: cbCuentaId });
      if (error) throw error;
      const { data: fresh } = await supabase2.from("pagos_disponibles").select("*").eq("id", cobrando.id).single();
      setPagos((prev: any[]) => prev.map((p) => (p.id === cobrando.id ? fresh : p)));
      const [{ data: nuevoMov }, { data: nuevoSaldo }] = await Promise.all([
        supabase2.from("movimientos_caja").select("*, cuenta:cuentas(nombre, moneda)").eq("id", movId).single(),
        supabase2.rpc("saldo_cuenta", { p_cuenta_id: cbCuentaId }),
      ]);
      if (nuevoMov) setMovimientos((prev: any[]) => [nuevoMov, ...prev]);
      setCuentas((prev: any[]) => prev.map((c) => (c.id === cbCuentaId ? { ...c, saldo: Number(nuevoSaldo) || 0 } : c)));
      setCobrando(null);
    } catch (err: any) {
      alert(err.message || "No se pudo registrar el pago.");
    } finally { setGuardando(false); }
  };

  const FILTROS: { value: Filtro; label: string }[] = [
    { value: "todos", label: `Todos los pendientes · ${pendientesPorMoneda.n}` },
    { value: "sin_cobrar", label: `Sin cobrar · ${pagos.filter((p) => !p.cobrado && Number(p.monto_cobrado) === 0).length}` },
    { value: "parciales", label: `Parciales · ${pagos.filter((p) => !p.cobrado && Number(p.monto_cobrado) > 0).length}` },
    { value: "vencidos", label: `Vencidos · ${pagos.filter((p) => !p.cobrado && p.fecha < hoy).length}` },
    { value: "ya_abonado", label: `Ya abonado · ${abonadoPorMoneda.n}` },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase text-amber-600">⏳ Pendientes de cobro</p>
          {Object.keys(pendientesPorMoneda.map).length === 0 ? <p className="text-lg">—</p> : Object.entries(pendientesPorMoneda.map).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}
          <p className="text-[10px] text-amber-600/70">Aún falta cobrar del cliente. {pendientesPorMoneda.n} sin cobrar</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase text-indigo-600">✓ Ya abonado al propietario</p>
          {Object.keys(abonadoPorMoneda.map).length === 0 ? <p className="text-lg">—</p> : Object.entries(abonadoPorMoneda.map).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}
          <p className="text-[10px] text-indigo-600/70">Operaciones cerradas: cliente pagó todo + egreso al propietario hecho. {abonadoPorMoneda.n} pagos</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {FILTROS.map((f) => (
          <button key={f.value} onClick={() => setFiltro(f.value)} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${filtro === f.value ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>{f.label}</button>
        ))}
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar vehículo, cliente, notas..." className="ml-auto text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 outline-none" />
        <button onClick={abrirNuevo} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-3.5 h-3.5" /> Nuevo</button>
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin resultados</p></div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 dark:border-white/10 text-left text-slate-400"><th className="p-2.5">Vehículo</th><th className="p-2.5">Monto</th><th className="p-2.5">Fecha cobro</th><th className="p-2.5">Estado</th><th className="p-2.5">Notas</th><th className="p-2.5">Acciones</th></tr></thead>
            <tbody>
              {filtrados.map((p) => {
                const vencido = !p.cobrado && p.fecha < hoy;
                const parcial = !p.cobrado && Number(p.monto_cobrado) > 0;
                return (
                  <tr key={p.id} className="border-b border-slate-50 dark:border-white/5">
                    <td className="p-2.5 font-bold">{p.descripcion}{p.cliente_propietario ? <span className="block text-[10px] text-slate-400 font-normal">{p.cliente_propietario}</span> : ""}</td>
                    <td className="p-2.5 font-mono font-bold">{fmt(p.monto, p.moneda)}{parcial && <span className="block text-[10px] text-slate-400 font-normal">cobrado {fmt(p.monto_cobrado, p.moneda)}</span>}</td>
                    <td className="p-2.5">{p.fecha}</td>
                    <td className="p-2.5">
                      {p.cobrado ? <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700">Abonado</span>
                        : vencido ? <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700">Vencido</span>
                        : parcial ? <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700">Parcial</span>
                        : <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500">Sin cobrar → cobrar</span>}
                    </td>
                    <td className="p-2.5 text-slate-400">{p.notas || "—"}</td>
                    <td className="p-2.5">{!p.cobrado && <button onClick={() => abrirCobro(p)} className="flex items-center gap-1 text-emerald-600 font-bold"><DollarSign className="w-3.5 h-3.5" /> Cobrar</button>}</td>
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
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Nuevo pago disponible</h3><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Pagos pendientes/disponibles para entregar al propietario. Al marcarse Cobrado se genera el Egreso en Finanzas automáticamente.</p>
            <label className={labelClass}>Descripción / Vehículo *</label>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Monto *</label><input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Moneda *</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
            </div>
            <label className={labelClass + " mt-3"}>Fecha registro</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
            <label className={labelClass + " mt-3"}>Caja prevista</label>
            <select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} className={inputClass}><option value="">— Sin definir —</option>{cuentas.filter((c) => c.moneda === moneda).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Expediente vinculado (opcional)</label><select value={expedienteId} onChange={(e) => setExpedienteId(e.target.value)} className={inputClass}><option value="">— Sin expediente —</option>{expedientes.map((e) => <option key={e.id} value={e.id}>{e.titulo || `EXP — ${e.id.slice(0, 8)}`}</option>)}</select></div>
              <div><label className={labelClass}>Cliente / propietario</label><input value={clientePropietario} onChange={(e) => setClientePropietario(e.target.value)} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={inputClass} />
            <p className="text-[10px] text-slate-400 mt-2">El pago queda como pendiente — no afecta saldos hasta que se marque Cobrado.</p>
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crear} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Registrar pago</button></div>
          </div>
        </div>
      )}

      {cobrando && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setCobrando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-3"><h3 className="text-base font-bold">Pagar al propietario</h3><button onClick={() => setCobrando(null)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-sm font-bold mb-2">{cobrando.descripcion}</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelClass}>Monto ({cobrando.moneda}) *</label><input type="number" value={cbMonto} onChange={(e) => setCbMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Caja *</label><select value={cbCuentaId} onChange={(e) => setCbCuentaId(e.target.value)} className={inputClass}><option value="">— Elegí —</option>{cuentas.filter((c) => c.moneda === cobrando.moneda).map((c) => <option key={c.id} value={c.id}>{c.nombre} · saldo {fmt(c.saldo, c.moneda)}</option>)}</select></div>
            </div>
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setCobrando(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={confirmarCobro} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Confirmar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
