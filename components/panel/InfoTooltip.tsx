"use client";

import { Info } from "lucide-react";

// Tooltip propio (no el nativo del navegador) para explicar de dónde sale
// un número en una tarjeta -- hover-only vía CSS (group/group-hover), sin
// estado ni JS extra. Deliberadamente neutro (slate/negro), nunca rojo,
// ámbar, verde ni el azul de marca -- esos 4 colores ya significan algo
// puntual en Finanzas (semáforo de punto de equilibrio en ResumenTab.tsx:
// rojo/amarillo/verde/azul) y en la navegación (rojo = grupo activo, azul =
// sub-tab activo) -- reusarlos acá para "hay un tooltip" los vaciaría de
// significado en el resto del panel.
export default function InfoTooltip({ texto }: { texto: string }) {
  return (
    <span className="relative inline-flex group/tooltip ml-1 align-middle">
      <Info className="w-3 h-3 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-help" />
      <span
        role="tooltip"
        className="pointer-events-none absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 rounded-lg bg-slate-900 dark:bg-black px-2.5 py-1.5 text-[10px] font-normal normal-case leading-snug text-white opacity-0 scale-95 origin-bottom transition-all duration-150 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 shadow-lg"
      >
        {texto}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900 dark:border-t-black" />
      </span>
    </span>
  );
}
