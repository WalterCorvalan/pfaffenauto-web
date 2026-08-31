"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Landmark, Plus, BarChart3, List, Search } from "lucide-react";
import NuevaInfraccionModal from "./NuevaInfraccionModal";

interface Infraccion {
  id: string;
  fecha: string;
  mes: string;
  jurisdiccion: string | null;
  estado: string;
  cliente_nombre: string | null;
  dominio_dni: string | null;
  deuda_ars: number | null;
  pago_cliente_ars: number | null;
  pago_real_ars: number | null;
  ganancia_ars: number | null;
  medio_pago: string | null;
  planilla: string | null;
  gestor: string | null;
  vehiculo_id: string | null;
  comentarios: string | null;
}
interface Vehiculo { id: string; marca: string; modelo: string; patente: string | null }

const ESTADO_COLOR: Record<string, string> = {
  Pendiente: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
  "En trámite": "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
  Pagado: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
  Cancelado: "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400",
};

function fmtArs(n: number | null) {
  return n == null ? "—" : `$ ${Number(n).toLocaleString("es-AR")}`;
}

export default function InfraccionesClient({ infraccionesIniciales, vehiculos, puedeVerGanancia }: { infraccionesIniciales: Infraccion[]; vehiculos: Vehiculo[]; puedeVerGanancia: boolean }) {
  const [infracciones, setInfracciones] = useState(infraccionesIniciales);
  const [tab, setTab] = useState<"listado" | "liquidacion">("listado");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [infraccionAEditar, setInfraccionAEditar] = useState<Infraccion | null>(null);
  const [query, setQuery] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const hoy = new Date();
  const [mesLiquidacion, setMesLiquidacion] = useState(`${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`);
  const [liquidacion, setLiquidacion] = useState<any[]>([]);
  const [cargandoLiquidacion, setCargandoLiquidacion] = useState(false);

  useEffect(() => {
    if (tab !== "liquidacion") return;
    let cancelado = false;
    setCargandoLiquidacion(true);
    supabase2.rpc("infracciones_liquidacion_mensual", { p_mes: `${mesLiquidacion}-01` }).then(({ data }) => {
      if (!cancelado) { setLiquidacion(data || []); setCargandoLiquidacion(false); }
    });
    return () => { cancelado = true; };
  }, [tab, mesLiquidacion]);

  const vehiculoMap = useMemo(() => Object.fromEntries(vehiculos.map((v) => [v.id, v])), [vehiculos]);

  const filtradas = useMemo(() => {
    let lista = infracciones;
    if (estadoFiltro) lista = lista.filter((i) => i.estado === estadoFiltro);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      lista = lista.filter((i) => [i.cliente_nombre, i.dominio_dni, i.planilla, i.gestor].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return lista;
  }, [infracciones, estadoFiltro, query]);

  const abrirNueva = () => { setInfraccionAEditar(null); setModalAbierto(true); };
  const abrirEdicion = (i: Infraccion) => { setInfraccionAEditar(i); setModalAbierto(true); };

  const onGuardada = (i: any) => {
    if (i._eliminada) { setInfracciones((prev) => prev.filter((x) => x.id !== i.id)); return; }
    setInfracciones((prev) => (prev.some((x) => x.id === i.id) ? prev.map((x) => (x.id === i.id ? i : x)) : [i, ...prev]));
  };

  const totalLiquidacion = useMemo(() => {
    return liquidacion.reduce((acc, l) => ({
      cantidad: acc.cantidad + Number(l.cantidad),
      total_deuda: acc.total_deuda + Number(l.total_deuda),
      total_pago_cliente: acc.total_pago_cliente + Number(l.total_pago_cliente),
      total_pago_real: acc.total_pago_real + Number(l.total_pago_real),
      total_ganancia: acc.total_ganancia + Number(l.total_ganancia),
    }), { cantidad: 0, total_deuda: 0, total_pago_cliente: 0, total_pago_real: 0, total_ganancia: 0 });
  }, [liquidacion]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 px-6 py-4 bg-white dark:bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Infracciones</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gestión de multas para clientes externos</p>
          </div>
        </div>
        <button onClick={abrirNueva} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shrink-0">
          <Plus className="w-4 h-4" /> Nueva operación
        </button>
      </header>

      <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02]">
        <button onClick={() => setTab("listado")} className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold border-b-2 transition-colors ${tab === "listado" ? "border-rose-600 text-rose-600 dark:text-rose-400" : "border-transparent text-slate-400"}`}>
          <List className="w-4 h-4" /> Listado
        </button>
        <button onClick={() => setTab("liquidacion")} className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold border-b-2 transition-colors ${tab === "liquidacion" ? "border-rose-600 text-rose-600 dark:text-rose-400" : "border-transparent text-slate-400"}`}>
          <BarChart3 className="w-4 h-4" /> Liquidación
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#141414] p-6">
        {tab === "listado" ? (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente, dominio, planilla..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
              </div>
              <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white">
                <option value="">Todos los estados</option>
                {["Pendiente", "En trámite", "Pagado", "Cancelado"].map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            {filtradas.length === 0 ? (
              <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center">
                <Landmark className="w-8 h-8 text-slate-400 mb-3" />
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Sin infracciones cargadas</h3>
                <p className="text-[13px] font-medium text-slate-500 max-w-sm">Registrá una multa a gestionar con el botón "Nueva operación".</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/5 text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-slate-100 dark:border-white/10">
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Cliente</th>
                        <th className="px-4 py-3">Dominio/DNI</th>
                        <th className="px-4 py-3">Planilla</th>
                        <th className="px-4 py-3 text-right">Deuda</th>
                        <th className="px-4 py-3 text-right">Pago cliente</th>
                        <th className="px-4 py-3 text-right">Pago real</th>
                        {puedeVerGanancia && <th className="px-4 py-3 text-right">Ganancia</th>}
                        <th className="px-4 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                      {filtradas.map((i) => (
                        <tr key={i.id} onClick={() => abrirEdicion(i)} className="hover:bg-slate-50/50 dark:hover:bg-white/5 cursor-pointer">
                          <td className="px-4 py-3 text-[13px] text-slate-600 dark:text-slate-300">{new Date(i.fecha + "T12:00:00Z").toLocaleDateString("es-AR", { timeZone: "UTC" })}</td>
                          <td className="px-4 py-3 text-[13px] font-bold text-slate-900 dark:text-white">{i.cliente_nombre || "—"}</td>
                          <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400 font-mono">{i.dominio_dni || "—"}</td>
                          <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">{i.planilla || "—"}</td>
                          <td className="px-4 py-3 text-[13px] text-right text-slate-600 dark:text-slate-300 font-mono">{fmtArs(i.deuda_ars)}</td>
                          <td className="px-4 py-3 text-[13px] text-right text-slate-600 dark:text-slate-300 font-mono">{fmtArs(i.pago_cliente_ars)}</td>
                          <td className="px-4 py-3 text-[13px] text-right text-slate-600 dark:text-slate-300 font-mono">{fmtArs(i.pago_real_ars)}</td>
                          {puedeVerGanancia && <td className="px-4 py-3 text-[13px] text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">{fmtArs(i.ganancia_ars)}</td>}
                          <td className="px-4 py-3"><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${ESTADO_COLOR[i.estado] || ""}`}>{i.estado}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <input type="month" value={mesLiquidacion} onChange={(e) => setMesLiquidacion(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white" />

            {cargandoLiquidacion ? (
              <p className="text-sm text-slate-400 text-center py-10">Cargando...</p>
            ) : liquidacion.length === 0 ? (
              <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center">
                <BarChart3 className="w-8 h-8 text-slate-400 mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Sin infracciones liquidables ese mes.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/5 text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-slate-100 dark:border-white/10">
                        <th className="px-4 py-3">Planilla</th>
                        <th className="px-4 py-3 text-right">Cantidad</th>
                        <th className="px-4 py-3 text-right">Deuda</th>
                        <th className="px-4 py-3 text-right">Pago cliente</th>
                        <th className="px-4 py-3 text-right">Pago real</th>
                        {puedeVerGanancia && <th className="px-4 py-3 text-right">Ganancia</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                      {liquidacion.map((l) => (
                        <tr key={l.planilla}>
                          <td className="px-4 py-3 text-[13px] font-bold text-slate-900 dark:text-white">{l.planilla}</td>
                          <td className="px-4 py-3 text-[13px] text-right text-slate-600 dark:text-slate-300 font-mono">{l.cantidad}</td>
                          <td className="px-4 py-3 text-[13px] text-right text-slate-600 dark:text-slate-300 font-mono">{fmtArs(l.total_deuda)}</td>
                          <td className="px-4 py-3 text-[13px] text-right text-slate-600 dark:text-slate-300 font-mono">{fmtArs(l.total_pago_cliente)}</td>
                          <td className="px-4 py-3 text-[13px] text-right text-slate-600 dark:text-slate-300 font-mono">{fmtArs(l.total_pago_real)}</td>
                          {puedeVerGanancia && <td className="px-4 py-3 text-[13px] text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">{fmtArs(l.total_ganancia)}</td>}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                        <td className="px-4 py-3 text-[13px] font-black text-slate-900 dark:text-white">Total</td>
                        <td className="px-4 py-3 text-[13px] text-right font-black text-slate-900 dark:text-white font-mono">{totalLiquidacion.cantidad}</td>
                        <td className="px-4 py-3 text-[13px] text-right font-black text-slate-900 dark:text-white font-mono">{fmtArs(totalLiquidacion.total_deuda)}</td>
                        <td className="px-4 py-3 text-[13px] text-right font-black text-slate-900 dark:text-white font-mono">{fmtArs(totalLiquidacion.total_pago_cliente)}</td>
                        <td className="px-4 py-3 text-[13px] text-right font-black text-slate-900 dark:text-white font-mono">{fmtArs(totalLiquidacion.total_pago_real)}</td>
                        {puedeVerGanancia && <td className="px-4 py-3 text-[13px] text-right font-black text-emerald-600 dark:text-emerald-400 font-mono">{fmtArs(totalLiquidacion.total_ganancia)}</td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {modalAbierto && (
        <NuevaInfraccionModal
          infraccion={infraccionAEditar}
          vehiculos={vehiculos}
          onClose={() => setModalAbierto(false)}
          onGuardada={(i) => { onGuardada(i); setModalAbierto(false); }}
        />
      )}
    </div>
  );
}
