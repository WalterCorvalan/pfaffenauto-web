import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export default async function Stats() {
  const supabase = await createClient();

  // 1. Obtener la base histórica de configuracion (Ej: si en años pasados vendieron 700)
  const { data: config } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "ventas_historicas")
    .maybeSingle();

  // Si no hay configuración, arrancamos de 700 como base visual
  const ventasBase = parseInt(config?.valor || "700", 10);

  // 2. Contar ventas reales registradas en tu sistema nuevo
  const { count: ventasNuevas } = await supabase
    .from("vehiculos")
    .select("*", { count: "exact", head: true })
    .eq("estado", "Vendido");

  const totalVentas = ventasBase + (ventasNuevas || 0);

  return (
    <section className="w-full bg-background py-12 md:py-20 px-4 md:px-6">
      
      {/* Contenedor Principal (Tarjeta Navy) */}
      <div className="max-w-4xl mx-auto bg-navy rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-2xl border border-navy/50">
        
        {/* Decoración de luz de fondo sutil */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="relative z-10">
          
          {/* Etiqueta Nuevo Servicio */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-secondary/30 bg-secondary/10 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
            <span className="text-secondary text-[10px] font-bold tracking-widest uppercase">
              Nuevo Servicio
            </span>
          </div>

          {/* Títulos */}
          <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.1] mb-4 tracking-tight">
            Negociamos<br />por vos<span className="text-secondary">.</span>
          </h2>
          
          <p className="text-gray-300 text-sm md:text-base font-medium max-w-lg mb-10 leading-relaxed">
            Pfaffen Autos vende vehículos todos los días. Vos comprás uno cada 5 años. Ponemos nuestra experiencia a tu favor.
          </p>

          {/* Cajas de Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col justify-center">
              <span className="text-2xl md:text-3xl font-black text-white tracking-tight">$3,5M</span>
              <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                Ahorro Promedio
              </span>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col justify-center">
              <span className="text-2xl md:text-3xl font-black text-white tracking-tight">35x</span>
              <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                Retorno del Servicio
              </span>
            </div>

            <div className="col-span-2 md:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col justify-center">
              {/* ¡Número dinámico desde Supabase! */}
              <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {totalVentas.toLocaleString("es-AR")}+
              </span>
              <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                Autos Gestionados
              </span>
            </div>
          </div>

          {/* Botón CTA conectado al Cotizador */}
          <Link 
            href="/cotizador" 
            className="w-full block text-center md:inline-flex md:w-auto items-center justify-center gap-2 bg-primary hover:bg-secondary text-white font-bold text-sm md:text-base uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(14,165,233,0.3)] hover:-translate-y-0.5"
          >
            Negocien por mí <ArrowRight className="w-5 h-5 inline-block" strokeWidth={2.5} />
          </Link>
          
        </div>
      </div>
    </section>
  );
}