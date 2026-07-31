import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Stock from "@/components/Stock";
import Link from "next/link";
import { MapPin, Phone, Clock, ArrowLeft } from "lucide-react";
// Importamos tu FadeIn por si lo necesitas después, aunque usaremos framer internamente
import FadeIn from "@/components/FadeIn"; 
// Importación crucial para permitir Framer Motion en Next.js App Router (Client Component Inline)
import SucursalHeroAnimated from "./SucursalHeroAnimated"; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

export const revalidate = 60;

const FALLBACK_DATA: Record<
  string,
  { imagen: string; telefono: string; direccion: string; horario: string }
> = {
  "casa-central": {
    imagen: "/VDM.jpeg",
    telefono: "11 37564398",
    direccion: "Casa Central, Buenos Aires",
    horario: "Lun a Sáb - 9:00 a 19:00hs",
  },
  "olivos": {
    imagen: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1200&auto=format&fit=crop",
    telefono: "11 56520726",
    direccion: "Olivos, Buenos Aires",
    horario: "Lun a Sáb - 9:00 a 19:00hs",
  },
  "don-torcuato": {
    imagen: "/pana.jpg",
    telefono: "11 57998065",
    direccion: "Don Torcuato, Buenos Aires",
    horario: "Lun a Sáb - 9:00 a 19:00hs",
  },
};

export default async function SucursalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: sucursal } = await supabase
    .from("sucursales")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!sucursal) notFound();

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(
      `
      *,
      multimedia_vehiculos ( url_archivo ),
      sucursales ( nombre )
    `,
    )
    .eq("sucursal_id", sucursal.id)
    .in("estado", ["Disponible", "Reservado"])
    .order("created_at", { ascending: false });

  const fallback = FALLBACK_DATA[slug] || FALLBACK_DATA["casa-central"];

  const imagenFondo = sucursal.imagen_url || fallback.imagen;
  const direccion = sucursal.direccion || fallback.direccion;
  const telefono = sucursal.telefono || fallback.telefono;
  const horario = sucursal.horarios || fallback.horario;
  const nombreSucursal = sucursal.nombre;

  return (
    <div className="w-full bg-[#E9ECEF] min-h-screen flex flex-col relative overflow-hidden">
      
      {/* Componente Cliente Interactivo con Framer Motion y Spatial UI */}
      <SucursalHeroAnimated 
        nombre={nombreSucursal} 
        imagen={imagenFondo} 
        direccion={direccion} 
        telefono={telefono} 
        horario={horario} 
      />

      {/* Transición al Catálogo - Se superpone elegantemente al Hero */}
      <div className="relative z-20 -mt-[100px] md:-mt-[140px] bg-[#E9ECEF] rounded-t-[40px] md:rounded-t-[60px] pt-12 overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.15)] border-t border-white/60">
        <Stock vehiculos={vehiculos} />
      </div>
    </div>
  );
}