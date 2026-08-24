"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calculator, ShieldCheck, CreditCard } from "lucide-react";
import SolicitarFinanciacionForm from "@/components/forms/SolicitarFinanciacionForm";

// linkAFinanciacion: en el home, el botón lleva a /financiacion (página completa).
// En /financiacion mismo, abre el modal de solicitud directo.
export default function BannerFinanciacion({ linkAFinanciacion = false }: { linkAFinanciacion?: boolean }) {
  const [meses, setMeses] = useState<number>(48);
  const [anticipoPorcentaje, setAnticipoPorcentaje] = useState<number>(50);

  // ================= VALORES DE REFERENCIA =================
  const PRECIO_VEHICULO = 28600000; 
  const TNA = 0.46; // 46% TNA general simplificada

  const anticipoCliente = (PRECIO_VEHICULO * anticipoPorcentaje) / 100;
  const montoAFinanciar = PRECIO_VEHICULO - anticipoCliente;

  const calcularCuota = (plazoMeses: number) => {
    if (montoAFinanciar <= 0) return 0;
    const tasaMensual = TNA / 12;
    // Fórmula del Sistema Francés
    const cuotaPura =
      montoAFinanciar *
      (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) /
      (Math.pow(1 + tasaMensual, plazoMeses) - 1);

    return Math.round(cuotaPura);
  };

  const beneficios = [
    { icon: Calculator, titulo: `Tasa Fija del ${(TNA * 100).toFixed(0)}% TNA`, texto: "Línea \"+Autos con BNA\" del Banco Nación para vehículos 0km y usados." },
    { icon: CreditCard, titulo: "Financiá hasta 72 meses", texto: "Elegí el plazo que mejor se adapte a tu bolsillo. Sin prenda." },
    { icon: ShieldCheck, titulo: "Gestión 100% online", texto: "Aprobación ágil. Simulá, cargá tus datos y recibí respuesta sin moverte de tu casa." },
  ];

  return (
    <section className="py-20 lg:py-28 bg-[#f8fafc] dark:bg-[#0a0a0f] border-t border-slate-200 dark:border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-2 bg-[#0145F2]/10 dark:bg-sky-400/10 text-[#0145F2] dark:text-sky-300 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              <ShieldCheck className="w-4 h-4" /> Respaldo Oficial
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl text-slate-900 dark:text-white font-black tracking-tight mb-4 leading-[1.1]">
              Pagá tu auto <br className="hidden md:block" />
              <span className="text-[#0145F2] dark:text-sky-400">hasta en 72 cuotas.</span>
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 font-medium max-w-lg">
              Con la línea "+Autos" del Banco Nación, llevarte la llave es mucho más fácil. Simulá tu plan ideal ahora mismo.
            </p>
          </div>
        </div>

        {/* ================= CONTENIDO ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Columna Izquierda: Beneficios */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-6">
            {beneficios.map((b) => (
              <div key={b.titulo} className="flex items-start gap-5 group">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[#0145F2] dark:text-sky-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 group-hover:border-[#0145F2] dark:group-hover:border-sky-400 transition-all duration-300">
                  <b.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-1.5">{b.titulo}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{b.texto}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Columna Derecha: El Simulador "Pop" */}
          <div className="lg:col-span-7 relative mt-8 lg:mt-0">
            {/* Sombras y brillos de fondo para que resalte */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0145F2]/30 to-sky-400/20 dark:from-blue-600/30 dark:to-sky-400/20 blur-3xl rounded-[3rem] transform rotate-3 scale-105" />
            
            <div className="relative bg-white dark:bg-[#111520] border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 sm:p-10 shadow-2xl overflow-hidden">
              <Calculator className="absolute -top-6 -right-6 w-40 h-40 text-slate-900/5 dark:text-white/5 pointer-events-none transform rotate-12" />

              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#0145F2] dark:text-sky-400 flex items-center gap-2">
                  <Calculator className="w-4 h-4" /> Simulador de Referencia
                </h3>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10">
                  Vehículo base: $ {PRECIO_VEHICULO.toLocaleString("es-AR")}
                </span>
              </div>

              <div className="space-y-8 relative z-10">
                {/* Slider Anticipo */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Tu Anticipo ({anticipoPorcentaje}%)
                    </label>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      $ {anticipoCliente.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="80"
                    step="5"
                    value={anticipoPorcentaje}
                    onChange={(e) => setAnticipoPorcentaje(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-[#0145F2] dark:accent-sky-400 mt-2"
                  />
                </div>

                {/* Plazos */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-3">
                    Plazo a financiar
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[24, 48, 72].map((plazo) => (
                      <button
                        key={plazo}
                        onClick={() => setMeses(plazo)}
                        className={`py-3.5 rounded-2xl text-sm font-black transition-all ${
                          meses === plazo
                            ? "bg-[#0145F2] text-white shadow-[0_0_20px_rgba(1,69,242,0.4)] scale-105"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {plazo} cuotas
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resultado */}
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-sm mt-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                      Cuota Mensual Estimada
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                      $ {calcularCuota(meses).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>

                {/* Botón */}
                <div className="pt-2">
                  {linkAFinanciacion ? (
                    <Link
                      href="/financiacion"
                      className="w-full bg-[#0145F2] hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl"
                    >
                      Iniciar Solicitud Online
                    </Link>
                  ) : (
                    <SolicitarFinanciacionForm
                      label="Iniciar Solicitud Online"
                      className="w-full bg-[#0145F2] hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl"
                    />
                  )}
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium text-center mt-4 px-4">
                    * Simulación referencial para un vehículo de $ {PRECIO_VEHICULO.toLocaleString("es-AR")}.
                    Tasa del {(TNA * 100).toFixed(0)}% TNA sujeta a evaluación crediticia y posibles modificaciones del Banco Nación.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}