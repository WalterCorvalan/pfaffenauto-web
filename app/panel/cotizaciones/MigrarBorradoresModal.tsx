"use client";

import { useEffect, useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, RotateCw, Play, Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
  onMigradas: (ids: string[]) => void;
}

export default function MigrarBorradoresModal({ onClose, onMigradas }: Props) {
  const [pendientes, setPendientes] = useState<{ id: string }[] | null>(null);
  const [migrando, setMigrando] = useState(false);
  const [hecho, setHecho] = useState(false);

  const cargar = async () => {
    setPendientes(null);
    const { data } = await supabase2.from("cotizaciones").select("id").eq("estado", "borrador");
    setPendientes(data || []);
  };

  useEffect(() => { cargar(); }, []);

  const migrar = async () => {
    if (!pendientes || pendientes.length === 0) return;
    setMigrando(true);
    const ids = pendientes.map((p) => p.id);
    const { error } = await supabase2.from("cotizaciones").update({ estado: "pendiente" }).in("id", ids);
    if (!error) {
      onMigradas(ids);
      setHecho(true);
      setPendientes([]);
    }
    setMigrando(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 pr-4">El estado inicial de las cotizaciones se renombró de <code>Borrador</code> a <code>Pendiente</code>. Esta herramienta actualiza en bloque los docs históricos que todavía tienen el valor viejo. Es idempotente — re-correrla no rompe nada.</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl py-8 text-center">
          {pendientes === null ? (
            <Loader2 className="w-5 h-5 mx-auto text-slate-400 animate-spin" />
          ) : pendientes.length === 0 ? (
            <>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{hecho ? "Migración completa" : "Nada que migrar"}</p>
              <p className="text-xs text-slate-400 mt-1 px-6">No quedan cotizaciones con status <code>Borrador</code> en la base. Todo está en <code>Pendiente</code>.</p>
            </>
          ) : (
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{pendientes.length} cotización{pendientes.length === 1 ? "" : "es"} con estado viejo</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
          <button type="button" onClick={cargar} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600"><RotateCw className="w-3.5 h-3.5" /> Recargar</button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl">Cerrar</button>
            <button type="button" onClick={migrar} disabled={migrando || !pendientes || pendientes.length === 0} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed">
              {migrando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Migrar {pendientes?.length ?? 0} cotizacion{(pendientes?.length ?? 0) === 1 ? "" : "es"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
