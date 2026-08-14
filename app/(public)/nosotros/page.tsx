"use client";

import React from "react";
import { Timeline } from "@/components/ui/Timeline";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Users } from "lucide-react";

const TEAM_MEMBERS = [
  {
    name: "Sergio Pfaffezeller",
    role: "Fundador y Director Ejecutivo",
    // Podés cambiar esta URL por la foto real de Sergio
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop",
    color: "bg-[#339AF0]", // Color de fondo si usan fotos con fondo transparente
  },
  {
    name: "Gabriel",
    role: "Encargado de Sucursal Casa Central",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop",
    color: "bg-[#845EF7]",
  },
];

export default function NosotrosPage() {
  const data = [
    {
      title: "2010",
      content: (
        <div>
          <h3 className="text-xl md:text-2xl font-black text-navy mb-2 tracking-tight">
            Los Inicios en Casa Central
          </h3>
          <p className="mb-6 text-sm font-medium text-gray-600 leading-relaxed max-w-2xl">
            Pfaffen Autos abrió sus puertas en nuestra Casa Central con una visión clara impulsada por nuestro fundador, <strong>Sergio Pfaffezeller</strong>: transformar la compra y venta de vehículos en una experiencia transparente, segura y humana.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <img
              src="/VDM.jpeg"
              alt="Sede Casa Central"
              className="h-40 w-full rounded-2xl object-cover shadow-[0_8px_30px_rgba(0,0,0,0.1)] md:h-52 lg:h-64 border border-white/50"
            />
            <img
              src="https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=1200&auto=format&fit=crop"
              alt="Primeros clientes"
              className="h-40 w-full rounded-2xl object-cover shadow-[0_8px_30px_rgba(0,0,0,0.1)] md:h-52 lg:h-64 border border-white/50"
            />
          </div>
        </div>
      ),
    },
    {
      title: "2018",
      content: (
        <div>
          <h3 className="text-xl md:text-2xl font-black text-navy mb-2 tracking-tight">
            Expansión en Zona Norte
          </h3>
          <p className="mb-6 text-sm font-medium text-gray-600 leading-relaxed max-w-2xl">
            Gracias a la confianza inquebrantable de nuestros clientes, inauguramos nuestra sucursal estratégica en <strong>Don Torcuato</strong>. Esto nos consolidó como referentes absolutos en Zona Norte para la comercialización de vehículos 0KM y usados seleccionados de alta gama.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <img
              src="/pana.jpg"
              alt="Sucursal Don Torcuato"
              className="h-40 w-full rounded-2xl object-cover shadow-[0_8px_30px_rgba(0,0,0,0.1)] md:h-52 lg:h-64 border border-white/50"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Hoy",
      content: (
        <div>
          <h3 className="text-xl md:text-2xl font-black text-navy mb-2 tracking-tight">
            Revolución y Servicio Premium
          </h3>
          <p className="mb-6 text-sm font-medium text-gray-600 leading-relaxed max-w-2xl">
            Integramos tecnología de punta para ofrecer <strong>cotizaciones en el acto</strong>, un proceso de <strong>consignación sin estrés</strong> y un catálogo 100% digitalizado. Mantenemos intacta la cercanía, el respaldo oficial y la pasión por los motores que nos caracteriza desde el día uno.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1619767886558-efeb9c0a149f?q=80&w=1200&auto=format&fit=crop"
              alt="Innovación Tecnológica"
              className="h-40 w-full rounded-2xl object-cover shadow-[0_8px_30px_rgba(0,0,0,0.1)] md:h-52 lg:h-64 border border-white/50"
            />
            <img
              src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop"
              alt="Autos de Alta Gama"
              className="h-40 w-full rounded-2xl object-cover shadow-[0_8px_30px_rgba(0,0,0,0.1)] md:h-52 lg:h-64 border border-white/50"
            />
          </div>
          
          <div className="mt-8">
            <Link 
              href="/catalogo" 
              className="inline-flex items-center gap-2 bg-[#0145F2] hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-full transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              Conocé nuestro stock <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-foreground relative overflow-hidden pb-0 pt-10">
      
      {/* ================= EFECTOS ESPACIALES SUPERIORES ================= */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#0145F2]/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-sky-300/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* ================= ENCABEZADO ================= */}
        <div className="text-center mb-10 pt-10">
          <span className="text-[#0145F2] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] bg-blue-50/50 backdrop-blur-md border border-blue-100/50 px-4 py-1.5 rounded-full inline-block shadow-sm mb-4">
            Nuestra Historia
          </span>
          <h1 className="text-4xl md:text-6xl font-light text-navy tracking-tighter drop-shadow-sm mb-4">
            Conocé <strong className="font-black text-transparent bg-clip-text bg-gradient-to-r from-navy to-[#0145F2]">Pfaffen Autos</strong>
          </h1>
          <p className="text-slate-500 text-sm md:text-base font-medium max-w-2xl mx-auto">
            Desde nuestros primeros pasos hasta convertirnos en la concesionaria referente de Zona Norte. Pasión por los motores, transparencia y el cliente siempre en el centro.
          </p>
        </div>

        {/* ================= TIMELINE COMPONENT ================= */}
        <div className="relative w-full overflow-clip bg-white/40 backdrop-blur-xl border border-white/60 rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.03)] p-4 md:p-8 mb-20">
          <Timeline data={data} />
        </div>
      </div>

      {/* ================= NUEVA SECCIÓN: EQUIPO (DISEÑO DARK) ================= */}
      <section className="w-full bg-[#121212] pt-24 pb-32 relative overflow-hidden rounded-t-[40px] md:rounded-t-[60px] border-t border-white/10 mt-12">
        {/* Luces sutiles en la sección oscura */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#0145F2]/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="mb-16">
            <span className="text-[#339AF0] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Los rostros detrás de Pfaffen
            </span>
            <h2 className="text-3xl md:text-5xl font-light text-white tracking-tighter max-w-2xl leading-tight">
              Somos un equipo de <strong className="font-black">apasionados por los motores y la excelencia.</strong>
            </h2>
          </div>

          {/* Grilla del Equipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name} className="flex flex-col group cursor-default">
                
                {/* Contenedor de la Imagen */}
                <div className={`w-full aspect-square rounded-[32px] overflow-hidden mb-6 relative border border-white/10 shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(1,69,242,0.2)] ${member.color}`}>
                  
                  {/* Gradiente oscuro inferior para que no quede plano */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 z-10 mix-blend-multiply"></div>
                  
                  {/* Imagen */}
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out relative z-0"
                  />
                  
                  {/* Textura sutil superpuesta (opcional, para dar el efecto de la imagen de referencia) */}
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-20 pointer-events-none"></div>
                </div>

                {/* Textos */}
                <div className="px-2">
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mb-1">
                    {member.name}
                  </h3>
                  <p className="text-sm font-medium text-slate-400">
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