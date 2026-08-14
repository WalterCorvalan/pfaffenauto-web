"use client";

import { useState } from "react";
import { History, ChevronDown } from "lucide-react";

interface CotizacionPrevia {
  id: string;
  marca: string;
  modelo: string;
  precio_sugerido: number | null;
  created_at: string;
}

export default function HistorialTasacionBadge({ anteriores }: { anteriores: CotizacionPrevia[] }) {
  const [abierto, setAbierto] = useState(false);
  if (anteriores.length === 0) return null;

  return (
    <div className="mb-3 -mt-1">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded-md w-full justify-between hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <History className="w-3 h-3" /> {anteriores.length} tasación{anteriores.length > 1 ? "es" : ""} previa{anteriores.length > 1 ? "s" : ""}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <div className="mt-1.5 space-y-1 animate-fadeIn">
          {anteriores.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-[10px] bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] rounded px-2 py-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {new Date(c.created_at).toLocaleDateString("es-AR")} · {c.marca} {c.modelo}
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {c.precio_sugerido ? `$${c.precio_sugerido.toLocaleString("es-AR")}` : "Sin tasar"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
