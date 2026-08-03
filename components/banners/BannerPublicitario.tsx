"use client";

import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function BannersPublicitarios() {
  const banners = [
    {
      id: 1,
      titulo: "El auto que buscás, más cerca de lo que pensás",
      subtitulo: "Más de 50 unidades certificadas",
      cta: "Ver Catálogo",
      href: "/catalogo",
      // Azul corporativo vibrante
      bgColor: "bg-gradient-to-br from-[#0145F2] to-blue-600",
      // Imagen de cliente feliz / vendedor
      imgSrc: "https://images.unsplash.com/photo-1619551734325-81aaf323686c?q=80&w=800&auto=format&fit=crop",
      // Corte diagonal tipo "/" (más ancho arriba, entra hacia la izquierda abajo)
      clipPath: "polygon(0 0, 100% 0, 100% 100%, 20% 100%)"
    },
    {
      id: 2,
      titulo: "Con nuestros planes, pagalo a tu medida",
      subtitulo: "Elegí entre múltiples opciones de financiación",
      cta: "Ver opciones",
      href: "/financiacion",
      // Azul oscuro / Ejecutivo
      bgColor: "bg-gradient-to-br from-slate-900 to-[#0b1329]",
      // Imagen de showroom / hombre en estacionamiento
      imgSrc: "https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=800&auto=format&fit=crop",
      // Corte diagonal tipo "\" (entra hacia la izquierda arriba, más ancho abajo)
      clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0% 100%)"
    },
    {
      id: 3,
      titulo: "Descubrí el precio de tu auto hoy",
      subtitulo: "Hacelo rápido, 100% online y seguro",
      cta: "Cotizar auto",
      href: "/cotizador",
      // Azul intermedio / Royal Blue
      bgColor: "bg-gradient-to-br from-sky-700 to-[#0145F2]",
      // Imagen de auto limpio / moderno
      imgSrc: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=800&auto=format&fit=crop",
      // Corte diagonal tipo "/"
      clipPath: "polygon(0 0, 100% 0, 100% 100%, 15% 100%)"
    }
  ];

  return (
    <section className="py-12 bg-transparent relative z-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {banners.map((banner) => (
            <Link
              key={banner.id}
              href={banner.href}
              className={`relative h-[200px] sm:h-[220px] rounded-[24px] overflow-hidden flex group transition-all duration-500 shadow-lg hover:shadow-2xl hover:-translate-y-1 ${banner.bgColor}`}
            >
              {/* === LADO IZQUIERDO: TEXTO Y BOTÓN === */}
              <div className="relative z-10 w-[55%] p-5 sm:p-6 flex flex-col justify-center h-full">
                <h3 className="text-white font-black text-base sm:text-lg lg:text-[1.15rem] leading-tight drop-shadow-md">
                  {banner.titulo}
                </h3>
                <p className="text-white/80 text-[10px] sm:text-xs mt-2 font-medium">
                  {banner.subtitulo}
                </p>
                
                <div className="mt-auto flex items-center gap-2 text-white text-[11px] sm:text-xs font-bold transition-all duration-300 group-hover:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white transition-colors duration-300 shadow-inner">
                    {/* Al hacer hover, el ícono cambia al color de fondo de la tarjeta para resaltar */}
                    <Plus className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-white ${banner.id === 2 ? 'group-hover:text-slate-900' : 'group-hover:text-[#0145F2]'}`} />
                  </div>
                  <span className="drop-shadow-sm group-hover:opacity-90">{banner.cta}</span>
                </div>
              </div>

              {/* === LADO DERECHO: IMAGEN CORTADA === */}
              <div 
                className="absolute top-0 right-0 w-[60%] h-full z-0 overflow-hidden bg-slate-200"
                style={{ clipPath: banner.clipPath }}
              >
                {/* Degradado oscuro sutil para que la imagen no pelee con el texto en pantallas chicas */}
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/20 z-10 mix-blend-multiply"></div>
                
                <img 
                  src={banner.imgSrc} 
                  alt={banner.titulo} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}