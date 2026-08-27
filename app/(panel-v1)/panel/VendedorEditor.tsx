"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Edit3, X, Save } from "lucide-react";

interface Vendedor {
  id: string;
  nombre: string | null;
  sucursal_id: string | null;
  rol?: string;
}

const ROL_LABEL: Record<string, string> = { admin: "Dueño", encargado: "Encargado", vendedor: "Vendedor" };

interface VendedorEditorProps {
  autoId: string;
  autoMarca?: string;
  autoModelo?: string;
  autoSucursalId: string | null;
  vendedorActualId: string | null;
  vendedorActualNombre: string | null;
  vendedores: Vendedor[];
  puedeGestionar: boolean;
}

export default function VendedorEditor({ autoId, autoMarca, autoModelo, autoSucursalId, vendedorActualId, vendedorActualNombre, vendedores, puedeGestionar }: VendedorEditorProps) {
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

      // Avisamos al responsable recién asignado — y si ese auto ya tiene
      // solicitudes de crédito activas esperando, se lo sumamos al mismo aviso
      // para que no se le pase (justamente el caso: la solicitud llegó antes
      // de asignarlo). Pasa por una API server-side porque insertar una
      // notificación PARA OTRO usuario desde el cliente choca con RLS.
      if (nuevoVendedor && nuevoVendedor !== vendedorActualId) {
        const nombreAuto = `${autoMarca || ""} ${autoModelo || ""}`.trim() || "un vehículo";

        const { data: solicitudesActivas } = await supabase
          .from("cotizaciones")
          .select("id")
          .eq("vehiculo_id", autoId)
          .eq("tipo_peritaje", "financiacion")
          .in("estado", ["Pendiente", "Contactado"]);

        const hayFinanciacion = (solicitudesActivas?.length || 0) > 0;

        // Aviso de stock: te asignaron el auto (siempre).
        fetch("/api/vehiculos/notificar-cambio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            autoId,
            vendedorAsignadoId: nuevoVendedor,
            actorId: user?.id || null,
            mensaje: `Te asignaron el ${nombreAuto}.`,
            tipo: "vehiculo_asignado",
          }),
        }).catch((err) => console.error("Error notificando asignación:", err));

        // Aviso aparte para la sección Financiación: que cuente en su propio badge.
        if (hayFinanciacion) {
          fetch("/api/vehiculos/notificar-cambio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              autoId,
              vendedorAsignadoId: nuevoVendedor,
              actorId: user?.id || null,
              mensaje: `Tenés ${solicitudesActivas!.length} solicitud${solicitudesActivas!.length > 1 ? "es" : ""} de crédito esperando por el ${nombreAuto}.`,
              tipo: "financiacion_pendiente",
              seccion: "financiacion",
              link: "/panel/ventas/financiaciones",
            }),
          }).catch((err) => console.error("Error notificando financiación pendiente:", err));
        }
      }

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
          ${puedeGestionar ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-[#00246b] text-slate-600 dark:text-slate-300 group" : "cursor-default text-slate-500 dark:text-slate-400"}
        `}
        title={puedeGestionar ? "Tocar para asignar responsable" : ""}
      >
        <User className={`w-3.5 h-3.5 shrink-0 ${puedeGestionar ? "text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-sky-300" : "text-slate-400 dark:text-slate-500"}`} />
        <span className="truncate">{vendedorActualNombre || "Sin asignar"}</span>

        {puedeGestionar && (
          <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0 text-slate-400 dark:text-slate-500" />
        )}
      </div>

      {isEditing && puedeGestionar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !cargando && setIsEditing(false)}></div>
          <div className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600 dark:text-sky-300" /> Asignar Responsable
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={guardarVendedor} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Responsable (vendedor, encargado o dueño)</label>
                <div className="flex items-center bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 focus-within:border-indigo-500 transition-colors shadow-sm">
                  <select value={nuevoVendedor} onChange={(e) => setNuevoVendedor(e.target.value)} className="w-full bg-transparent py-3 text-sm text-slate-900 dark:text-white outline-none appearance-none cursor-pointer">
                    <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin asignar</option>
                    {[...vendedoresSucursal, ...vendedoresOtros].map((v) => (
                      <option key={v.id} value={v.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">
                        {v.nombre} — {ROL_LABEL[v.rol || "vendedor"]}{vendedoresOtros.includes(v) ? " (otra sucursal)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                {nuevoVendedor && vendedoresOtros.some((v) => v.id === nuevoVendedor) && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-300 font-medium mt-1.5">Esta persona no pertenece a la sucursal del auto.</p>
                )}
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
