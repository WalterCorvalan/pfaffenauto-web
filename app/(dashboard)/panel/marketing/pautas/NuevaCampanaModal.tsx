"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, X, Megaphone } from "lucide-react";

export default function NuevaCampanaModal({ sucursales }: { sucursales: any[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [plataforma, setPlataforma] = useState("Google Ads");
  const [nombreCampana, setNombreCampana] = useState("");
  const [sucursalId, setSucursalId] = useState("");
  const [periodo, setPeriodo] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [gasto, setGasto] = useState("");
  const [clics, setClics] = useState("");
  const [leads, setLeads] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("campanas_marketing").insert({
        plataforma,
        nombre_campana: nombreCampana || null,
        sucursal_id: sucursalId || null,
        periodo: `${periodo}-01`,
        gasto: Number(gasto) || 0,
        clics: Number(clics) || 0,
        leads: Number(leads) || 0,
        creado_por: user?.id,
      });
      if (error) throw error;
      setIsOpen(false);
      setNombreCampana(""); setSucursalId(""); setGasto(""); setClics(""); setLeads("");
      router.refresh();
    } catch (err) {
      alert("Error al registrar la campaña");
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
        <Plus className="w-4 h-4" /> Cargar Métricas
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-[#0a2a6b] pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600 dark:text-sky-300" /> Cargar Métricas de Pauta
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Plataforma</label>
                <select
                  value={plataforma} onChange={(e) => setPlataforma(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[13px] outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors appearance-none cursor-pointer"
                >
                  <option value="Google Ads" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Google Ads</option>
                  <option value="Meta Ads" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Meta Ads</option>
                  <option value="MercadoLibre" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">MercadoLibre</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Destino</label>
                <select
                  value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[13px] outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors appearance-none cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Página general</option>
                  {sucursales.map((s) => (<option key={s.id} value={s.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{s.nombre}</option>))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Nombre de campaña (opcional)</label>
                <input
                  type="text" value={nombreCampana} onChange={(e) => setNombreCampana(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[14px] outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors"
                  placeholder="Ej: Búsqueda - 0km Casa Central"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Mes</label>
                <input
                  type="month" required value={periodo} onChange={(e) => setPeriodo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[14px] outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Gasto ($)</label>
                  <input
                    type="number" step="0.01" required value={gasto} onChange={(e) => setGasto(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[13px] font-mono outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Clics/Alcance</label>
                  <input
                    type="number" value={clics} onChange={(e) => setClics(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[13px] font-mono outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Leads</label>
                  <input
                    type="number" value={leads} onChange={(e) => setLeads(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] p-3 rounded-xl text-slate-900 dark:text-white text-[13px] font-mono outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-[#0a2a6b] mt-6">
                <button
                  type="submit" disabled={cargando}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl mt-2 disabled:opacity-50 text-[11px] uppercase tracking-widest shadow-sm transition-colors"
                >
                  {cargando ? "Guardando..." : "Registrar Métricas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
