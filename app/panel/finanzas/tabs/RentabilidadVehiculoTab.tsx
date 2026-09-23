"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { TrendingUp, Info } from "lucide-react";
import { fmt } from "./shared";
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
export default function RentabilidadVehiculoTab({ ventas }: { ventas: any[] }) {
  const [vehiculos, setVehiculos] = useState<Record<string, { precio_compra: number | null; moneda_compra: string | null }>>({});
  const [comisiones, setComisiones] = useState<any[]>([]);
  const [gastosAgenciaPorVenta, setGastosAgenciaPorVenta] = useState<Record<string, { monto: number; moneda: string }[]>>({});
  const [cargando, setCargando] = useState(true);

  const ventasCerradas = useMemo(() => ventas.filter((v) => v.estado === "cerrada" && v.vehiculo_id), [ventas]);

  useEffect(() => {
    const vehiculoIds = [...new Set(ventasCerradas.map((v) => v.vehiculo_id))];
    const ventaIds = ventasCerradas.map((v) => v.id);
    if (vehiculoIds.length === 0) { setCargando(false); return; }

    Promise.all([
      supabase2.from("vehiculos").select("id, precio_compra, moneda_compra").in("id", vehiculoIds),
      supabase2.from("comisiones").select("venta_id, monto, moneda").in("venta_id", ventaIds),
      supabase2.from("expedientes").select("id, venta_id").in("venta_id", ventaIds),
    ]).then(async ([vehRes, comRes, expRes]) => {
      const mapaVehiculos: Record<string, { precio_compra: number | null; moneda_compra: string | null }> = {};
      (vehRes.data || []).forEach((v: any) => { mapaVehiculos[v.id] = { precio_compra: v.precio_compra, moneda_compra: v.moneda_compra }; });
      setVehiculos(mapaVehiculos);
      setComisiones(comRes.data || []);

      const expedienteIds = (expRes.data || []).map((e: any) => e.id);
      const ventaPorExpediente: Record<string, string> = {};
      (expRes.data || []).forEach((e: any) => { ventaPorExpediente[e.id] = e.venta_id; });

      if (expedienteIds.length > 0) {
        const { data: gastos } = await supabase2.from("expediente_gastos").select("expediente_id, monto, moneda, a_cargo_de").in("expediente_id", expedienteIds).eq("a_cargo_de", "agencia");
        const porVenta: Record<string, { monto: number; moneda: string }[]> = {};
        (gastos || []).forEach((g: any) => {
          const ventaId = ventaPorExpediente[g.expediente_id];
          if (!ventaId) return;
          porVenta[ventaId] = porVenta[ventaId] || [];
          porVenta[ventaId].push({ monto: Number(g.monto), moneda: g.moneda });
        });
        setGastosAgenciaPorVenta(porVenta);
      }
      setCargando(false);
    });
  }, [ventasCerradas]);

  const filas = useMemo(() => {
    return ventasCerradas.map((v) => {
      const moneda = v.moneda_venta;
      const vehiculo = vehiculos[v.vehiculo_id];
      const costoCoincide = vehiculo?.precio_compra != null && vehiculo.moneda_compra === moneda;
      const costo = costoCoincide ? Number(vehiculo!.precio_compra) : 0;

      const comisionesVenta = comisiones.filter((c) => c.venta_id === v.id);
      const comisionCoincide = comisionesVenta.filter((c) => c.moneda === moneda).reduce((acc, c) => acc + Number(c.monto), 0);
      const comisionOtraMoneda = comisionesVenta.some((c) => c.moneda !== moneda);

      const gastosVenta = gastosAgenciaPorVenta[v.id] || [];
      const gastosCoinciden = gastosVenta.filter((g) => g.moneda === moneda).reduce((acc, g) => acc + g.monto, 0);
      const gastosOtraMoneda = gastosVenta.some((g) => g.moneda !== moneda);

      const ganancia = Number(v.precio_venta || 0) - costo - comisionCoincide - gastosCoinciden;
      const avisoMoneda = (vehiculo?.precio_compra != null && !costoCoincide) || comisionOtraMoneda || gastosOtraMoneda;

      return {
        id: v.id, vehiculo: [v.vehiculo_marca, v.vehiculo_modelo].filter(Boolean).join(" ") || "—",
        comprador: v.comprador_nombre || "—", fecha: v.fecha_cierre, moneda,
        precioVenta: Number(v.precio_venta || 0), costo, comision: comisionCoincide, gastos: gastosCoinciden,
        ganancia, avisoMoneda,
      };
    }).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  }, [ventasCerradas, vehiculos, comisiones, gastosAgenciaPorVenta]);

  const totalesPorMoneda = useMemo(() => {
    const map: Record<string, { precioVenta: number; costo: number; comision: number; gastos: number; ganancia: number; cantidad: number }> = {};
    filas.forEach((f) => {
      map[f.moneda] = map[f.moneda] || { precioVenta: 0, costo: 0, comision: 0, gastos: 0, ganancia: 0, cantidad: 0 };
      map[f.moneda].precioVenta += f.precioVenta;
      map[f.moneda].costo += f.costo;
      map[f.moneda].comision += f.comision;
      map[f.moneda].gastos += f.gastos;
      map[f.moneda].ganancia += f.ganancia;
      map[f.moneda].cantidad += 1;
    });
    return map;
  }, [filas]);

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
