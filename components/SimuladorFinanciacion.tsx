"use client";

import { useEffect, useState } from "react";
import { Calculator, CheckCircle2 } from "lucide-react";
import SolicitarFinanciacionForm from "@/components/forms/SolicitarFinanciacionForm";
import {
  TOPES_FINANCIACION_DEFAULT, TOPE_0KM_DEFAULT, TNA_POR_PLAZO_DEFAULT, GASTOS_PCT_DEFAULT,
  PLAZOS_DISPONIBLES,
  topePctPorAnio, calcularCuotaFrances, type TopeFinanciacion,
} from "@/lib/financiacion";

interface VehiculoFinanciable {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  km: number | null;
  precio_publicado_ars: number | null;
  precio_publicado_usd?: number | null;
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
  const [topes, setTopes] = useState<TopeFinanciacion[]>(TOPES_FINANCIACION_DEFAULT);
  const [tope0km, setTope0km] = useState(TOPE_0KM_DEFAULT);
  const [tna, setTna] = useState<Record<string, number>>(TNA_POR_PLAZO_DEFAULT);
  const [gastosPct, setGastosPct] = useState(GASTOS_PCT_DEFAULT);

  useEffect(() => {
    fetch("/api/financiacion-config").then((r) => r.json()).then((data) => {
      if (data.financiacion_topes?.length) setTopes(data.financiacion_topes);
      if (data.financiacion_tope_0km) setTope0km(data.financiacion_tope_0km);
      if (Object.keys(data.financiacion_tna || {}).length) setTna(data.financiacion_tna);
      if (data.financiacion_gastos_pct != null) setGastosPct(data.financiacion_gastos_pct);
    }).catch(() => {});
  }, []);

  const [cuotas, setCuotas] = useState(24);

  // Tope de financiación real de decreditos según el año del auto (0km ->
  // escalón propio, más alto) -- reemplaza al viejo slider manual de
  // "anticipo" (30-80%, sin relación con el año) de la línea BNA.
  const esOkm = (vehiculo.km ?? 0) === 0;
  const pct = topePctPorAnio(vehiculo.anio, esOkm, topes, tope0km);
  const capitalMaximo = precioTotal * (pct / 100);
  const gastos = precioTotal * (gastosPct / 100);
  const totalNecesario = precioTotal + gastos;
  const anticipoCliente = Math.max(0, totalNecesario - capitalMaximo);

  const tasaPlazo = tna[String(cuotas)];
  const cuotaEstimada = tasaPlazo ? calcularCuotaFrances(capitalMaximo, tasaPlazo, cuotas) : 0;

  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[24px] p-5 md:p-6 shadow-sm dark:shadow-none mt-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Calculator className="w-24 h-24" />
      </div>

      <h3 className="text-sm font-black uppercase tracking-widest text-navy dark:text-white mb-5 flex items-center gap-2">
        <Calculator className="w-4 h-4 text-[#0145F2] dark:text-sky-400" /> Simulador de Crédito
      </h3>

      <div className="space-y-6 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-0.5">Financiás hasta</span>
            <span className="text-lg font-black text-[#0145F2] dark:text-sky-400">$ {capitalMaximo.toLocaleString("es-AR")}</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">{pct}% del valor{esOkm ? " (0km)" : ""}</span>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-0.5">Anticipo en efectivo</span>
            <span className="text-lg font-black text-navy dark:text-white">$ {anticipoCliente.toLocaleString("es-AR")}</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Precio + gastos − financiado</span>
          </div>
        </div>

        {/* Selector de Cuotas */}
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Cantidad de Cuotas</label>
          <div className="grid grid-cols-5 gap-2">
            {PLAZOS_DISPONIBLES.map((c) => (
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
        <div className="bg-sky-50 dark:bg-sky-400/10 border border-sky-100 dark:border-sky-400/20 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-sky-600 dark:text-sky-300 block mb-0.5">Cuota Promedio</span>
              <span className="text-2xl font-black text-navy dark:text-white">$ {cuotaEstimada.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</span>
            </div>
            <CheckCircle2 className="w-8 h-8 text-sky-400 dark:text-sky-300" />
          </div>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center -mt-2">
          Simulación aproximada — la tasa real depende del perfil crediticio de cada cliente, sujeta a aprobación de la financiera.
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
