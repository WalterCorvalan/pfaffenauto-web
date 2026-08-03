"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calculator, ShieldCheck, CreditCard, ArrowRight, CheckCircle2 } from "lucide-react";

export default function BannerFinanciacion() {
  const [meses, setMeses] = useState<number>(60);
  const precioVehiculo = 2860000;
  
  // Lógica simple de simulación en tiempo real para el mockup interactivo
  const calcularCuota = (plazo: number) => {
    const interes = 1 + (plazo * 0.018); // Simulación de tasa orientativa
    const montoBase = precioVehiculo * 0.7; // Financiando el 70%
    return Math.round((montoBase * interes) / plazo);
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
                Créditos a tu medida
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
                    Simulá planes en tiempo real
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                    Cotizá según tus preferencias y elegí los plazos que más te convengan para tu bolsillo.
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
                    Completá tu información básica y validala sin moverte de tu casa de forma segura.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center shrink-0 text-[#0145F2]">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-navy uppercase tracking-wide mb-1">
                    Aprovechá nuestros planes a cuota fija
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                    Congelá tu cuota en pesos o conocé nuestras opciones con tasa preferencial.
                  </p>
                </div>
              </div>

            </div>

            {/* Botón de Acción Principal */}
            <div className="pt-2">
              <Link
                href="/financiacion"
                className="inline-flex items-center gap-3 bg-[#0145F2] hover:bg-blue-600 text-white font-black text-xs md:text-sm uppercase tracking-widest px-8 py-4.5 rounded-2xl shadow-[0_10px_25px_rgba(1,69,242,0.3)] transition-all active:scale-95 group w-full sm:w-auto justify-center"
              >
                Simulá tu financiación 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* ================= COLUMNA DERECHA: MOCKUP INTERACTIVO SIMILAR A LA REFERENCIA ================= */}
          <div className="lg:col-span-5 flex justify-center relative">
            
            {/* Círculo de fondo azul dinámico (similar al diseño de la imagen) */}
            <div className="absolute w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] bg-[#0145F2] rounded-full blur-[2px] opacity-90 -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xl"></div>

            {/* Tarjeta Simulador Estilo App */}
            <div className="w-full max-w-[360px] bg-white rounded-[32px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 relative z-10">
              
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-black uppercase tracking-widest text-navy">Simulá tu préstamo</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              {/* Ficha de auto simulada */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3 mb-4">
                <div className="w-14 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                  <img src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=300&auto=format&fit=crop" alt="Auto" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Vehículo Seleccionado</p>
                  <p className="text-xs font-black text-navy uppercase truncate">Volkswagen Gol Trend</p>
                  <p className="text-xs font-bold text-[#0145F2]">Precio: $ 2.860.000</p>
                </div>
              </div>

              {/* Input simulado de monto */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">¿Cuánto querés pedir?</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black text-navy">
                  $ 2.000.000
                </div>
                <span className="text-[9px] text-slate-400 mt-1 block">El máximo a prestar es $ 2.145.000.</span>
              </div>

              {/* Selector de Plazos Interactivo */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Elegí el plazo</span>

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
                      $ {calcularCuota(plazo).toLocaleString("es-AR")}*
                    </span>
                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}