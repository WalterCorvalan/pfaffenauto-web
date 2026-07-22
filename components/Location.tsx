export default function Location() {
  return (
    <section className="py-24 bg-[#050505] border-t border-white/5 relative overflow-hidden">
      {/* Brillo de fondo sutil */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#0145F2]/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <div className="max-w-[90rem] mx-auto px-4 md:px-6 relative z-10">
        {/* Encabezado */}
        <div className="text-center mb-16">
          <span className="text-[#0145F2] text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-4 block drop-shadow-md">
            Infraestructura & Presencia
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter">
            Estamos Ubicados
          </h2>
        </div>

        {/* Grid de 3 Tarjetas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SUCURSAL 1: VILLA DE MAYO */}
          <div className="bg-[#09090b] rounded-[2.5rem] border border-white/5 hover:border-[#0145F2]/40 transition-all duration-500 overflow-hidden flex flex-col shadow-2xl hover:shadow-[0_0_40px_rgba(1,69,242,0.15)] group relative">
            {/* Mapa */}
            <div className="w-full h-[320px] relative overflow-hidden">
              <iframe
                src="https://maps.google.com/maps?q=Pfaffen+Autos,+Villa+de+Mayo,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es"
                className="w-full h-full border-0 group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                title="Mapa Villa de Mayo"
              ></iframe>
              {/* Sombra interna para integrar el mapa con la tarjeta */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent pointer-events-none"></div>
            </div>

            {/* Contenido */}
            <div className="px-8 pb-8 pt-2 flex flex-col flex-grow relative">
              <h3 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tight mb-1">
                Villa de Mayo
              </h3>
              <p className="text-[10px] text-[#0145F2] uppercase tracking-widest font-bold mb-8 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0145F2] animate-pulse"></span>
                Casa Central
              </p>

              <div className="flex-grow"></div>

              {/* Botones Modernos */}
              <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                <a
                  href="#stock"
                  className="group/btn relative overflow-hidden flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0145F2] to-[#002b99] text-white text-[10px] font-black uppercase tracking-widest py-4 px-2 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(1,69,242,0.3)] hover:shadow-[0_0_30px_rgba(1,69,242,0.6)] hover:-translate-y-1"
                >
                  <span>Ver Stock</span>
                  <svg
                    className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                    />
                  </svg>
                </a>
                <a
                  href="https://maps.app.goo.gl/4ZMmpWJCarHcZ2sb9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn relative flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-[#0145F2]/10 text-white text-[10px] font-black uppercase tracking-widest py-4 px-2 rounded-2xl border border-white/10 hover:border-[#0145F2]/50 transition-all duration-300 backdrop-blur-md hover:-translate-y-1"
                >
                  <span>Cómo Llegar</span>
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover/btn:text-[#0145F2] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* SUCURSAL 2: PANAMERICANA */}
          <div className="bg-[#09090b] rounded-[2.5rem] border border-white/5 hover:border-[#0145F2]/40 transition-all duration-500 overflow-hidden flex flex-col shadow-2xl hover:shadow-[0_0_40px_rgba(1,69,242,0.15)] group relative">
            {/* Mapa */}
            <div className="w-full h-[320px] relative overflow-hidden">
              <iframe
                src="https://maps.google.com/maps?q=Pfaffen+Autos,+Don+Torcuato,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es"
                className="w-full h-full border-0 group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                title="Mapa Panamericana"
              ></iframe>
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent pointer-events-none"></div>
            </div>

            {/* Contenido */}
            <div className="px-8 pb-8 pt-2 flex flex-col flex-grow relative">
              <h3 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tight mb-1">
                Panamericana
              </h3>
              <p className="text-[10px] text-[#0145F2] uppercase tracking-widest font-bold mb-8 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0145F2] animate-pulse"></span>
                Sucursal Panamericana
              </p>

              <div className="flex-grow"></div>

              {/* Botones Modernos */}
              <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                <a
                  href="#stock"
                  className="group/btn relative overflow-hidden flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0145F2] to-[#002b99] text-white text-[10px] font-black uppercase tracking-widest py-4 px-2 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(1,69,242,0.3)] hover:shadow-[0_0_30px_rgba(1,69,242,0.6)] hover:-translate-y-1"
                >
                  <span>Ver Stock</span>
                  <svg
                    className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                    />
                  </svg>
                </a>
                <a
                  href="https://maps.app.goo.gl/GuNBuUKT5xMFw5jR9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn relative flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-[#0145F2]/10 text-white text-[10px] font-black uppercase tracking-widest py-4 px-2 rounded-2xl border border-white/10 hover:border-[#0145F2]/50 transition-all duration-300 backdrop-blur-md hover:-translate-y-1"
                >
                  <span>Cómo Llegar</span>
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover/btn:text-[#0145F2] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* SUCURSAL 3: OLIVOS */}
          <div className="bg-[#09090b] rounded-[2.5rem] border border-white/5 hover:border-[#0145F2]/40 transition-all duration-500 overflow-hidden flex flex-col shadow-2xl hover:shadow-[0_0_40px_rgba(1,69,242,0.15)] group relative">
            {/* Mapa */}
            <div className="w-full h-[320px] relative overflow-hidden">
              <iframe
                src="https://maps.google.com/maps?q=Pfaffen+Autos,+Olivos,+Buenos+Aires&t=m&z=15&output=embed&iwloc=near&hl=es"
                className="w-full h-full border-0 group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                title="Mapa Olivos"
              ></iframe>
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent pointer-events-none"></div>
            </div>

            {/* Contenido */}
            <div className="px-8 pb-8 pt-2 flex flex-col flex-grow relative">
              <h3 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tight mb-1">
                Olivos
              </h3>
              <p className="text-[10px] text-[#0145F2] uppercase tracking-widest font-bold mb-8 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0145F2] animate-pulse"></span>
                Sucursal Olivos
              </p>

              <div className="flex-grow"></div>

              {/* Botones Modernos */}
              <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                <a
                  href="#stock"
                  className="group/btn relative overflow-hidden flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0145F2] to-[#002b99] text-white text-[10px] font-black uppercase tracking-widest py-4 px-2 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(1,69,242,0.3)] hover:shadow-[0_0_30px_rgba(1,69,242,0.6)] hover:-translate-y-1"
                >
                  <span>Ver Stock</span>
                  <svg
                    className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                    />
                  </svg>
                </a>
                <a
                  href="https://maps.app.goo.gl/3agMwsdC8hg7CT417"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn relative flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-[#0145F2]/10 text-white text-[10px] font-black uppercase tracking-widest py-4 px-2 rounded-2xl border border-white/10 hover:border-[#0145F2]/50 transition-all duration-300 backdrop-blur-md hover:-translate-y-1"
                >
                  <span>Cómo Llegar</span>
                  <svg
                    className="w-4 h-4 text-gray-400 group-hover/btn:text-[#0145F2] transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
