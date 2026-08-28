"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { useRouter } from "next/navigation";
import { Plus, X, Megaphone, Save } from "lucide-react";

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400";

export default function NuevaCampanaModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [plataforma, setPlataforma] = useState("Google Ads");
  const [nombreCampana, setNombreCampana] = useState("");
  const [periodo, setPeriodo] = useState(() => new Date().toISOString().slice(0, 10));
  const [gasto, setGasto] = useState("");
  const [clics, setClics] = useState("");
  const [leads, setLeads] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const { data: { user } } = await supabase2.auth.getUser();
      const { error } = await supabase2.from("campanas_marketing").insert({
        plataforma,
        nombre_campana: nombreCampana || null,
        periodo,
        gasto: Number(gasto) || 0,
        clics: Number(clics) || 0,
        leads: Number(leads) || 0,
        creado_por: user?.id,
      });
      if (error) throw error;
      setIsOpen(false);
      setNombreCampana(""); setGasto(""); setClics(""); setLeads("");
      router.refresh();
    } catch (err) {
      alert("Error al registrar la campaña.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors shrink-0"
      >
        <Plus className="w-4 h-4" /> Cargar Métricas
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !cargando && setIsOpen(false)} />
          <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
            
            <div className="p-6 pb-0 shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-rose-600" /> Cargar Pauta
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto overflow-x-hidden flex-1 min-h-0 space-y-4 custom-scrollbar">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Plataforma</label>
                <select value={plataforma} onChange={(e) => setPlataforma(e.target.value)} className={`${inputClass} cursor-pointer`}>
                  <option value="Google Ads">Google Ads</option>
                  <option value="Meta Ads">Meta Ads</option>
                  <option value="MercadoLibre">MercadoLibre</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Nombre (opcional)</label>
                <input
                  type="text" value={nombreCampana} onChange={(e) => setNombreCampana(e.target.value)}
                  className={inputClass} placeholder="Ej: Búsqueda - 0km Casa Central"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Día/Período</label>
                <input type="date" required value={periodo} onChange={(e) => setPeriodo(e.target.value)} className={inputClass} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Gasto ($)</label>
                  <input type="number" step="0.01" required value={gasto} onChange={(e) => setGasto(e.target.value)} className={`${inputClass} font-mono`} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Clics</label>
                  <input type="number" value={clics} onChange={(e) => setClics(e.target.value)} className={`${inputClass} font-mono`} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Leads</label>
                  <input type="number" value={leads} onChange={(e) => setLeads(e.target.value)} className={`${inputClass} font-mono`} placeholder="0" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 p-6 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-transparent mt-2">
              <button onClick={() => setIsOpen(false)} disabled={cargando} className="ml-auto px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={cargando} className="px-6 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                {cargando ? "Guardando..." : <><Save className="w-4 h-4" /> Registrar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}