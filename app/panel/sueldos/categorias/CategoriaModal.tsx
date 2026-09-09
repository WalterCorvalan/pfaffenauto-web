"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Save, Trash2 } from "lucide-react";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 block";

export default function CategoriaModal({
  categoria,
  onClose,
  onSuccess,
}: {
  categoria?: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!categoria?.id;
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState(categoria?.nombre || "");
  const [sueldoBase, setSueldoBase] = useState(categoria?.sueldo_base != null ? String(categoria.sueldo_base) : "0");
  const [monedaSueldo, setMonedaSueldo] = useState(categoria?.moneda_sueldo || "ARS");
  const [tieneComision, setTieneComision] = useState(categoria?.tiene_comision || false);
  const [montoTaller, setMontoTaller] = useState(categoria?.monto_por_auto_taller != null ? String(categoria.monto_por_auto_taller) : "");
  const [monedaTaller, setMonedaTaller] = useState(categoria?.moneda_taller || "ARS");
  const [orden, setOrden] = useState(categoria?.orden != null ? String(categoria.orden) : "0");

  const guardar = async () => {
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const payload = {
        nombre: nombre.trim(),
        sueldo_base: Number(sueldoBase) || 0,
        moneda_sueldo: monedaSueldo,
        tiene_comision: tieneComision,
        monto_por_auto_taller: montoTaller ? Number(montoTaller) : null,
        moneda_taller: monedaTaller,
        orden: Number(orden) || 0,
      };
      const { error: err } = isEditing
        ? await supabase2.from("categorias_empleado").update(payload).eq("id", categoria.id)
        : await supabase2.from("categorias_empleado").insert(payload);
      if (err) throw err;
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al guardar la categoría.");
    } finally {
      setCargando(false);
    }
  };

  const borrar = async () => {
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"? Los empleados que la tengan asignada quedarán sin categoría.`)) return;
    setCargando(true);
    try {
      const { error: err } = await supabase2.from("categorias_empleado").delete().eq("id", categoria.id);
      if (err) throw err;
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError("No se pudo borrar la categoría.");
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !cargando && onClose()} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 pb-4 shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{isEditing ? "Editar categoría" : "Nueva categoría"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-xl font-medium">{error}</div>
          )}

          <div>
            <label className={labelClass}>Nombre <span className="text-rose-500">*</span></label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Vendedor" className={inputClass} autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sueldo base</label>
              <input type="number" value={sueldoBase} onChange={(e) => setSueldoBase(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Moneda</label>
              <select value={monedaSueldo} onChange={(e) => setMonedaSueldo(e.target.value)} className={`${inputClass} cursor-pointer`}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={tieneComision} onChange={(e) => setTieneComision(e.target.checked)} className="w-4 h-4 rounded accent-rose-600" />
            Cobra comisión por venta
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Monto por auto (taller)</label>
              <input type="number" value={montoTaller} onChange={(e) => setMontoTaller(e.target.value)} placeholder="Opcional" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Moneda taller</label>
              <select value={monedaTaller} onChange={(e) => setMonedaTaller(e.target.value)} className={`${inputClass} cursor-pointer`}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Orden de visualización</label>
            <input type="number" value={orden} onChange={(e) => setOrden(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="flex gap-2 p-6 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-transparent">
          {isEditing && (
            <button onClick={borrar} disabled={cargando} className="mr-auto p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors disabled:opacity-50" title="Eliminar categoría">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={onClose} disabled={cargando} className={`px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1 ${!isEditing && "ml-auto"}`}>
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button onClick={guardar} disabled={cargando} className="px-6 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
            <Save className="w-4 h-4" /> {cargando ? "Guardando..." : (isEditing ? "Guardar" : "Crear")}
          </button>
        </div>
      </div>
    </div>
  );
}
