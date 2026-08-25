"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function CompartirPresupuestoBoton({ tokenPublico, compacto }: { tokenPublico: string | null; compacto?: boolean }) {
  const [copiado, setCopiado] = useState(false);

  if (!tokenPublico) return null;

  const copiar = () => {
    const link = `${window.location.origin}/presupuesto/${tokenPublico}`;
    navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <button
      onClick={copiar}
      title={copiado ? "Link copiado" : "Copiar link para el cliente"}
      className={`inline-flex items-center gap-1.5 ${compacto ? "p-1.5" : "p-2"} bg-white dark:bg-[#00246b] hover:bg-emerald-50 dark:hover:bg-[#002a6e] border border-slate-200 dark:border-[#0a2a6b] hover:border-emerald-300 rounded-lg text-slate-400 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-300 transition-all shadow-sm`}
    >
      {copiado ? <Check className={compacto ? "w-3.5 h-3.5" : "w-4 h-4"} /> : <Share2 className={compacto ? "w-3.5 h-3.5" : "w-4 h-4"} />}
    </button>
  );
}
