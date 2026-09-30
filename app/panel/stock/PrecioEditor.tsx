"use client";

import { useEffect, useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { DollarSign, X, Save, History } from "lucide-react";

function fmtPrecio(n: number, moneda: string) {
  return moneda === "ARS" ? `$ ${n.toLocaleString("es-AR")}` : `${moneda} ${n.toLocaleString("es-AR")}`;
}

interface HistorialItem {
  id: string;
  precio_anterior: number | null;
  moneda_anterior: string | null;
  precio_nuevo: number;
  moneda_nueva: string;
  usuario_nombre: string | null;
  created_at: string;
}

export default function PrecioEditor({
  vehiculoId, precio, moneda, onActualizado,
}: {
  vehiculoId: string; precio: number; moneda: string; onActualizado: (id: string, cambios: any) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nuevoPrecio, setNuevoPrecio] = useState(String(precio || ""));
  const [nuevaMoneda, setNuevaMoneda] = useState(moneda);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [verHistorial, setVerHistorial] = useState(false);
  const [historial, setHistorial] = useState<HistorialItem[] | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  useEffect(() => {
    if (!verHistorial || historial !== null) return;
    setCargandoHistorial(true);
    supabase2
      .from("vehiculo_precio_historial")
      .select("id, precio_anterior, moneda_anterior, precio_nuevo, moneda_nueva, usuario_nombre, created_at")
      .eq("vehiculo_id", vehiculoId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setHistorial(data || []);
        setCargandoHistorial(false);
      });
  }, [verHistorial, historial, vehiculoId]);

  const guardar = async () => {
    const monto = Number(nuevoPrecio);
    if (!monto || monto <= 0) return setError("Cargá un precio válido.");
    if (monto === precio && nuevaMoneda === moneda) return setEditando(false);
    setGuardando(true);
    setError("");
    const res = await fetch("/api/panel/vehiculos/precio", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehiculoId, precio: monto, moneda: nuevaMoneda }),
    });
    const data = await res.json();
    setGuardando(false);
    if (!res.ok) return setError(data.error || "No se pudo actualizar el precio.");
    onActualizado(vehiculoId, data.cambios);
    setHistorial(null);
    setEditando(false);
  };

  if (!editando) {
    return (
      <button onClick={() => setEditando(true)} className="font-bold text-slate-700 dark:text-slate-200 hover:text-[#0145F2] dark:hover:text-rose-400">
        {precio ? fmtPrecio(precio, moneda) : <span className="text-slate-300 dark:text-slate-600 font-normal">Sin precio</span>}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !guardando && setEditando(false)} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-xs rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#0145F2]" /> Editar precio</h3>
          <button onClick={() => setEditando(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-500/10 p-2.5 rounded-lg">{error}</p>}
        <div className="flex gap-2">
          <select value={nuevaMoneda} onChange={(e) => setNuevaMoneda(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-2.5 text-sm outline-none text-slate-900 dark:text-white">
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
          <input type="text" inputMode="numeric" value={nuevoPrecio} onChange={(e) => setNuevoPrecio(e.target.value.replace(/\D/g, ""))} placeholder="15000000" className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-900 dark:text-white font-mono" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditando(false)} disabled={guardando} className="flex-1 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl disabled:opacity-50">Cancelar</button>
          <button onClick={guardar} disabled={guardando} className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold bg-[#0145F2] hover:bg-[#0138c9] text-white rounded-xl disabled:opacity-50">
            {guardando ? "Guardando..." : <><Save className="w-3.5 h-3.5" /> Confirmar</>}
          </button>
        </div>

        <div className="border-t border-slate-100 dark:border-white/10 pt-3">
          <button onClick={() => setVerHistorial((v) => !v)} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-[#0145F2] dark:hover:text-sky-400">
            <History className="w-3.5 h-3.5" /> {verHistorial ? "Ocultar historial" : "Ver historial de precios"}
          </button>
          {verHistorial && (
            <div className="mt-2.5 space-y-2 max-h-48 overflow-y-auto">
              {cargandoHistorial && <p className="text-[11px] text-slate-400">Cargando...</p>}
              {!cargandoHistorial && historial?.length === 0 && <p className="text-[11px] text-slate-400">Sin cambios registrados todavía.</p>}
              {historial?.map((h) => (
                <div key={h.id} className="text-[11px] bg-slate-50 dark:bg-white/5 rounded-lg px-2.5 py-2">
                  <p className="font-bold text-slate-700 dark:text-slate-200">
                    {h.precio_anterior ? fmtPrecio(h.precio_anterior, h.moneda_anterior || "USD") : "Sin precio"}
                    {" → "}
                    {fmtPrecio(h.precio_nuevo, h.moneda_nueva)}
                  </p>
                  <p className="text-slate-400 mt-0.5">
                    {h.usuario_nombre || "Usuario"} · {new Date(h.created_at).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
