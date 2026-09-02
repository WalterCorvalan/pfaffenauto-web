export const CATEGORIAS_MOVIMIENTO = ["Venta de vehículo", "Compra de vehículo", "Seña", "Comisión", "Gasto fijo", "Sueldo", "Gastos operativos", "Marketing", "Gestoría", "Impuestos", "Alquiler", "Seguros", "Transferencia", "Cobro de cuota", "Pago de cuota", "Otro"];

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

export function diasHasta(fecha: string) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const v = new Date(fecha + "T00:00:00");
  return Math.round((v.getTime() - hoy.getTime()) / 86400000);
}
