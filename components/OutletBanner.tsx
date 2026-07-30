import { ArrowRight, Tag, Zap } from "lucide-react";
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
    <section className="w-full bg-[#dee2e6] border-gray-400 py-10 md:py-16 px-4 md:px-6">
      
      {/* Contenedor Principal (Banner Oscuro/Promocional) */}
      <div className="max-w-7xl mx-auto bg-navy rounded-[2rem] p-6 md:p-10 relative overflow-hidden shadow-xl border border-navy/80">
        
        {/* Decoración de fondo: resplandor azul corporativo */}
        <div className="absolute top-1/2 right-0 md:right-10 w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none -translate-y-1/2"></div>
        {/* Patrón sutil para textura tecnológica */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          
          {/* Textos Izquierda */}
          <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-4 md:mb-6">
              <Zap className="w-3 h-3 text-primary fill-primary animate-pulse" />
              <span className="text-primary text-[10px] md:text-xs font-bold tracking-widest uppercase">
                Liquidación de Stock
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
              <h2 className="text-3xl md:text-5xl lg:text-[56px] font-black text-white leading-[1] tracking-tighter uppercase">
                Outlet
              </h2>
              {/* LOGO PFAFFEN INYECTADO */}
              <div className="relative flex items-center shrink-0 mt-1 sm:mt-0">
                <img
                  src="/logo.png"
                  alt="Pfaffen Autos"
                  className="h-7 sm:h-9 md:h-12 w-auto invert brightness-0"
                />
                <img
                  src="/r.png"
                  alt="Marca Registrada"
                  className="absolute -top-1 -right-3 md:-right-4 w-2.5 h-2.5 md:w-3.5 md:h-3.5 object-contain invert brightness-0 opacity-80"
                />
              </div>
            </div>
            
            <p className="text-gray-300 text-sm md:text-base font-medium max-w-lg mb-0 leading-relaxed mx-auto md:mx-0">
              Vehículos seleccionados a precios súper accesibles. Ideales como primer auto, herramienta de trabajo o proyecto.
            </p>
          </div>

          {/* Bloque Derecha (Estadísticas y Botón) */}
          <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-6 shrink-0">
            
            {/* Cajas de Info */}
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-center md:justify-end">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center min-w-[120px]">
                <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  -{25}%
                </span>
                <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 text-center">
                  Por debajo del<br/>mercado
                </span>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center min-w-[120px]">
                <span className="text-2xl md:text-3xl font-black text-primary tracking-tight">
                  {outletCount || "+10"}
                </span>
                <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 text-center">
                  Unidades<br/>Disponibles
                </span>
              </div>
            </div>

            {/* Botón CTA */}
            <Link 
              href="/outlet" 
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-[#0145F2] hover:from-[#0145F2] hover:to-navy text-white font-bold text-xs md:text-sm uppercase tracking-widest px-8 py-4 md:py-5 rounded-2xl transition-all shadow-[0_4px_20px_rgba(14,165,233,0.3)] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(1,69,242,0.4)]"
            >
              Ver autos del outlet <ArrowRight className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
            </Link>

          </div>
          
        </div>
      </div>
    </section>
  );
}