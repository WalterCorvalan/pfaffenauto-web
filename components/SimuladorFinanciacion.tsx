"use client";

import { useState } from "react";
import { Calculator, CheckCircle2 } from "lucide-react";
import SolicitarFinanciacionForm from "@/components/forms/SolicitarFinanciacionForm";

interface VehiculoFinanciable {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  km: number | null;
  precio_publicado_ars: number | null;
  sucursales: { nombre: string } | null;
}

export default function SimuladorFinanciacion({
  precioTotal,
  autoNombre,
  telefono,
  vehiculo,
}: {
  precioTotal: number;
  autoNombre: string;
  telefono: string;
  vehiculo: VehiculoFinanciable;
}) {
  const [anticipoPorcentaje, setAnticipoPorcentaje] = useState(50);
  const [cuotas, setCuotas] = useState(24);
  const [cuentaSueldo, setCuentaSueldo] = useState(false);

  // Línea "+Autos con BNA" (préstamo personal, no prendario) — tasas oficiales
  // publicadas en bna.com.ar/home/masautos. Sistema francés de amortización.
  const montoAnticipo = (precioTotal * anticipoPorcentaje) / 100;
  const saldoAFinanciar = precioTotal - montoAnticipo;

  const TNA = cuentaSueldo ? 0.36 : 0.46;
  const tasaMensual = TNA / 12;
  const cuotaEstimada =
    saldoAFinanciar > 0
      ? (saldoAFinanciar * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -cuotas))
      : 0;


  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[24px] p-5 md:p-6 shadow-sm dark:shadow-none mt-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Calculator className="w-24 h-24" />
      </div>

      <h3 className="text-sm font-black uppercase tracking-widest text-navy dark:text-white mb-5 flex items-center gap-2">
        <Calculator className="w-4 h-4 text-[#0145F2] dark:text-sky-400" /> Simulador de Crédito
      </h3>

      <div className="space-y-6 relative z-10">
        {/* Slider de Anticipo */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tu Anticipo ({anticipoPorcentaje}%)</label>
            <span className="text-lg font-black text-[#0145F2] dark:text-sky-400">$ {montoAnticipo.toLocaleString("es-AR")}</span>
          </div>
          <input
            type="range"
            min="30"
            max="80"
            step="5"
            value={anticipoPorcentaje}
            onChange={(e) => setAnticipoPorcentaje(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#0145F2]"
          />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">
            <span>Min 30%</span>
            <span>Max 80%</span>
          </div>
        </div>

        {/* Cuenta sueldo BNA */}
        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 w-fit">
          <input
            type="checkbox"
            checked={cuentaSueldo}
            onChange={(e) => setCuentaSueldo(e.target.checked)}
            className="w-4 h-4 accent-[#0145F2]"
          />
          Tengo cuenta sueldo en el Banco Nación
        </label>

        {/* Selector de Cuotas */}
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Cantidad de Cuotas</label>
          <div className="grid grid-cols-4 gap-2">
            {[12, 24, 48, 72].map((c) => (
              <button
                key={c}
                onClick={() => setCuotas(c)}
                className={`py-2 rounded-xl text-xs font-black transition-all ${cuotas === c ? "bg-navy dark:bg-[#0145F2] text-white shadow-md" : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Resultado */}
        <div className="bg-sky-50 dark:bg-sky-400/10 border border-sky-100 dark:border-sky-400/20 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-600 dark:text-sky-300 block mb-0.5">Cuota Promedio</span>
            <span className="text-2xl font-black text-navy dark:text-white">$ {cuotaEstimada.toLocaleString("es-AR", {maximumFractionDigits: 0})}</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-sky-400 dark:text-sky-300" />
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center -mt-2">
          Línea &quot;+Autos con BNA&quot; · TNA {(TNA * 100).toFixed(0)}% ({cuentaSueldo ? "cuenta sueldo" : "cartera abierta"}) · tasas oficiales sujetas a cambios del Banco Nación
        </p>

        <SolicitarFinanciacionForm
          vehiculoPreseleccionado={vehiculo}
          label="Solicitar este plan"
          className="w-full bg-[#0145F2] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_4px_15px_rgba(1,69,242,0.3)]"
        />
      </div>
    </div>
  );
}