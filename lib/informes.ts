import { SupabaseClient } from "@supabase/supabase-js";

const CATEGORIAS_EGRESO = [
  { tabla: "movimientos_caja", label: "Gasto Manual", montoKey: "monto", conceptoKey: "descripcion" },
  { tabla: "patentes", label: "Patentes", montoKey: "importe", conceptoKey: "periodo" },
  { tabla: "transferencias_patentamientos", label: "Transferencias y Patentamientos", montoKey: "importe", conceptoKey: "concepto" },
  { tabla: "repuestos_reparaciones", label: "Repuestos y Reparaciones", montoKey: "importe", conceptoKey: "concepto" },
  { tabla: "gastos_varios", label: "Gastos Varios", montoKey: "importe", conceptoKey: "concepto" },
  { tabla: "sueldos", label: "Sueldos", montoKey: "importe", conceptoKey: "concepto" },
] as const;

export interface Egreso {
  categoria: string;
  concepto: string;
  monto: number;
  fecha: string;
  atipico: boolean;
}

export interface DatosMes {
  nombreMes: string;
  cantidadVendidos: number;
  ingresosTotales: number;
  ventaMasCara: any | null;
  egresosDelMes: Egreso[];
  egresosTotales: number;
  gastosMasCaros: Egreso[];
  gastosAtipicos: Egreso[];
  netoDelMes: number;
}

// Reutilizada por /panel/informes (vista) y /api/informes/generar-reporte (IA)
export async function obtenerDatosMes(supabase: SupabaseClient, fecha: Date = new Date()): Promise<DatosMes> {
  const mes = fecha.getMonth();
  const anio = fecha.getFullYear();
  const primerDiaMes = new Date(anio, mes, 1).toISOString().split("T")[0];
  const ultimoDiaMes = new Date(anio, mes + 1, 0).toISOString().split("T")[0];
  const nombreMes = fecha.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  const { data: ventasMes } = await supabase
    .from("boletos_venta")
    .select(`
      id, venta_ars, fecha,
      marca, modelo,
      apellido, nombre
    `)
    .gte("fecha", primerDiaMes)
    .lte("fecha", ultimoDiaMes);

  const ventas = ventasMes || [];
  const cantidadVendidos = ventas.length;
  const ingresosTotales = ventas.reduce((acc, v: any) => acc + (Number(v.venta_ars) || 0), 0);
  const ventaMasCara = [...ventas].sort((a: any, b: any) => (Number(b.venta_ars) || 0) - (Number(a.venta_ars) || 0))[0] as any || null;

  const resultados = await Promise.all(
    CATEGORIAS_EGRESO.map((cat) =>
      supabase
        .from(cat.tabla)
        .select("*")
        .gte("fecha", primerDiaMes)
        .lte("fecha", ultimoDiaMes)
        .then((r) => ({ cat, rows: r.data || [] }))
    )
  );

  const seisMesesAtras = new Date(anio, mes - 6, 1).toISOString().split("T")[0];
  const historico = await Promise.all(
    CATEGORIAS_EGRESO.map((cat) =>
      supabase
        .from(cat.tabla)
        .select(cat.montoKey)
        .gte("fecha", seisMesesAtras)
        .then((r) => {
          const montos = (r.data || []).map((row: any) => Number(row[cat.montoKey]) || 0).filter((m) => m > 0);
          const promedio = montos.length > 0 ? montos.reduce((a, b) => a + b, 0) / montos.length : 0;
          return { tabla: cat.tabla, promedio };
        })
    )
  );

  const egresosDelMes: Egreso[] = [];
  resultados.forEach(({ cat, rows }) => {
    const promedioCategoria = historico.find((h) => h.tabla === cat.tabla)?.promedio || 0;
    rows.forEach((row: any) => {
      if (cat.tabla === "movimientos_caja" && row.tipo !== "egreso") return;
      const monto = Number(row[cat.montoKey]) || 0;
      egresosDelMes.push({
        categoria: cat.label,
        concepto: row[cat.conceptoKey] || cat.label,
        monto,
        fecha: row.fecha,
        atipico: promedioCategoria > 0 && monto > promedioCategoria * 2,
      });
    });
  });

  const egresosTotales = egresosDelMes.reduce((acc, e) => acc + e.monto, 0);
  const gastosMasCaros = [...egresosDelMes].sort((a, b) => b.monto - a.monto).slice(0, 10);
  const gastosAtipicos = egresosDelMes.filter((e) => e.atipico).sort((a, b) => b.monto - a.monto);
  const netoDelMes = ingresosTotales - egresosTotales;

  return {
    nombreMes, cantidadVendidos, ingresosTotales, ventaMasCara,
    egresosDelMes, egresosTotales, gastosMasCaros, gastosAtipicos, netoDelMes,
  };
}
