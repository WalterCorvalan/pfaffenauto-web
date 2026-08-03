import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export default async function OutletBanner() {
  const supabase = await createClient();

  // Contamos cuántos vehículos hay en el Outlet (menores a 10M) para mostrar el número real
  const { count: outletCount } = await supabase
    .from("vehiculos")
    .select("*", { count: "exact", head: true })
    .in("estado", ["Disponible", "Reservado"])
    .lt("precio_publicado_ars", 10000000);

  return (
    <section className="w-full bg-[#E9ECEF] py-10 md:py-16 px-4 md:px-6">
      
      {/* Contenedor Principal (Premium Card) */}
      <div className="max-w-7xl mx-auto relative group">
        <div className="bg-navy rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 border border-slate-800/50">
          
          {/* ================= FONDOS Y EFECTOS ================= */}
          {/* Grilla sutil tecnológica */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          {/* Brillo corporativo asimétrico */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0145F2]/15 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none z-0"></div>

          {/* ================= CONTENIDO IZQUIERDA ================= */}
          <div className="relative z-10 flex-1 flex flex-col items-center md:items-start text-center md:text-left">
            
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-4 h-4 text-[#0145F2] fill-[#0145F2]" />
              <span className="text-[#0145F2] text-[10px] md:text-xs font-black tracking-widest uppercase">
                Liquidación de Stock
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-sm">
                Outlet
              </h2>
              {/* LOGO PFAFFEN INYECTADO */}
              <div className="relative flex items-center mt-2 sm:mt-0">
                <img
                  src="/logo.png"
                  alt="Pfaffen Autos"
                  className="h-8 md:h-11 w-auto invert brightness-0 drop-shadow-sm"
                />
                <img
                  src="/r.png"
                  alt="Marca Registrada"
                  className="absolute -top-1 -right-3 md:-right-4 w-3 h-3 md:w-3.5 md:h-3.5 object-contain invert brightness-0 opacity-80"
                />
              </div>
            </div>
            
            <p className="text-gray-400 text-sm md:text-base font-medium max-w-lg mt-2 leading-relaxed">
              Unidades seleccionadas a precios imbatibles. Ideales como primer auto, herramienta de trabajo o proyecto personal.
            </p>
          </div>

          {/* ================= CONTENIDO DERECHA ================= */}
          <div className="relative z-10 flex flex-col items-center md:items-end gap-8 shrink-0 w-full md:w-auto">
            
            {/* Métricas Tipográficas Limpias */}
            <div className="flex items-center gap-8 md:gap-12 w-full justify-center md:justify-end">
              <div className="flex flex-col items-center md:items-end">
                <span className="text-3xl md:text-4xl font-black text-white tracking-tighter drop-shadow-sm">-25%</span>
                <span className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 text-center md:text-right">Por debajo del<br/>mercado</span>
              </div>
              
              <div className="w-px h-12 bg-white/10 hidden md:block"></div>
              
              <div className="flex flex-col items-center md:items-start">
                <span className="text-3xl md:text-4xl font-black text-[#0145F2] tracking-tighter drop-shadow-sm">{outletCount || "+10"}</span>
                <span className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 text-center md:text-left">Unidades<br/>Disponibles</span>
              </div>
            </div>

            {/* Botón Minimalista Premium */}
            <Link 
              href="/outlet" 
              className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md p-1.5 pr-6 rounded-full transition-all duration-300 w-full md:w-auto justify-center md:justify-start active:scale-95"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white text-navy flex items-center justify-center group-hover:bg-[#0145F2] group-hover:text-white transition-colors duration-300 shadow-sm">
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </div>
              <span className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-white">
                Ver autos del outlet
              </span>
            </Link>

          </div>
          
        </div>
      </div>
    </section>
  );
}