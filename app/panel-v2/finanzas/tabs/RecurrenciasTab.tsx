"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, Send, Download, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { inputClass, labelClass, fmt } from "./shared";

function mesesAtras(n: number) {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) { out.push(d.toISOString().slice(0, 7)); d.setMonth(d.getMonth() - 1); }
  return out;
}
function mesesAdelante(n: number) {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) { out.push(d.toISOString().slice(0, 7)); d.setMonth(d.getMonth() + 1); }
  return out;
}
function labelMes(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }).replace(".", "").toUpperCase();
}

export default function RecurrenciasTab({
  recurrencias, setRecurrencias, generaciones, setGeneraciones, cuentas, setCuentas, movimientos, setMovimientos,
}: { recurrencias: any[]; setRecurrencias: (fn: any) => void; generaciones: any[]; setGeneraciones: (fn: any) => void; cuentas: any[]; setCuentas: (fn: any) => void; movimientos: any[]; setMovimientos: (fn: any) => void }) {
  const [showNuevo, setShowNuevo] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("egreso");
  const [categoria, setCategoria] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [diaMes, setDiaMes] = useState("1");
  const [cuentaId, setCuentaId] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mesesExpandidos, setMesesExpandidos] = useState<Record<string, boolean>>({});
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const mesActual = new Date().toISOString().slice(0, 7);
  const activas = recurrencias.filter((r) => r.estado === "activa");
  const pausadas = recurrencias.filter((r) => r.estado === "pausada");
  const generadasEsteMes = generaciones.filter((g) => g.mes.slice(0, 7) === mesActual);
  const pendientesEsteMes = activas.filter((r) => !generadasEsteMes.some((g) => g.recurrencia_id === r.id));

  const compromisoPorMoneda = useMemo(() => {
    const map: Record<string, { ingresos: number; egresos: number }> = {};
    activas.forEach((r) => {
      map[r.moneda] = map[r.moneda] || { ingresos: 0, egresos: 0 };
      if (r.tipo === "ingreso") map[r.moneda].ingresos += Number(r.monto); else map[r.moneda].egresos += Number(r.monto);
    });
    return map;
  }, [activas]);

  const historico = mesesAtras(6);
  const proyeccion = mesesAdelante(12);

  const abrirNuevo = () => { setEditando(null); setNombre(""); setTipo("egreso"); setCategoria(""); setMonto(""); setMoneda("USD"); setDiaMes("1"); setCuentaId(""); setNotas(""); setShowNuevo(true); };
  const abrirEditar = (r: any) => { setEditando(r); setNombre(r.nombre); setTipo(r.tipo); setCategoria(r.categoria || ""); setMonto(String(r.monto)); setMoneda(r.moneda); setDiaMes(String(r.dia_mes)); setCuentaId(r.cuenta_id); setNotas(r.notas || ""); setShowNuevo(true); };

  const guardar = async () => {
    if (!nombre.trim() || !monto || !cuentaId) return alert("Completá nombre, monto y caja.");
    setGuardando(true);
    try {
      const payload = { nombre: nombre.trim(), tipo, categoria: categoria || null, monto: Number(monto), moneda, dia_mes: Number(diaMes) || 1, cuenta_id: cuentaId, notas: notas || null };
      if (editando) {
        const { data, error } = await supabase2.from("finanzas_recurrencias").update(payload).eq("id", editando.id).select().single();
        if (error) throw error;
        setRecurrencias((prev: any[]) => prev.map((r) => (r.id === editando.id ? data : r)));
      } else {
        const { data, error } = await supabase2.from("finanzas_recurrencias").insert(payload).select().single();
        if (error) throw error;
        setRecurrencias((prev: any[]) => [data, ...prev]);
      }
      setShowNuevo(false);
    } catch { alert("No se pudo guardar la recurrencia."); } finally { setGuardando(false); }
  };

  const pausarToggle = async (r: any) => {
    const nuevoEstado = r.estado === "activa" ? "pausada" : "activa";
    await supabase2.from("finanzas_recurrencias").update({ estado: nuevoEstado }).eq("id", r.id);
    setRecurrencias((prev: any[]) => prev.map((x) => (x.id === r.id ? { ...x, estado: nuevoEstado } : x)));
  };

  const eliminarRecurrencia = async (r: any) => {
    if (!confirm(`¿Eliminar la recurrencia "${r.nombre}"? No revierte movimientos ya generados.`)) return;
    await supabase2.from("finanzas_recurrencias").delete().eq("id", r.id);
    setRecurrencias((prev: any[]) => prev.filter((x) => x.id !== r.id));
  };

  const generar = async (r: any, mes = mesActual) => {
    setGuardando(true);
    try {
      const { data: movId, error } = await supabase2.rpc("generar_recurrencia", { p_id: r.id, p_mes: `${mes}-01` });
      if (error) throw error;
      const [{ data: nuevoMov }, { data: nuevoSaldo }] = await Promise.all([
        supabase2.from("movimientos_caja").select("*, cuenta:cuentas(nombre, moneda)").eq("id", movId).single(),
        supabase2.rpc("saldo_cuenta", { p_cuenta_id: r.cuenta_id }),
      ]);
      if (nuevoMov) setMovimientos((prev: any[]) => [nuevoMov, ...prev]);
      setCuentas((prev: any[]) => prev.map((c) => (c.id === r.cuenta_id ? { ...c, saldo: Number(nuevoSaldo) || 0 } : c)));
      const { data: freshGen } = await supabase2.from("finanzas_recurrencias_generaciones").select("*").eq("recurrencia_id", r.id).eq("mes", `${mes}-01`).single();
      if (freshGen) setGeneraciones((prev: any[]) => [freshGen, ...prev]);
    } catch (err: any) {
      alert(err.message || "No se pudo generar.");
    } finally { setGuardando(false); }
  };

  const generarTodas = async () => {
    for (const r of pendientesEsteMes) await generar(r, mesActual);
  };

  const eliminarGeneracion = async (g: any) => {
    if (!confirm("¿Eliminar este movimiento generado? Se revierte el egreso/ingreso y podés volver a generarlo.")) return;
    await supabase2.rpc("eliminar_movimiento_caja", { p_movimiento_id: g.movimiento_id, p_motivo: "Generación de recurrencia eliminada" });
    await supabase2.from("finanzas_recurrencias_generaciones").delete().eq("id", g.id);
    setGeneraciones((prev: any[]) => prev.filter((x) => x.id !== g.id));
    setMovimientos((prev: any[]) => prev.filter((m) => m.id !== g.movimiento_id));
  };

  const exportarCsv = () => {
    const filas = [["Concepto", ...proyeccion.map(labelMes)], ...activas.map((r) => [r.nombre, ...proyeccion.map((m) => overrides[`${r.id}:${m}`] ?? String(r.monto))])];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `proyeccion_caja_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const valorProyeccion = (r: any, mes: string) => overrides[`${r.id}:${mes}`] ?? String(r.monto);

  return (
    <div>
      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3 mb-4 text-xs text-indigo-700 dark:text-indigo-300">
        💡 <b>Recurrencias</b>: plantillas para gastos/ingresos que se repiten cada mes (alquiler del local, sueldos, servicios, etc). Click en "📤 Generar este mes" para crear el movimiento del mes en curso.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
          {Object.keys(compromisoPorMoneda).length === 0 ? <p className="text-sm text-slate-400">Sin recurrencias activas</p> : Object.entries(compromisoPorMoneda).map(([m, v]) => (
            <div key={m}>
              <p className="text-[10px] font-bold uppercase text-slate-400">Compromiso mensual · {m}</p>
              <p className={`text-2xl font-black ${v.ingresos - v.egresos < 0 ? "text-rose-500" : "text-emerald-600"}`}>{fmt(v.ingresos - v.egresos, m)}<span className="text-xs font-normal text-slate-400"> neto/mes</span></p>
              <p className="text-xs"><span className="text-emerald-600">↑ {fmt(v.ingresos, m)}</span> <span className="text-rose-500 ml-2">↓ {fmt(v.egresos, m)}</span></p>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 grid grid-cols-2 gap-2 text-sm">
          <p className="text-slate-400">Activas</p><p className="text-right font-bold">{activas.length}</p>
          <p className="text-slate-400">Pausadas</p><p className="text-right font-bold">{pausadas.length}</p>
          <p className="text-slate-400">Generadas este mes</p><p className="text-right font-bold">{generadasEsteMes.length}</p>
          <p className="text-slate-400">Pendientes</p><p className="text-right font-bold">{pendientesEsteMes.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 mb-4">
        <p className="text-sm font-bold mb-2">📈 Histórico mensual (generado por recurrencias · últimos 6 meses)</p>
        {generaciones.length === 0 ? <p className="text-xs text-slate-400">Todavía no se generaron movimientos de recurrencias. Usá "Generar este mes" y vas a ver acá la evolución.</p> : (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {historico.map((m) => {
              const delMes = generaciones.filter((g) => g.mes.slice(0, 7) === m);
              const neto = delMes.reduce((acc, g) => { const mov = movimientos.find((x) => x.id === g.movimiento_id); if (!mov) return acc; return acc + (mov.tipo === "ingreso" ? Number(mov.monto) : -Number(mov.monto)); }, 0);
              return (
                <div key={m}>
                  <button onClick={() => setMesesExpandidos((p) => ({ ...p, [m]: !p[m] }))} className="w-full flex items-center justify-between py-2 text-sm">
                    <span className="flex items-center gap-1.5">{mesesExpandidos[m] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />} {labelMes(m)} {delMes.length > 0 && <span className="text-[10px] bg-slate-100 dark:bg-white/10 rounded-full px-1.5">{delMes.length}</span>}</span>
                    <span className={`font-mono font-bold ${neto < 0 ? "text-rose-500" : "text-emerald-600"}`}>{delMes.length === 0 ? "—" : fmt(neto, "USD")}</span>
                  </button>
                  {mesesExpandidos[m] && delMes.length > 0 && (
                    <div className="pb-2 space-y-1">
                      {delMes.map((g) => {
                        const mov = movimientos.find((x) => x.id === g.movimiento_id);
                        const r = recurrencias.find((x) => x.id === g.recurrencia_id);
                        return (
                          <div key={g.id} className="flex items-center justify-between text-xs pl-5">
                            <span>{r?.nombre || "—"}</span>
                            <span className="flex items-center gap-2"><span className="font-mono">{mov ? fmt(mov.monto, mov.cuenta?.moneda || r?.moneda) : "—"}</span><button onClick={() => eliminarGeneracion(g)}><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button></span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold">🗓 Proyección de caja · 12 meses (editá cualquier celda; vacío = vuelve al base)</p>
          <button onClick={exportarCsv} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg"><Download className="w-3.5 h-3.5" /> Excel</button>
        </div>
        {activas.length === 0 ? <p className="text-xs text-slate-400">Sin recurrencias activas para proyectar.</p> : (
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead><tr className="text-left text-slate-400"><th className="p-1.5 sticky left-0 bg-white dark:bg-[#141414]">Concepto</th>{proyeccion.map((m) => <th key={m} className="p-1.5 text-right">{labelMes(m)}</th>)}</tr></thead>
              <tbody>
                {activas.map((r) => (
                  <tr key={r.id} className="border-t border-slate-50 dark:border-white/5">
                    <td className="p-1.5 sticky left-0 bg-white dark:bg-[#141414] whitespace-nowrap">● {r.nombre}</td>
                    {proyeccion.map((m) => {
                      const key = `${r.id}:${m}`;
                      const editado = key in overrides;
                      return <td key={m} className="p-0.5"><input value={valorProyeccion(r, m)} onChange={(e) => setOverrides((p) => ({ ...p, [key]: e.target.value }))} className={`w-16 text-right text-xs px-1 py-0.5 rounded border ${editado ? "bg-amber-50 dark:bg-amber-500/10 border-amber-300" : "border-transparent"}`} /></td>;
                    })}
                  </tr>
                ))}
                <tr className="border-t border-slate-200 dark:border-white/10 font-bold text-emerald-600"><td className="p-1.5 sticky left-0 bg-white dark:bg-[#141414]">Ingresos</td>{proyeccion.map((m) => { const n = activas.filter((r) => r.tipo === "ingreso").reduce((a, r) => a + Number(valorProyeccion(r, m) || 0), 0); return <td key={m} className="p-1.5 text-right">{n === 0 ? "—" : fmt(n, "USD")}</td>; })}</tr>
                <tr className="text-rose-500 font-bold"><td className="p-1.5 sticky left-0 bg-white dark:bg-[#141414]">Egresos</td>{proyeccion.map((m) => { const n = activas.filter((r) => r.tipo === "egreso").reduce((a, r) => a + Number(valorProyeccion(r, m) || 0), 0); return <td key={m} className="p-1.5 text-right">{fmt(n, "USD")}</td>; })}</tr>
                <tr className="font-bold border-t border-slate-200 dark:border-white/10"><td className="p-1.5 sticky left-0 bg-white dark:bg-[#141414]">Neto del mes</td>{proyeccion.map((m) => { const ing = activas.filter((r) => r.tipo === "ingreso").reduce((a, r) => a + Number(valorProyeccion(r, m) || 0), 0); const eg = activas.filter((r) => r.tipo === "egreso").reduce((a, r) => a + Number(valorProyeccion(r, m) || 0), 0); const n = ing - eg; return <td key={m} className={`p-1.5 text-right ${n < 0 ? "text-rose-500" : "text-emerald-600"}`}>{fmt(n, "USD")}</td>; })}</tr>
                <tr className="text-slate-400"><td className="p-1.5 sticky left-0 bg-white dark:bg-[#141414]">Flujo acumulado</td>{(() => { let acc = 0; return proyeccion.map((m) => { const ing = activas.filter((r) => r.tipo === "ingreso").reduce((a, r) => a + Number(valorProyeccion(r, m) || 0), 0); const eg = activas.filter((r) => r.tipo === "egreso").reduce((a, r) => a + Number(valorProyeccion(r, m) || 0), 0); acc += ing - eg; return <td key={m} className={`p-1.5 text-right ${acc < 0 ? "text-rose-500" : ""}`}>{fmt(acc, "USD")}</td>; }); })()}</tr>
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[10px] text-slate-400 mt-2">💡 Las celdas en <span className="text-amber-600 font-bold">ámbar</span> tienen un valor editado para ese mes. El resto usa el monto base de la plantilla. La proyección no genera movimientos — es planificación.</p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button onClick={generarTodas} disabled={guardando || pendientesEsteMes.length === 0} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg"><Send className="w-4 h-4" /> Generar TODAS del mes ({pendientesEsteMes.length} pendiente{pendientesEsteMes.length === 1 ? "" : "s"})</button>
        <button onClick={abrirNuevo} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><Plus className="w-4 h-4" /> Nueva Recurrencia</button>
      </div>

      {recurrencias.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin recurrencias creadas</p></div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 dark:border-white/10 text-left text-slate-400"><th className="p-2.5">Nombre</th><th className="p-2.5">Tipo</th><th className="p-2.5">Categoría</th><th className="p-2.5">Monto</th><th className="p-2.5">Día del mes</th><th className="p-2.5">Caja</th><th className="p-2.5">Estado</th><th className="p-2.5">Acciones</th></tr></thead>
            <tbody>
              {recurrencias.map((r) => {
                const yaGenerada = generadasEsteMes.some((g) => g.recurrencia_id === r.id);
                return (
                  <tr key={r.id} className="border-b border-slate-50 dark:border-white/5">
                    <td className="p-2.5 font-bold">🔁 {r.nombre}</td>
                    <td className="p-2.5"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${r.tipo === "ingreso" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700" : "bg-rose-100 dark:bg-rose-500/20 text-rose-700"}`}>{r.tipo}</span></td>
                    <td className="p-2.5 text-slate-400">{r.categoria || "—"}</td>
                    <td className="p-2.5 font-mono font-bold">{fmt(r.monto, r.moneda)}</td>
                    <td className="p-2.5">Día {r.dia_mes}</td>
                    <td className="p-2.5">{cuentas.find((c) => c.id === r.cuenta_id)?.nombre || "—"}</td>
                    <td className="p-2.5">{r.estado === "activa" ? <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700">✓ Activa</span> : <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500">Pausada</span>}</td>
                    <td className="p-2.5"><div className="flex items-center gap-2 flex-wrap">
                      {r.estado === "activa" && !yaGenerada && <button onClick={() => generar(r)} className="text-emerald-600 font-bold">📤 Generar este mes</button>}
                      {yaGenerada && <span className="text-slate-400">Ya generada</span>}
                      <button onClick={() => pausarToggle(r)} className="text-slate-500 font-bold">{r.estado === "activa" ? "Pausar" : "Reactivar"}</button>
                      <button onClick={() => abrirEditar(r)} className="text-rose-500 font-bold">Editar</button>
                      <button onClick={() => eliminarRecurrencia(r)} className="text-rose-500 font-bold">Eliminar</button>
                    </div></td>
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
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">{editando ? "Editar recurrencia" : "Nueva recurrencia"}</h3><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Plantilla de gasto/ingreso que se repite cada mes.</p>
            <label className={labelClass}>Nombre *</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Alquiler del local, Sueldo Jorge..." className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Tipo *</label><select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputClass}><option value="egreso">Egreso</option><option value="ingreso">Ingreso</option></select></div>
              <div><label className={labelClass}>Categoría</label><input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Alquiler, Sueldo..." className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div><label className={labelClass}>Monto *</label><input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>Moneda *</label><select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={inputClass}><option value="USD">USD</option><option value="ARS">ARS</option></select></div>
              <div><label className={labelClass}>Día del mes</label><input type="number" min={1} max={28} value={diaMes} onChange={(e) => setDiaMes(e.target.value)} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Caja *</label>
            <select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} className={inputClass}><option value="">— Elegí —</option>{cuentas.filter((c) => c.moneda === moneda).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={guardar} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> {editando ? "Guardar" : "Crear recurrencia"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
