"use client";

import { useMemo, useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { FileBadge, ArrowLeftRight, Wrench, Receipt, Users, Building2, Car, Plus, X } from "lucide-react";
import { fmt } from "./shared";
import { hoyLocalISO } from "@/lib/panel/fechas";

// Calcado de v1 (panel/gastos/egresos) pero sin tablas nuevas: en vez de 5
// tablas separadas (patentes, transferencias_patentamientos, ...) reusa
// movimientos_caja con tipo_movimiento = categoría -- así estos gastos
// siguen sumando en Ingresos/Egresos, Dashboard y Gastos Atípicos en vez de
// quedar en una isla aparte.
type CategoriaKey = "Patentes" | "Transferencias y Patentamientos" | "Repuestos y Reparaciones" | "Gastos Varios" | "Sueldos";

interface CategoriaConfig {
  key: CategoriaKey;
  label: string;
  icono: any;
  color: string;
  conVehiculo: boolean;
  conEmpleado: boolean;
  campoExtraLabel: string;
}

const CATEGORIAS: CategoriaConfig[] = [
  { key: "Patentes", label: "Patentes", icono: FileBadge, color: "indigo", conVehiculo: true, conEmpleado: false, campoExtraLabel: "Período" },
  { key: "Transferencias y Patentamientos", label: "Transferencias y Patentamientos", icono: ArrowLeftRight, color: "sky", conVehiculo: true, conEmpleado: false, campoExtraLabel: "Concepto" },
  { key: "Repuestos y Reparaciones", label: "Repuestos y Reparaciones", icono: Wrench, color: "amber", conVehiculo: true, conEmpleado: false, campoExtraLabel: "Concepto" },
  { key: "Gastos Varios", label: "Gastos Varios", icono: Receipt, color: "rose", conVehiculo: false, conEmpleado: false, campoExtraLabel: "Concepto" },
  { key: "Sueldos", label: "Sueldos", icono: Users, color: "emerald", conVehiculo: false, conEmpleado: true, campoExtraLabel: "Concepto" },
];

const COLOR_TEXTO: Record<string, string> = {
  indigo: "text-indigo-600 dark:text-indigo-400", sky: "text-sky-600 dark:text-sky-400", amber: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-600 dark:text-rose-400", emerald: "text-emerald-600 dark:text-emerald-400",
};
const COLOR_BORDE: Record<string, string> = {
  indigo: "border-indigo-200 dark:border-indigo-500/30", sky: "border-sky-200 dark:border-sky-500/30", amber: "border-amber-200 dark:border-amber-500/30",
  rose: "border-rose-200 dark:border-rose-500/30", emerald: "border-emerald-200 dark:border-emerald-500/30",
};

export default function EgresosCategoriaTab({
  movimientos, setMovimientos, cuentas, sucursales, vendedores, vehiculosTodos, miId,
}: {
  movimientos: any[]; setMovimientos: (fn: any) => void; cuentas: any[]; sucursales: { id: string; nombre: string }[];
  vendedores: { id: string; nombre: string }[]; vehiculosTodos: { id: string; marca: string; modelo: string; anio: number; patente: string | null }[];
  miId: string;
}) {
  const [tabActiva, setTabActiva] = useState<CategoriaKey>("Patentes");
  const [filtroSucursal, setFiltroSucursal] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const config = CATEGORIAS.find((c) => c.key === tabActiva)!;

  const egresosPorCategoria = useMemo(() => {
    const map = new Map<string, any[]>();
    CATEGORIAS.forEach((c) => map.set(c.key, []));
    movimientos
      .filter((m) => m.tipo === "egreso" && m.estado === "aprobado")
      .forEach((m) => { if (map.has(m.tipo_movimiento)) map.get(m.tipo_movimiento)!.push(m); });
    return map;
  }, [movimientos]);

  const registros = (egresosPorCategoria.get(tabActiva) || []).filter((r) => !filtroSucursal || r.sucursal_id === filtroSucursal);
  const totalPorMoneda = (lista: any[]) => {
    const map: Record<string, number> = {};
    lista.forEach((r) => { const mo = r.cuenta?.moneda; if (mo) map[mo] = (map[mo] || 0) + Number(r.monto); });
    return map;
  };
  const totalCategoria = totalPorMoneda(registros);
  const totalGeneral = totalPorMoneda(
    CATEGORIAS.flatMap((c) => (egresosPorCategoria.get(c.key) || []).filter((r) => !filtroSucursal || r.sucursal_id === filtroSucursal))
  );

  const [fCuentaId, setFCuentaId] = useState("");
  const [fImporte, setFImporte] = useState("");
  const [fFecha, setFFecha] = useState(hoyLocalISO());
  const [fSucursalId, setFSucursalId] = useState("");
  const [fVehiculoId, setFVehiculoId] = useState("");
  const [fPatente, setFPatente] = useState("");
  const [fEmpleadoId, setFEmpleadoId] = useState("");
  const [fExtra, setFExtra] = useState("");

  const abrirModal = () => {
    setFCuentaId(""); setFImporte(""); setFFecha(hoyLocalISO()); setFSucursalId(""); setFVehiculoId(""); setFPatente(""); setFEmpleadoId(""); setFExtra("");
    setShowModal(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fCuentaId || !fImporte) return alert("Elegí la caja y el importe.");
    setGuardando(true);
    try {
      const { data: movId, error } = await supabase2.rpc("registrar_movimiento_caja", {
        p_tipo: "egreso", p_monto: Number(fImporte), p_cuenta_id: fCuentaId, p_fecha: fFecha,
        p_categoria: config.key, p_forma_pago: "Transferencia",
        p_vehiculo_id: config.conVehiculo ? (fVehiculoId || null) : null,
        p_cliente_id: null, p_venta_id: null,
        p_observaciones: fExtra || null,
      });
      if (error) throw error;
      const patch: Record<string, unknown> = { sucursal_id: fSucursalId || null };
      if (config.conVehiculo && fPatente) patch.patente = fPatente.toUpperCase();
      if (config.conEmpleado) patch.vendedor_id = fEmpleadoId || null;
      const { data: actualizado } = await supabase2.from("movimientos_caja").update(patch)
        .eq("id", movId)
        .select("*, cuenta:cuentas(nombre, moneda), vehiculo:vehiculo_id ( marca, modelo, anio ), vendedor:vendedor_id ( nombre )")
        .single();
      if (actualizado) setMovimientos((prev: any[]) => [actualizado, ...prev]);
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al guardar el egreso.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Egresos por Categoría</h2>
          <p className="text-xs text-slate-400">Patentes, transferencias, repuestos, gastos varios y sueldos</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer">
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
          <button onClick={abrirModal} className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"><Plus className="w-4 h-4" /> Nuevo Egreso</button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 overflow-x-auto">
        {CATEGORIAS.map((c) => {
          const Icon = c.icono;
          const activa = c.key === tabActiva;
          return (
            <button key={c.key} onClick={() => setTabActiva(c.key)} className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${activa ? `${COLOR_TEXTO[c.color]} border-current` : "text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-600 dark:hover:text-slate-300"}`}>
              <Icon className="w-4 h-4" /> {c.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={`bg-white dark:bg-white/5 border ${COLOR_BORDE[config.color]} rounded-2xl p-5`}>
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{config.label} ({registros.length})</span>
          {Object.keys(totalCategoria).length === 0 ? <h3 className={`text-2xl font-black mt-1 font-mono ${COLOR_TEXTO[config.color]}`}>$ 0</h3> : Object.entries(totalCategoria).map(([m, v]) => <h3 key={m} className={`text-2xl font-black mt-1 font-mono ${COLOR_TEXTO[config.color]}`}>{fmt(v, m)}</h3>)}
        </div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Total egresos (todas las categorías)</span>
          {Object.keys(totalGeneral).length === 0 ? <h3 className="text-2xl font-black mt-1 font-mono">$ 0</h3> : Object.entries(totalGeneral).map(([m, v]) => <h3 key={m} className="text-2xl font-black mt-1 font-mono text-slate-800 dark:text-white">{fmt(v, m)}</h3>)}
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/5 text-slate-400 uppercase tracking-widest font-bold">
                <th className="p-3 pl-4">Fecha</th>
                {config.conVehiculo && <th className="p-3">Vehículo</th>}
                {config.conEmpleado && <th className="p-3">Empleado</th>}
                <th className="p-3">{config.campoExtraLabel}</th>
                <th className="p-3 flex items-center gap-1"><Building2 className="w-3 h-3" /> Sucursal</th>
                <th className="p-3 pr-4 text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {registros.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                  <td className="p-3 pl-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{new Date(`${r.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}</td>
                  {config.conVehiculo && (
                    <td className="p-3 text-slate-700 dark:text-slate-200">
                      {r.vehiculo || r.patente ? <span className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-slate-400" /> {r.vehiculo ? `${r.vehiculo.marca} ${r.vehiculo.modelo} (${r.vehiculo.anio})` : ""} {r.patente ? `· ${r.patente}` : ""}</span> : "—"}
                    </td>
                  )}
                  {config.conEmpleado && <td className="p-3 text-slate-700 dark:text-slate-200">{r.vendedor?.nombre || "—"}</td>}
                  <td className="p-3 text-slate-600 dark:text-slate-300">{r.observaciones || "—"}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{sucursales.find((s) => s.id === r.sucursal_id)?.nombre || "—"}</td>
                  <td className="p-3 pr-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">{fmt(Number(r.monto), r.cuenta?.moneda || "ARS")}</td>
                </tr>
              ))}
              {registros.length === 0 && (
                <tr><td colSpan={6} className="p-10 text-center text-slate-400 italic">Sin registros de {config.label.toLowerCase()} todavía.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !guardando && setShowModal(false)} />
          <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><config.icono className="w-5 h-5" /> Nuevo egreso — {config.label}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={guardar} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Fecha</label><input type="date" required value={fFecha} onChange={(e) => setFFecha(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500" /></div>
                <div><label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Importe</label><input type="text" inputMode="numeric" required placeholder="147000" value={fImporte} onChange={(e) => setFImporte(e.target.value.replace(/\D/g, ""))} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500" /></div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Caja de la que sale</label>
                <select required value={fCuentaId} onChange={(e) => setFCuentaId(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500">
                  <option value="">Elegir caja...</option>
                  {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Sucursal</label>
                <select value={fSucursalId} onChange={(e) => setFSucursalId(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500">
                  <option value="">Sin especificar</option>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              {config.conVehiculo && (
                <div className="border-t border-slate-100 dark:border-white/10 pt-4 space-y-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Vehículo</p>
                  <select value={fVehiculoId} onChange={(e) => { setFVehiculoId(e.target.value); const v = vehiculosTodos.find((x) => x.id === e.target.value); if (v?.patente) setFPatente(v.patente); }} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500">
                    <option value="">Elegir del stock (opcional)...</option>
                    {vehiculosTodos.map((v) => <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.anio}) {v.patente ? `· ${v.patente}` : ""}</option>)}
                  </select>
                  <input placeholder="Patente (si no está en la lista)" value={fPatente} onChange={(e) => setFPatente(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500" />
                </div>
              )}
              {config.conEmpleado && (
                <div className="border-t border-slate-100 dark:border-white/10 pt-4">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Empleado</label>
                  <select required value={fEmpleadoId} onChange={(e) => setFEmpleadoId(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500">
                    <option value="">Elegir...</option>
                    {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">{config.campoExtraLabel}</label>
                <input placeholder={config.campoExtraLabel === "Período" ? "Ej: 2026/03" : "Ej: Cambio de aceite"} value={fExtra} onChange={(e) => setFExtra(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500" />
              </div>
              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-white/10 flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={guardando} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors disabled:opacity-50">{guardando ? "Guardando..." : "Registrar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
