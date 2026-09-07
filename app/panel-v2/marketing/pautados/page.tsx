import { createClient } from "@/lib/supabase2/server";
import { Megaphone } from "lucide-react";
import TablaResponsiva, { type ColumnaTabla } from "@/components/panelV2/TablaResponsiva";

interface VehiculoPautado {
  id: string; marca: string; modelo: string; anio: number; precio_venta: number; moneda_venta: string;
  canal_pauta: string | null; razon_pauta: string | null; precio_publicado_ars: number | null;
}

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
        <TablaResponsiva<VehiculoPautado>
          filas={vehiculos}
          keyExtractor={(v) => v.id}
          encabezadoMobile={(v) => <p className="text-sm font-bold text-slate-900 dark:text-white">{v.marca} {v.modelo} {v.anio}</p>}
          columnas={
            [
              { key: "vehiculo", header: "Vehículo", cell: (v) => `${v.marca} ${v.modelo} ${v.anio}`, claseTd: "text-sm font-bold text-slate-900 dark:text-white", ocultarEnMobile: true },
              { key: "precio", header: "Precio", cell: (v) => `${v.moneda_venta} ${Number(v.precio_venta).toLocaleString("es-AR")}`, claseTd: "text-sm text-slate-600 dark:text-slate-300" },
              { key: "canal", header: "Canal", cell: (v) => v.canal_pauta || "—" },
              { key: "precio_pub", header: "Precio publicado", cell: (v) => (v.precio_publicado_ars ? `ARS ${Number(v.precio_publicado_ars).toLocaleString("es-AR")}` : "—") },
              { key: "razon", header: "Razón", cell: (v) => v.razon_pauta || "—" },
            ] as ColumnaTabla<VehiculoPautado>[]
          }
        />
      )}
    </div>
  );
}
