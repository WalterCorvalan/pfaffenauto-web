"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { DollarSign, Edit3, X, Save, Sparkles, Loader2 } from "lucide-react";

interface PrecioSugeridoEditorProps {
  cotizacionId: string;
  precioSugerido: number | null;
  marca?: string;
  modelo?: string;
  version?: string;
  anio?: number;
  kilometraje?: number;
}

export default function PrecioSugeridoEditor({ cotizacionId, precioSugerido, marca, modelo, version, anio, kilometraje }: PrecioSugeridoEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [precio, setPrecio] = useState(precioSugerido?.toString() || "");
  const [cargando, setCargando] = useState(false);
  const [buscandoIA, setBuscandoIA] = useState(false);
  const [detalleIA, setDetalleIA] = useState<{ precioMedio: number; cantidad: number | null; descuento: number } | null>(null);

  const buscarConIA = async () => {
    if (!marca || !modelo || !anio || kilometraje == null) return;
    setBuscandoIA(true);
    setDetalleIA(null);
    try {
      const res = await fetch("/api/cotizaciones/precio-sugerido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marca, modelo, version, anio, kilometraje }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo calcular el precio.");

      setPrecio(String(data.precio_sugerido));
      setDetalleIA({ precioMedio: data.precio_medio_mercado, cantidad: data.cantidad_comparables, descuento: data.descuento_aplicado });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al buscar precio con IA.");
    } finally {
      setBuscandoIA(false);
    }
  };

  const guardarPrecio = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    try {
      const { error } = await supabase
        .from("cotizaciones")
        .update({ precio_sugerido: precio ? Number(precio) : null })
        .eq("id", cotizacionId);
      if (error) throw error;

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error al actualizar precio sugerido:", error);
      alert("Error al actualizar el precio sugerido.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <div
        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        className="flex-1 min-w-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#00246b] rounded-lg p-1 -ml-1 transition-colors group"
        title="Tocar para cargar precio sugerido"
      >
        <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-0.5 truncate">
          Oferta Sugerida
          <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </span>
        <span className="text-[13px] font-black text-slate-800 dark:text-white font-mono truncate block">
          {precioSugerido ? `$ ${precioSugerido.toLocaleString("es-AR")}` : "Sin cargar"}
        </span>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !cargando && setIsEditing(false)}></div>
          <div className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" /> Precio Sugerido
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {marca && modelo && anio && kilometraje != null && (
              <button
                type="button"
                onClick={buscarConIA}
                disabled={buscandoIA}
                className="w-full mb-4 py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-colors disabled:opacity-50"
              >
                {buscandoIA ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando en MELI/Kavak...</> : <><Sparkles className="w-3.5 h-3.5" /> Sugerir con IA</>}
              </button>
            )}

            {detalleIA && (
              <div className="mb-4 p-3 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <div className="flex justify-between"><span>Media de mercado</span><span className="font-bold text-slate-900 dark:text-white">$ {detalleIA.precioMedio.toLocaleString("es-AR")}</span></div>
                <div className="flex justify-between"><span>Descuento por km ({(detalleIA.descuento * 100).toFixed(0)}%)</span><span className="font-bold text-slate-900 dark:text-white">$ {precio ? Number(precio).toLocaleString("es-AR") : "-"}</span></div>
                {detalleIA.cantidad != null && <div className="text-slate-400">Basado en {detalleIA.cantidad} comparables</div>}
              </div>
            )}

            <form onSubmit={guardarPrecio} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Precio sugerido (ARS)</label>
                <div className="flex items-center bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 focus-within:border-emerald-500 transition-colors shadow-sm">
                  <span className="text-slate-400 mr-2 font-bold">$</span>
                  <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Ej: 18000000" className="w-full bg-transparent py-2.5 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 font-mono" autoFocus />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-[#0a2a6b] flex gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#00246b] text-slate-600 dark:text-slate-300 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={cargando} className="flex-1 py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  {cargando ? "Guardando..." : <><Save className="w-3.5 h-3.5" /> Guardar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
