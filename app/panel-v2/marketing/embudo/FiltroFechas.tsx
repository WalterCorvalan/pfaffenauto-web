"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, X } from "lucide-react";

export default function FiltroFechas({ desde, hasta }: { desde?: string; hasta?: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [d, setD] = useState(desde || "");
  const [h, setH] = useState(hasta || "");

  const aplicar = () => {
    const params = new URLSearchParams();
    if (d) params.set("desde", d);
    if (h) params.set("hasta", h);
    router.push(`/panel-v2/marketing/embudo${params.toString() ? `?${params.toString()}` : ""}`);
    setAbierto(false);
  };

  const limpiar = () => {
    setD(""); setH("");
    router.push("/panel-v2/marketing/embudo");
    setAbierto(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setAbierto((v) => !v)} className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${desde || hasta ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50"}`}>
        <Filter className="w-3.5 h-3.5" /> {desde || hasta ? `${desde || "…"} → ${hasta || "…"}` : "Filtrar"}
      </button>
      {abierto && (
        <div className="absolute right-0 top-full mt-2 z-20 bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl p-4 w-64">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Desde</label>
          <input type="date" value={d} onChange={(e) => setD(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none mb-3" />
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Hasta</label>
          <input type="date" value={h} onChange={(e) => setH(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none mb-3" />
          <div className="flex items-center gap-2">
            <button onClick={limpiar} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-500"><X className="w-3 h-3" /> Limpiar</button>
            <button onClick={aplicar} className="ml-auto px-3 py-1.5 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg">Aplicar</button>
          </div>
        </div>
      )}
    </div>
  );
}
