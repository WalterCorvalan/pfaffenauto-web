import { createClient } from "@/lib/supabase2/server";
import { Megaphone, TrendingUp } from "lucide-react";
import TablaPautados from "./TablaPautados";

export default async function PautadosPage() {
  const supabase = await createClient();
  // Trae TODOS los que alguna vez se marcaron pautado (no solo los activos)
  // para poder mostrar "vendidos estando pautados" -- v1 lo tenía, v2 lo
  // había perdido al filtrar pautado=true de una.
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id, marca, modelo, anio, patente, estado, precio_venta, moneda_venta, canal_pauta, razon_pauta, precio_publicado_ars, slug, fotos, sucursal:sucursal_id ( nombre )")
    .eq("pautado", true)
    .order("created_at", { ascending: false });

  // El join de Supabase tipa "sucursal" como array aunque sea 1:1 -- se
  // achata acá para que coincida con lo que espera TablaPautados.
  const datos = (vehiculos || []).map((v: any) => ({ ...v, sucursal: Array.isArray(v.sucursal) ? v.sucursal[0] || null : v.sucursal }));
  const activos = datos.filter((v: any) => v.estado === "disponible" || v.estado === "reservado" || v.estado === "señado");
  const vendidos = datos.filter((v: any) => v.estado === "vendido");

  const porCanal: Record<string, number> = {};
  datos.forEach((v) => { const k = v.canal_pauta || "Sin canal"; porCanal[k] = (porCanal[k] || 0) + 1; });
  const canalesOrdenados = Object.entries(porCanal).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-6 space-y-4 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Megaphone className="w-4 h-4 text-rose-600" /> Autos Pautados</h2>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-500/20"><Megaphone className="w-3.5 h-3.5" /> {activos.length} activos pautados</span>
          <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20"><TrendingUp className="w-3.5 h-3.5" /> {vendidos.length} vendidos estando pautados</span>
        </div>
      </div>

      {datos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {canalesOrdenados.map(([canal, cantidad]) => (
            <span key={canal} className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">
              {canal}: <span className="text-rose-600">{cantidad}</span>
            </span>
          ))}
        </div>
      )}

      {activos.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center text-sm text-slate-400">Ningún vehículo pautado activo por ahora.</div>
      ) : (
        <TablaPautados vehiculos={activos} />
      )}

      {vendidos.length > 0 && (
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 mt-6">Vendidos estando pautados</h3>
          <TablaPautados vehiculos={vendidos} />
        </div>
      )}
    </div>
  );
}
