"use client";

import React from "react";
import Link from "next/link";
import { Users, Briefcase, ArrowRight } from "lucide-react";

export default function BannerRRHH() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-[#0A0F1C] border-t border-slate-800">
      
      {/* Luces de fondo (Efecto espacial corporativo sutil) */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-[#0145F2]/10 rounded-full blur-[140px] pointer-events-none"></div>
      
      {/* Grilla técnica de fondo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16">
        
        {/* TEXTOS */}
        <div className="flex-1 text-center md:text-left">
          <span className="inline-flex items-center gap-2 bg-[#0145F2]/20 border border-[#0145F2]/30 text-sky-400 text-[10px] md:text-xs font-black uppercase tracking-[0.15em] px-4 py-1.5 rounded-full mb-6">
            <Users className="w-3.5 h-3.5" /> Recursos Humanos
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Unite a nuestro <br className="hidden lg:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-[#0145F2]">equipo de expertos.</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium max-w-lg mx-auto md:mx-0 leading-relaxed">
            Estamos en constante crecimiento y buscamos talentos apasionados por la industria automotriz. Si querés potenciar tu carrera, dejanos tus datos.
          </p>
        </div>

        {/* BOTÓN DE REDIRECCIÓN A LA LANDING PAGE */}
        <div className="shrink-0 w-full md:w-auto">
          <Link 
            href="/trabaja-con-nosotros"
            className="group relative flex items-center justify-center gap-3 w-full md:w-auto bg-white text-navy font-black text-xs md:text-sm uppercase tracking-widest px-8 py-5 rounded-2xl transition-all shadow-[0_8px_30px_rgba(255,255,255,0.1)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.2)] hover:-translate-y-1 active:scale-95 overflow-hidden"
          >
            {/* Brillo dinámico en hover */}
            <span className="absolute inset-0 w-[150%] h-full bg-gradient-to-r from-transparent via-slate-100 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]"></span>
            
            <Briefcase className="w-5 h-5 text-[#0145F2] relative z-10" />
            <span className="relative z-10">Postularme Ahora</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-navy group-hover:translate-x-1 transition-all relative z-10" />
          </Link>
        </div>
        
      </div>
    </section>
  );
}