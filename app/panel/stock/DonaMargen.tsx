"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Extraído de FichaVehiculoModal.tsx a su propio módulo para poder
// cargarlo con next/dynamic (ssr: false) desde ahí -- recharts solo hace
// falta acá, dentro del tab "Gastos y margen" de la ficha, no en el resto
// del modal (que se abre mucho más seguido que ese tab puntual).
function fmtPrecio(n: number | null, moneda: string | null) {
  if (!n || !moneda) return "—";
  return moneda === "ARS" ? `$ ${n.toLocaleString("es-AR")}` : `${moneda} ${n.toLocaleString("es-AR")}`;
}

// Segmentos = costo/comisión/gastos (lo que se "come" el precio de venta);
// la ganancia queda afuera del anillo -- si es negativa no se puede dibujar
// como porción de un círculo, así que se muestra aparte arriba (ya estaba).
export default function DonaMargen({ precioVenta, costo, comision, gastos, ganancia, moneda }: { precioVenta: number; costo: number; comision: number; gastos: number; ganancia: number; moneda: string }) {
  const segmentos = [
    { nombre: "Costo de compra", valor: costo, color: "#94a3b8" },
    { nombre: "Comisión", valor: comision, color: "#818cf8" },
    { nombre: "Gastos", valor: gastos, color: "#fbbf24" },
  ].filter((s) => s.valor > 0);
  if (segmentos.length === 0 || precioVenta <= 0) return null;

  return (
    <div className="relative h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={segmentos} dataKey="valor" nameKey="nombre" innerRadius={55} outerRadius={80} paddingAngle={2} stroke="none">
            {segmentos.map((s) => <Cell key={s.nombre} fill={s.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Precio de venta</p>
        <p className="text-base font-black text-slate-800 dark:text-white">{fmtPrecio(precioVenta, moneda)}</p>
      </div>
      <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 mt-1">
        {segmentos.map((s) => (
          <span key={s.nombre} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            {s.nombre} · {Math.round((s.valor / precioVenta) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}
