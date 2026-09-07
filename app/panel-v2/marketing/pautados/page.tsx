import { createClient } from "@/lib/supabase2/server";
import { Megaphone } from "lucide-react";
import TablaPautados from "./TablaPautados";

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
        <TablaPautados vehiculos={vehiculos} />
      )}
    </div>
  );
}
