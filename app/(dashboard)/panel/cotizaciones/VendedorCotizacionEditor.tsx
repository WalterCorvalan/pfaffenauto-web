"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Edit3, X, Save } from "lucide-react";

interface Vendedor {
  id: string;
  nombre: string | null;
  rol?: string;
}

const ROL_LABEL: Record<string, string> = { admin: "Dueño", encargado: "Encargado", vendedor: "Vendedor" };

interface VendedorCotizacionEditorProps {
  cotizacionId: string;
  vendedorActualId: string | null;
  vendedorActualNombre: string | null;
  vendedores: Vendedor[];
}

export default function VendedorCotizacionEditor({ cotizacionId, vendedorActualId, vendedorActualNombre, vendedores }: VendedorCotizacionEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [nuevoVendedor, setNuevoVendedor] = useState(vendedorActualId || "");
  const [cargando, setCargando] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevoVendedor === vendedorActualId) return;
    setCargando(true);
    try {
      const { error } = await supabase.from("cotizaciones").update({ vendedor_id: nuevoVendedor || null }).eq("id", cotizacionId);
      if (error) throw error;
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error al asignar vendedor:", error);
      alert("Error al asignar el vendedor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <div
        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        className="flex items-center gap-1.5 truncate font-medium text-[11px] transition-all rounded-md px-1.5 py-1 -ml-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#00246b] text-slate-600 dark:text-slate-300 group"
        title="Tocar para asignar vendedor"
      >
        <User className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-sky-300" />
        <span className="truncate">{vendedorActualNombre || "Sin asignar"}</span>
        <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0 text-slate-400 dark:text-slate-500" />
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !cargando && setIsEditing(false)}></div>
          <div className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600 dark:text-sky-300" /> Asignar Vendedor
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Vendedor responsable</label>
                <div className="flex items-center bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 focus-within:border-indigo-500 transition-colors shadow-sm">
                  <select value={nuevoVendedor} onChange={(e) => setNuevoVendedor(e.target.value)} className="w-full bg-transparent py-3 text-sm text-slate-900 dark:text-white outline-none appearance-none cursor-pointer">
                    <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin asignar</option>
                    {vendedores.map((v) => (
                      <option key={v.id} value={v.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">
                        {v.nombre} — {ROL_LABEL[v.rol || "vendedor"]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-[#0a2a6b] flex gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-white dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#002a6e] text-slate-600 dark:text-slate-300 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={cargando || nuevoVendedor === vendedorActualId} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  {cargando ? "Guardando..." : <><Save className="w-3.5 h-3.5" /> Confirmar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
