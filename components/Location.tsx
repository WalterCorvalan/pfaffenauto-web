import { MapPin, Navigation, Car } from "lucide-react";
import Link from "next/link";

export default function Location() {
  return (
    <section className="py-24 bg-[#050505] border-t border-white/5 relative overflow-hidden">
      <div className="max-w-[85rem] mx-auto px-6 relative z-10">
        
        {/* Encabezado */}
        <div className="text-center mb-16">
          <span className="text-[#0145F2] text-[10px] font-bold uppercase tracking-[0.3em] mb-3 block">
            Dónde encontrarnos
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
            Nuestras Sucursales
          </h2>
        </div>

        {/* Grid de 3 Tarjetas con Mapa Integrado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          
          {/* ================= SUCURSAL 1: VILLA DE MAYO ================= */}
          <div className="bg-[#0A0F16] rounded-2xl border border-white/10 hover:border-[#0145F2]/40 overflow-hidden flex flex-col transition-all duration-300 group shadow-lg">
            
            {/* Mapa - AHORA A TODO COLOR */}
            <div className="w-full h-[240px] relative">
              <iframe
                src="https://maps.google.com/maps?q=Pfaffen+Autos,+Villa+de+Mayo,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es"
                className="w-full h-full border-0 group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                title="Mapa Villa de Mayo"
              ></iframe>
              {/* Degradado para transición suave al texto */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F16] via-[#0A0F16]/20 to-transparent pointer-events-none"></div>
            </div>

            {/* Info Minimalista */}
            <div className="p-6 md:p-8 flex flex-col flex-grow -mt-4 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  Villa de Mayo
                </h3>
                <span className="bg-[#0145F2] w-2 h-2 rounded-full animate-pulse"></span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-8">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>Villa de Mayo, Buenos Aires</span>
              </div>

              {/* Botones de Acción */}
              <div className="mt-auto flex gap-3">
                <Link 
                  href="/sucursales/villa-de-mayo" 
                  className="flex-1 bg-[#0145F2] hover:bg-[#1E6FD9] text-white text-[10px] font-bold uppercase tracking-widest py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <Car className="w-4 h-4" /> STOCK
                </Link>
                <a 
                  href="https://maps.app.goo.gl/4ZMmpWJCarHcZ2sb9" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#12161f] hover:bg-white/10 border border-white/5 text-white text-[10px] font-bold uppercase tracking-widest py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" /> LLEGAR
                </a>
              </div>
            </div>
          </div>

          {/* ================= SUCURSAL 2: OLIVOS ================= */}
          <div className="bg-[#0A0F16] rounded-2xl border border-white/10 hover:border-[#0145F2]/40 overflow-hidden flex flex-col transition-all duration-300 group shadow-lg">
            
            {/* Mapa */}
            <div className="w-full h-[240px] relative">
              <iframe
                src="https://maps.google.com/maps?q=Pfaffen+Autos,+Olivos,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es"
                className="w-full h-full border-0 group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                title="Mapa Olivos"
              ></iframe>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F16] via-[#0A0F16]/20 to-transparent pointer-events-none"></div>
            </div>

            {/* Info Minimalista */}
            <div className="p-6 md:p-8 flex flex-col flex-grow -mt-4 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  Olivos
                </h3>
                <span className="bg-[#0145F2] w-2 h-2 rounded-full animate-pulse"></span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-8">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>Olivos, Buenos Aires</span>
              </div>

              {/* Botones de Acción */}
              <div className="mt-auto flex gap-3">
                <Link 
                  href="/sucursales/olivos" 
                  className="flex-1 bg-[#0145F2] hover:bg-[#1E6FD9] text-white text-[10px] font-bold uppercase tracking-widest py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <Car className="w-4 h-4" /> STOCK
                </Link>
                <a 
                  href="https://maps.app.goo.gl/3agMwsdC8hg7CT417" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#12161f] hover:bg-white/10 border border-white/5 text-white text-[10px] font-bold uppercase tracking-widest py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" /> LLEGAR
                </a>
              </div>
            </div>
          </div>

          {/* ================= SUCURSAL 3: PANAMERICANA ================= */}
          <div className="bg-[#0A0F16] rounded-2xl border border-white/10 hover:border-[#0145F2]/40 overflow-hidden flex flex-col transition-all duration-300 group shadow-lg">
            
            {/* Mapa */}
            <div className="w-full h-[240px] relative">
              <iframe
                src="https://maps.google.com/maps?q=Pfaffen+Autos,+Don+Torcuato,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es"
                className="w-full h-full border-0 group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                title="Mapa Panamericana"
              ></iframe>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F16] via-[#0A0F16]/20 to-transparent pointer-events-none"></div>
            </div>

            {/* Info Minimalista */}
            <div className="p-6 md:p-8 flex flex-col flex-grow -mt-4 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  Panamericana
                </h3>
                <span className="bg-[#0145F2] w-2 h-2 rounded-full animate-pulse"></span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-8">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>Panamericana Km 28</span>
              </div>

              {/* Botones de Acción */}
              <div className="mt-auto flex gap-3">
                <Link 
                  href="/sucursales/panamericana" 
                  className="flex-1 bg-[#0145F2] hover:bg-[#1E6FD9] text-white text-[10px] font-bold uppercase tracking-widest py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <Car className="w-4 h-4" /> STOCK
                </Link>
                <a 
                  href="https://maps.app.goo.gl/GuNBuUKT5xMFw5jR9" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#12161f] hover:bg-white/10 border border-white/5 text-white text-[10px] font-bold uppercase tracking-widest py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" /> LLEGAR
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}