"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calculator, ShieldCheck, CreditCard, ArrowRight, Info } from "lucide-react";

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

  return (
    <section className="py-20 md:py-28 bg-[#F4F7FC] relative overflow-hidden border-t border-b border-slate-200/60">
      
      {/* Luces ambientales sutiles */}
      <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* ================= COLUMNA IZQUIERDA: BENEFICIOS ================= */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div>
              <span className="text-[#0145F2] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full inline-block mb-4 shadow-sm">
                Créditos Prendarios BNA
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-navy tracking-tighter leading-tight">
                Pagá tu auto hasta en <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy to-[#0145F2]">60 meses</span>
              </h2>
            </div>

            {/* Lista de Beneficios */}
            <div className="space-y-6">
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center shrink-0 text-[#0145F2]">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-navy uppercase tracking-wide mb-1">
                    Tasa Preferencial del 11% (TNA)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                    Aprovechá la línea de créditos prendarios del Banco Nación. La tasa de interés más baja y competitiva del mercado actual.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center shrink-0 text-[#0145F2]">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-navy uppercase tracking-wide mb-1">
                    Gastos incluidos en la cuota
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                    Los costos de prenda y otorgamiento se suman al crédito. Así necesitás menos efectivo inicial para retirar tu vehículo.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center shrink-0 text-[#0145F2]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-navy uppercase tracking-wide mb-1">
                    Cargá tus datos 100% online
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                    Aprobación ágil. Completá tu información básica y validala sin moverte de tu casa de forma totalmente segura.
                  </p>
                </div>
              </div>

            </div>

            {/* Botón de Acción Principal */}
            <div className="pt-2">
              <Link
                href="/cotizador"
                className="inline-flex items-center gap-3 bg-[#0145F2] hover:bg-blue-600 text-white font-black text-xs md:text-sm uppercase tracking-widest px-8 py-4.5 rounded-2xl shadow-[0_10px_25px_rgba(1,69,242,0.3)] transition-all active:scale-95 group w-full sm:w-auto justify-center"
              >
                Solicitar mi crédito 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* ================= COLUMNA DERECHA: SIMULADOR INTERACTIVO BNA ================= */}
          <div className="lg:col-span-5 flex justify-center relative">
            
            {/* Círculo de fondo azul dinámico */}
            <div className="absolute w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] bg-[#0145F2] rounded-full blur-[2px] opacity-90 -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xl"></div>

            {/* Tarjeta Simulador Estilo App */}
            <div className="w-full max-w-[380px] bg-white rounded-[32px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 relative z-10">
              
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-black uppercase tracking-widest text-navy">Simulador BNA</span>
                <span className="bg-sky-100 text-[#0145F2] text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded">11% TNA</span>
              </div>

              {/* Ficha de auto simulada */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3 mb-4">
                <div className="w-14 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                  <img src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=300&auto=format&fit=crop" alt="Auto" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div className="w-full">
                  <p className="text-xs font-black text-navy uppercase truncate">Volkswagen Taos</p>
                  <p className="text-[10px] font-bold text-[#0145F2] tracking-wide">Valor: $ {PRECIO_VEHICULO.toLocaleString("es-AR")}</p>
                </div>
              </div>

              {/* Resumen de Montos Explicados */}
              <div className="mb-5 space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Anticipo (50%)</span>
                  <span className="text-navy font-black">$ {anticipoCliente.toLocaleString("es-AR")}</span>
                </div>
                
                <div className="border-t border-slate-200/60 my-2"></div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Capital Restante</span>
                  <span className="text-navy font-black">$ {capitalRestante.toLocaleString("es-AR")}</span>
                </div>
                
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Info className="w-3 h-3" /> Gastos Prenda (4%)
                  </span>
                  <span className="text-slate-500 font-black">+ $ {gastosPrenda.toLocaleString("es-AR")}</span>
                </div>

                <div className="border-t border-slate-200/60 my-2"></div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#0145F2] font-black uppercase tracking-wider">A Financiar</span>
                  <span className="text-[#0145F2] font-black text-sm">$ {montoAFinanciar.toLocaleString("es-AR")}</span>
                </div>
              </div>

              {/* Selector de Plazos Interactivo */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Elegí la cantidad de cuotas fijas</span>

                {[60, 48, 36].map((plazo) => (
                  <div
                    key={plazo}
                    onClick={() => setMeses(plazo)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      meses === plazo 
                        ? "bg-blue-50/60 border-[#0145F2] shadow-sm" 
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${meses === plazo ? "border-[#0145F2] bg-[#0145F2]" : "border-slate-300"}`}>
                        {meses === plazo && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                      <span className="text-xs font-black text-navy">{plazo} cuotas</span>
                    </div>
                    <span className={`text-xs font-black ${meses === plazo ? "text-[#0145F2]" : "text-slate-600"}`}>
                      $ {calcularCuota(plazo).toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
              </div>
              
              <p className="text-[9px] text-slate-400 text-center mt-4 font-medium px-2">
                * Simulación sujeta a evaluación crediticia. Sistema Francés TNA 11%. No incluye costos de seguro de vida/unidad.
              </p>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}