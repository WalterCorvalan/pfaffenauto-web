export const CATEGORIAS_MOVIMIENTO = ["Venta de vehículo", "Compra de vehículo", "Seña", "Comisión", "Gasto fijo", "Sueldo", "Gastos operativos", "Marketing", "Gestoría", "Impuestos", "Alquiler", "Seguros", "Transferencia", "Cobro de cuota", "Pago de cuota", "Otro"];

export const CATEGORIAS_CAJA_CHICA = ["Nafta", "Limpieza", "Repuestos", "Insumos", "Correo/Encomiendas", "Cafetería", "Pago a vehículo/proveedor", "Otro"];

// Clasificación para el semáforo financiero / punto de equilibrio (pedido de
// la reunión del 22/9, definida junto con el usuario). Compra/venta de
// vehículo, seña, transferencia y cobro/pago de cuota quedan afuera de
// ambas listas a propósito -- son movimientos de capital/inventario, no
// gasto operativo del mes.
export const CATEGORIAS_GASTO_FIJO = ["Alquiler", "Sueldo", "Seguros", "Impuestos", "Gasto fijo"];
export const CATEGORIAS_GASTO_VARIABLE = ["Comisión", "Marketing", "Gestoría", "Gastos operativos", "Pago a vehículo/proveedor", "Nafta", "Limpieza", "Repuestos", "Insumos", "Correo/Encomiendas", "Cafetería"];

export const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-500";
export const labelClass = "text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block";

export function fmt(n: number, moneda = "ARS") {
  return `${moneda === "USD" ? "USD" : "$"} ${Math.round(n).toLocaleString("es-AR")}`;
}

export function porMoneda(lista: any[], campoMoneda: string, campoMonto: string) {
  const map: Record<string, number> = {};
  lista.forEach((x) => { map[x[campoMoneda]] = (map[x[campoMoneda]] || 0) + Number(x[campoMonto]); });
  return map;
}

// Semáforo financiero / punto de equilibrio (pedido de la reunión del
// 22/9, corregido el 23/9: no es solo verde/rojo por signo, son 4 zonas
// según la relación ingreso vs egreso -- rojo por debajo del equilibrio,
// amarillo en el equilibrio (banda del 100-110%, no un punto exacto -- con
// montos reales nunca da justo), verde con ganancia, azul al duplicar el
// egreso ("se exceden las expectativas"). Toda tarjeta de plata en Finanzas
// que tenga un par ingreso/egreso natural (Neto del área, Rentabilidad
// general, Ingresos extra / consignación...) usa esta misma función, no un
// simple positivo/negativo -- las tarjetas que son un solo lado del par
// (Ingresos del área, Gastos fijos/variables, etc.) reciben la MISMA zona
// que su contraparte, para que el conjunto se vea consistente.
export type ZonaSemaforo = "rojo" | "amarillo" | "verde" | "azul";

export function zonaEquilibrio(ingresos: number, egresos: number): ZonaSemaforo {
  if (egresos <= 0) return ingresos > 0 ? "azul" : "amarillo";
  const ratio = ingresos / egresos;
  if (ratio < 1) return "rojo";
  if (ratio < 1.1) return "amarillo";
  if (ratio < 2) return "verde";
  return "azul";
}

// Peor zona entre varias (una tarjeta puede mostrar más de una moneda) --
// rojo es lo peor, azul lo mejor.
const ORDEN_ZONA: ZonaSemaforo[] = ["rojo", "amarillo", "verde", "azul"];
export function peorZona(zonas: ZonaSemaforo[]): ZonaSemaforo {
  if (zonas.length === 0) return "amarillo";
  return zonas.reduce((peor, z) => (ORDEN_ZONA.indexOf(z) < ORDEN_ZONA.indexOf(peor) ? z : peor));
}

export const CLASE_ZONA_CARD: Record<ZonaSemaforo, string> = {
  rojo: "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20",
  amarillo: "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
  verde: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
  azul: "bg-[#0145F2]/5 dark:bg-[#0145F2]/10 border-[#0145F2]/20",
};

export function diasHasta(fecha: string) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const v = new Date(fecha + "T00:00:00");
  return Math.round((v.getTime() - hoy.getTime()) / 86400000);
}

// Movimientos SIN venta_id (gestoría, multas, honorarios, trámites) --
// "Operatoria del área" en RentabilidadTab.tsx. Extraído acá para que el
// Resumen pueda mostrar el mismo ingreso/egreso/neto sin duplicar el
// filtro. Se excluye tipo_movimiento === "Transferencia" (no es
// ingreso/egreso real, cae en ambas patas e infla los brutos).
export function ingresosEgresosOperatoriaAreaPorMoneda(movimientos: any[]): { ingresos: Record<string, number>; egresos: Record<string, number> } {
  const delArea = movimientos.filter((m) => !m.venta_id && !m.deleted_at && m.estado === "aprobado" && m.tipo_movimiento !== "Transferencia");
  const ingresos: Record<string, number> = {};
  const egresos: Record<string, number> = {};
  delArea.forEach((m) => {
    const mo = m.cuenta?.moneda;
    if (!mo) return;
    if (m.tipo === "ingreso") ingresos[mo] = (ingresos[mo] || 0) + Number(m.monto);
    else egresos[mo] = (egresos[mo] || 0) + Number(m.monto);
  });
  return { ingresos, egresos };
}

export function netoOperatoriaAreaPorMoneda(movimientos: any[]): Record<string, number> {
  const { ingresos, egresos } = ingresosEgresosOperatoriaAreaPorMoneda(movimientos);
  const monedas = new Set([...Object.keys(ingresos), ...Object.keys(egresos)]);
  const map: Record<string, number> = {};
  monedas.forEach((m) => { map[m] = (ingresos[m] || 0) - (egresos[m] || 0); });
  return map;
}
