import { Bebas_Neue } from "next/font/google";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"] });

export default function Hero() {
  return (
    <section id="inicio" className="relative h-[100svh] w-full flex flex-col justify-between items-center text-center px-4 pt-24 md:pt-32 pb-16 lg:pb-8 overflow-hidden bg-[#050505]">
      <div className="absolute top-0 left-0 w-full h-[100svh] z-0">
        <img src="/hero-bg.png" alt="Fondo Desktop" className="hidden md:block w-full h-full object-cover object-[center_100%]" />
        <img src="/hero-bg-mobile.png" alt="Fondo Mobile" className="block md:hidden w-full h-full object-cover object-bottom" />
        <div className="absolute top-0 left-0 w-full h-40 md:h-64 bg-gradient-to-b from-[#050505]/90 md:from-[#050505]/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-56 md:h-48 bg-gradient-to-t from-[#050505] via-[#050505]/80 md:via-[#050505]/0 to-transparent"></div>
      </div>

      <div className="relative z-20 w-full flex flex-col items-center justify-start mt-0 md:mt-4">
        <h1 className={`text-[3rem] leading-[0.85] sm:text-5xl md:text-6xl lg:text-[5.5rem] xl:text-[7rem] uppercase tracking-normal flex flex-col gap-1 md:gap-2 ${bebas.className}`}>
          <span className="text-white drop-shadow-lg">Tu próximo vehículo</span>
          <span className="text-[#0145F2] drop-shadow-[0_0_30px_rgba(1,69,242,0.8)]">Empieza acá.</span>
        </h1>
        <p className="mt-4 md:mt-5 text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] text-white lg:text-black drop-shadow-md">
          Usados Seleccionados y <span className="text-[#0145F2]">0 KM.</span>
        </p>
        <div className="my-4 lg:my-6 relative flex justify-center items-center w-full max-w-[200px] lg:max-w-[300px]">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#0145F2] to-transparent opacity-100"></div>
          <div className="absolute w-8 lg:w-12 h-[2px] bg-white rounded-full shadow-[0_0_20px_#0145F2]"></div>
        </div>
        <div className="font-serif">
          <p className="text-[10px] md:text-xs lg:text-sm uppercase tracking-[0.2em] lg:tracking-[0.3em] text-white lg:text-black mb-1 lg:mb-1.5 drop-shadow-md">
            La forma <span className="text-[#0145F2]">más confiable</span>
          </p>
          <p className="text-[10px] md:text-xs lg:text-sm uppercase tracking-[0.2em] lg:tracking-[0.3em] text-white lg:text-black drop-shadow-md">
            De comprar o vender tu auto
          </p>
        </div>
      </div>

      <div className="relative z-20 w-full max-w-5xl mt-auto mb-2 lg:mb-6 grid grid-cols-2 md:flex md:flex-wrap justify-center gap-y-8 gap-x-2 md:gap-x-8 lg:gap-x-14 px-2">
        {/* Aquí van los 5 enlaces minimalistas (Ver Stock, Cotizar Ahora, Comprar, Vender, Cambiar) */}
        {/* Pegá el bloque de los 5 <a> del Hero anterior para no hacer esto súper largo */}
      </div>

      <div className="relative z-20 animate-bounce text-white/40 hover:text-white transition-colors mt-4">
        <a href="#stock">
          <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
          </svg>
        </a>
      </div>
    </section>
  );
}