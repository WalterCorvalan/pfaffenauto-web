"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  Wallet, Plus, X, Car, FileBadge, ArrowLeftRight, Wrench, Receipt, Users, Building2,
} from "lucide-react";

type Categoria = "patentes" | "transferencias_patentamientos" | "repuestos_reparaciones" | "gastos_varios" | "sueldos";

interface CategoriaConfig {
  tabla: Categoria;
  label: string;
  icono: React.ReactNode;
  color: string;
  conVehiculo: boolean;
  campoExtraLabel: string; // "Período" o "Concepto"
  campoExtraKey: "periodo" | "concepto";
  conEmpleado: boolean;
}

const CATEGORIAS: CategoriaConfig[] = [
  { tabla: "patentes", label: "Patentes", icono: <FileBadge className="w-4 h-4" />, color: "indigo", conVehiculo: true, campoExtraLabel: "Período", campoExtraKey: "periodo", conEmpleado: false },
  { tabla: "transferencias_patentamientos", label: "Transferencias y Patentamientos", icono: <ArrowLeftRight className="w-4 h-4" />, color: "sky", conVehiculo: true, campoExtraLabel: "Concepto", campoExtraKey: "concepto", conEmpleado: false },
  { tabla: "repuestos_reparaciones", label: "Repuestos y Reparaciones", icono: <Wrench className="w-4 h-4" />, color: "amber", conVehiculo: true, campoExtraLabel: "Concepto", campoExtraKey: "concepto", conEmpleado: false },
  { tabla: "gastos_varios", label: "Gastos Varios", icono: <Receipt className="w-4 h-4" />, color: "rose", conVehiculo: false, campoExtraLabel: "Concepto", campoExtraKey: "concepto", conEmpleado: false },
  { tabla: "sueldos", label: "Sueldos", icono: <Users className="w-4 h-4" />, color: "emerald", conVehiculo: false, campoExtraLabel: "Concepto", campoExtraKey: "concepto", conEmpleado: true },
];

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  indigo: { bg: "bg-indigo-50 dark:bg-[#002a6e]", text: "text-indigo-600 dark:text-sky-300", border: "border-indigo-100 dark:border-[#0a2a6b]" },
  sky: { bg: "bg-sky-50 dark:bg-[#002a6e]", text: "text-sky-600 dark:text-sky-300", border: "border-sky-100 dark:border-[#0a2a6b]" },
  amber: { bg: "bg-amber-50 dark:bg-[#002a6e]", text: "text-amber-600 dark:text-amber-300", border: "border-amber-100 dark:border-[#0a2a6b]" },
  rose: { bg: "bg-rose-50 dark:bg-[#002a6e]", text: "text-rose-600 dark:text-rose-300", border: "border-rose-100 dark:border-[#0a2a6b]" },
  emerald: { bg: "bg-emerald-50 dark:bg-[#002a6e]", text: "text-emerald-600 dark:text-emerald-300", border: "border-emerald-100 dark:border-[#0a2a6b]" },
};

export default function EgresosClient({
  sucursales,
  perfiles,
  datosIniciales,
}: {
  sucursales: { id: string; nombre: string }[];
  perfiles: { id: string; nombre: string }[];
  datosIniciales: Record<Categoria, any[]>;
}) {
  const router = useRouter();
  const [tabActiva, setTabActiva] = useState<Categoria>("patentes");
  const [filtroSucursal, setFiltroSucursal] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const config = CATEGORIAS.find((c) => c.tabla === tabActiva)!;
  const colores = colorClasses[config.color];

  const registros = (datosIniciales[tabActiva] || []).filter(
    (r) => !filtroSucursal || r.sucursal_id === filtroSucursal
  );
  const totalCategoria = registros.reduce((acc, r) => acc + (Number(r.importe) || 0), 0);

  const totalGeneral = CATEGORIAS.reduce((acc, c) => {
    const regs = (datosIniciales[c.tabla] || []).filter((r) => !filtroSucursal || r.sucursal_id === filtroSucursal);
    return acc + regs.reduce((a, r) => a + (Number(r.importe) || 0), 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGuardando(true);
    const form = new FormData(e.currentTarget);

    const payload: Record<string, any> = {
      fecha: form.get("fecha"),
      importe: Number(form.get("importe")),
      sucursal_id: form.get("sucursal_id") || null,
      [config.campoExtraKey]: form.get("campoExtra") || null,
    };

    if (config.conVehiculo) {
      payload.dominio = form.get("dominio") || null;
      payload.marca = form.get("marca") || null;
      payload.modelo = form.get("modelo") || null;
      payload.modelo_anio = form.get("modelo_anio") ? Number(form.get("modelo_anio")) : null;
    }

    if (config.conEmpleado) {
      payload.nombre = form.get("nombre") || null;
      payload.usuario_id = form.get("usuario_id") || null;
    }

    try {
      const { error } = await supabase.from(config.tabla).insert(payload);
      if (error) throw error;
      setShowModal(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error al guardar el egreso.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-[#002a6e] border border-rose-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-rose-600 dark:text-rose-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Egresos por Categoría</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Patentes, transferencias, repuestos, gastos varios y sueldos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filtroSucursal}
            onChange={(e) => setFiltroSucursal(e.target.value)}
            className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-3 py-2 text-[12px] font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => (<option key={s.id} value={s.id}>{s.nombre}</option>))}
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-[12px] font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nuevo Egreso
          </button>
        </div>
      </header>

      {/* ================= TABS ================= */}
      <div className="flex items-center gap-1 px-6 pt-3 bg-white dark:bg-[#001c55] border-b border-slate-200 dark:border-[#0a2a6b] overflow-x-auto custom-scrollbar shrink-0">
        {CATEGORIAS.map((c) => {
          const activa = c.tabla === tabActiva;
          const col = colorClasses[c.color];
          return (
            <button
              key={c.tabla}
              onClick={() => setTabActiva(c.tabla)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[12px] font-bold whitespace-nowrap border-b-2 transition-colors ${
                activa ? `${col.text} border-current` : "text-slate-400 dark:text-slate-500 border-transparent hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              {c.icono} {c.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* ================= RESUMEN ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`bg-white dark:bg-[#001c55] border ${colores.border} rounded-2xl p-5 shadow-sm`}>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">{config.label} ({registros.length})</span>
              <h3 className={`text-2xl font-black mt-1 font-mono ${colores.text}`}>$ {totalCategoria.toLocaleString("es-AR")}</h3>
            </div>
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">Total egresos (todas las categorías)</span>
              <h3 className="text-2xl font-black mt-1 font-mono text-slate-800 dark:text-white">$ {totalGeneral.toLocaleString("es-AR")}</h3>
            </div>
          </div>

          {/* ================= TABLA (desktop) ================= */}
          <div className="hidden md:block bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#00246b] border-b border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6">Fecha</th>
                    {config.conVehiculo && <th className="p-4">Vehículo</th>}
                    {config.conEmpleado && <th className="p-4">Empleado</th>}
                    <th className="p-4">{config.campoExtraLabel}</th>
                    <th className="p-4 flex items-center gap-1"><Building2 className="w-3 h-3" /> Sucursal</th>
                    <th className="p-4 pr-6 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                  {registros.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-[#00246b] transition-colors">
                      <td className="p-4 pl-6 text-[13px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {new Date(`${r.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}
                      </td>
                      {config.conVehiculo && (
                        <td className="p-4 text-[13px] text-slate-700 dark:text-slate-200">
                          {r.marca || r.modelo ? (
                            <span className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {r.marca} {r.modelo} {r.modelo_anio ? `(${r.modelo_anio})` : ""} {r.dominio ? `· ${r.dominio}` : ""}</span>
                          ) : "—"}
                        </td>
                      )}
                      {config.conEmpleado && (
                        <td className="p-4 text-[13px] text-slate-700 dark:text-slate-200">{r.nombre || "—"}</td>
                      )}
                      <td className="p-4 text-[13px] text-slate-600 dark:text-slate-300">{r[config.campoExtraKey] || "—"}</td>
                      <td className="p-4 text-[13px] text-slate-600 dark:text-slate-300">{r.sucursales?.nombre || "—"}</td>
                      <td className="p-4 pr-6 text-right font-mono text-[13px] font-bold text-rose-600 dark:text-rose-300">$ {Number(r.importe).toLocaleString("es-AR")}</td>
                    </tr>
                  ))}
                  {registros.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                        Sin registros de {config.label.toLowerCase()} todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= TARJETAS (mobile) — mismos datos, sin scroll horizontal ================= */}
          <div className="md:hidden space-y-3">
            {registros.length === 0 ? (
              <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                Sin registros de {config.label.toLowerCase()} todavía.
              </div>
            ) : (
              registros.map((r) => (
                <div key={r.id} className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
                      {new Date(`${r.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}
                    </span>
                    <span className="font-mono text-[14px] font-black text-rose-600 dark:text-rose-300">$ {Number(r.importe).toLocaleString("es-AR")}</span>
                  </div>
                  {config.conVehiculo && (
                    <FilaMovil label="Vehículo" valor={r.marca || r.modelo ? `${r.marca || ""} ${r.modelo || ""} ${r.modelo_anio ? `(${r.modelo_anio})` : ""} ${r.dominio ? `· ${r.dominio}` : ""}`.trim() : "—"} icono={<Car className="w-3 h-3" />} />
                  )}
                  {config.conEmpleado && <FilaMovil label="Empleado" valor={r.nombre || "—"} />}
                  <FilaMovil label={config.campoExtraLabel} valor={r[config.campoExtraKey] || "—"} />
                  <FilaMovil label="Sucursal" valor={r.sucursales?.nombre || "—"} icono={<Building2 className="w-3 h-3" />} />
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* ================= MODAL NUEVO EGRESO ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !guardando && setShowModal(false)}></div>
          <div className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] w-full max-w-md rounded-2xl shadow-2xl p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {config.icono} Nuevo egreso — {config.label}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Fecha</label>
                  <input type="date" name="fecha" required defaultValue={new Date().toISOString().split("T")[0]} className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Importe ($)</label>
                  <input type="number" name="importe" required min="0" step="0.01" placeholder="0" className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Sucursal</label>
                <select name="sucursal_id" className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer">
                  <option value="">Sin especificar</option>
                  {sucursales.map((s) => (<option key={s.id} value={s.id}>{s.nombre}</option>))}
                </select>
              </div>

              {config.conVehiculo && (
                <div className="border-t border-slate-100 dark:border-[#0a2a6b] pt-4 space-y-3">
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Datos del vehículo</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="marca" placeholder="Marca" className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                    <input name="modelo" placeholder="Modelo" className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                    <input name="dominio" placeholder="Dominio (patente)" className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                    <input name="modelo_anio" type="number" placeholder="Año" className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                  </div>
                </div>
              )}

              {config.conEmpleado && (
                <div className="border-t border-slate-100 dark:border-[#0a2a6b] pt-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Empleado</label>
                    <input name="nombre" required placeholder="Nombre del empleado" className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Vincular a usuario del sistema (opcional)</label>
                    <select name="usuario_id" className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer">
                      <option value="">Sin vincular</option>
                      {perfiles.map((p) => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">{config.campoExtraLabel}</label>
                <input
                  name="campoExtra"
                  placeholder={config.campoExtraKey === "periodo" ? "Ej: 2026/03" : "Ej: Cambio de aceite"}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-[#0a2a6b] flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-white dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#002a6e] text-slate-600 dark:text-slate-300 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={guardando} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  {guardando ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FilaMovil({ label, valor, icono }: { label: string; valor: string; icono?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12px]">
      <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide flex items-center gap-1 shrink-0">{icono}{label}</span>
      <span className="text-slate-700 dark:text-slate-200 text-right truncate">{valor}</span>
    </div>
  );
}
