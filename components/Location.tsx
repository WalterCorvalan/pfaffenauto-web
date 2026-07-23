import { MapPin, Navigation, Car } from "lucide-react";
import Link from "next/link";

export default function Location() {
  return (
    <section className="py-24 bg-[#050505] border-t border-white/5 relative overflow-hidden">
      <div className="max-w-[85rem] mx-auto px-6 relative z-10">
        
        {/* Encabezado */}
        <div className="text-center mb-12">
          <span className="text-[#0145F2] text-[10px] font-bold uppercase tracking-[0.3em] mb-3 block">
            Dónde encontrarnos
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
            Nuestras Sucursales
          </h2>
        </div>

        {/* Grid de 3 Tarjetas con Mapa Integrado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          
          {/* ================= SUCURSAL 1: VILLA DE MAYO ================= */}
          <div className="bg-[#0A0F16] rounded-lg border border-white/10 hover:border-[#0145F2]/40 overflow-hidden flex flex-col transition-all duration-300 group shadow-lg">
            
            {/* Mapa - Altura reducida */}
            <div className="w-full h-[180px] relative">
              <iframe
                src="https://maps.google.com/maps?q=Pfaffen+Autos,+Villa+de+Mayo,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es"
                className="w-full h-full border-0 group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                title="Mapa Villa de Mayo"
              ></iframe>
              {/* Sutil degradado interior */}
              <div className="absolute inset-0 via-transparent to-transparent pointer-events-none"></div>
            </div>

            {/* Info Minimalista - Padding y márgenes reducidos */}
            <div className="p-4 md:p-5 flex flex-col flex-grow relative z-10">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  Villa de Mayo
                </h3>
                <span className="bg-[#0145F2] w-1.5 h-1.5 rounded-full animate-pulse"></span>
              </div>
              
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-5">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                <span>Villa de Mayo, Buenos Aires</span>
              </div>

              {/* Botones de Acción - Más cuadrados y compactos */}
              <div className="mt-auto flex gap-2">
                <Link 
                  href="/sucursales/villa-de-mayo" 
                  className="flex-1 bg-[#0145F2] hover:bg-[#1E6FD9] text-white text-[9px] font-bold uppercase tracking-widest py-2.5 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Car className="w-3.5 h-3.5" /> STOCK
                </Link>
                <a 
                  href="https://maps.app.goo.gl/4ZMmpWJCarHcZ2sb9" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#12161f] hover:bg-white/10 border border-white/5 text-white text-[9px] font-bold uppercase tracking-widest py-2.5 rounded-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" /> LLEGAR
                </a>
              </div>
            </div>
          </div>

          {/* ================= SUCURSAL 2: OLIVOS ================= */}
          <div className="bg-[#0A0F16] rounded-lg border border-white/10 hover:border-[#0145F2]/40 overflow-hidden flex flex-col transition-all duration-300 group shadow-lg">
            
            {/* Mapa */}
            <div className="w-full h-[180px] relative">
              <iframe
                src="https://maps.google.com/maps?q=Pfaffen+Autos,+Olivos,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es"
                className="w-full h-full border-0 group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                title="Mapa Olivos"
              ></iframe>
              <div className="absolute inset-0 via-transparent to-transparent pointer-events-none"></div>
            </div>

            {/* Info Minimalista */}
            <div className="p-4 md:p-5 flex flex-col flex-grow relative z-10">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  Olivos
                </h3>
                <span className="bg-[#0145F2] w-1.5 h-1.5 rounded-full animate-pulse"></span>
              </div>
              
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-5">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                <span>Olivos, Buenos Aires</span>
              </div>

              {/* Botones de Acción */}
              <div className="mt-auto flex gap-2">
                <Link 
                  href="/sucursales/olivos" 
                  className="flex-1 bg-[#0145F2] hover:bg-[#1E6FD9] text-white text-[9px] font-bold uppercase tracking-widest py-2.5 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Car className="w-3.5 h-3.5" /> STOCK
                </Link>
                <a 
                  href="https://maps.app.goo.gl/LZCyj4v4mBHBt3uu5" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#12161f] hover:bg-white/10 border border-white/5 text-white text-[9px] font-bold uppercase tracking-widest py-2.5 rounded-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" /> LLEGAR
                </a>
              </div>
            </div>
          </div>

          {/* ================= SUCURSAL 3: PANAMERICANA ================= */}
          <div className="bg-[#0A0F16] rounded-lg border border-white/10 hover:border-[#0145F2]/40 overflow-hidden flex flex-col transition-all duration-300 group shadow-lg">
            
            {/* Mapa */}
            <div className="w-full h-[180px] relative">
              <iframe
                src="https://maps.google.com/maps?q=Pfaffen+Autos,+Don+Torcuato,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es"
                className="w-full h-full border-0 group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                title="Mapa Panamericana"
              ></iframe>
              <div className="absolute inset-0 via-transparent to-transparent pointer-events-none"></div>
            </div>

            {/* Info Minimalista */}
            <div className="p-4 md:p-5 flex flex-col flex-grow relative z-10">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  Panamericana
                </h3>
                <span className="bg-[#0145F2] w-1.5 h-1.5 rounded-full animate-pulse"></span>
              </div>
              
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-5">
                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                <span>Panamericana Km 28</span>
              </div>

              {/* Botones de Acción */}
              <div className="mt-auto flex gap-2">
                <Link 
                  href="/sucursales/panamericana" 
                  className="flex-1 bg-[#0145F2] hover:bg-[#1E6FD9] text-white text-[9px] font-bold uppercase tracking-widest py-2.5 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Car className="w-3.5 h-3.5" /> STOCK
                </Link>
                <a 
                  href="https://maps.app.goo.gl/GuNBuUKT5xMFw5jR9" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#12161f] hover:bg-white/10 border border-white/5 text-white text-[9px] font-bold uppercase tracking-widest py-2.5 rounded-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" /> LLEGAR
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}