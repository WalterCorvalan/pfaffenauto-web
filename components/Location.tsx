import { MapPin, Navigation, Car } from "lucide-react";
import Link from "next/link";

export default function Location() {
  return (
    <section className="py-24 bg-[#dee2e6] border-gray-400 border-t relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        <div className="text-center mb-12">
          <span className="text-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-3 block">
            Dónde encontrarnos
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-navy tracking-tight">
            Nuestras <strong className="font-black">Sucursales</strong>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          
          {/* Casa Central */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 hover:border-primary/40 overflow-hidden flex flex-col transition-all duration-300 group shadow-sm">
            <div className="w-full h-[200px] relative">
              <iframe src="https://maps.google.com/maps?q=Pfaffen+Autos,+Villa+de+Mayo,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es" className="w-full h-full border-0 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" loading="lazy" title="Mapa Casa Central"></iframe>
            </div>
            <div className="p-1.5 flex flex-col flex-grow relative z-10">
              <h3 className="text-lg font-black text-navy uppercase tracking-tight mb-2">Casa Central</h3>
              <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium mb-5">
                <MapPin className="w-3.5 h-3.5" /> <span>Casa Central, Buenos Aires</span>
              </div>
              <div className="mt-auto flex gap-2">
                <Link href="/sucursales/casa-central" className="flex-1 bg-primary hover:bg-secondary text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                  <Car className="w-3.5 h-3.5" /> Stock
                </Link>
                <a href="https://maps.app.goo.gl/4ZMmpWJCarHcZ2sb9" target="_blank" rel="noopener noreferrer" className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-navy text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" /> Llegar
                </a>
              </div>
            </div>
          </div>

          {/* Don Torcuato */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 hover:border-primary/40 overflow-hidden flex flex-col transition-all duration-300 group shadow-sm">
            <div className="w-full h-[200px] relative">
              <iframe src="https://maps.google.com/maps?q=Pfaffen+Autos,+Don+Torcuato,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es" className="w-full h-full border-0 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" loading="lazy" title="Mapa Don Torcuato"></iframe>
            </div>
            <div className="p-1.5 flex flex-col flex-grow relative z-10">
              <h3 className="text-lg font-black text-navy uppercase tracking-tight mb-2">Don Torcuato</h3>
              <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium mb-5">
                <MapPin className="w-3.5 h-3.5" /> <span>Don Torcuato, Tigre</span>
              </div>
              <div className="mt-auto flex gap-2">
                <Link href="/sucursales/don-torcuato" className="flex-1 bg-primary hover:bg-secondary text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                  <Car className="w-3.5 h-3.5" /> Stock
                </Link>
                <a href="https://maps.app.goo.gl/GuNBuUKT5xMFw5jR9" target="_blank" rel="noopener noreferrer" className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-navy text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" /> Llegar
                </a>
              </div>
            </div>
          </div>

          {/* Olivos */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 hover:border-primary/40 overflow-hidden flex flex-col transition-all duration-300 group shadow-sm">
            <div className="w-full h-[200px] relative">
              <iframe src="https://maps.google.com/maps?q=Pfaffen+Autos+Olivos,+Av.+Maipu+4182,+Olivos&t=m&z=16&output=embed&iwloc=near&hl=es" className="w-full h-full border-0 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" loading="lazy" title="Mapa Olivos"></iframe>
            </div>
            <div className="p-1.5 flex flex-col flex-grow relative z-10">
              <h3 className="text-lg font-black text-navy uppercase tracking-tight mb-2">Olivos</h3>
              <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium mb-5">
                <MapPin className="w-3.5 h-3.5" /> <span>Olivos, Buenos Aires</span>
              </div>
              <div className="mt-auto flex gap-2">
                <Link href="/sucursales/olivos" className="flex-1 bg-primary hover:bg-secondary text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                  <Car className="w-3.5 h-3.5" /> Stock
                </Link>
                <a href="https://maps.app.goo.gl/LZCyj4v4mBHBt3uu5" target="_blank" rel="noopener noreferrer" className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-navy text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" /> Llegar
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}