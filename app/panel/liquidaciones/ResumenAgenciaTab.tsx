"use client";

import { useMemo } from "react";
import { fmt } from "./shared";
import TablaResponsiva, { type ColumnaTabla } from "@/components/panel/TablaResponsiva";

export default function ResumenAgenciaTab({ liquidaciones, gananciasOcultas }: { liquidaciones: any[]; gananciasOcultas: boolean }) {
  const finalizadas = liquidaciones.filter((l) => l.estado === "terminado");

  const porMes = useMemo(() => {
    const map: Record<string, any[]> = {};
    finalizadas.forEach((l) => { const m = l.mes.slice(0, 7); map[m] = map[m] || []; map[m].push(l); });
    return Object.entries(map).map(([mes, filas]) => ({
      mes, ops: filas.length,
      difTransfTotal: filas.reduce((a, f) => a + Number(f.diferencia_transferencia), 0),
      difMultasTotal: filas.reduce((a, f) => a + Number(f.diferencia_multas), 0),
      comisiones: filas.reduce((a, f) => a + Number(f.comision_gestora), 0),
      ingresoNeto: filas.reduce((a, f) => a + Number(f.ingreso_agencia), 0),
    })).sort((a, b) => b.mes.localeCompare(a.mes));
  }, [finalizadas]);

  if (porMes.length === 0) {
    return <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin datos</p><p className="text-xs text-slate-400 mt-1">No hay transferencias finalizadas para el resumen de la agencia.</p></div>;
  }

  const ultimo = porMes[0];

  return (
    <div>
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 mb-4 inline-block">
        <p className="text-sm font-bold">{new Date(ultimo.mes + "-01T12:00:00").toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</p>
        <p className="text-2xl font-black text-blue-600">{gananciasOcultas ? "—" : fmt(ultimo.ingresoNeto)}</p>
        <p className="text-xs text-slate-400">Ingreso agencia ({finalizadas[0]?.pct_agencia_aplicado ?? 90}%)</p>
        <p className="text-xs text-slate-400 mt-1">{ultimo.ops} operaciones · Comisiones: {fmt(ultimo.comisiones)}</p>
      </div>

      <TablaResponsiva<typeof porMes[number]>
        filas={porMes}
        keyExtractor={(m) => m.mes}
        encabezadoMobile={(m) => <p className="font-bold">{new Date(m.mes + "-01T12:00:00").toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</p>}
        columnas={
          [
            { key: "mes", header: "Mes", cell: (m) => new Date(m.mes + "-01T12:00:00").toLocaleDateString("es-AR", { month: "long", year: "numeric" }), claseTd: "font-bold", ocultarEnMobile: true },
            { key: "ops", header: "Ops", cell: (m) => m.ops },
            { key: "dif_transf", header: "Dif. transf. total", cell: (m) => (gananciasOcultas ? "—" : fmt(m.difTransfTotal)), claseTd: "font-mono text-emerald-600" },
            { key: "dif_multas", header: "Dif. multas total", cell: (m) => (gananciasOcultas ? "—" : (m.difMultasTotal ? fmt(m.difMultasTotal) : "—")), claseTd: "font-mono" },
            { key: "comisiones", header: "Comisiones gestoras", cell: (m) => fmt(m.comisiones), claseTd: "font-mono font-bold text-indigo-600" },
            { key: "ingreso_neto", header: "Ingreso neto agencia", cell: (m) => (gananciasOcultas ? "—" : fmt(m.ingresoNeto)), claseTd: "font-mono font-bold text-blue-600" },
          ] as ColumnaTabla<typeof porMes[number]>[]
        }
      />
    </div>
  );
}
