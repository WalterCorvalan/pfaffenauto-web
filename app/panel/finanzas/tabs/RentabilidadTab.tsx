"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { fmt, ingresosEgresosOperatoriaAreaPorMoneda, zonaEquilibrio, peorZona, CLASE_ZONA_CARD } from "./shared";

export default function RentabilidadTab({ movimientos, senasActivas, cuotasPendientes }: { movimientos: any[]; senasActivas: Record<string, number>; cuotasPendientes: Record<string, number> }) {
  // Rentabilidad del área Finanzas/Gestoría: movimientos SIN venta_id (multas,
  // gestoría, honorarios, servicios, trámites, verificaciones).
  // La ganancia por venta de vehículo (con venta_id) vive en Reportes/Cockpit CEO.
  // Se excluye tipo_movimiento === "Transferencia": una transferencia entre
  // cajas propias no es ingreso/egreso real, cae en ambas patas (sin venta_id)
  // e infla los brutos -- mismo bug ya corregido en FinanzasClient.tsx,
  // MovimientosTab.tsx y LibrosContablesTab.tsx.
  const delArea = movimientos.filter((m) => !m.venta_id && !m.deleted_at && m.estado === "aprobado" && m.tipo_movimiento !== "Transferencia");

  const { ingresos: ingresosPorMoneda, egresos: egresosPorMoneda } = ingresosEgresosOperatoriaAreaPorMoneda(movimientos);

  // Zona del semáforo (rojo/amarillo/verde/azul) según ingresos vs egresos
  // del área -- misma lógica que el punto de equilibrio general, aplicada acá
  // a la operatoria del área. Si hay más de una moneda, se usa la peor zona
  // para colorear la tarjeta entera.
  const zonaArea = useMemo(() => {
    const monedas = Array.from(new Set([...Object.keys(ingresosPorMoneda), ...Object.keys(egresosPorMoneda)]));
    if (monedas.length === 0) return "amarillo" as const;
    return peorZona(monedas.map((m) => zonaEquilibrio(ingresosPorMoneda[m] || 0, egresosPorMoneda[m] || 0)));
  }, [ingresosPorMoneda, egresosPorMoneda]);
  const claseArea = CLASE_ZONA_CARD[zonaArea];

  const netoPorMoneda = useMemo(() => {
    const monedas = new Set([...Object.keys(ingresosPorMoneda), ...Object.keys(egresosPorMoneda)]);
    const map: Record<string, number> = {};
    monedas.forEach((m) => { map[m] = (ingresosPorMoneda[m] || 0) - (egresosPorMoneda[m] || 0); });
    return map;
  }, [ingresosPorMoneda, egresosPorMoneda]);

  const categorias = (tipo: "ingreso" | "egreso") => {
    const map: Record<string, Record<string, number>> = {};
    delArea.filter((m) => m.tipo === tipo).forEach((m) => {
      const cat = m.tipo_movimiento || "Sin categoría";
      const mo = m.cuenta?.moneda;
      if (!mo) return;
      map[cat] = map[cat] || {};
      map[cat][mo] = (map[cat][mo] || 0) + Number(m.monto);
    });
    return Object.entries(map).sort((a, b) => Object.values(b[1])[0] - Object.values(a[1])[0]);
  };

  const ingresosCat = categorias("ingreso");
  const egresosCat = categorias("egreso");

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3 flex gap-2">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-700 dark:text-indigo-300">
          <b>Rentabilidad del área Finanzas / Gestoría</b> — ingresos y egresos por operatoria del área: multas, transferencias, gestoría, honorarios, servicios, trámites y verificaciones.
          <br />La ganancia por venta de vehículos no se muestra acá — está en <b>Reportes</b>, que la abre venta por venta.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`rounded-xl p-4 border ${claseArea}`}>
          <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center justify-between">Ingresos del área <TrendingUp className="w-3.5 h-3.5" /></p>
          {Object.keys(ingresosPorMoneda).length === 0 ? <p className="text-lg">—</p> : Object.entries(ingresosPorMoneda).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}
          <p className="text-[10px] text-slate-400">{delArea.filter((m) => m.tipo === "ingreso").length} movimientos</p>
        </div>
        <div className={`rounded-xl p-4 border ${claseArea}`}>
          <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center justify-between">Egresos del área <TrendingDown className="w-3.5 h-3.5" /></p>
          {Object.keys(egresosPorMoneda).length === 0 ? <p className="text-lg">—</p> : Object.entries(egresosPorMoneda).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}
          <p className="text-[10px] text-slate-400">{delArea.filter((m) => m.tipo === "egreso").length} movimientos</p>
        </div>
        <div className={`rounded-xl p-4 border ${claseArea}`}>
          <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Neto del área</p>
          {Object.keys(netoPorMoneda).length === 0 ? <p className="text-lg">USD 0<br />$ 0</p> : Object.entries(netoPorMoneda).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}
          <p className="text-[10px] text-slate-400">Ingresos − Egresos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
          <p className="text-sm font-bold mb-2">↑ Ingresos por categoría</p>
          {ingresosCat.length === 0 ? <p className="text-xs text-slate-400">Sin ingresos del área cargados.</p> : (
            <div className="space-y-1.5">{ingresosCat.map(([cat, porMoneda]) => (
              <div key={cat} className="flex items-center justify-between text-xs"><span className="text-slate-500">{cat}</span><span className="font-mono font-bold">{Object.entries(porMoneda).map(([m, n]) => fmt(n, m)).join(" · ")}</span></div>
            ))}</div>
          )}
        </div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
          <p className="text-sm font-bold mb-2">↓ Egresos por categoría</p>
          {egresosCat.length === 0 ? <p className="text-xs text-slate-400">Sin egresos del área cargados.</p> : (
            <div className="space-y-1.5">{egresosCat.map(([cat, porMoneda]) => (
              <div key={cat} className="flex items-center justify-between text-xs"><span className="text-slate-500">{cat}</span><span className="font-mono font-bold">{Object.entries(porMoneda).map(([m, n]) => fmt(n, m)).join(" · ")}</span></div>
            ))}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase text-amber-600">🤝 Señas activas (a aplicar)</p>
          {Object.keys(senasActivas).length === 0 ? <p className="text-lg font-black">—</p> : Object.entries(senasActivas).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}
          <p className="text-[10px] text-amber-600/70">Dinero recibido en concepto de seña que aún no se aplicó a venta.</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase text-indigo-600">🗓 Cuotas pendientes</p>
          {Object.keys(cuotasPendientes).length === 0 ? <p className="text-lg font-black">—</p> : Object.entries(cuotasPendientes).map(([m, n]) => <p key={m} className="text-lg font-black">{fmt(n, m)}</p>)}
          <p className="text-[10px] text-indigo-600/70">Cuotas aún no cobradas a clientes.</p>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 text-center">🐷 La rentabilidad por venta de vehículo (precio − costo − comisiones − gastos) se muestra en Reportes, no acá. Este panel es solo la operatoria administrativa del área.</p>
    </div>
  );
}
