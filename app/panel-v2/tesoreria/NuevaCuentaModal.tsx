"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { useRouter } from "next/navigation";
import { Plus, X, Landmark } from "lucide-react";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";
const labelClass = "text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block";

export default function NuevaCuentaModal({ sucursales }: { sucursales: any[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("Banco");
  const [moneda, setMoneda] = useState("ARS");
  const [saldoInicial, setSaldoInicial] = useState("");
  const [sucursalId, setSucursalId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const { error } = await supabase2.from("cuentas").insert({ nombre, tipo, moneda, saldo_inicial: Number(saldoInicial) || 0, sucursal_id: sucursalId || null });
      if (error) throw error;
      setIsOpen(false);
      setNombre(""); setSaldoInicial(""); setSucursalId(""); setTipo("Banco"); setMoneda("ARS");
      router.refresh();
    } catch {
      alert("Error al crear la cuenta");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shrink-0"><Plus className="w-4 h-4" /> Nueva Cuenta</button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/10 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Landmark className="w-5 h-5 text-rose-600" /> Nueva Cuenta</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className={labelClass}>Nombre</label><input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} placeholder="Ej: Banco Galicia Cta Cte" /></div>
              <div>
                <label className={labelClass}>Tipo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={`${inputClass} cursor-pointer`}>
                  <option value="Banco">Banco</option><option value="Tarjeta">Tarjeta</option><option value="Efectivo">Efectivo</option><option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Moneda</label>
                <select value={moneda} onChange={(e) => setMoneda(e.target.value)} className={`${inputClass} cursor-pointer`}>
                  <option value="ARS">Pesos (ARS)</option><option value="USD">Dólares (USD)</option>
                </select>
              </div>
              <div><label className={labelClass}>Saldo inicial ({moneda === "USD" ? "US$" : "$"})</label><input type="number" step="0.01" value={saldoInicial} onChange={(e) => setSaldoInicial(e.target.value)} className={inputClass} placeholder="0" /></div>
              <div>
                <label className={labelClass}>Sucursal (opcional)</label>
                <select value={sucursalId} onChange={(e) => setSucursalId(e.target.value)} className={`${inputClass} cursor-pointer`}>
                  <option value="">Sin especificar</option>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <button type="submit" disabled={cargando} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 text-[12px] uppercase tracking-widest transition-colors">
                {cargando ? "Guardando..." : "Crear Cuenta"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
