import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Stock from "@/components/Stock";
import { MapPin, Phone, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export const revalidate = 60; // ISR para que cargue rápido

// ================= DICCIONARIO DE DATOS REALES =================
const FALLBACK_DATA: Record<string, { imagen: string; telefono: string; direccion: string; horario: string }> = {
  "villa-de-mayo": {
    imagen: "/VDM.jpeg",
    telefono: "11 37564398",
    direccion: "Villa de Mayo, Buenos Aires",
    horario: "Lun a Sáb - 9:00 a 19:00hs"
  },
  "olivos": {
    imagen: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1200&auto=format&fit=crop",
    telefono: "11 56520726",
    direccion: "Olivos, Buenos Aires",
    horario: "Lun a Sáb - 9:00 a 19:00hs"
  },
  "panamericana": {
    imagen: "/pana.jpg",
    telefono: "11 57998065",
    direccion: "Panamericana R202",
    horario: "Lun a Sáb - 9:00 a 19:00hs"
  }
};

export default async function SucursalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 1. Buscamos la sucursal en la base de datos por su slug
  const { data: sucursal } = await supabase
    .from("sucursales")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!sucursal) {
    notFound();
  }

  // 2. Buscamos SOLO los vehículos asignados a esta sucursal (sucursal_id)
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

  // 3. Mezclamos la info de Supabase con nuestro Diccionario Seguro
  const fallback = FALLBACK_DATA[slug] || FALLBACK_DATA["villa-de-mayo"];
  
  const imagenFondo = sucursal.imagen_url || fallback.imagen;
  const direccion = sucursal.direccion || fallback.direccion;
  const telefono = sucursal.telefono || fallback.telefono;
  const horario = sucursal.horarios || fallback.horario;

  const nombreSucursal = sucursal.nombre.toUpperCase();

  return (
    <div className="w-full bg-[#050505] min-h-screen flex flex-col">
      
      {/* ================= HERO ESPECÍFICO DE SUCURSAL ================= */}
      <section className="relative h-[65vh] min-h-[500px] w-full flex flex-col justify-center px-6 md:px-12 pb-16 overflow-hidden bg-black">
        
        {/* Imagen de Fondo (Ahora se ve brillante y clara) */}
        <div className="absolute inset-0 z-0">
          <img
            src={imagenFondo}
            alt={`Sucursal ${sucursal.nombre}`}
            className="w-full h-full object-cover object-center opacity-90"
          />
          {/* Degradado lateral: Oscuro a la izquierda (para leer el texto), transparente a la derecha (para ver la foto) */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent"></div>
          
          {/* Degradado sutil abajo para que conecte bien con el fondo blanco de los autos */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/20"></div>
        </div>

        {/* Contenido */}
        <div className="relative z-20 max-w-7xl mx-auto w-full mt-10">
          
          <Link href="/#sucursales" className="inline-flex items-center gap-2 text-[#0145F2] hover:text-blue-400 text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors mb-6 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 w-fit">
            <ArrowLeft className="w-4 h-4" /> Volver a Sucursales
          </Link>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase text-white tracking-tight drop-shadow-xl mb-8 leading-none">
            SUCURSAL <br className="hidden md:block" />
            <span className="text-[#0145F2] drop-shadow-md">{nombreSucursal}</span>
          </h1>
          
          {/* Lista de Info Rápida */}
          <div className="flex flex-col gap-5 mt-4 max-w-md">
            
            <div className="flex items-center gap-4 text-gray-200 hover:text-white transition-colors bg-black/10 backdrop-blur-sm p-2 rounded-2xl border border-white/5 w-fit pr-6">
              <div className="w-10 h-10 rounded-full bg-[#0145F2]/20 border border-[#0145F2]/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(1,69,242,0.3)]">
                <MapPin className="w-4 h-4 text-[#0145F2]" />
              </div>
              <span className="text-sm font-bold tracking-wide drop-shadow-md">{direccion}</span>
            </div>
            
            <div className="flex items-center gap-4 text-gray-200 hover:text-white transition-colors bg-black/10 backdrop-blur-sm p-2 rounded-2xl border border-white/5 w-fit pr-6">
              <div className="w-10 h-10 rounded-full bg-[#0145F2]/20 border border-[#0145F2]/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(1,69,242,0.3)]">
                <Phone className="w-4 h-4 text-[#0145F2]" />
              </div>
              <span className="text-sm font-bold tracking-wide drop-shadow-md">{telefono}</span>
            </div>

            <div className="flex items-center gap-4 text-gray-200 hover:text-white transition-colors bg-black/10 backdrop-blur-sm p-2 rounded-2xl border border-white/5 w-fit pr-6">
              <div className="w-10 h-10 rounded-full bg-[#0145F2]/20 border border-[#0145F2]/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(1,69,242,0.3)]">
                <Clock className="w-4 h-4 text-[#0145F2]" />
              </div>
              <span className="text-sm font-bold tracking-wide drop-shadow-md">{horario}</span>
            </div>

          </div>
        </div>
      </section>

      {/* ================= CATÁLOGO DE LA SUCURSAL ================= */}
      <div className="relative z-30 -mt-10 bg-background rounded-t-[2.5rem] pt-6 overflow-hidden">
        <Stock vehiculos={vehiculos} />
      </div>

    </div>
  );
}