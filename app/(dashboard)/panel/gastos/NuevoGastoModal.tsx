"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NuevoGastoModal({ sucursales }: { sucursales: any[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cargando, setCargando] = useState(false);
  
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [sucursalId, setSucursalId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("movimientos_caja").insert({
        tipo: "egreso",
        monto: Number(monto),
        descripcion,
        sucursal_id: sucursalId,
        usuario_id: user?.id,
        forma_pago: "Efectivo",
        fecha: new Date().toISOString().split("T")[0]
      });

      if (error) throw error;
      setIsOpen(false);
      setMonto(""); setDescripcion("");
      router.refresh();
    } catch (err) {
      alert("Error al registrar el gasto");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="bg-[#111827] border border-dashed border-[#2d3d54] p-6 rounded-2xl flex flex-col justify-center items-center text-center cursor-pointer hover:border-rose-500/40 hover:bg-rose-500/[0.03] transition-colors h-full">
        <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mb-3 text-rose-500">
          <Plus className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-rose-400">Registrar Egreso</h3>
        <span className="text-xs text-slate-500 mt-1">Luz, sueldos, gestoría</span>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111827] border border-[#1e293b] p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Receipt className="w-5 h-5 text-rose-500"/> Nuevo Gasto</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Monto ($)</label>
                <input type="number" required value={monto} onChange={e => setMonto(e.target.value)} className="w-full bg-[#0b1329] border border-[#1e293b] p-3 rounded-xl text-white outline-none focus:border-rose-500" placeholder="Ej: 50000" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Descripción</label>
                <input type="text" required value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full bg-[#0b1329] border border-[#1e293b] p-3 rounded-xl text-white outline-none focus:border-rose-500" placeholder="Ej: Pago de luz" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">¿A qué sucursal afecta?</label>
                <select required value={sucursalId} onChange={e => setSucursalId(e.target.value)} className="w-full bg-[#0b1329] border border-[#1e293b] p-3 rounded-xl text-white outline-none focus:border-rose-500">
                  <option value="">Seleccionar...</option>
                  {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <button type="submit" disabled={cargando} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl mt-4 disabled:opacity-50">
                {cargando ? "Guardando..." : "Registrar Gasto"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}