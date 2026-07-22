import { Bebas_Neue } from "next/font/google";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"] });

export default function Stats() {
  return (
    <section className="bg-[#1b3a82] py-10 w-full border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 text-center flex flex-col items-center">
        <span className="text-white/70 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-3">Nuestros Números</span>
        <h2 className="text-2xl md:text-4xl font-black text-white mb-12 tracking-tight">Resultados que hablan solos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-4 w-full">
          <div className="flex flex-col items-center">
            <span className={`text-5xl md:text-7xl text-white mb-2 ${bebas.className}`}>1.247</span>
            <span className="text-[9px] md:text-[11px] text-white/80 font-medium uppercase tracking-widest">Autos Vendidos</span>
          </div>
          <div className="flex flex-col items-center">
            <span className={`text-5xl md:text-7xl text-white mb-2 ${bebas.className}`}>1.180</span>
            <span className="text-[9px] md:text-[11px] text-white/80 font-medium uppercase tracking-widest">Clientes Satisfechos</span>
          </div>
          <div className="flex flex-col items-center">
            <span className={`text-5xl md:text-7xl text-white mb-2 ${bebas.className}`}>15+</span>
            <span className="text-[9px] md:text-[11px] text-white/80 font-medium uppercase tracking-widest">Años de Trayectoria</span>
          </div>
          <div className="flex flex-col items-center">
            <span className={`text-5xl md:text-7xl text-white mb-2 ${bebas.className}`}>3</span>
            <span className="text-[9px] md:text-[11px] text-white/80 font-medium uppercase tracking-widest">Sucursales Activas</span>
          </div>
        </div>
      </div>
    </section>
  );
}