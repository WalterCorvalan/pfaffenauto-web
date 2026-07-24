import { createClient } from "@/lib/supabase-server";
import Stock from "@/components/Stock";
import { Tag, AlertCircle } from "lucide-react";
import Link from "next/link";

export const revalidate = 60; 

export default async function OutletPage() {
  const supabase = await createClient();

  // ================= FETCH DE AUTOS OUTLET =================
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
    <div className="min-h-screen bg-background font-sans text-foreground pb-20">
      
      {/* ================= PORTADA DEL OUTLET (Header Claro) ================= */}
      <div className="relative w-full bg-gradient-to-b from-blue-50 to-white border-b border-gray-100 overflow-hidden pt-6 pb-12">
        {/* Círculo decorativo de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          {/* Migas de pan */}
          <div className="text-xs text-gray-500 font-medium mb-10">
            <Link href="/" className="hover:text-primary">Inicio</Link> /{" "}
            <strong className="text-navy">Outlet</strong>
          </div>

          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            
            <span className="flex items-center gap-2 bg-blue-100 text-blue-600 border border-blue-200 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 shadow-sm">
              <Tag className="w-3.5 h-3.5" /> Oportunidades Únicas
            </span>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-navy tracking-tight mb-4 uppercase">
              Outlet <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Pfaffen</span>
            </h1>
            
            <p className="text-sm md:text-base text-gray-500 font-medium mb-8 leading-relaxed">
              Vehículos seleccionados a precios de liquidación. Ideales como primer auto, proyectos o herramienta de trabajo cotidiano.
            </p>
          </div>
        </div>
      </div>

      {/* ================= BARRA DE AVISO SUTIL ================= */}
      <div className="w-full bg-blue-50/50 border-y border-blue-100 py-3 px-4 flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4 text-blue-500" />
        <span className="text-[11px] md:text-xs font-bold text-blue-700 tracking-widest uppercase">
          El stock del outlet se renueva constantemente y vuela rápido.
        </span>
      </div>

      {/* ================= CATÁLOGO ================= */}
      <div className="pt-8">
        {/* Reciclamos tu componente Stock, que ya está en modo claro y se adapta perfecto */}
        <Stock vehiculos={vehiculos} />
      </div>

    </div>
  );
}