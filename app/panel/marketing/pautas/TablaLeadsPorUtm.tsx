"use client";

import TablaResponsiva, { type ColumnaTabla } from "@/components/panel/TablaResponsiva";

export default function TablaLeadsPorUtm({ leadsPorUtm }: { leadsPorUtm: any[] }) {
  if (!leadsPorUtm || leadsPorUtm.length === 0) {
    return <p className="p-10 text-center text-slate-400 text-sm italic">Sin leads con UTM detectado todavía.</p>;
  }
  return (
    <TablaResponsiva<any>
      filas={leadsPorUtm}
      keyExtractor={(l) => `${l.utm_source}-${l.utm_campaign}-${l.utm_medium}`}
      encabezadoMobile={(l) => <p className="text-[13px] text-slate-700 dark:text-slate-200 font-bold">{l.utm_campaign}</p>}
      columnas={
        [
          { key: "utm_source", header: "Fuente", cell: (l) => l.utm_source, claseTd: "text-[13px] font-bold text-slate-700 dark:text-slate-200" },
          { key: "utm_campaign", header: "Campaña", cell: (l) => l.utm_campaign, claseTd: "text-[13px] text-slate-600 dark:text-slate-300", ocultarEnMobile: true },
          { key: "utm_medium", header: "Medio", cell: (l) => l.utm_medium, claseTd: "text-[13px] text-slate-500 dark:text-slate-400", ocultarEnMobile: true },
          { key: "leads", header: "Leads", cell: (l) => l.leads, claseTd: "font-mono text-[13px] font-bold text-slate-900 dark:text-white" },
        ] as ColumnaTabla<any>[]
      }
    />
  );
}
