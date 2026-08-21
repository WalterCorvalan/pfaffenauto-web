"use client";

import React from "react";
import { Timeline } from "@/components/ui/Timeline";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Users, Landmark } from "lucide-react";

const TEAM_MEMBERS = [
  {
    name: "Sergio Pfaffezeller",
    role: "Fundador y Director Ejecutivo",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop",
    color: "bg-slate-800", 
  },
  {
    name: "Gabriel",
    role: "Encargado de Sucursal Casa Central",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
    color: "bg-slate-800",
  },
];

export default function NosotrosClient() {
  const data = [
    {
      title: "2010",
      content: (
        <div className="group">
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            Los Inicios en Casa Central
          </h3>
          <p className="mb-8 text-sm md:text-base font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Pfaffen Autos abrió sus puertas en nuestra Casa Central con una visión clara impulsada por nuestro fundador, <strong className="text-slate-900 dark:text-white">Sergio Pfaffezeller</strong>: transformar la compra y venta de vehículos en una experiencia transparente, segura y humana.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="relative h-48 md:h-64 w-full rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm group-hover:shadow-xl transition-shadow duration-500">
              <Image src="/VDM.jpeg" alt="Sede Casa Central" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="relative h-48 md:h-64 w-full rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm group-hover:shadow-xl transition-shadow duration-500">
              <Image src="https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=1200&auto=format&fit=crop" alt="Primeros clientes" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-700 delay-75" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "2018",
      content: (
        <div className="group">
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            Expansión en Zona Norte
          </h3>
          <p className="mb-8 text-sm md:text-base font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Gracias a la confianza inquebrantable de nuestros clientes, inauguramos nuestra sucursal estratégica en <strong className="text-slate-900 dark:text-white">Don Torcuato</strong>. Esto nos consolidó como referentes absolutos en Zona Norte para la comercialización de vehículos 0KM y usados seleccionados de alta gama.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="relative h-48 md:h-64 w-full rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm group-hover:shadow-xl transition-shadow duration-500">
              <Image src="/pana.jpg" alt="Sucursal Don Torcuato" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Hoy",
      content: (
        <div className="group">
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            Revolución y Servicio Premium
          </h3>
          <p className="mb-8 text-sm md:text-base font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Integramos tecnología de punta para ofrecer <strong className="text-slate-900 dark:text-white">cotizaciones en el acto</strong>, un proceso de <strong className="text-slate-900 dark:text-white">consignación sin estrés</strong> y un catálogo 100% digitalizado. Mantenemos intacta la cercanía, el respaldo oficial y la pasión por los motores que nos caracteriza desde el día uno.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="relative h-48 md:h-64 w-full rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm group-hover:shadow-xl transition-shadow duration-500">
              <Image src="https://images.unsplash.com/photo-1619767886558-efeb9c0a149f?q=80&w=1200&auto=format&fit=crop" alt="Innovación Tecnológica" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="relative h-48 md:h-64 w-full rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm group-hover:shadow-xl transition-shadow duration-500">
              <Image src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop" alt="Autos de Alta Gama" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-700 delay-75" />
            </div>
          </div>
          
          <div className="mt-10">
            <Link 
              href="/catalogo" 
              className="inline-flex items-center gap-2 bg-[#0145F2] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              Conocé nuestro stock <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#030303] font-sans text-slate-900 dark:text-white relative overflow-hidden">

      {/* ================= MESH GRADIENT / LUCES AMBIENTALES ================= */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#0145F2]/10 dark:bg-sky-500/10 rounded-[100%] blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[600px] bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-[150px] pointer-events-none z-0 transform rotate-45" />

      {/* ================= HERO EXPANSIVO (ULTRA MODERNO) ================= */}
      <section className="relative z-10 pt-32 pb-16 px-4 md:px-6 flex flex-col items-center justify-center">
        
        {/* Etiqueta Superior Flotante */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-xl mb-8">
          <Landmark className="w-4 h-4 text-[#0145F2] dark:text-sky-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300">
            Nuestra Historia
          </span>
        </div>

        {/* Título Gigante */}
        <h1 className="text-5xl md:text-[80px] lg:text-[110px] font-black tracking-tighter text-center leading-[0.85] mb-8 text-slate-900 dark:text-white">
          CONOCÉ <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0145F2] via-sky-400 to-[#0145F2] dark:from-sky-400 dark:via-blue-500 dark:to-sky-400">
            PFAFFEN AUTOS
          </span>
        </h1>

        {/* Bajada */}
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-center text-sm md:text-base font-medium leading-relaxed mb-12">
          Desde nuestros primeros pasos hasta convertirnos en la concesionaria referente de Zona Norte. Pasión por los motores, transparencia y el cliente siempre en el centro.
        </p>

      </section>

      {/* ================= TIMELINE COMPONENT ================= */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 mb-24">
        {/* Al quitar el contenedor blanco del timeline, este se integra muchísimo mejor al fondo de la web */}
        <Timeline data={data} />
      </div>

      {/* ================= SECCIÓN: EQUIPO (EDITORIAL PREMIUM) ================= */}
      <section className="w-full bg-slate-900 dark:bg-[#0a0a0f] pt-24 pb-32 relative overflow-hidden rounded-t-[3rem] md:rounded-t-[4rem] border-t border-white/5">
        
        {/* Brillo sutil de fondo para el equipo */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0145F2]/20 dark:bg-sky-500/10 rounded-full blur-[140px] pointer-events-none z-0 translate-x-1/3 -translate-y-1/3" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="mb-16 text-center md:text-left">
            <span className="inline-flex items-center gap-2 text-sky-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              <Users className="w-4 h-4" /> Los rostros detrás de Pfaffen
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter max-w-2xl leading-[1.1]">
              Apasionados por los <br className="hidden md:block" /> motores y la excelencia.
            </h2>
          </div>

          {/* Grilla del Equipo (Retratos aspect-[3/4]) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name} className="flex flex-col group cursor-default">
                
                {/* Contenedor de la Imagen Editorial */}
                <div className={`w-full aspect-[3/4] rounded-[2rem] overflow-hidden mb-6 relative border border-white/10 shadow-2xl transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-[0_30px_60px_rgba(1,69,242,0.3)] ${member.color}`}>
                  
                  {/* Gradiente oscuro inferior (Viñeta) */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0a0f] to-transparent opacity-80 z-10 pointer-events-none" />
                  
                  {/* Imagen */}
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out relative z-0"
                  />
                  
                  {/* Textura sutil (Opcional, para ese look film) */}
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay z-20 pointer-events-none" />
                </div>

                {/* Textos del integrante */}
                <div className="px-2">
                  <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">
                    {member.name}
                  </h3>
                  <p className="text-sm font-medium text-sky-400 uppercase tracking-widest">
                    {member.role}
                  </p>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}