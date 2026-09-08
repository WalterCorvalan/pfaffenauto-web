import { DollarSign } from "lucide-react";

// Tarjeta de costo de IA con barra de progreso hacia un tope de gasto
// mensual/período (default USD 10) -- verde tranquilo, ámbar cerca del
// límite, rojo llegando o pasado. Usada en todas las pestañas de Marketing
// que muestran "Costo IA (30d)" para que el gasto salte a la vista sin tener
// que leer el número.
export default function TarjetaCostoIA({ costo, label = "Costo IA (30d)", limite = 10, sub }: { costo: number; label?: string; limite?: number; sub?: string }) {
  const pct = limite > 0 ? Math.min(100, Math.round((costo / limite) * 100)) : 0;
  const color = pct >= 90 ? "rose" : pct >= 60 ? "amber" : "emerald";
  const TONOS: Record<string, { texto: string; barra: string; fondo: string }> = {
    emerald: { texto: "text-emerald-600 dark:text-emerald-400", barra: "bg-emerald-500", fondo: "bg-emerald-100 dark:bg-emerald-500/10" },
    amber: { texto: "text-amber-600 dark:text-amber-400", barra: "bg-amber-500", fondo: "bg-amber-100 dark:bg-amber-500/10" },
    rose: { texto: "text-rose-600 dark:text-rose-400", barra: "bg-rose-500", fondo: "bg-rose-100 dark:bg-rose-500/10" },
  };
  const t = TONOS[color];

  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
      <DollarSign className={`w-5 h-5 ${t.texto} mb-2`} />
      <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{costo > 0 ? `US$ ${costo.toLocaleString("es-AR", { maximumFractionDigits: 2 })}` : "—"}</p>
      <p className="text-[11px] text-slate-400 mt-0.5 mb-2">{label}</p>
      <div className={`h-1.5 rounded-full overflow-hidden ${t.fondo}`}>
        <div className={`h-full rounded-full ${t.barra} transition-all`} style={{ width: `${Math.max(pct > 0 ? 3 : 0, pct)}%` }} />
      </div>
      <p className="text-[10px] text-slate-400 mt-1">{pct}% de US$ {limite} (tope orientativo)</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
