"use client";

import { useState, useMemo } from "react";
import { Pencil, Trash2, Folder } from "lucide-react";
import { supabase2 } from "@/lib/supabase2/client";
import { fmt, ESTADO_LABEL, ESTADO_COLOR } from "./shared";

type Col = "dominio" | "fecha_operacion" | "transf_cliente" | "comision_gestora" | "ingreso_agencia";

export default function TransferenciasTab({
  liquidaciones, setLiquidaciones, gananciasOcultas, onEditar,
}: { liquidaciones: any[]; setLiquidaciones: (fn: any) => void; gananciasOcultas: boolean; onEditar: (row: any) => void }) {
  const meses = useMemo(() => {
    const set = new Set(liquidaciones.map((l) => l.mes.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [liquidaciones]);

  const [mes, setMes] = useState<string | null>(meses[0] || new Date().toISOString().slice(0, 7));
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "finalizados" | "en_proceso">("todos");
  const [orden, setOrden] = useState<{ col: Col; dir: 1 | -1 }>({ col: "fecha_operacion", dir: -1 });
  const [verTodos, setVerTodos] = useState(false);

  const delMes = mes && !verTodos ? liquidaciones.filter((l) => l.mes.slice(0, 7) === mes) : liquidaciones;

  const filtrados = useMemo(() => {
    let l = delMes;
    if (filtroEstado === "finalizados") l = l.filter((x) => x.estado === "terminado");
    if (filtroEstado === "en_proceso") l = l.filter((x) => x.estado === "en_proceso");
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      l = l.filter((x) => (x.dominio || "").toLowerCase().includes(q) || (x.cliente_comprador || "").toLowerCase().includes(q) || (x.cliente_vendedor || "").toLowerCase().includes(q) || (x.marca || "").toLowerCase().includes(q));
    }
    return [...l].sort((a, b) => {
      const av = a[orden.col], bv = b[orden.col];
      if (av == null) return 1; if (bv == null) return -1;
      return av > bv ? orden.dir : av < bv ? -orden.dir : 0;
    });
  }, [delMes, filtroEstado, busqueda, orden]);

  const finalizadosCount = delMes.filter((x) => x.estado === "terminado").length;
  const enProcesoCount = delMes.filter((x) => x.estado === "en_proceso").length;

  const toggleOrden = (col: Col) => setOrden((p) => (p.col === col ? { col, dir: (p.dir * -1) as 1 | -1 } : { col, dir: -1 }));

  const eliminar = async (row: any) => {
    if (!confirm(`¿Eliminar la transferencia de ${row.dominio}?`)) return;
    await supabase2.from("liquidaciones_gestoria").delete().eq("id", row.id);
    setLiquidaciones((prev: any[]) => prev.filter((x) => x.id !== row.id));
  };

  const totales = filtrados.reduce((acc, x) => ({
    cobrado: acc.cobrado + Number(x.transf_cliente), costoReg: acc.costoReg + Number(x.transf_registro),
    difTransf: acc.difTransf + Number(x.diferencia_transferencia), difMultas: acc.difMultas + Number(x.diferencia_multas),
    comision: acc.comision + Number(x.comision_gestora), ingAgencia: acc.ingAgencia + Number(x.ingreso_agencia),
  }), { cobrado: 0, costoReg: 0, difTransf: 0, difMultas: 0, comision: 0, ingAgencia: 0 });

  const th = (label: string, col?: Col) => (
    <th className={`p-2.5 text-left ${col ? "cursor-pointer select-none" : ""}`} onClick={col ? () => toggleOrden(col) : undefined}>
      {label}{col && orden.col === col ? (orden.dir === 1 ? " ↑" : " ↓") : ""}
    </th>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <select value={verTodos ? "__todos__" : mes || ""} onChange={(e) => { if (e.target.value === "__todos__") setVerTodos(true); else { setVerTodos(false); setMes(e.target.value); } }} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm">
          {meses.map((m) => <option key={m} value={m}>{new Date(m + "-01T12:00:00").toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</option>)}
          <option value="__todos__">Todos los meses</option>
        </select>
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar patente, cliente, marca..." className="flex-1 min-w-[200px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm" />
        <span className="text-xs text-slate-400 shrink-0">{filtrados.length} operaci{filtrados.length === 1 ? "ón" : "ones"}</span>
      </div>

      <div className="flex items-center gap-1 mb-3">
        <button onClick={() => setFiltroEstado("todos")} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${filtroEstado === "todos" ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>Todos {delMes.length}</button>
        <button onClick={() => setFiltroEstado("finalizados")} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${filtroEstado === "finalizados" ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>✓ Finalizados {finalizadosCount}</button>
        <button onClick={() => setFiltroEstado("en_proceso")} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${filtroEstado === "en_proceso" ? "bg-rose-600 text-white" : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"}`}>⏳ En proceso {enProcesoCount}</button>
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center">
          <p className="text-sm font-bold">Sin transferencias {!verTodos && mes ? `en ${new Date(mes + "-01T12:00:00").toLocaleDateString("es-AR", { month: "long", year: "numeric" })}` : ""}</p>
          {!verTodos && meses.length > 1 && <><p className="text-xs text-slate-400 mt-1">Hay operaciones cargadas en otros meses ({meses.length} meses con datos).</p><button onClick={() => setVerTodos(true)} className="mt-3 px-4 py-2 text-xs font-bold border border-slate-200 dark:border-white/10 rounded-lg">Ver todos los meses</button></>}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
          <table className="w-full text-xs">
            <thead className="border-b border-slate-100 dark:border-white/10 text-slate-400">
              <tr>
                {th("Dominio", "dominio")}{th("Fecha operación", "fecha_operacion")}<th className="p-2.5 text-left">Título</th><th className="p-2.5 text-left">Vehículo</th><th className="p-2.5 text-left">Gestora</th>
                {th("Cobrado", "transf_cliente")}<th className="p-2.5 text-left">Costo reg.</th><th className="p-2.5 text-left">Dif. transf.</th><th className="p-2.5 text-left">Multas</th><th className="p-2.5 text-left">Dif. multas</th>
                {th("Comisión", "comision_gestora")}{th("Ing. agencia", "ingreso_agencia")}<th className="p-2.5 text-left">Estado</th><th className="p-2.5 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((x) => (
                <tr key={x.id} className="border-b border-slate-50 dark:border-white/5">
                  <td className="p-2.5 font-bold flex items-center gap-1">{x.dominio}{x.expediente_id && <span title="Vinculado a expediente"><Folder className="w-3 h-3 text-amber-500" /></span>}</td>
                  <td className="p-2.5">{x.fecha_operacion}</td>
                  <td className="p-2.5">{x.expediente?.titulo_transferido_url ? <span className="text-emerald-600 font-bold">✓ título</span> : <span className="text-amber-600">⚠ sin título</span>}</td>
                  <td className="p-2.5 text-slate-400">{x.marca} {x.modelo}</td>
                  <td className="p-2.5">{x.gestora || "—"}</td>
                  <td className="p-2.5 font-mono">{fmt(x.transf_cliente)}</td>
                  <td className="p-2.5 font-mono">{fmt(x.transf_registro)}</td>
                  <td className="p-2.5 font-mono">{gananciasOcultas ? "—" : fmt(x.diferencia_transferencia)}</td>
                  <td className="p-2.5 font-mono">{Number(x.multas_cliente) ? fmt(x.multas_cliente) : "—"}</td>
                  <td className="p-2.5 font-mono">{gananciasOcultas ? "—" : (x.multas_cliente || x.multas_costo_real ? fmt(x.diferencia_multas) : "—")}</td>
                  <td className="p-2.5 font-mono font-bold">{fmt(x.comision_gestora)}</td>
                  <td className="p-2.5 font-mono font-bold">{gananciasOcultas ? "—" : fmt(x.ingreso_agencia)}</td>
                  <td className="p-2.5"><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${ESTADO_COLOR[x.estado]}`}>{ESTADO_LABEL[x.estado]}</span>{x.liquidado_gestora && <span className="block text-[10px] text-emerald-600 mt-0.5">✓ liquidada</span>}</td>
                  <td className="p-2.5"><div className="flex items-center gap-2"><button onClick={() => onEditar(x)}><Pencil className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" /></button><button onClick={() => eliminar(x)}><Trash2 className="w-3.5 h-3.5 text-rose-500" /></button></div></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 dark:border-white/10 font-bold bg-slate-50 dark:bg-white/5">
                <td className="p-2.5" colSpan={5}>TOTALES ({filtrados.length} ops)</td>
                <td className="p-2.5 font-mono">{fmt(totales.cobrado)}</td>
                <td className="p-2.5 font-mono">{fmt(totales.costoReg)}</td>
                <td className="p-2.5 font-mono">{gananciasOcultas ? "—" : fmt(totales.difTransf)}</td>
                <td className="p-2.5"></td>
                <td className="p-2.5 font-mono">{gananciasOcultas ? "—" : fmt(totales.difMultas)}</td>
                <td className="p-2.5 font-mono">{fmt(totales.comision)}</td>
                <td className="p-2.5 font-mono">{gananciasOcultas ? "—" : fmt(totales.ingAgencia)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
