"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function CompartirPresupuestoBoton({ tokenPublico, compacto = false }: { tokenPublico: string | null; compacto?: boolean }) {
  const [copiado, setCopiado] = useState(false);
  if (!tokenPublico) return <span className="text-slate-300 dark:text-slate-600">—</span>;

  const copiar = () => {
    const url = `${window.location.origin}/presupuestos/${tokenPublico}`;
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  };

  return (
    <button onClick={copiar} title="Copiar link para el cliente" className={`inline-flex items-center gap-1 ${compacto ? "p-1.5" : "p-2"} rounded-lg border transition-colors ${copiado ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" : "bg-slate-50 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10 hover:text-rose-600 hover:border-rose-200"}`}>
      {copiado ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
    </button>
  );
}
