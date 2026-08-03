"use client";

import React from "react";
import { WobbleCard } from "./ui/wobble-card";
import Link from "next/link";
import { ArrowRight, Calculator, Banknote, CarFront, Sparkles } from "lucide-react";

export default function ServiciosWobble() {
  return (
    <section className="py-24 bg-transparent relative overflow-hidden border-t border-transparent">
      
      {/* ================= LUCES AMBIENTALES ================= */}
      <div className="absolute top-[10%] left-[-5%] w-[500px] h-[500px] bg-slate-900/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-sky-900/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* ================= ENCABEZADO ================= */}
        <div className="text-center mb-16 relative z-10">
          <span className="text-[#0145F2] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] bg-blue-50/50 backdrop-blur-xl border border-blue-100/50 px-4 py-1.5 rounded-full inline-block shadow-sm mb-4">
            <Sparkles className="w-3.5 h-3.5 inline mr-1" /> Nuestros Servicios
          </span>
          <h2 className="text-3xl md:text-5xl font-light text-navy tracking-tighter drop-shadow-sm">
            Soluciones a <strong className="font-black text-transparent bg-clip-text bg-gradient-to-r from-navy to-[#0145F2]">tu medida</strong>
          </h2>
        </div>

        {/* ================= GRILLA DE WOBBLE CARDS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
          
          {/* TARJETA 1: COTIZAR */}
          <WobbleCard
            containerClassName="col-span-1 lg:col-span-2 h-full bg-[#0d1631] relative overflow-hidden group shadow-[0_12px_40px_rgba(11,19,41,0.25)] border border-slate-700/40 rounded-[32px]"
            className="p-6 md:p-10 flex flex-col h-full min-h-[420px]"
          >
            {/* Contenido (Textos y Botón) por encima de todo */}
            <div className="relative z-20 flex flex-col flex-1">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-[14px] flex items-center justify-center mb-6 shadow-inner">
                <Calculator className="w-5 h-5 text-sky-400" />
              </div>
              <h2 className="text-left text-balance text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4 leading-tight drop-shadow-md">
                Cotizá tu usado en <br className="hidden md:block" />el acto y llevalo.
              </h2>
              <p className="text-left text-sm md:text-base text-slate-300 font-medium mb-8 leading-relaxed max-w-sm">
                Entregá tu vehículo como parte de pago. Te aseguramos una tasación justa y transparente para que te subas a tu próximo auto sin demoras.
              </p>
              <div className="mt-auto">
                <Link 
                  href="/cotizador" 
                  className="inline-flex items-center gap-2 bg-white text-navy hover:bg-slate-100 font-black text-[10px] md:text-xs uppercase tracking-widest px-6 py-3.5 rounded-full transition-all active:scale-95 shadow-xl group/btn"
                >
                  Cotizar Ahora <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            
            {/* Imagen de Fondo (Mitad inferior) */}
            <div className="absolute right-0 bottom-0 w-full h-[60%] lg:w-[60%] lg:h-full z-0 overflow-hidden pointer-events-none">
              {/* Gradiente para fundir la imagen con el fondo oscuro */}
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-transparent via-[#0d1631]/80 to-[#0d1631] z-10"></div>
              <img
                src="https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=800&auto=format&fit=crop"
                alt="Cotizar auto usado"
                className="w-full h-full object-cover object-right-bottom opacity-50 mix-blend-screen group-hover:opacity-70 transition-all duration-700 ease-out"
              />
            </div>
          </WobbleCard>

          {/* TARJETA 2: VENDÉ TU AUTO */}
          <WobbleCard 
            containerClassName="col-span-1 bg-[#111520] relative overflow-hidden flex flex-col justify-center shadow-[0_12px_40px_rgba(15,23,42,0.3)] border border-slate-700/50 group rounded-[32px]"
            className="p-6 md:p-10 flex flex-col h-full min-h-[380px]"
          >
            <div className="relative z-20 flex flex-col flex-1">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-[14px] flex items-center justify-center mb-6 shadow-inner">
                <Banknote className="w-5 h-5 text-slate-300" />
              </div>
              <h2 className="text-left text-balance text-3xl md:text-4xl font-black tracking-tight text-white mb-4 leading-tight drop-shadow-md">
                Vendé tu auto en <br className="hidden md:block"/>menos de 24 hrs.
              </h2>
              <p className="text-left text-sm md:text-base text-slate-400 font-medium mb-8 leading-relaxed max-w-[26rem]">
                Efectivo inmediato, transferencia segura y 100% formal. Vende tu unidad de forma directa y sin complicaciones.
              </p>
              <div className="mt-auto">
                <Link 
                  href="/vender" 
                  className="inline-flex items-center gap-2 bg-slate-700/60 hover:bg-slate-600 border border-slate-600/50 text-white backdrop-blur-md font-black text-[10px] md:text-xs uppercase tracking-widest px-6 py-3.5 rounded-full transition-all active:scale-95 shadow-lg group/btn"
                >
                  Vender mi auto <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </WobbleCard>

          {/* TARJETA 3: CONSIGNAR */}
          <WobbleCard 
            containerClassName="col-span-1 lg:col-span-3 bg-[#1e293b] relative overflow-hidden group shadow-[0_12px_40px_rgba(15,23,42,0.25)] border border-slate-600/40 rounded-[32px]"
            className="p-6 md:p-10 flex flex-col h-full min-h-[420px]"
          >
            <div className="relative z-20 flex flex-col flex-1 w-full lg:w-1/2">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-[14px] flex items-center justify-center mb-6 shadow-inner">
                <CarFront className="w-5 h-5 text-sky-400" />
              </div>
              <h2 className="text-left text-balance text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-white mb-4 leading-tight drop-shadow-md">
                Consignación Premium: <br />Nosotros vendemos por vos.
              </h2>
              <p className="text-left text-sm md:text-base text-slate-300 font-medium mb-8 leading-relaxed max-w-md">
                Dejanos tu vehículo y despreocupate de la gestión. Nos encargamos de la exposición, atención comercial y seguridad jurídica. <strong className="text-white font-bold">Máxima rentabilidad asegurada.</strong>
              </p>
              <div className="mt-auto">
                <Link 
                  href="/consignacion" 
                  className="inline-flex items-center gap-2 bg-white text-navy hover:bg-slate-100 font-black text-[10px] md:text-xs uppercase tracking-widest px-6 py-3.5 rounded-full transition-all active:scale-95 shadow-xl group/btn2"
                >
                  Quiero Consignar Mi Auto <ArrowRight className="w-4 h-4 group-hover/btn2:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Imagen de Fondo (Mitad derecha/inferior) */}
            <div className="absolute right-0 bottom-0 w-full h-[55%] lg:w-[55%] lg:h-full z-0 overflow-hidden pointer-events-none">
              {/* Gradiente para fundir la imagen con el fondo oscuro */}
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-transparent via-[#1e293b]/90 to-[#1e293b] z-10"></div>
              <img
                src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000&auto=format&fit=crop"
                alt="Consignación de autos"
                className="w-full h-full object-cover object-center opacity-60 mix-blend-screen group-hover:opacity-80 transition-all duration-700 ease-out"
              />
            </div>
          </WobbleCard>
          
        </div>
      </div>
    </section>
  );
}