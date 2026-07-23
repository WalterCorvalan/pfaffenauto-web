import { createClient } from "@supabase/supabase-js";
import Stock from "@/components/Stock";
import { Tag, AlertCircle } from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export const revalidate = 60; 

export default async function OutletPage() {
  // ================= FETCH DE AUTOS OUTLET =================
  // ACÁ FILTRAMOS LOS AUTOS. 
  // Por ejemplo, acá estoy trayendo autos que cuesten MENOS de $10.000.000. 
  // (Si en tu base de datos tenés una columna "categoria" o "es_outlet", lo cambiamos).
const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(`
      *,
      multimedia_vehiculos ( url_archivo ),
      sucursales ( nombre )
    `)
    .in("estado", ["Disponible", "Reservado"])
    .not("precio_publicado_ars", "is", null) // Prevenir errores con nulos
    .lt("precio_publicado_ars", 10000000) 
    .order("created_at", { ascending: false });

  return (
    <div className="w-full bg-[#050505] min-h-screen flex flex-col">
      
      {/* ================= HERO DEL OUTLET ================= */}
      <section className="relative h-[55svh] min-h-[450px] w-full flex flex-col justify-end px-6 md:px-12 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2000&auto=format&fit=crop"
            alt="Pfaffen Outlet"
            className="w-full h-full object-cover object-center brightness-[0.4] grayscale-[30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent"></div>
        </div>

        <div className="relative z-20 max-w-[85rem] mx-auto w-full text-center md:text-left flex flex-col items-center md:items-start">
          
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors mb-6">
            &larr; Volver al Inicio
          </Link>

          <span className="flex items-center gap-2 bg-[#FBBF24] text-black text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-4">
            <Tag className="w-3.5 h-3.5" /> Oportunidades
          </span>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase text-white tracking-tight drop-shadow-lg mb-4">
            Outlet <span className="text-[#FBBF24]">Pfaffen</span>
          </h1>
          
          <p className="text-gray-300 text-sm md:text-base font-medium max-w-xl">
            Vehículos seleccionados a precios de liquidación. Ideales como primer auto, proyectos o herramienta de trabajo cotidiano.
          </p>
          
        </div>
      </section>

      {/* ================= BARRA DE AVISO ================= */}
      <div className="w-full bg-[#FBBF24] text-black py-3 px-4 flex items-center justify-center gap-3 relative z-30">
        <AlertCircle className="w-5 h-5" />
        <span className="text-xs md:text-sm font-bold tracking-wide uppercase">
          El stock del outlet se renueva constantemente y vuela rápido.
        </span>
      </div>

      {/* ================= CATÁLOGO (RECICLANDO COMPONENTE STOCK) ================= */}
      <div className="relative z-20 py-8">
        {/* Le inyectamos los vehículos filtrados a tu componente de siempre */}
        <Stock vehiculos={vehiculos} />
      </div>

    </div>
  );
}