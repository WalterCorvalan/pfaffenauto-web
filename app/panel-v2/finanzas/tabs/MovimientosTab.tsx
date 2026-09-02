"use client";

import { useState, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, Trash2, Pencil, ArrowLeftRight, Lock, Download, Search, Paperclip } from "lucide-react";
import { inputClass, labelClass, fmt } from "./shared";

const CATEGORIAS = ["Venta de vehículo", "Compra de vehículo", "Seña", "Comisión", "Gasto fijo", "Sueldo", "Transferencia", "Cobro de cuota", "Pago de cuota", "Otro"];

function inicioSemana(d: Date) { const x = new Date(d); const dia = x.getDay(); x.setDate(x.getDate() - (dia === 0 ? 6 : dia - 1)); x.setHours(0, 0, 0, 0); return x; }

export default function MovimientosTab({
  miId, soyAdmin, cuentas, movimientos, setMovimientos, cierres, setCierres, ventas,
}: {
  miId: string; soyAdmin: boolean; cuentas: any[]; movimientos: any[]; setMovimientos: (fn: any) => void;
  cierres: any[]; setCierres: (fn: any) => void; ventas: any[];
}) {
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "ingreso" | "egreso" | "transferencia">("todos");
  const [busqueda, setBusqueda] = useState("");
  const [rango, setRango] = useState<string | null>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [cajaFiltro, setCajaFiltro] = useState("");

  const [showRegistrar, setShowRegistrar] = useState(false);
  const [rCategoria, setRCategoria] = useState(CATEGORIAS[0]);
  const [rTipo, setRTipo] = useState<"ingreso" | "egreso">("ingreso");
  const [rMonto, setRMonto] = useState("");
  const [rFecha, setRFecha] = useState(new Date().toISOString().slice(0, 10));
  const [rCajaId, setRCajaId] = useState("");
  const [rVentaId, setRVentaId] = useState("");
  const [rNotas, setRNotas] = useState("");
  const [rArchivos, setRArchivos] = useState<File[]>([]);
  const [guardandoR, setGuardandoR] = useState(false);

  const [showTransferencia, setShowTransferencia] = useState(false);
  const [tMonedaOrigen, setTMonedaOrigen] = useState("USD");
  const [tMonedaDestino, setTMonedaDestino] = useState("USD");
  const [tCajaOrigen, setTCajaOrigen] = useState("");
  const [tCajaDestino, setTCajaDestino] = useState("");
  const [tMontoOrigen, setTMontoOrigen] = useState("");
  const [tMontoDestino, setTMontoDestino] = useState("");
  const [tFecha, setTFecha] = useState(new Date().toISOString().slice(0, 10));
  const [tNotas, setTNotas] = useState("");
  const [guardandoT, setGuardandoT] = useState(false);

  const [showCierres, setShowCierres] = useState(false);

  const filtrados = useMemo(() => {
    let l = movimientos;
    if (filtroTipo === "transferencia") l = l.filter((m) => !!m.transferencia_grupo_id);
    else if (filtroTipo !== "todos") l = l.filter((m) => m.tipo === filtroTipo && !m.transferencia_grupo_id);
    if (cajaFiltro) l = l.filter((m) => m.cuenta_id === cajaFiltro);
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      l = l.filter((m) => [m.tipo_movimiento, m.observaciones, m.patente].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    const hoy = new Date();
    if (rango === "hoy") { const h = hoy.toISOString().slice(0, 10); l = l.filter((m) => m.fecha === h); }
    else if (rango === "semana") { const ini = inicioSemana(hoy).toISOString().slice(0, 10); l = l.filter((m) => m.fecha >= ini); }
    else if (rango === "mes") { const ini = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10); l = l.filter((m) => m.fecha >= ini); }
    else if (rango === "trimestre") { const ini = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1).toISOString().slice(0, 10); l = l.filter((m) => m.fecha >= ini); }
    else if (rango === "anio") { const ini = new Date(hoy.getFullYear(), 0, 1).toISOString().slice(0, 10); l = l.filter((m) => m.fecha >= ini); }
    if (desde) l = l.filter((m) => m.fecha >= desde);
    if (hasta) l = l.filter((m) => m.fecha <= hasta);
    return l;
  }, [movimientos, filtroTipo, cajaFiltro, busqueda, rango, desde, hasta]);

  const cajaSeleccionada = cuentas.find((c) => c.id === cajaFiltro);
  // Nunca se suma ARS + USD en un solo número — sin caja elegida se agrupa
  // por moneda (vía la caja de cada movimiento) y se muestra cada una aparte.
  const ingresosPorMoneda: Record<string, number> = {};
  const egresosPorMoneda: Record<string, number> = {};
  filtrados.forEach((m) => {
    const mo = m.cuenta?.moneda;
    if (!mo) return;
    if (m.tipo === "ingreso") ingresosPorMoneda[mo] = (ingresosPorMoneda[mo] || 0) + Number(m.monto);
    else egresosPorMoneda[mo] = (egresosPorMoneda[mo] || 0) + Number(m.monto);
  });
  const ingresos = cajaSeleccionada ? (ingresosPorMoneda[cajaSeleccionada.moneda] || 0) : 0;
  const egresos = cajaSeleccionada ? (egresosPorMoneda[cajaSeleccionada.moneda] || 0) : 0;

  const registrar = async () => {
    if (!rMonto || !rCajaId) return alert("Completá monto y caja.");
    setGuardandoR(true);
    try {
      const { data: movId, error } = await supabase2.rpc("registrar_movimiento_caja", {
        p_tipo: rTipo, p_monto: Number(rMonto), p_cuenta_id: rCajaId, p_fecha: rFecha,
        p_categoria: rCategoria, p_venta_id: rVentaId || null, p_observaciones: rNotas || null,
      });
      if (error) throw error;

      for (const file of rArchivos.slice(0, 10)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("carpeta", "finanzas");
        const res = await fetch("/api/panel-v2/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok) await supabase2.from("movimiento_comprobantes").insert({ movimiento_id: movId, url: data.publicUrl, nombre: file.name, subido_por: miId });
      }

      const { data: nuevo } = await supabase2.from("movimientos_caja").select("*, cuenta:cuentas(nombre, moneda)").eq("id", movId).single();
      if (nuevo) setMovimientos((prev: any[]) => [nuevo, ...prev]);
      setShowRegistrar(false);
      setRMonto(""); setRVentaId(""); setRNotas(""); setRArchivos([]);
    } catch (err: any) {
      alert(err.message || "No se pudo registrar el movimiento.");
    } finally {
      setGuardandoR(false);
    }
  };

  const eliminar = async (m: any) => {
    const motivo = prompt(`¿Eliminar "${m.tipo_movimiento || m.tipo}"? Escribí un motivo (opcional):`);
    if (motivo === null) return;
    const { error } = await supabase2.rpc("eliminar_movimiento_caja", { p_movimiento_id: m.id, p_motivo: motivo || null });
    if (error) return alert(error.message);
    setMovimientos((prev: any[]) => prev.filter((x) => x.id !== m.id));
  };

  const borrarTodos = async () => {
    if (!soyAdmin) return;
    if (!confirm(`¿Eliminar los ${filtrados.length} movimientos de esta lista? No se puede deshacer fácil.`)) return;
    for (const m of filtrados) {
      await supabase2.rpc("eliminar_movimiento_caja", { p_movimiento_id: m.id, p_motivo: "Borrado masivo" });
    }
    const idsBorrados = new Set(filtrados.map((m) => m.id));
    setMovimientos((prev: any[]) => prev.filter((x) => !idsBorrados.has(x.id)));
  };

  const exportarCsv = () => {
    const filas = [["Fecha", "Descripción", "Categoría", "Caja", "Tipo", "Monto", "Moneda"]];
    filtrados.forEach((m) => filas.push([m.fecha, m.observaciones || "", m.tipo_movimiento || "", m.cuenta?.nombre || "", m.tipo, String(m.monto), m.cuenta?.moneda || ""]));
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `movimientos_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const abrirCajaDestinoAuto = (cajaId: string) => {
    setTCajaDestino(cajaId);
    const c = cuentas.find((x) => x.id === cajaId);
    if (c) setTMonedaDestino(c.moneda);
  };
  const abrirCajaOrigenAuto = (cajaId: string) => {
    setTCajaOrigen(cajaId);
    const c = cuentas.find((x) => x.id === cajaId);
    if (c) setTMonedaOrigen(c.moneda);
  };

  const crearTransferencia = async () => {
    if (!tCajaOrigen || !tCajaDestino || !tMontoOrigen) return alert("Completá origen, destino y monto.");
    const montoDestino = tMonedaOrigen === tMonedaDestino ? tMontoOrigen : tMontoDestino;
    if (!montoDestino) return alert("Completá el monto destino.");
    setGuardandoT(true);
    try {
      const { error } = await supabase2.rpc("crear_transferencia", {
        p_cuenta_origen_id: tCajaOrigen, p_cuenta_destino_id: tCajaDestino,
        p_monto_origen: Number(tMontoOrigen), p_monto_destino: Number(montoDestino), p_fecha: tFecha, p_notas: tNotas || null,
      });
      if (error) throw error;
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "No se pudo crear la transferencia.");
    } finally {
      setGuardandoT(false);
    }
  };

  const mesesConMovimientos = useMemo(() => {
    const map = new Map<string, number>();
    movimientos.forEach((m) => { const mes = m.fecha.slice(0, 7) + "-01"; map.set(mes, (map.get(mes) || 0) + 1); });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [movimientos]);

  const cerrarMes = async (mes: string) => {
    const { error } = await supabase2.rpc("cerrar_mes", { p_mes: mes });
    if (error) return alert(error.message);
    setCierres((prev: any[]) => [{ mes, cerrado_en: new Date().toISOString(), reabierto_en: null }, ...prev.filter((c) => c.mes !== mes)]);
  };
  const reabrirMes = async (mes: string) => {
    const { error } = await supabase2.rpc("reabrir_mes", { p_mes: mes });
    if (error) return alert(error.message);
    setCierres((prev: any[]) => prev.map((c) => (c.mes === mes ? { ...c, reabierto_en: new Date().toISOString() } : c)));
  };
  const estaCerrado = (mes: string) => cierres.some((c) => c.mes === mes && !c.reabierto_en);

  return (
    <div>
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        {[{ v: "todos", l: "Todos" }, { v: "ingreso", l: "Ingreso" }, { v: "egreso", l: "Egreso" }, { v: "transferencia", l: "Transferencias" }].map((t) => (
          <button key={t.v} onClick={() => setFiltroTipo(t.v as any)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filtroTipo === t.v ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>{t.l}</button>
        ))}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar (descripción, vehículo, vendedor)" className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {soyAdmin && filtrados.length > 0 && <button onClick={borrarTodos} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-rose-200 dark:border-rose-500/20 text-rose-600 rounded-lg"><Trash2 className="w-3.5 h-3.5" /> Borrar todos ({filtrados.length})</button>}
        <button onClick={() => setShowCierres(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg"><Lock className="w-3.5 h-3.5" /> Cierres mensuales</button>
        <button onClick={() => setShowTransferencia(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg"><ArrowLeftRight className="w-3.5 h-3.5" /> Transferencia</button>
        <button onClick={exportarCsv} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg"><Download className="w-3.5 h-3.5" /> Excel</button>
        <button onClick={() => setShowRegistrar(true)} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg ml-auto"><Plus className="w-3.5 h-3.5" /> Registrar</button>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap text-xs">
        <span className="font-bold text-slate-400">Rango:</span>
        {[{ v: "hoy", l: "Hoy" }, { v: "semana", l: "Esta semana" }, { v: "mes", l: "Este mes" }, { v: "trimestre", l: "Este trimestre" }, { v: "anio", l: "Este año" }].map((r) => (
          <button key={r.v} onClick={() => setRango(rango === r.v ? null : r.v)} className={`px-2.5 py-1 rounded-full font-bold ${rango === r.v ? "bg-slate-800 dark:bg-white/20 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>{r.l}</button>
        ))}
        <span className="text-slate-400">Desde:</span><input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1" />
        <span className="text-slate-400">Hasta:</span><input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1" />
        <span className="ml-auto text-slate-400">{filtrados.length} movimiento{filtrados.length === 1 ? "" : "s"}</span>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs font-bold text-slate-400">Caja:</span>
        <select value={cajaFiltro} onChange={(e) => setCajaFiltro(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs">
          <option value="">Todas las cajas</option>
          {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre} — {c.moneda} {c.saldo.toLocaleString("es-AR")}</option>)}
        </select>
        {cajaSeleccionada && <><span className="text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 px-2.5 py-1 rounded-full">Saldo: {fmt(cajaSeleccionada.saldo, cajaSeleccionada.moneda)}</span><button onClick={() => setCajaFiltro("")} className="text-[11px] text-rose-500 font-bold">✕ Limpiar caja</button></>}
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin movimientos</p></div>
      ) : (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50 dark:bg-white/5 text-[10px] uppercase tracking-widest text-slate-400 font-bold"><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Descripción</th><th className="px-4 py-3">Categoría</th><th className="px-4 py-3">Caja</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Monto</th><th className="px-4 py-3 w-px">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {filtrados.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{m.fecha}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{m.observaciones || m.tipo_movimiento || "—"} {m.estado === "pendiente" && <span className="text-[9px] font-bold uppercase text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded ml-1">Pendiente aprobación</span>}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{m.tipo_movimiento || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{m.cuenta?.nombre}{m.transferencia_grupo_id && <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded ml-1">Transferencia</span>}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${m.tipo === "ingreso" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700" : "bg-rose-50 dark:bg-rose-500/10 text-rose-700"}`}>{m.tipo === "ingreso" ? "↗" : "↘"} {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}</span></td>
                    <td className={`px-4 py-3 text-sm font-bold ${m.tipo === "ingreso" ? "text-emerald-600" : "text-rose-600"}`}>{m.tipo === "ingreso" ? "+" : "-"}{fmt(m.monto, m.cuenta?.moneda)}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><button className="text-[11px] font-bold text-slate-500 mr-2"><Pencil className="w-3.5 h-3.5 inline" /></button><button onClick={() => eliminar(m)} className="text-[11px] font-bold text-rose-600">Eliminar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase text-emerald-600">Ingresos{cajaSeleccionada ? ` ${cajaSeleccionada.moneda}` : ""}</p>
          {cajaSeleccionada ? <p className="text-lg font-black">{fmt(ingresos, cajaSeleccionada.moneda)}</p> : Object.keys(ingresosPorMoneda).length === 0 ? <p className="text-lg font-black">—</p> : Object.entries(ingresosPorMoneda).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}
        </div>
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase text-rose-500">Egresos{cajaSeleccionada ? ` ${cajaSeleccionada.moneda}` : ""}</p>
          {cajaSeleccionada ? <p className="text-lg font-black">{fmt(egresos, cajaSeleccionada.moneda)}</p> : Object.keys(egresosPorMoneda).length === 0 ? <p className="text-lg font-black">—</p> : Object.entries(egresosPorMoneda).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase text-indigo-600">Neto {cajaSeleccionada ? `· ${cajaSeleccionada.nombre}` : ""}</p>
          {cajaSeleccionada ? <p className="text-lg font-black">{fmt(ingresos - egresos, cajaSeleccionada.moneda)}</p> : (
            Array.from(new Set([...Object.keys(ingresosPorMoneda), ...Object.keys(egresosPorMoneda)])).length === 0 ? <p className="text-lg font-black">—</p> :
            Array.from(new Set([...Object.keys(ingresosPorMoneda), ...Object.keys(egresosPorMoneda)])).map((m) => <p key={m} className="text-lg font-black">{fmt((ingresosPorMoneda[m] || 0) - (egresosPorMoneda[m] || 0), m)}</p>)
          )}
        </div>
      </div>

      {showRegistrar && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowRegistrar(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Registrar movimiento</h3><button onClick={() => setShowRegistrar(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Cargá un ingreso o egreso. El saldo de la caja seleccionada se actualiza automáticamente.</p>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setRTipo("ingreso")} className={`flex-1 py-2 rounded-lg text-sm font-bold ${rTipo === "ingreso" ? "bg-emerald-600 text-white" : "border border-slate-200 dark:border-white/10"}`}>Ingreso</button>
              <button onClick={() => setRTipo("egreso")} className={`flex-1 py-2 rounded-lg text-sm font-bold ${rTipo === "egreso" ? "bg-rose-600 text-white" : "border border-slate-200 dark:border-white/10"}`}>Egreso</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelClass}>Categoría *</label><select value={rCategoria} onChange={(e) => setRCategoria(e.target.value)} className={inputClass}>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label className={labelClass}>Fecha *</label><input type="date" value={rFecha} onChange={(e) => setRFecha(e.target.value)} className={inputClass} /></div>
            </div>
            <label className={labelClass + " mt-3"}>Monto *</label>
            <input type="number" value={rMonto} onChange={(e) => setRMonto(e.target.value)} className={inputClass} />
            <label className={labelClass + " mt-3"}>Caja *</label>
            <select value={rCajaId} onChange={(e) => setRCajaId(e.target.value)} className={inputClass}>
              <option value="">— Elegí una caja —</option>
              {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>)}
            </select>
            <label className={labelClass + " mt-3"}>Venta vinculada (opcional)</label>
            <select value={rVentaId} onChange={(e) => setRVentaId(e.target.value)} className={inputClass}>
              <option value="">— Sin venta vinculada —</option>
              {ventas.map((v) => <option key={v.id} value={v.id}>{v.comprador_nombre} · {v.vehiculo_marca} {v.vehiculo_modelo}</option>)}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Solo si este movimiento corresponde a una operación específica del CRM.</p>
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={rNotas} onChange={(e) => setRNotas(e.target.value)} rows={2} placeholder="Aclaraciones, número de factura, referencia interna..." className={inputClass} />
            <label className={labelClass + " mt-3 flex items-center gap-1.5"}><Paperclip className="w-3.5 h-3.5" /> Comprobantes (factura, recibo, ticket — máx. 15MB)</label>
            <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer">
              Adjuntar archivo
              <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={(e) => setRArchivos((prev) => [...prev, ...Array.from(e.target.files || [])])} />
            </label>
            {rArchivos.length === 0 ? <p className="text-[11px] text-slate-400 mt-1.5">Sin comprobantes adjuntos. Podés sumar tantos como necesites.</p> : (
              <div className="flex flex-wrap gap-1.5 mt-1.5">{rArchivos.map((f, i) => <span key={i} className="text-[11px] bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-full flex items-center gap-1">{f.name}<button onClick={() => setRArchivos((prev) => prev.filter((_, x) => x !== i))}><X className="w-3 h-3" /></button></span>)}</div>
            )}
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowRegistrar(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={registrar} disabled={guardandoR} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> {guardandoR ? "Guardando..." : "Registrar movimiento"}</button></div>
          </div>
        </div>
      )}

      {showTransferencia && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowTransferencia(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><h3 className="text-lg font-bold">Transferencia</h3><button onClick={() => setShowTransferencia(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Crea dos movimientos linkeados (Egreso + Ingreso) que se reflejan al instante en los saldos de ambas cuentas.</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelClass}>Caja origen *</label><select value={tCajaOrigen} onChange={(e) => abrirCajaOrigenAuto(e.target.value)} className={inputClass}><option value="">— Elegí —</option>{cuentas.filter((c) => c.id !== tCajaDestino).map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>)}</select></div>
              <div><label className={labelClass}>Caja destino *</label><select value={tCajaDestino} onChange={(e) => abrirCajaDestinoAuto(e.target.value)} className={inputClass}><option value="">— Elegí —</option>{cuentas.filter((c) => c.id !== tCajaOrigen).map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>)}</select></div>
            </div>
            <label className={labelClass + " mt-3"}>Fecha *</label>
            <input type="date" value={tFecha} onChange={(e) => setTFecha(e.target.value)} className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Monto origen ({tMonedaOrigen}) *</label><input type="number" value={tMontoOrigen} onChange={(e) => { setTMontoOrigen(e.target.value); if (tMonedaOrigen === tMonedaDestino) setTMontoDestino(e.target.value); }} className={inputClass} /></div>
              <div>
                <label className={labelClass}>Monto destino {tMonedaOrigen === tMonedaDestino ? "" : `(${tMonedaDestino})`}</label>
                {tMonedaOrigen === tMonedaDestino ? (
                  <><input disabled value={tMontoOrigen} className={inputClass + " opacity-60"} /><p className="text-[10px] text-slate-400 mt-0.5">En la misma moneda entra exactamente lo que sale — no se puede fabricar diferencia.</p></>
                ) : (
                  <input type="number" value={tMontoDestino} onChange={(e) => setTMontoDestino(e.target.value)} className={inputClass} />
                )}
              </div>
            </div>
            {tMonedaOrigen !== tMonedaDestino && tMontoOrigen && tMontoDestino && (
              <p className="text-[11px] text-slate-400 mt-1">Tipo de cambio implícito: {(Number(tMontoDestino) / Number(tMontoOrigen)).toLocaleString("es-AR", { maximumFractionDigits: 2 })}</p>
            )}
            <label className={labelClass + " mt-3"}>Concepto / nota</label>
            <textarea value={tNotas} onChange={(e) => setTNotas(e.target.value)} rows={2} placeholder="Ej: Reposición caja chica · cierre semanal" className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowTransferencia(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crearTransferencia} disabled={guardandoT} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><ArrowLeftRight className="w-4 h-4" /> Crear transferencia</button></div>
          </div>
        </div>
      )}

      {showCierres && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCierres(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-start mb-1"><X onClick={() => setShowCierres(false)} className="w-4 h-4 text-slate-400 cursor-pointer ml-auto" /></div>
            <p className="text-xs text-slate-400 mb-4">Una vez cerrado un mes, sus movimientos quedan read-only — no se pueden agregar, editar ni borrar. Solo el admin puede reabrir.</p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {mesesConMovimientos.map(([mes, cant]) => {
                const cerrado = estaCerrado(mes);
                return (
                  <div key={mes} className="flex items-center justify-between bg-slate-50 dark:bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Lock className={`w-4 h-4 ${cerrado ? "text-rose-500" : "text-amber-500"}`} />
                      <div><p className="text-sm font-bold">{new Date(mes + "T00:00:00").toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</p><p className="text-[11px] text-slate-400">{cant} movimiento{cant === 1 ? "" : "s"}</p></div>
                    </div>
                    {cerrado ? <button onClick={() => reabrirMes(mes)} className="px-3 py-1.5 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg">Reabrir</button> : <button onClick={() => cerrarMes(mes)} className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Cerrar mes</button>}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-4"><button onClick={() => setShowCierres(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
