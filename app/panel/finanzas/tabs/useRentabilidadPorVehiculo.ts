"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase2 } from "@/lib/supabase/client";

export interface FilaRentabilidadVehiculo {
  id: string; vehiculo: string; comprador: string; fecha: string | null; moneda: string;
  precioVenta: number; costo: number; comision: number; gastos: number; ganancia: number; avisoMoneda: boolean;
}

// Extraído de RentabilidadVehiculoTab.tsx para poder mostrar el mismo total
// (ganancia por vehículo vendido) también como tarjeta en el Resumen, sin
// duplicar el fetch/cálculo en dos archivos. Ganancia = precio de venta −
// costo de compra − comisión del vendedor − gastos del expediente a cargo
// de la agencia, sin prorratear gastos fijos/variables ni convertir moneda
// (ver comentario largo en RentabilidadVehiculoTab.tsx).
export function useRentabilidadPorVehiculo(ventas: any[]) {
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

  const filas: FilaRentabilidadVehiculo[] = useMemo(() => {
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

  return { filas, totalesPorMoneda, cargando };
}
