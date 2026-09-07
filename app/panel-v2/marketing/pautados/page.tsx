import { createClient } from "@/lib/supabase2/server";
import { Megaphone } from "lucide-react";
import TablaPautados from "./TablaPautados";

export default async function PautadosPage() {
  const supabase = await createClient();
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id, marca, modelo, anio, precio_venta, moneda_venta, canal_pauta, razon_pauta, precio_publicado_ars, slug")
    .eq("pautado", true)
    .order("created_at", { ascending: false });

  const datos = vehiculos || [];
  const porCanal: Record<string, number> = {};
  datos.forEach((v) => { const k = v.canal_pauta || "Sin canal"; porCanal[k] = (porCanal[k] || 0) + 1; });
  const canalesOrdenados = Object.entries(porCanal).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Megaphone className="w-4 h-4 text-rose-600" /> Autos Pautados <span className="text-xs font-normal text-slate-400">{datos.length} en pauta activa</span></h2>

      {datos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {canalesOrdenados.map(([canal, cantidad]) => (
            <span key={canal} className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">
              {canal}: <span className="text-rose-600">{cantidad}</span>
            </span>
          ))}
        </div>
      )}

      {!vehiculos || vehiculos.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center text-sm text-slate-400">Ningún vehículo marcado como pautado todavía.</div>
      ) : (
        <TablaPautados vehiculos={vehiculos} />
      )}
    </div>
  );
}
