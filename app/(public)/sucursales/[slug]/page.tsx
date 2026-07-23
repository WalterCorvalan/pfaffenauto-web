import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Stock from "@/components/Stock";
import { MapPin, Phone, Clock, CalendarDays } from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export const revalidate = 60; // ISR para que cargue rápido

// En Next.js 15+, params es una promesa que debemos resolver
export default async function SucursalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 1. Buscamos la sucursal en la base de datos por su slug
  const { data: sucursal } = await supabase
    .from("sucursales")
    .select("*")
    .eq("slug", slug)
    .single();

  // Si alguien escribe mal la URL (ej: /sucursales/falsa), da error 404
  if (!sucursal) {
    notFound();
  }

  // 2. Buscamos SOLO los vehículos asignados a esta sucursal
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(`
      *,
      multimedia_vehiculos ( url_archivo ),
      sucursales ( nombre )
    `)
    .eq("sucursal_id", sucursal.id)
    .in("estado", ["Disponible", "Reservado"])
    .order("created_at", { ascending: false });

  // Imágenes de fondo dinámicas según la sucursal
  const bgImages: Record<string, string> = {
    "villa-de-mayo": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop",
    "olivos": "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=2000&auto=format&fit=crop",
    "panamericana": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2000&auto=format&fit=crop",
  };
  const heroImage = bgImages[slug] || bgImages["villa-de-mayo"];

  return (
    <div className="w-full bg-[#050505] min-h-screen flex flex-col">
      
      {/* ================= HERO ESPECÍFICO DE SUCURSAL ================= */}
      <section className="relative h-[60svh] min-h-[500px] w-full flex flex-col justify-end px-6 md:px-12 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt={`Sucursal ${sucursal.nombre}`}
            className="w-full h-full object-cover object-center brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent"></div>
        </div>

        <div className="relative z-20 max-w-[85rem] mx-auto w-full">
          <Link href="/#sucursales" className="inline-flex items-center gap-2 text-[#0145F2] hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors mb-6">
            &larr; Volver a Sucursales
          </Link>
          
          <h1 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tight drop-shadow-lg mb-4">
            Sucursal <span className="text-[#0145F2]">{sucursal.nombre}</span>
          </h1>
          
          {/* Info Rápida */}
          <div className="flex flex-wrap gap-4 md:gap-8 mt-6">
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[#0145F2]" />
              </div>
              <span className="text-xs font-medium tracking-wide">{sucursal.direccion || "Dirección no configurada"}</span>
            </div>
            
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-[#0145F2]" />
              </div>
              <span className="text-xs font-medium tracking-wide">{sucursal.telefono || "Teléfono no configurado"}</span>
            </div>

            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#0145F2]" />
              </div>
              <span className="text-xs font-medium tracking-wide">Lun a Sáb - 9:00 a 19:00hs</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CATÁLOGO DE LA SUCURSAL ================= */}
      {/* MAGIA: Reciclamos tu componente Stock, pasándole solo los autos de ESTA sucursal */}
      <div className="relative z-20 -mt-8">
        <Stock vehiculos={vehiculos} />
      </div>

    </div>
  );
}