import { ArrowRight, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase2/server";

export default async function OutletBanner() {
  const supabase = await createClient();

  // Contamos cuántos vehículos hay en el Outlet (menores a 10M) para mostrar el número real
  const { count: outletCount } = await supabase
    .from("vehiculos")
    .select("*", { count: "exact", head: true })
    .in("estado", ["disponible", "reservado"])
    .lt("precio_publicado_ars", 10000000);

  return (
    <section className="w-full bg-[#f5f5f5] py-12 md:py-16 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* ================= CONTENEDOR SÓLIDO (CLEAN COMMERCE) ================= */}
        <div className="bg-slate-900 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10 shadow-lg">
          
          {/* ================= CONTENIDO IZQUIERDA ================= */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
            
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-md">
                <Zap className="w-3.5 h-3.5 fill-white" /> Liquidación de Stock
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter uppercase leading-none">
                Outlet
              </h2>
              {/* LOGO PFAFFEN INYECTADO */}
              <div className="relative flex items-center mt-2 sm:mt-0">
                <Image
                  src="/logo.png"
                  alt="Pfaffen Autos"
                  width={668}
                  height={173}
                  className="h-8 md:h-11 w-auto invert brightness-0"
                />
                <Image
                  src="/r.png"
                  alt="Marca Registrada"
                  width={66}
                  height={66}
                  className="absolute -top-1 -right-3 md:-right-4 w-3 h-3 md:w-3.5 md:h-3.5 object-contain invert brightness-0 opacity-80"
                />
              </div>
            </div>
            
            <p className="text-slate-300 text-sm md:text-base font-medium max-w-lg mt-2 leading-relaxed">
              Vehiculos de segunda y tercera seleccion.
            </p>
          </div>

          {/* ================= CONTENIDO DERECHA (Métricas + Botón) ================= */}
          <div className="flex flex-col items-center md:items-end gap-8 shrink-0 w-full md:w-auto">
            
            {/* Métricas Tipográficas Limpias */}
            <div className="flex items-center gap-8 md:gap-12 w-full justify-center md:justify-end">
              <div className="flex flex-col items-center md:items-end">
                <span className="text-3xl md:text-4xl font-black text-white tracking-tighter">-25%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 text-center md:text-right">
                  Por debajo del<br />mercado
                </span>
              </div>
              
              <div className="w-px h-12 bg-slate-700 hidden md:block"></div>
              
              <div className="flex flex-col items-center md:items-start">
                <span className="text-3xl md:text-4xl font-black text-blue-500 tracking-tighter">
                  {outletCount || "+10"}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 text-center md:text-left">
                  Unidades<br />Disponibles
                </span>
              </div>
            </div>

            {/* Botón Sólido Clásico */}
            <Link 
              href="/outlet" 
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs md:text-sm w-full md:w-auto transition-colors active:scale-95"
            >
              Ver autos del outlet
              <ArrowRight className="w-4 h-4" />
            </Link>

          </div>
          
        </div>
      </div>
    </section>
  );
}