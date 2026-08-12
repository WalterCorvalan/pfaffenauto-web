"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calculator, ShieldCheck, CreditCard, ArrowRight } from "lucide-react";

export default function BannerFinanciacion() {
  const [meses, setMeses] = useState<number>(60);

  // ================= LÓGICA FINANCIERA (SISTEMA FRANCÉS - BNA) =================
  const PRECIO_VEHICULO = 28600000;
  const TNA = 0.11; // 11% Tasa Nominal Anual
  const PORCENTAJE_ANTICIPO = 0.50; // Cliente pone la mitad
  const PORCENTAJE_PRENDA = 0.04; // 4% del valor del auto para gastos

  // 1. El cliente entrega la mitad del valor del auto
  const anticipoCliente = PRECIO_VEHICULO * PORCENTAJE_ANTICIPO;

  // 2. El banco financia la otra mitad
  const capitalRestante = PRECIO_VEHICULO - anticipoCliente;

  // 3. Gastos administrativos y de prenda (4% del total del auto)
  const gastosPrenda = PRECIO_VEHICULO * PORCENTAJE_PRENDA;

  // 4. El monto total a financiar SUMA el capital restante + los gastos de prenda
  const montoAFinanciar = capitalRestante + gastosPrenda;

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
    { icon: Calculator, titulo: "Tasa preferencial del 11% (TNA)", texto: "La línea de créditos prendarios del Banco Nación, la más competitiva del mercado actual." },
    { icon: CreditCard, titulo: "Gastos incluidos en la cuota", texto: "Los costos de prenda y otorgamiento se suman al crédito. Necesitás menos efectivo inicial." },
    { icon: ShieldCheck, titulo: "Cargá tus datos 100% online", texto: "Aprobación ágil. Completá tu información y validala sin moverte de tu casa." },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#f8f9fa] border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl text-gray-900 font-black tracking-tight mb-4 leading-tight">
              Pagá tu auto <br className="hidden md:block" />
              <span className="text-blue-600">hasta en 60 cuotas.</span>
            </h2>
            <p className="text-base text-gray-500 font-medium">
              Créditos prendarios del Banco Nación con tasa preferencial. Simulá tu cuota y solicitalo online.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl shrink-0">
            <div className="flex flex-col items-center justify-center pr-4 border-r border-gray-200">
              <span className="text-2xl font-black text-gray-900">11%</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">TNA</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">Banco Nación</span>
              <span className="text-xs text-gray-500 font-medium">Tasa preferencial vigente</span>
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
                className="bg-white border border-gray-200 p-5 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all duration-300 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <b.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{b.titulo}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{b.texto}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Simulador */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 rounded-2xl p-6 sm:p-8 h-full flex flex-col">

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-900">Simulá tu cuota</h3>
                <span className="text-[11px] font-bold text-gray-400">Valor de referencia $ {PRECIO_VEHICULO.toLocaleString("es-AR")}</span>
              </div>

              {/* Selector de plazos */}
              <div className="flex items-center gap-2 mb-6">
                {[36, 48, 60].map((plazo) => (
                  <button
                    key={plazo}
                    onClick={() => setMeses(plazo)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                      meses === plazo
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-200 text-gray-500 hover:border-blue-300"
                    }`}
                  >
                    {plazo} cuotas
                  </button>
                ))}
              </div>

              {/* Resumen */}
              <dl className="space-y-2.5 text-sm mb-6">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Anticipo (50%)</dt>
                  <dd className="font-bold text-gray-900">$ {anticipoCliente.toLocaleString("es-AR")}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Capital a financiar</dt>
                  <dd className="font-bold text-gray-900">$ {capitalRestante.toLocaleString("es-AR")}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Gastos de prenda (4%)</dt>
                  <dd className="font-bold text-gray-900">+ $ {gastosPrenda.toLocaleString("es-AR")}</dd>
                </div>
              </dl>

              <div className="flex items-center justify-between mt-auto pt-5 border-t border-gray-100">
                <span className="text-sm font-bold text-gray-900">Cuota mensual estimada</span>
                <span className="text-2xl font-black text-blue-600">$ {calcularCuota(meses).toLocaleString("es-AR")}</span>
              </div>

              <Link
                href="/financiacion"
                className="mt-6 flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 rounded-xl transition-colors active:scale-[0.99]"
              >
                Solicitar mi crédito
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-[11px] text-gray-400 text-center mt-4">
                * Simulación sujeta a evaluación crediticia. Sistema Francés TNA 11%. No incluye seguro de vida/unidad.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
