"use client";

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function VentasChart({ data, vendedores }: { data: any[], vendedores: string[] }) {
  // Paleta de colores vibrantes para diferenciar a los vendedores
  const coloresVendedores = ["#0ea5e9", "#fbbf24", "#10b981", "#a78bfa", "#fb7185"];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
      
      {/* ================= GRÁFICO 1: VENTAS TOTALES ================= */}
      <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col h-[400px]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
          Evolución General de Ventas (6 Meses)
        </h3>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
              {/* Grilla sutil de fondo */}
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
              
              <Tooltip 
                contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              
              <Line 
                type="monotone" 
                dataKey="Total" 
                name="Autos Vendidos"
                stroke="#f97316" // Color naranja de tu foto de referencia
                strokeWidth={3} 
                dot={{ fill: '#f97316', strokeWidth: 2, r: 5 }} 
                activeDot={{ r: 8, strokeWidth: 0 }}
                label={{ fill: '#e2e8f0', fontSize: 12, position: 'top', dy: -10 }} // Número arriba del puntito
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= GRÁFICO 2: POR VENDEDOR ================= */}
      <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col h-[400px]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
          Rendimiento por Asesor/Encargado
        </h3>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
              
              <Tooltip 
                contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} iconType="circle" />
              
              {vendedores.map((vendedor, idx) => (
                <Line 
                  key={vendedor}
                  type="monotone" 
                  dataKey={vendedor} 
                  stroke={coloresVendedores[idx % coloresVendedores.length]} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}