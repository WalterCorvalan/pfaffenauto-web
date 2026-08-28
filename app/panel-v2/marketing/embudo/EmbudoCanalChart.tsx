"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORES = ["#f97316", "#0ea5e9", "#a78bfa", "#10b981", "#fbbf24", "#fb7185", "#64748b"];

export default function EmbudoCanalChart({ data, canales }: { data: any[]; canales: string[] }) {
  return (
    <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col h-[380px]">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
        Ventas por Canal — Últimos 6 Meses
      </h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: "#0b1329", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }} />
            <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} iconType="circle" />
            {canales.map((canal, idx) => (
              <Line
                key={canal}
                type="monotone"
                dataKey={canal}
                stroke={COLORES[idx % COLORES.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}