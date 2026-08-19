"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calculator, ShieldCheck, CreditCard, ArrowRight } from "lucide-react";

export default function BannerFinanciacion() {
  const [meses, setMeses] = useState<number>(60);
  const [cuentaSueldo, setCuentaSueldo] = useState(false);

  // ================= LÍNEA REAL "+AUTOS CON BNA" (préstamo personal, no prendario) =================
  // Tasas oficiales publicadas en bna.com.ar/home/masautos — sujetas a cambios del banco.
  const PRECIO_VEHICULO = 28600000;
  const TNA = cuentaSueldo ? 0.36 : 0.46;
  const PORCENTAJE_ANTICIPO = 0.50; // Cliente pone la mitad como anticipo

  const anticipoCliente = PRECIO_VEHICULO * PORCENTAJE_ANTICIPO;
  const montoAFinanciar = PRECIO_VEHICULO - anticipoCliente;

  const calcularCuota = (plazoMeses: number) => {
    const tasaMensual = TNA / 12;
    // Fórmula del Sistema Francés: C = V * (i * (1+i)^n) / ((1+i)^n - 1)
    const cuotaPura =
      montoAFinanciar *
      (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) /
      (Math.pow(1 + tasaMensual, plazoMeses) - 1);

    return Math.round(cuotaPura);
  };

  const beneficios = [
    { icon: Calculator, titulo: `Tasa desde ${(TNA * 100).toFixed(0)}% TNA`, texto: "Línea \"+Autos con BNA\" del Banco Nación para 0km y usados, sin prenda." },
    { icon: CreditCard, titulo: "Hasta $100.000.000 financiables", texto: "Cubre hasta el 100% del valor del vehículo, en hasta 72 cuotas." },
    { icon: ShieldCheck, titulo: "Cargá tus datos 100% online", texto: "Aprobación ágil. Completá tu información y validala sin moverte de tu casa." },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#f8f9fa] dark:bg-[#0a0a0f] border-t border-gray-200 dark:border-transparent">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl text-gray-900 dark:text-white font-black tracking-tight mb-4 leading-tight">
              Pagá tu auto <br className="hidden md:block" />
              <span className="text-blue-600 dark:text-sky-300">hasta en 72 cuotas.</span>
            </h2>
            <p className="text-base text-gray-500 dark:text-slate-400 font-medium">
              Línea &quot;+Autos con BNA&quot; del Banco Nación. Simulá tu cuota y solicitalo online.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-xl shrink-0">
            <div className="flex flex-col items-center justify-center pr-4 border-r border-gray-200 dark:border-white/10">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{(TNA * 100).toFixed(0)}%</span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-1">TNA</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Banco Nación</span>
              <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Tasa vigente publicada</span>
            </div>
          </div>
        </div>

        {/* ================= CONTENIDO: BENEFICIOS + SIMULADOR ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Beneficios */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-4">
            {beneficios.map((b) => (
              <div
                key={b.titulo}
                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5 rounded-2xl hover:border-blue-400 dark:hover:border-sky-400/50 hover:shadow-md transition-all duration-300 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-sky-400/10 text-blue-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                  <b.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{b.titulo}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{b.texto}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Simulador */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-sky-400/50 hover:shadow-md transition-all duration-300 rounded-2xl p-6 sm:p-8 h-full flex flex-col">

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Simulá tu cuota</h3>
                <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500">Valor de referencia $ {PRECIO_VEHICULO.toLocaleString("es-AR")}</span>
              </div>

              <label className="flex items-center gap-2.5 text-xs font-bold text-gray-600 dark:text-slate-300 cursor-pointer bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 w-fit mb-5">
                <input
                  type="checkbox"
                  checked={cuentaSueldo}
                  onChange={(e) => setCuentaSueldo(e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
                Tengo cuenta sueldo en el Banco Nación
              </label>

              {/* Selector de plazos */}
              <div className="flex items-center gap-2 mb-6">
                {[24, 48, 72].map((plazo) => (
                  <button
                    key={plazo}
                    onClick={() => setMeses(plazo)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                      meses === plazo
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-sky-400/50"
                    }`}
                  >
                    {plazo} cuotas
                  </button>
                ))}
              </div>

              {/* Resumen */}
              <dl className="space-y-2.5 text-sm mb-6">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500 dark:text-slate-400">Anticipo (50%)</dt>
                  <dd className="font-bold text-gray-900 dark:text-white">$ {anticipoCliente.toLocaleString("es-AR")}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500 dark:text-slate-400">Monto a financiar</dt>
                  <dd className="font-bold text-gray-900 dark:text-white">$ {montoAFinanciar.toLocaleString("es-AR")}</dd>
                </div>
              </dl>

              <div className="flex items-center justify-between mt-auto pt-5 border-t border-gray-100 dark:border-white/10">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Cuota mensual estimada</span>
                <span className="text-2xl font-black text-blue-600 dark:text-sky-300">$ {calcularCuota(meses).toLocaleString("es-AR")}</span>
              </div>

              <Link
                href="/financiacion"
                className="mt-6 flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 rounded-xl transition-colors active:scale-[0.99]"
              >
                Solicitar mi crédito
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-[11px] text-gray-400 dark:text-slate-500 text-center mt-4">
                * Simulación de referencia, sujeta a evaluación crediticia. Línea &quot;+Autos con BNA&quot;, sistema francés. Tasas oficiales del Banco Nación, sujetas a cambios.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
