"use client";

import { TrendingUp, Info } from "lucide-react";
import { fmt } from "./shared";
import { useRentabilidadPorVehiculo } from "./useRentabilidadPorVehiculo";
import TablaResponsiva, { type ColumnaTabla } from "@/components/panel/TablaResponsiva";

// Rentabilidad POR VENTA DE VEHÍCULO -- distinto de RentabilidadTab.tsx (que
// es la operatoria del área Finanzas/Gestoría: multas, honorarios, trámites,
// movimientos SIN venta_id). Acá es al revés: ganancia real de cada auto
// vendido = precio de venta − costo de compra − comisión del vendedor −
// gastos del expediente a cargo de la agencia. Sin prorratear gastos fijos
// ni variables de la agencia (alquiler, sueldos, etc.) -- esos se ven en
// Recurrencias/Presupuesto, no acá, y sin convertir moneda: si algún
// componente (costo, comisión, gasto) está en una moneda distinta a la de
// la venta, se descuenta aparte y se avisa con ⚠️ en vez de mezclarlo.
// Lógica compartida con la tarjeta "Rentabilidad general" del Resumen vía
// useRentabilidadPorVehiculo.ts -- no duplicar el fetch acá.
export default function RentabilidadVehiculoTab({ ventas }: { ventas: any[] }) {
  const { filas, totalesPorMoneda, cargando } = useRentabilidadPorVehiculo(ventas);

  if (cargando) return null;

  return (
    <div>
      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3 mb-4 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Ganancia por vehículo vendido: precio de venta − costo de compra − comisión del vendedor − gastos del expediente a cargo de la agencia. No incluye gastos fijos/variables de la agencia (eso se ve en Recurrencias/Presupuesto). Si algún componente está en otra moneda que la venta, se marca con ⚠️ y no se descuenta (evitá sumar monedas distintas).</span>
      </div>

      {Object.keys(totalesPorMoneda).length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin ventas cerradas con vehículo asociado</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {Object.entries(totalesPorMoneda).map(([moneda, t]) => (
            <div key={moneda} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Ganancia total · {moneda} ({t.cantidad} venta{t.cantidad === 1 ? "" : "s"})</p>
              <p className={`text-2xl font-black ${t.ganancia < 0 ? "text-rose-500" : "text-emerald-600"}`}>{fmt(t.ganancia, moneda)}</p>
              <p className="text-xs text-slate-400 mt-1">Venta {fmt(t.precioVenta, moneda)} · Costo {fmt(t.costo, moneda)} · Comisión {fmt(t.comision, moneda)} · Gastos {fmt(t.gastos, moneda)}</p>
            </div>
          ))}
        </div>
      )}

      {filas.length > 0 && (
        <TablaResponsiva<any>
          filas={filas}
          keyExtractor={(f) => f.id}
          encabezadoMobile={(f) => <p className="font-bold">{f.vehiculo}{f.avisoMoneda && " ⚠️"}</p>}
          columnas={
            [
              { key: "vehiculo", header: "Vehículo", cell: (f) => <>{f.vehiculo}{f.avisoMoneda && <span title="Algún componente está en otra moneda y no se descontó">⚠️</span>}</>, claseTd: "font-bold", ocultarEnMobile: true },
              { key: "comprador", header: "Comprador", cell: (f) => f.comprador, claseTd: "text-slate-400" },
              { key: "fecha", header: "Fecha cierre", cell: (f) => (f.fecha ? new Date(`${f.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—") },
              { key: "precioVenta", header: "Venta", cell: (f) => fmt(f.precioVenta, f.moneda), claseTd: "font-mono" },
              { key: "costo", header: "Costo", cell: (f) => fmt(f.costo, f.moneda), claseTd: "font-mono text-slate-400" },
              { key: "comision", header: "Comisión", cell: (f) => fmt(f.comision, f.moneda), claseTd: "font-mono text-slate-400" },
              { key: "gastos", header: "Gastos agencia", cell: (f) => fmt(f.gastos, f.moneda), claseTd: "font-mono text-slate-400" },
              { key: "ganancia", header: "Ganancia", cell: (f) => fmt(f.ganancia, f.moneda), claseTd: (f: any) => `font-mono font-bold ${f.ganancia < 0 ? "text-rose-500" : "text-emerald-600"}` },
            ] as ColumnaTabla<any>[]
          }
        />
      )}
    </div>
  );
}
