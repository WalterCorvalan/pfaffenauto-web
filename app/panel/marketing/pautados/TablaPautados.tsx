"use client";

import { ExternalLink, Car } from "lucide-react";
import TablaResponsiva, { type ColumnaTabla } from "@/components/panel/TablaResponsiva";

interface VehiculoPautado {
  id: string; marca: string; modelo: string; anio: number; patente: string | null; estado: string;
  precio_venta: number; moneda_venta: string; canal_pauta: string | null; razon_pauta: string | null;
  precio_publicado_ars: number | null; slug: string | null; fotos: string[] | null;
  sucursal: { nombre: string } | null;
}

const BADGE_ESTADO: Record<string, string> = {
  disponible: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20",
  reservado: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
  "señado": "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
  vendido: "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10",
};

// TablaResponsiva es "use client" -- las columnas llevan funciones (cell),
// que no se pueden pasar desde page.tsx (server component). Se aisla acá.
export default function TablaPautados({ vehiculos }: { vehiculos: VehiculoPautado[] }) {
  return (
    <TablaResponsiva<VehiculoPautado>
      filas={vehiculos}
      keyExtractor={(v) => v.id}
      encabezadoMobile={(v) => <p className="text-sm font-bold text-slate-900 dark:text-white">{v.marca} {v.modelo} {v.anio}</p>}
      columnas={
        [
          { key: "vehiculo", header: "Vehículo", cell: (v) => (
            <div className="flex items-center gap-2.5">
              {v.fotos?.[0] ? (
                <img src={v.fotos[0]} alt="" className="w-12 h-9 object-cover rounded-md border border-slate-200 dark:border-white/10 shrink-0" />
              ) : (
                <div className="w-12 h-9 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-md flex items-center justify-center shrink-0">
                  <Car className="w-4 h-4 text-slate-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{v.patente || "S/P"}</p>
                {v.slug ? (
                  <a href={`/catalogo/${v.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline font-bold text-sm text-slate-900 dark:text-white truncate">
                    {v.marca} {v.modelo} {v.anio} <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                  </a>
                ) : <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{v.marca} {v.modelo} {v.anio}</p>}
              </div>
            </div>
          ), claseTd: "text-sm font-bold text-slate-900 dark:text-white", ocultarEnMobile: true },
          { key: "precio", header: "Precio", cell: (v) => `${v.moneda_venta} ${Number(v.precio_venta).toLocaleString("es-AR")}`, claseTd: "text-sm text-slate-600 dark:text-slate-300" },
          { key: "canal", header: "Canal", cell: (v) => v.canal_pauta || "—" },
          { key: "sucursal", header: "Sucursal", cell: (v) => v.sucursal?.nombre || "—", claseTd: "text-sm text-slate-500 dark:text-slate-400" },
          { key: "precio_pub", header: "Precio publicado", cell: (v) => (v.precio_publicado_ars ? `ARS ${Number(v.precio_publicado_ars).toLocaleString("es-AR")}` : "—") },
          { key: "razon", header: "Razón", cell: (v) => v.razon_pauta || "—" },
          { key: "estado", header: "Estado", cell: (v) => <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${BADGE_ESTADO[v.estado] || BADGE_ESTADO.vendido}`}>{v.estado}</span> },
        ] as ColumnaTabla<VehiculoPautado>[]
      }
    />
  );
}
