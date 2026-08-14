"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, ArrowUpRight, Building2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Sucursales() {
  const sucursales = [
    {
      id: "casa-central",
      titulo: "CASA CENTRAL",
      subtitulo: "AUTOS 0KM",
      telefono: "11 37564398",
      direccion: "Casa Central, Buenos Aires",
      img: "/VDM.jpeg",
      destacado: true, // Ocupará un espacio visual principal
    },
    {
      id: "don-torcuato",
      titulo: "DON TORCUATO",
      subtitulo: "USADOS Y SEMINUEVOS",
      telefono: "11 57998065",
      direccion: "Don Torcuato, Buenos Aires",
      img: "/pana.jpg",
      destacado: false,
    },
  ];

  return (
    <section id="sucursales" className="w-full bg-[#f8f9fa] py-12 md:py-20 relative overflow-hidden">
      
      {/* Elementos ambientales de fondo (Spatial UI) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* ================= ENCABEZADO MINIMALISTA ================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#0145F2]/10 text-[#0145F2] text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-3 border border-[#0145F2]/20">
              <Building2 className="w-3.5 h-3.5" /> Puntos de Venta
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-[#0f293e] tracking-tighter">
              Nuestras <span className="text-[#0145F2]">sucursales</span>
            </h2>
          </div>
          <p className="text-slate-500 text-xs md:text-sm max-w-sm font-medium leading-relaxed">
            Visitá nuestros salones exclusivos en Buenos Aires y recibí asesoramiento personalizado de nuestros especialistas.
          </p>
        </div>

        {/* ================= GRILLA BENTO MODERNA ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {sucursales.map((sucursal, index) => (
            <motion.div
              key={sucursal.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="group relative h-[420px] lg:h-[460px] rounded-[32px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-slate-200/80 bg-white flex flex-col justify-end transition-all duration-500 hover:shadow-[0_20px_50px_rgba(1,69,242,0.15)] hover:-translate-y-1.5"
            >
              <Link href={`/sucursales/${sucursal.id}`} className="absolute inset-0 z-20 focus:outline-none">
                <span className="sr-only">Ver sucursal {sucursal.titulo}</span>
              </Link>

              {/* IMAGEN DE FONDO CON ZOOM EN HOVER */}
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src={sucursal.img}
                  alt={sucursal.titulo}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                {/* Degradado cinematográfico para asegurar legibilidad */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/95 via-[#050505]/40 to-transparent transition-opacity duration-300"></div>
              </div>

              {/* ETIQUETA SUPERIOR (Subtítulo / Especialidad) */}
              <div className="absolute top-5 left-5 z-10">
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-white/30 shadow-sm">
                  {sucursal.subtitulo}
                </span>
              </div>

              {/* BOTÓN FLOTANTE SUPERIOR DERECHO (Flecha interactiva) */}
              <div className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-[#0145F2] group-hover:border-[#0145F2] transition-all duration-300">
                <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>

              {/* INFORMACIÓN INFERIOR */}
              <div className="relative z-10 p-6 md:p-8 flex flex-col justify-end text-white">
                
                <h3 className="text-2xl lg:text-3xl font-black uppercase tracking-tight mb-2 drop-shadow-md">
                  {sucursal.titulo}
                </h3>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">{sucursal.direccion}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="tracking-wide font-mono">{sucursal.telefono}</span>
                  </div>
                </div>

                {/* ACCIÓN / BARRA INFERIOR DE TARJETA */}
                <div className="pt-4 border-t border-white/15 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-widest text-sky-300 group-hover:text-white transition-colors">
                    Ver salón y stock
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-navy transition-all">
                    <span className="text-xs font-bold">→</span>
                  </div>
                </div>

              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}