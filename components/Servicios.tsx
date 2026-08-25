"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Banknote, CarFront, Zap, Tag } from "lucide-react";

export default function Servicios() {
  return (
    <section className="py-16 md:py-24 bg-[#f8fafc] dark:bg-[#0a0a0f] border-t border-slate-200 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* ================= ENCABEZADO ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-14">
          <div>
            <div className="inline-flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-lg bg-[#0d1631] dark:bg-sky-600 flex items-center justify-center shrink-0 shadow-sm">
                <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.25} />
              </span>
              <span className="text-gray-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-[0.15em]">
                Soluciones integrales
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight max-w-xl leading-[1.05]">
              Más que <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0145F2] to-sky-400">comprar un auto.</span>
            </h2>
          </div>
          <Link
            href="/contacto"
            className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0145F2] dark:hover:text-sky-400 transition-colors group shrink-0"
          >
            Contactar asesor <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* ================= BENTO GRID PROMOCIONAL ================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* BANNER 1: VENDER (Destacado - 8 columnas) — naranja */}
          <div className="md:col-span-8 bg-white dark:bg-[#111520] rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-2xl rounded-bl-2xl p-8 md:p-12 relative overflow-hidden group shadow-sm hover:shadow-[0_20px_50px_rgba(249,115,22,0.14)] dark:shadow-none border-t-4 border-orange-400 dark:border-orange-500 transition-all duration-500 flex flex-col justify-center min-h-[380px]">
            <span className="absolute top-6 right-8 text-[80px] font-black text-slate-900/[0.03] dark:text-white/[0.04] leading-none select-none pointer-events-none">01</span>
            <div className="relative z-20 max-w-md">
              <span className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-full mb-6">
                <Tag className="w-3 h-3" /> Mejor precio del mercado
              </span>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-4">
                Vendé tu auto hoy.<br />Efectivo inmediato.
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8">
                Efectivo en el acto, transferencia segura y 100% formal. Vendé tu unidad de forma directa y sin complicaciones ni intermediarios.
              </p>
              <Link
                href="/vender"
                className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95 group/btn"
              >
                Vender mi auto <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Imagen a sangre derecha — efectivo en mano, no un auto */}
            <div className="absolute right-0 bottom-0 w-full h-[50%] md:w-[45%] md:h-full z-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent via-white/85 dark:via-[#111520]/90 to-white dark:to-[#111520] z-10"></div>
              <Image
                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1000&auto=format&fit=crop"
                alt="Efectivo inmediato al vender tu auto"
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover object-center opacity-90 dark:opacity-50 group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>
          </div>

          {/* BANNER 2: SEGUROS (4 columnas - Vertical) — rojo */}
          <div className="md:col-span-4 bg-[#0a0a0f] rounded-tr-[2.5rem] rounded-bl-[2.5rem] rounded-tl-2xl rounded-br-2xl p-8 relative overflow-hidden group shadow-sm hover:shadow-[0_20px_50px_rgba(244,63,94,0.18)] border-t-4 border-red-500 transition-all duration-500 flex flex-col justify-end min-h-[380px]">
            <span className="absolute top-6 right-8 text-[80px] font-black text-white/[0.05] leading-none select-none pointer-events-none z-10">02</span>
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10"></div>
              <Image
                src="https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=800&auto=format&fit=crop"
                alt="Protección y cobertura de seguro"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>
            <div className="relative z-20">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/20">
                <ShieldCheck className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-2xl font-black text-white leading-tight mb-3">
                Asegurá tu auto <br />con La Caja.
              </h3>
              <p className="text-slate-400 font-medium text-xs leading-relaxed mb-6">
                Salí de la concesionaria 100% protegido. Cotizá la mejor cobertura.
              </p>
              <a
                href="https://www.lacaja.com.ar"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-200 text-slate-900 font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all active:scale-95"
              >
                Ver Coberturas <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* BANNER 3: CONSIGNAR (Horizontal Full - 12 columnas) — verde */}
          <div className="md:col-span-12 bg-emerald-600 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group shadow-lg shadow-emerald-500/20 transition-all duration-500 flex flex-col justify-center min-h-[300px]">
            <span className="absolute top-6 right-8 text-[80px] font-black text-white/10 leading-none select-none pointer-events-none">03</span>
            <div className="relative z-20 max-w-xl">
              <span className="inline-flex items-center gap-1.5 bg-black/20 text-white font-black uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm border border-white/10">
                <Banknote className="w-3 h-3" /> Rentabilidad Garantizada
              </span>
              <h3 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
                Compramos o consignamos tu auto al instante.
              </h3>
              <p className="text-emerald-50 font-medium text-sm leading-relaxed mb-8 max-w-md">
                Dejanos tu vehículo en consignación para obtener la máxima rentabilidad, o te lo compramos en efectivo hoy mismo sin vueltas.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/consignacion"
                  className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 hover:bg-slate-100 font-black text-[10px] sm:text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all active:scale-95"
                >
                  Consignar Vehículo
                </Link>
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center gap-2 bg-black/20 text-white hover:bg-black/30 font-black text-[10px] sm:text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all backdrop-blur-sm border border-white/10 active:scale-95"
                >
                  Contactar Asesor
                </Link>
              </div>
            </div>

            {/* Imagen a sangre derecha — acuerdo/firma, no un auto */}
            <div className="absolute right-0 bottom-0 w-full h-[60%] md:w-[45%] md:h-full z-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent via-emerald-600/80 to-emerald-600 z-10"></div>
              <Image
                src="https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1000&auto=format&fit=crop"
                alt="Acuerdo de consignación"
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover object-center opacity-50 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}