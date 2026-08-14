"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, X, Landmark } from "lucide-react";

export default function NuevaCuentaModal({ sucursales }: { sucursales: any[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("Banco");
  const [saldoInicial, setSaldoInicial] = useState("");
  const [sucursalId, setSucursalId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const { error } = await supabase.from("cuentas").insert({
        nombre,
        tipo,
        saldo_inicial: Number(saldoInicial) || 0,
        sucursal_id: sucursalId || null,
      });
      if (error) throw error;
      setIsOpen(false);
      setNombre(""); setSaldoInicial(""); setSucursalId(""); setTipo("Banco");
      router.refresh();
    } catch (err) {
      alert("Error al crear la cuenta");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-[12px] font-bold transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" /> Nueva Cuenta
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-[#0a2a6b] pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-600 dark:text-sky-300" /> Nueva Cuenta
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Nombre</label>
                <input
                  type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[14px] outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#00246b] transition-colors"
                  placeholder="Ej: Banco Galicia Cta Cte"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Tipo</label>
                <select
                  value={tipo} onChange={(e) => setTipo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[13px] outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#00246b] transition-colors appearance-none cursor-pointer"
                >
                  <option value="Banco">Banco</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Saldo inicial ($)</label>
                <input
                  type="number" step="0.01" value={saldoInicial} onChange={(e) => setSaldoInicial(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[14px] font-mono outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#00246b] transition-colors"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Sucursal (opcional)</label>
                <select
                  value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[13px] outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#00246b] transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Sin especificar</option>
                  {sucursales.map((s) => (<option key={s.id} value={s.id}>{s.nombre}</option>))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-[#0a2a6b] mt-6">
                <button
                  type="submit" disabled={cargando}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl mt-2 disabled:opacity-50 text-[11px] uppercase tracking-widest shadow-sm transition-colors"
                >
                  {cargando ? "Guardando..." : "Crear Cuenta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
