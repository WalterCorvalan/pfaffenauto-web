"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Search, CarFront, User, ArrowRight, Loader2 } from "lucide-react";

interface Resultado {
  id: string;
  numero: number | null;
  dominio: string | null;
  marca: string | null;
  modelo: string | null;
  nombre: string | null;
  apellido: string | null;
  etapa_seguimiento: string | null;
}

const BADGE_ETAPA: Record<string, string> = {
  "Seña": "bg-amber-500", "Documentación": "bg-indigo-500", "Patentamiento": "bg-blue-500",
  "Transferencia": "bg-purple-500", "Entrega": "bg-orange-500", "Completado": "bg-emerald-500",
};

export default function GestoriaBuscador() {
  const router = useRouter();
  const [patente, setPatente] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [resultados, setResultados] = useState<Resultado[]>([]);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    const termino = patente.trim().toUpperCase();
    if (!termino) return;
    setBuscando(true);
    setBuscado(true);
    const { data } = await supabase
      .from("boletos_venta")
      .select("id, numero, dominio, marca, modelo, nombre, apellido, etapa_seguimiento")
      .ilike("dominio", `%${termino}%`)
      .order("created_at", { ascending: false })
      .limit(20);
    setResultados(data || []);
    setBuscando(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={buscar} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            autoFocus
            value={patente}
            onChange={(e) => setPatente(e.target.value)}
            placeholder="Ingresá la patente del vehículo vendido..."
            className="w-full bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-xl py-3.5 pl-11 pr-4 text-sm font-mono uppercase tracking-widest outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:normal-case placeholder:font-sans placeholder:tracking-normal shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={buscando || !patente.trim()}
          className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-sm shrink-0"
        >
          {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Buscar
        </button>
      </form>

      {buscado && !buscando && resultados.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 text-center py-16 bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl">
          <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Sin resultados para "{patente}"</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Revisá que la patente esté bien escrita.</p>
        </div>
      )}

      <div className="space-y-3">
        {resultados.map((r) => (
          <button
            key={r.id}
            onClick={() => router.push(`/panel/ventas/seguimiento/${r.id}`)}
            className="w-full text-left flex items-center justify-between gap-4 bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm hover:border-indigo-300 dark:hover:border-sky-400/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
                <CarFront className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm bg-slate-100 dark:bg-[#00246b] text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-md tracking-widest">
                    {r.dominio || "S/P"}
                  </span>
                  {r.numero && <span className="text-xs text-slate-400 dark:text-slate-500">N° {r.numero}</span>}
                </div>
                <p className="text-[14px] font-bold text-slate-900 dark:text-white mt-1 truncate">{r.marca} {r.modelo}</p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <User className="w-3 h-3" /> {r.nombre} {r.apellido}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {r.etapa_seguimiento && (
                <span className={`text-[10px] font-bold uppercase tracking-widest text-white px-2.5 py-1 rounded-lg ${BADGE_ETAPA[r.etapa_seguimiento] || "bg-slate-400"}`}>
                  {r.etapa_seguimiento}
                </span>
              )}
              <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
