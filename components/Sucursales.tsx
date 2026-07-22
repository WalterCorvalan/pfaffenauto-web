import Link from "next/link";

export default function Sucursales() {
  return (
    <section id="sucursales" className="py-16 bg-[#0A0F16]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* Título simplificado sin textos extra */}
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-10 tracking-tight">
          Nuestras Sucursales
        </h2>

        {/* Grid de Tarjetas (3 Columnas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Tarjeta 1: Villa de Mayo */}
          <Link
            href="/sucursales/villa-de-mayo"
            className="relative h-[340px] rounded-[1.25rem] overflow-hidden group shadow-xl"
          >
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop"
              alt="Villa de Mayo"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F16] via-[#0A0F16]/70 to-[#0A0F16]/10 z-10 transition-opacity duration-500 group-hover:opacity-90"></div>

            <div className="absolute bottom-0 left-0 w-full p-6 z-20">
              <h3 className="text-[22px] font-bold text-white mb-5 tracking-tight group-hover:text-[#3b82f6] transition-colors">
                Villa de Mayo
              </h3>

              <div className="flex flex-col gap-3 text-[13px] text-gray-300 font-medium">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-[18px] h-[18px] text-gray-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                  </svg>
                  <span>Villa de Mayo, Buenos Aires</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-[18px] h-[18px] text-gray-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    ></path>
                  </svg>
                  <span>+54 11 4500-1200</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-[18px] h-[18px] text-gray-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>Lun–Sáb 9:00–19:00</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Tarjeta 2: Olivos */}
          <Link
            href="/sucursales/olivos"
            className="relative h-[340px] rounded-[1.25rem] overflow-hidden group shadow-xl"
          >
            <img
              src="https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=1000&auto=format&fit=crop"
              alt="Olivos"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F16] via-[#0A0F16]/70 to-[#0A0F16]/10 z-10 transition-opacity duration-500 group-hover:opacity-90"></div>

            <div className="absolute bottom-0 left-0 w-full p-6 z-20">
              <h3 className="text-[22px] font-bold text-white mb-5 tracking-tight group-hover:text-[#3b82f6] transition-colors">
                Olivos
              </h3>

              <div className="flex flex-col gap-3 text-[13px] text-gray-300 font-medium">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-[18px] h-[18px] text-gray-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                  </svg>
                  <span>Olivos, Buenos Aires</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-[18px] h-[18px] text-gray-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    ></path>
                  </svg>
                  <span>+54 11 4790-3300</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-[18px] h-[18px] text-gray-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>Lun–Sáb 9:00–18:30</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Tarjeta 3: Panamericana */}
          <Link
            href="/sucursales/panamericana"
            className="relative h-[340px] rounded-[1.25rem] overflow-hidden group shadow-xl"
          >
            <img
              src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop"
              alt="Panamericana"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F16] via-[#0A0F16]/70 to-[#0A0F16]/10 z-10 transition-opacity duration-500 group-hover:opacity-90"></div>

            <div className="absolute bottom-0 left-0 w-full p-6 z-20">
              <h3 className="text-[22px] font-bold text-white mb-5 tracking-tight group-hover:text-[#3b82f6] transition-colors">
                Panamericana
              </h3>

              <div className="flex flex-col gap-3 text-[13px] text-gray-300 font-medium">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-[18px] h-[18px] text-gray-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                  </svg>
                  <span>Panamericana km 28</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-[18px] h-[18px] text-gray-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    ></path>
                  </svg>
                  <span>+54 11 4716-5500</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-[18px] h-[18px] text-gray-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>Lun–Dom 9:00–20:00</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
