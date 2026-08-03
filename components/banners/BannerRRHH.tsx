"use client";

import React from "react";
import Link from "next/link";
import { Users, Briefcase, ArrowRight } from "lucide-react";

export default function BannerRRHH() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden bg-[#0b1329] border-t border-slate-800">
      {/* Luces de fondo (Efecto espacial corporativo) */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#0145F2]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-sky-400/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
        
        {/* TEXTOS */}
        <div className="flex-1 text-center md:text-left">
          <span className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            <Users className="w-3.5 h-3.5" /> Recursos Humanos
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-md mb-3">
            Unite a nuestro <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-[#0145F2]">equipo</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium max-w-lg mx-auto md:mx-0">
            Estamos en constante crecimiento y buscamos talentos apasionados por la industria automotriz. Si querés ser parte de Pfaffen Autos, dejanos tus datos.
          </p>
        </div>

        {/* BOTÓN DE REDIRECCIÓN A LA LANDING PAGE */}
        <div className="shrink-0 w-full md:w-auto">
          <Link 
            href="/trabaja-con-nosotros"
            className="w-full md:w-auto bg-white hover:bg-slate-100 text-navy font-black text-xs md:text-sm uppercase tracking-widest px-8 py-5 rounded-2xl transition-all shadow-[0_8px_25px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3 active:scale-95 group"
          >
            <Briefcase className="w-5 h-5 text-[#0145F2]" />
            Postularme Ahora
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-navy group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
        
      </div>
    </section>
  );
}