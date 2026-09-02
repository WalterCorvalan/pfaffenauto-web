export const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-500";
export const labelClass = "text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block";

export function fmt(n: number, moneda = "ARS") {
  return `${moneda === "USD" ? "USD" : "$"} ${Math.round(n).toLocaleString("es-AR")}`;
}

export function diasHasta(fecha: string) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const v = new Date(fecha + "T00:00:00");
  return Math.round((v.getTime() - hoy.getTime()) / 86400000);
}

export function badgeVencimiento(fecha: string) {
  const d = diasHasta(fecha);
  if (d < 0) return { texto: `Vencido ${-d}d`, clase: "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300" };
  if (d === 0) return { texto: "Vence hoy", clase: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300" };
  return { texto: `Vence en ${d}d`, clase: "bg-slate-100 dark:bg-white/10 text-slate-500" };
}
