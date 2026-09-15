export const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-500";
export const labelClass = "text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block";

export function fmt(n: number | null | undefined) {
  return `$ ${Math.round(Number(n) || 0).toLocaleString("es-AR")}`;
}

export const ESTADO_LABEL: Record<string, string> = { en_proceso: "En proceso", terminado: "Terminado", pendiente_pago: "Pendiente de pago", observado: "Observado" };
export const ESTADO_COLOR: Record<string, string> = {
  en_proceso: "bg-slate-100 dark:bg-white/10 text-slate-500",
  terminado: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700",
  pendiente_pago: "bg-amber-100 dark:bg-amber-500/20 text-amber-700",
  observado: "bg-rose-100 dark:bg-rose-500/20 text-rose-700",
};
