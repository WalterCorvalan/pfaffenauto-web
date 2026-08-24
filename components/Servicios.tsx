"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Banknote, CarFront, Zap, Tag } from "lucide-react";

export default function Servicios() {
  return (
    <section className="py-16 md:py-24 bg-[#f8fafc] dark:bg-[#0a0a0f] border-t border-slate-200 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* ================= ENCABEZADO E-COMMERCE ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-[#0145F2] dark:text-sky-400 font-black uppercase tracking-widest text-[10px] mb-3">
              <Zap className="w-4 h-4" /> Soluciones integrales
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Más que comprar un auto.
            </h2>
          </div>
          <Link 
            href="/contacto" 
            className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0145F2] dark:hover:text-sky-400 transition-colors group"
          >
            Contactar asesor <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* ================= BENTO GRID PROMOCIONAL ================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* BANNER 1: VENDER (Destacado - 8 columnas) */}
          <div className="md:col-span-8 bg-white dark:bg-[#111520] rounded-[2rem] p-8 md:p-12 relative overflow-hidden group shadow-sm hover:shadow-xl dark:shadow-none border border-slate-200/80 dark:border-white/10 transition-all duration-500 flex flex-col justify-center min-h-[380px]">
            <div className="relative z-20 max-w-md">
              <span className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-full mb-6">
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
                className="inline-flex items-center justify-center gap-2 bg-[#0145F2] hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 group/btn"
              >
                Vender mi auto <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Imagen a sangre derecha */}
            <div className="absolute right-0 bottom-0 w-full h-[50%] md:w-[50%] md:h-full z-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent via-white/80 dark:via-[#111520]/90 to-white dark:to-[#111520] z-10"></div>
              <Image
                src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1000&auto=format&fit=crop"
                alt="Entrega de llaves al vender tu auto"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center opacity-90 dark:opacity-50 group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>
          </div>

          {/* BANNER 2: SEGUROS (4 columnas - Vertical) */}
          <div className="md:col-span-4 bg-[#0a0a0f] rounded-[2rem] p-8 relative overflow-hidden group shadow-sm border border-slate-800 transition-all duration-500 flex flex-col justify-end min-h-[380px]">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10"></div>
              <Image
                src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800&auto=format&fit=crop"
                alt="Seguros de auto"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>
            <div className="relative z-20">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/20">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
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

          {/* BANNER 3: CONSIGNAR (Horizontal Full - 12 columnas) */}
          <div className="md:col-span-12 bg-[#0145F2] rounded-[2rem] p-8 md:p-12 relative overflow-hidden group shadow-lg shadow-blue-500/20 transition-all duration-500 flex flex-col justify-center min-h-[300px]">
            <div className="relative z-20 max-w-xl">
              <span className="inline-flex items-center gap-1.5 bg-black/20 text-white font-black uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm border border-white/10">
                <Banknote className="w-3 h-3" /> Rentabilidad Garantizada
              </span>
              <h3 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
                Compramos o consignamos tu auto al instante.
              </h3>
              <p className="text-blue-100 font-medium text-sm leading-relaxed mb-8 max-w-md">
                Dejanos tu vehículo en consignación para obtener la máxima rentabilidad, o te lo compramos en efectivo hoy mismo sin vueltas.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link 
                  href="/consignacion" 
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#0145F2] hover:bg-slate-100 font-black text-[10px] sm:text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all active:scale-95"
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
            
            {/* Imagen a sangre derecha */}
            <div className="absolute right-0 bottom-0 w-full h-[60%] md:w-[50%] md:h-full z-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent via-[#0145F2]/80 to-[#0145F2] z-10"></div>
              <Image
                src="https://images.unsplash.com/photo-1494905998402-395d579af36f?q=80&w=1000&auto=format&fit=crop"
                alt="Lote de autos en consignación"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center opacity-40 mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}