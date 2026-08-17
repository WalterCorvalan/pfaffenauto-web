"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Tags, Plus, X, Trash2, Edit2 } from "lucide-react";

interface Categoria {
  id: string;
  nombre: string;
  sueldo_base: number;
  tiene_comision: boolean;
  monto_por_auto_taller: number;
}

export default function CategoriasEmpleadoPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [sueldoBase, setSueldoBase] = useState("");
  const [tieneComision, setTieneComision] = useState(false);
  const [montoPorAuto, setMontoPorAuto] = useState("0");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("categorias_empleado").select("*").order("nombre");
    setCategorias(data || []);
    setLoading(false);
  };

  const abrirNueva = () => {
    setEditando(null);
    setNombre("");
    setSueldoBase("");
    setTieneComision(false);
    setMontoPorAuto("0");
    setShowModal(true);
  };

  const abrirEditar = (c: Categoria) => {
    setEditando(c);
    setNombre(c.nombre);
    setSueldoBase(String(c.sueldo_base));
    setTieneComision(c.tiene_comision);
    setMontoPorAuto(String(c.monto_por_auto_taller));
    setShowModal(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const payload = {
        nombre,
        sueldo_base: Number(sueldoBase) || 0,
        tiene_comision: tieneComision,
        monto_por_auto_taller: Number(montoPorAuto) || 0,
      };
      if (editando) {
        const { error } = await supabase.from("categorias_empleado").update(payload).eq("id", editando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categorias_empleado").insert(payload);
        if (error) throw error;
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert("Error al guardar la categoría.");
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: string, nombreCat: string) => {
    if (!confirm(`¿Eliminar la categoría "${nombreCat}"?`)) return;
    await supabase.from("categorias_empleado").delete().eq("id", id);
    fetchData();
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Tags className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Categorías de Empleado</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Sueldo base y reglas para el liquidador de sueldos</p>
          </div>
        </div>
        <button
          onClick={abrirNueva}
          className="bg-indigo-600 hover:bg-indigo-700 transition-colors px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 text-white shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nueva categoría
        </button>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar p-6">
        {loading ? (
          <p className="text-slate-400 dark:text-slate-500 text-sm">Cargando...</p>
        ) : categorias.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500">
            <Tags className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-bold">Sin categorías todavía</p>
            <p className="text-xs mt-1">Creá una para poder asignarla a los empleados en Gestión de Equipo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorias.map((c) => (
              <div key={c.id} className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-[15px]">{c.nombre}</h3>
                  <div className="flex items-center gap-1">
                    <button onClick={() => abrirEditar(c)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300 hover:bg-indigo-50 dark:hover:bg-[#00246b] rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => eliminar(c.id, c.nombre)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-[#00246b] rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white mb-3">$ {c.sueldo_base.toLocaleString("es-AR")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.tiene_comision && (
                    <span className="bg-emerald-50 dark:bg-[#002a6e] text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-[#0a2a6b] text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
                      + Comisión de ventas
                    </span>
                  )}
                  {c.monto_por_auto_taller > 0 && (
                    <span className="bg-amber-50 dark:bg-[#002a6e] text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-[#0a2a6b] text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
                      + $ {c.monto_por_auto_taller.toLocaleString("es-AR")} por auto (taller)
                    </span>
                  )}
                  {!c.tiene_comision && c.monto_por_auto_taller === 0 && (
                    <span className="bg-slate-50 dark:bg-[#00246b] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#0a2a6b] text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
                      Sueldo fijo
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !guardando && setShowModal(false)}></div>
          <div className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] w-full max-w-md rounded-2xl shadow-2xl p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editando ? "Editar categoría" : "Nueva categoría"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Nombre *</label>
                <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Vendedor, Encargado, Taller" className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Sueldo base ($) *</label>
                <input required type="number" value={sueldoBase} onChange={(e) => setSueldoBase(e.target.value)} className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] text-slate-900 dark:text-white" />
              </div>
              <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 cursor-pointer bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3.5 rounded-xl hover:bg-white dark:hover:bg-[#002a6e] transition-colors font-medium">
                <input type="checkbox" checked={tieneComision} onChange={(e) => setTieneComision(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                Suma comisión de ventas (vendedores/encargados)
              </label>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Monto por auto trabajado (taller/detailing)</label>
                <input type="number" value={montoPorAuto} onChange={(e) => setMontoPorAuto(e.target.value)} placeholder="0 si no aplica" className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] text-slate-900 dark:text-white" />
              </div>
              <div className="pt-3 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-white dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#002a6e] text-slate-600 dark:text-slate-300 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={guardando} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
