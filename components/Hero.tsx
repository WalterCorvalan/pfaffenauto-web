"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // ================= DATOS DE LOS BANNERS (SUCURSALES) =================
  // Acá podés cambiar las imágenes por las reales de tus sucursales
const slides = [
    {
      id: "villa-de-mayo",
      nombre: "Villa de Mayo",
      etiqueta: "Casa Central",
      descripcion: "Descubrí nuestro mayor stock de vehículos seleccionados y 0KM.",
      imagen: "VDM.jpeg",
      enlace: "/sucursales/villa-de-mayo",
      posicion: "object-center", // <--- Clase Tailwind
    },
    {
      id: "olivos",
      nombre: "Olivos",
      etiqueta: "Sucursal Norte",
      descripcion: "Atención premium y financiación a medida en el corazón de Olivos.",
      imagen: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=2000&auto=format&fit=crop",
      enlace: "/sucursales/olivos",
      posicion: "object-center", // <--- Clase Tailwind
    },
    {
      id: "panamericana",
      nombre: "Panamericana",
      etiqueta: "Acceso Directo",
      descripcion: "La forma más rápida y cómoda de llegar a tu próximo auto.",
      imagen: "/pana.jpg",
      enlace: "/sucursales/panamericana",
      posicion: "object-top", // <--- Clase Tailwind (Ancla el cartel al techo)
    },
  ];

  // ================= LÓGICA DEL CARRUSEL (Autoplay) =================
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000); // Cambia de banner cada 5 segundos
    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <section id="inicio" className="relative w-full pt-28 md:pt-32 pb-8 bg-[#050505] flex flex-col items-center">
      
      {/* Contenedor principal del Carrusel (Estilo ML) */}
      <div className="w-full max-w-[95rem] mx-auto px-4 md:px-8">
        
        {/* ================= CARRUSEL DE IMÁGENES ================= */}
        <div className="relative w-full h-[280px] sm:h-[350px] md:h-[450px] lg:h-[500px] rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] group">
          
          {/* Pista deslizable */}
          <div
            className="flex w-full h-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div key={index} className="relative w-full h-full flex-shrink-0">
                {/* Imagen de fondo del banner */}
                <img
                  src={slide.imagen}
                  alt={`Sucursal ${slide.nombre}`}
                  className="w-full h-full object-cover object-center brightness-75"
                />
                
                {/* Degradado oscuro para que el texto resalte siempre */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

                {/* Textos del Banner (Programados para no usar Photoshop) */}
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-3xl">
                  <span className="inline-block bg-[#0055A4] text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-3 md:px-4 py-1.5 rounded-full mb-4 w-max shadow-lg">
                    {slide.etiqueta}
                  </span>
                  
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white uppercase tracking-tight mb-4 drop-shadow-lg">
                    {slide.nombre}
                  </h2>
                  
                  <p className="text-gray-300 text-xs sm:text-sm md:text-base font-medium mb-8 max-w-md drop-shadow">
                    {slide.descripcion}
                  </p>
                  
                  <Link
                    href={slide.enlace}
                    className="bg-white text-black hover:bg-gray-200 px-6 md:px-8 py-3 w-max rounded-full text-xs md:text-sm font-bold uppercase tracking-widest transition-colors shadow-xl flex items-center gap-2"
                  >
                    Ver Sucursal
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* ================= CONTROLES DEL CARRUSEL ================= */}
          {/* Botón Anterior */}
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          {/* Botón Siguiente */}
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Puntos de Paginación (Dots) abajo en el centro */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? "bg-[#0055A4] w-6" : "bg-white/50 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </div>

        {/* ================= BARRA DE INFORMACIÓN (Estilo "Envío Gratis" ML) ================= */}
        {/* Pegada justo debajo del banner, con un diseño limpio para destacar */}
        <div className="w-full max-w-5xl mx-auto mt-0 bg-white text-black py-3 md:py-3.5 px-4 rounded-b-2xl shadow-xl border-t-4 border-[#0055A4] flex items-center justify-center gap-3">
          <Clock className="w-5 h-5 text-[#0055A4]" />
          <span className="text-xs md:text-sm font-bold tracking-wide">
            Horarios de atención: <span className="text-[#0055A4]">Lunes a Viernes de 9 a 18 hs.</span>
          </span>
        </div>

      </div>
    </section>
  );
}