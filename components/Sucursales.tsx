import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";

export default function Sucursales() {
  const sucursales = [
    {
      id: "villa-de-mayo",
      titulo: "VILLA DE MAYO",
      subtitulo: "AUTOS 0KM",
      telefono: "11 37564398",
      direccion: "Villa de Mayo, Buenos Aires",
      img: "/VDM.jpeg"
    },
    {
      id: "olivos",
      titulo: "OLIVOS",
      subtitulo: "ALTA GAMA",
      telefono: "11 56520726",
      direccion: "Olivos, Buenos Aires",
      img: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1200&auto=format&fit=crop" 
    },
    {
      id: "panamericana",
      titulo: "PANAMERICANA",
      subtitulo: "USADOS Y SEMINUEVOS",
      telefono: "11 57998065",
      direccion: "Panamericana R202",
      img: "/pana.jpg"
    }
  ];

  return (
    <section id="sucursales" className="w-full bg-background pt-8 pb-4">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* ================= ENCABEZADO ================= */}
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl md:text-2xl font-light text-navy tracking-tight">
            Nuestras <strong className="font-black">sucursales</strong>
          </h2>
          <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1 animate-pulse">
            {/* Magia Responsive: Cambia el texto según la pantalla */}
            <span className="hidden sm:inline">Deslizá para ver más</span>
            <span className="inline sm:hidden">Deslizá</span>
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4"/>
          </span>
        </div>

        {/* ================= CARRUSEL DE BANNERS ================= */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {sucursales.map((s) => (
            <Link 
              href={`/sucursales/${s.id}`} 
              key={s.id} 
              className="relative w-[90vw] md:w-full max-w-[100%] flex-none snap-center rounded-2xl md:rounded-3xl overflow-hidden group bg-[#111111] block aspect-[1/1] sm:aspect-[16/9] md:aspect-[21/6] shadow-xl"
            >
              
              {/* IMAGEN DE FONDO */}
              <img 
                src={s.img} 
                alt={s.titulo} 
                className="absolute inset-0 w-full h-full object-cover opacity-60 md:opacity-90 md:w-[65%] md:left-auto md:right-0 transition-transform duration-1000 group-hover:scale-105" 
              />

              {/* DEGRADADOS */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent md:hidden"></div>
              <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#111111] via-[#111111]/90 to-transparent w-[75%]"></div>

              {/* CONTENIDO DEL BANNER */}
              <div className="absolute inset-0 p-4 sm:p-5 md:p-10 flex flex-col justify-between z-10 w-full h-full">
                
                {/* Logo Superior Derecho */}
                <div className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2 opacity-70">
                   <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                     <span className="text-white text-[10px] font-black">P</span>
                   </div>
                   <span className="text-white text-[10px] md:text-xs font-black uppercase tracking-widest hidden md:block">Pfaffen</span>
                </div>

                {/* Texto Principal (Izquierda) */}
                <div className="mt-auto md:mt-0 max-w-lg">
                  <h3 className="text-2xl sm:text-3xl md:text-5xl lg:text-[56px] font-black text-white uppercase leading-[0.95] tracking-tighter mb-2 md:mb-3 shadow-black/50 drop-shadow-lg">
                    SUCURSAL <br/> 
                    {s.titulo}.
                  </h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-300 font-bold uppercase tracking-wider flex items-center gap-1.5 md:gap-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-white" /> {s.direccion}
                  </p>
                </div>

                {/* Bloque Inferior: Caja de Precio/Teléfono ajustada a celus */}
                <div className="flex justify-start items-end mt-4 sm:mt-6">
                  <div className="border-[2px] border-white/90 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-md bg-black/30 group-hover:bg-white group-hover:border-white transition-all duration-300 w-fit">
                    
                    <span className="block text-white group-hover:text-black font-black italic tracking-widest text-[9px] md:text-xs uppercase mb-0.5">
                      {s.subtitulo}
                    </span>
                    
                    {/* Contenedor del número (whitespace-nowrap evita que el número se rompa en dos líneas) */}
                    <div className="flex items-end gap-1 sm:gap-1.5 text-white group-hover:text-black leading-none whitespace-nowrap">
                       <span className="font-black text-xs sm:text-sm md:text-lg mb-0.5">TEL</span>
                       {/* Tamaños escalonados: 19px (celus chicos) -> 24px (tablets) -> 36px (PC) */}
                       <span className="font-black text-[19px] sm:text-2xl md:text-4xl tracking-tighter">
                         {s.telefono}
                       </span>
                    </div>

                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}