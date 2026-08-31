import { createClient } from "@/lib/supabase2/server";
import { Megaphone } from "lucide-react";

export default async function PautadosPage() {
  const supabase = await createClient();
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id, marca, modelo, anio, precio_venta, moneda_venta, canal_pauta, razon_pauta, precio_publicado_ars")
    .eq("pautado", true)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4"><Megaphone className="w-4 h-4 text-rose-600" /> Autos Pautados <span className="text-xs font-normal text-slate-400">{vehiculos?.length ?? 0} en pauta activa</span></h2>

      {!vehiculos || vehiculos.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center text-sm text-slate-400">Ningún vehículo marcado como pautado todavía.</div>
      ) : (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Canal</th>
                <th className="px-4 py-3">Precio publicado</th>
                <th className="px-4 py-3">Razón</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map((v) => (
                <tr key={v.id} className="border-b border-slate-50 dark:border-white/5 last:border-0">
                  <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">{v.marca} {v.modelo} {v.anio}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{v.moneda_venta} {Number(v.precio_venta).toLocaleString("es-AR")}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{v.canal_pauta || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{v.precio_publicado_ars ? `ARS ${Number(v.precio_publicado_ars).toLocaleString("es-AR")}` : "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{v.razon_pauta || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
