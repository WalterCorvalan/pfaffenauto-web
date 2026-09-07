"use client";

import TablaResponsiva, { type ColumnaTabla } from "@/components/panelV2/TablaResponsiva";

interface VehiculoPautado {
  id: string; marca: string; modelo: string; anio: number; precio_venta: number; moneda_venta: string;
  canal_pauta: string | null; razon_pauta: string | null; precio_publicado_ars: number | null;
}

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
          { key: "vehiculo", header: "Vehículo", cell: (v) => `${v.marca} ${v.modelo} ${v.anio}`, claseTd: "text-sm font-bold text-slate-900 dark:text-white", ocultarEnMobile: true },
          { key: "precio", header: "Precio", cell: (v) => `${v.moneda_venta} ${Number(v.precio_venta).toLocaleString("es-AR")}`, claseTd: "text-sm text-slate-600 dark:text-slate-300" },
          { key: "canal", header: "Canal", cell: (v) => v.canal_pauta || "—" },
          { key: "precio_pub", header: "Precio publicado", cell: (v) => (v.precio_publicado_ars ? `ARS ${Number(v.precio_publicado_ars).toLocaleString("es-AR")}` : "—") },
          { key: "razon", header: "Razón", cell: (v) => v.razon_pauta || "—" },
        ] as ColumnaTabla<VehiculoPautado>[]
      }
    />
  );
}
