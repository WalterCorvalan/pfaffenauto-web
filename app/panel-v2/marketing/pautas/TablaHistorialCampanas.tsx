"use client";

import TablaResponsiva, { type ColumnaTabla } from "@/components/panelV2/TablaResponsiva";

const COLOR_PLATAFORMA: Record<string, { bg: string; text: string; border: string }> = {
  "Google Ads": { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-500/20" },
  "Meta Ads": { bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-500/20" },
  "MercadoLibre": { bg: "bg-yellow-50 dark:bg-yellow-500/10", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-200 dark:border-yellow-500/20" },
};

// TablaResponsiva es "use client" -- las columnas llevan funciones (cell),
// que no se pueden pasar desde un server component. Se aisla acá para que
// pautas/page.tsx (server) solo le pase datos ya resueltos (serializables).
export default function TablaHistorialCampanas({ todas }: { todas: any[] }) {
  if (!todas || todas.length === 0) {
    return <p className="p-10 text-center text-slate-400 text-sm italic">Sin métricas cargadas todavía.</p>;
  }
  return (
    <TablaResponsiva<any>
      filas={todas}
      keyExtractor={(c) => c.id}
      encabezadoMobile={(c) => <p className="text-[13px] text-slate-700 dark:text-slate-200 font-bold">{c.nombre_campana || "General"}</p>}
      columnas={
        [
          { key: "mes", header: "Mes", cell: (c) => new Date(`${c.periodo}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }), claseTd: "text-[13px] text-slate-600 dark:text-slate-300 capitalize whitespace-nowrap" },
          { key: "plataforma", header: "Plataforma", cell: (c) => { const col = COLOR_PLATAFORMA[c.plataforma] || COLOR_PLATAFORMA["Google Ads"]; return <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${col.bg} ${col.text} ${col.border}`}>{c.plataforma}</span>; } },
          { key: "campana", header: "Campaña", cell: (c) => c.nombre_campana || "General", claseTd: "text-[13px] text-slate-700 dark:text-slate-200", ocultarEnMobile: true },
          { key: "gasto", header: "Gasto", cell: (c) => `$ ${Number(c.gasto).toLocaleString("es-AR")}`, claseTd: "font-mono text-[13px] font-bold text-slate-900 dark:text-white" },
          { key: "clics", header: "Clics", cell: (c) => c.clics, claseTd: "font-mono text-[13px] text-slate-600 dark:text-slate-400" },
          { key: "leads", header: "Leads", cell: (c) => c.leads, claseTd: "font-mono text-[13px] text-slate-600 dark:text-slate-400" },
        ] as ColumnaTabla<any>[]
      }
    />
  );
}
