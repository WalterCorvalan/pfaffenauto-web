"use client";

import { useState } from "react";
import { Calculator, CheckCircle2, ChevronRight } from "lucide-react";

export default function SimuladorFinanciacion({ 
  precioTotal, 
  autoNombre,
  telefono 
}: { 
  precioTotal: number; 
  autoNombre: string;
  telefono: string;
}) {
  const [anticipoPorcentaje, setAnticipoPorcentaje] = useState(50);
  const [cuotas, setCuotas] = useState(24);

  // Cálculos matemáticos simples (Simulación TNA 55%)
  const montoAnticipo = (precioTotal * anticipoPorcentaje) / 100;
  const saldoAFinanciar = precioTotal - montoAnticipo;
  
  const TNA = 0.55; 
  const interesTotal = saldoAFinanciar * TNA * (cuotas / 12);
  const cuotaEstimada = (saldoAFinanciar + interesTotal) / cuotas;

  // Lógica WhatsApp
  let numWA = telefono.replace(/\D/g, "");
  if (!numWA.startsWith("549") && !numWA.startsWith("54")) numWA = "549" + numWA;
  
  const mensajeWA = encodeURIComponent(`¡Hola! Estoy viendo el ${autoNombre} en su web. Me interesa la financiación entregando un anticipo de $${montoAnticipo.toLocaleString("es-AR")} en ${cuotas} cuotas. ¿Me pasan los requisitos?`);
  const linkWA = `https://wa.me/${numWA}?text=${mensajeWA}`;

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] p-5 md:p-6 shadow-sm mt-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Calculator className="w-24 h-24" />
      </div>

      <h3 className="text-sm font-black uppercase tracking-widest text-navy mb-5 flex items-center gap-2">
        <Calculator className="w-4 h-4 text-[#0145F2]" /> Simulador de Crédito
      </h3>

      <div className="space-y-6 relative z-10">
        {/* Slider de Anticipo */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tu Anticipo ({anticipoPorcentaje}%)</label>
            <span className="text-lg font-black text-[#0145F2]">$ {montoAnticipo.toLocaleString("es-AR")}</span>
          </div>
          <input 
            type="range" 
            min="30" 
            max="80" 
            step="5"
            value={anticipoPorcentaje} 
            onChange={(e) => setAnticipoPorcentaje(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0145F2]"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
            <span>Min 30%</span>
            <span>Max 80%</span>
          </div>
        </div>

        {/* Selector de Cuotas */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Cantidad de Cuotas</label>
          <div className="grid grid-cols-4 gap-2">
            {[12, 24, 36, 48].map((c) => (
              <button
                key={c}
                onClick={() => setCuotas(c)}
                className={`py-2 rounded-xl text-xs font-black transition-all ${cuotas === c ? "bg-navy text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Resultado */}
        <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-600 block mb-0.5">Cuota Promedio</span>
            <span className="text-2xl font-black text-navy">$ {cuotaEstimada.toLocaleString("es-AR", {maximumFractionDigits: 0})}</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-sky-400" />
        </div>

        <a 
          href={linkWA}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#0145F2] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_4px_15px_rgba(1,69,242,0.3)]"
        >
          Solicitar este plan <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}