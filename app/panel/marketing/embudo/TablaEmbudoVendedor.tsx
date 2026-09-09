"use client";

import { TrendingUp } from "lucide-react";
import TablaResponsiva, { type ColumnaTabla } from "@/components/panel/TablaResponsiva";

type FilaVendedor = { vendedorId: string; nombre: string; citas: number; asistieron: number; compraron: number };

// TablaResponsiva es "use client" -- las columnas llevan funciones (cell),
// que no se pueden pasar desde page.tsx (server component). Se aisla acá.
export default function TablaEmbudoVendedor({ embudoPorVendedor }: { embudoPorVendedor: FilaVendedor[] }) {
  if (embudoPorVendedor.length === 0) {
    return <p className="p-10 text-center text-slate-400 text-sm italic">No hay suficientes datos procesados.</p>;
  }
  return (
    <TablaResponsiva<FilaVendedor>
      filas={embudoPorVendedor}
      keyExtractor={(v) => v.vendedorId}
      encabezadoMobile={(v) => <p className="font-bold text-[13px] text-slate-800 dark:text-white">{v.nombre}</p>}
      columnas={
        [
          { key: "vendedor", header: "Vendedor", cell: (v) => v.nombre, claseTd: "font-bold text-[13px] text-slate-800 dark:text-white", ocultarEnMobile: true },
          { key: "visitas", header: "Visitas (Aprox)", cell: (v) => v.citas, claseTd: "font-mono text-[14px] text-slate-600 dark:text-slate-300" },
          { key: "compraron", header: "Compraron", cell: (v) => v.compraron, claseTd: "font-mono text-[14px] font-bold text-emerald-600 dark:text-emerald-400" },
          { key: "cierre", header: "Cierre Global", cell: (v) => {
            const cierre = v.citas > 0 ? Math.round((v.compraron / v.citas) * 100) : 0;
            return <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold border bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"><TrendingUp className="w-3 h-3 mr-1 text-slate-400" /> {cierre}%</span>;
          } },
        ] as ColumnaTabla<FilaVendedor>[]
      }
    />
  );
}
