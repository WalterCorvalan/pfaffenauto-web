"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Edit3, X, Save } from "lucide-react";

interface Vendedor {
  id: string;
  nombre: string | null;
  sucursal_id: string | null;
}

interface VendedorEditorProps {
  autoId: string;
  autoSucursalId: string | null;
  vendedorActualId: string | null;
  vendedorActualNombre: string | null;
  vendedores: Vendedor[];
  puedeGestionar: boolean;
}

export default function VendedorEditor({ autoId, autoSucursalId, vendedorActualId, vendedorActualNombre, vendedores, puedeGestionar }: VendedorEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [nuevoVendedor, setNuevoVendedor] = useState(vendedorActualId || "");
  const [cargando, setCargando] = useState(false);

  const vendedoresSucursal = vendedores.filter((v) => v.sucursal_id === autoSucursalId);
  const vendedoresOtros = vendedores.filter((v) => v.sucursal_id !== autoSucursalId);

  const guardarVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeGestionar || nuevoVendedor === vendedorActualId) return;
    setCargando(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("vehiculos").update({ vendedor_asignado_id: nuevoVendedor || null }).eq("id", autoId);
      if (error) throw error;

      const nombreNuevo = vendedores.find((v) => v.id === nuevoVendedor)?.nombre || "Sin asignar";

      await supabase.from("historial_cambios").insert({
        tabla: "vehiculos", registro_id: autoId, campo_modificado: "vendedor_asignado_id",
        valor_anterior: vendedorActualNombre || "Sin asignar", valor_nuevo: nombreNuevo,
        usuario_id: user?.id,
      });

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
        onClick={() => puedeGestionar && setIsEditing(true)}
        className={`inline-flex items-center gap-1.5 truncate font-medium text-[11px] transition-all rounded-md px-1.5 py-1 -ml-1.5
          ${puedeGestionar ? "cursor-pointer hover:bg-slate-50 text-slate-600 group" : "cursor-default text-slate-500"}
        `}
        title={puedeGestionar ? "Tocar para asignar vendedor" : ""}
      >
        <User className={`w-3.5 h-3.5 shrink-0 ${puedeGestionar ? "text-slate-400 group-hover:text-indigo-600" : "text-slate-400"}`} />
        <span className="truncate">{vendedorActualNombre || "Sin asignar"}</span>

        {puedeGestionar && (
          <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0 text-slate-400" />
        )}
      </div>

      {isEditing && puedeGestionar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !cargando && setIsEditing(false)}></div>
          <div className="relative bg-white border border-slate-200 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" /> Asignar Vendedor
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={guardarVendedor} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Vendedor Responsable</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:border-indigo-500 transition-colors shadow-sm">
                  <select value={nuevoVendedor} onChange={(e) => setNuevoVendedor(e.target.value)} className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none appearance-none cursor-pointer">
                    <option value="">Sin asignar</option>
                    {vendedoresSucursal.length > 0 && (
                      <optgroup label="Misma sucursal">
                        {vendedoresSucursal.map((v) => (<option key={v.id} value={v.id}>{v.nombre}</option>))}
                      </optgroup>
                    )}
                    {vendedoresOtros.length > 0 && (
                      <optgroup label="Otras sucursales">
                        {vendedoresOtros.map((v) => (<option key={v.id} value={v.id}>{v.nombre}</option>))}
                      </optgroup>
                    )}
                  </select>
                </div>
                {nuevoVendedor && vendedoresOtros.some((v) => v.id === nuevoVendedor) && (
                  <p className="text-[11px] text-amber-600 font-medium mt-1.5">Este vendedor no pertenece a la sucursal del auto.</p>
                )}
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors">Cancelar</button>
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
