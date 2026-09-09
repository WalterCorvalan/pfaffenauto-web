"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORES = ["#f97316", "#0ea5e9", "#a78bfa", "#10b981", "#fbbf24", "#fb7185", "#64748b"];

// Tooltip personalizado usando clases de Tailwind (soporta modo claro/oscuro nativo)
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 p-3 rounded-xl shadow-lg">
        <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs mb-1.5 last:mb-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500 dark:text-slate-400 capitalize">{entry.name}:</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white ml-auto pl-4">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function EmbudoCanalChart({ data, canales }: { data: any[]; canales: string[] }) {
  return (
    <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm flex flex-col h-[380px] transition-colors">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6">
        Ventas por Canal — Últimos 6 Meses
      </h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#64748b" strokeOpacity={0.15} vertical={false} />
            
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              strokeOpacity={0.5} 
              tick={{ fill: "#64748b", fontSize: 12 }} 
              tickLine={false} 
              axisLine={false} 
            />
            
            <YAxis 
              stroke="#64748b" 
              strokeOpacity={0.5} 
              tick={{ fill: "#64748b", fontSize: 12 }} 
              tickLine={false} 
              axisLine={false} 
              allowDecimals={false} 
            />
            
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: "#64748b", strokeWidth: 1, strokeDasharray: "3 3", fill: "transparent" }} 
            />
            
            <Legend 
              wrapperStyle={{ paddingTop: "15px", fontSize: "12px", color: "#64748b" }} 
              iconType="circle" 
            />
            
            {canales.map((canal, idx) => (
              <Line
                key={canal}
                type="monotone"
                dataKey={canal}
                stroke={COLORES[idx % COLORES.length]}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORES[idx % COLORES.length], strokeWidth: 0 }}
                activeDot={{ r: 6, fill: COLORES[idx % COLORES.length], strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}