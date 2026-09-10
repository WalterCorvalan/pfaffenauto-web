import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { CAMPOS_VEHICULO_PUBLICO } from "@/lib/vehiculos";
import VehiculosGrid from "@/components/VehiculosGrid";
import Link from "next/link";
import { MapPin, Phone, Clock, ArrowLeft } from "lucide-react";
// Importamos tu FadeIn por si lo necesitas después, aunque usaremos framer internamente
import FadeIn from "@/components/FadeIn"; 
// Importación crucial para permitir Framer Motion en Next.js App Router (Client Component Inline)
import SucursalHeroAnimated from "./SucursalHeroAnimated";
import type { Metadata } from "next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
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
  "don-torcuato": {
    imagen: "/pana.jpg",
    telefono: "11 57998065",
    direccion: "Don Torcuato, Buenos Aires",
    horario: "Lun a Sáb - 9:00 a 19:00hs",
  },
};

// Coordenadas reales, resueltas a mano desde el link corto de Google Maps de
// cada sucursal (sucursales.google_maps_url) -- no hay lat/long en la DB.
const GEO_SUCURSALES: Record<string, { latitude: number; longitude: number }> = {
  "casa-central": { latitude: -34.4889306, longitude: -58.6614257 },
  "don-torcuato": { latitude: -34.4840351, longitude: -58.619739 },
};

// Parsea "Calle 1234, C1614 Localidad, Provincia" en los campos de
// PostalAddress que pide schema.org -- las direcciones reales ya vienen en
// este formato consistente en la tabla sucursales.
function parseDireccion(direccion: string) {
  const partes = direccion.split(",").map((p) => p.trim());
  const streetAddress = partes[0] || direccion;
  const addressRegion = partes[partes.length - 1] || undefined;
  let postalCode: string | undefined;
  let addressLocality: string | undefined;
  if (partes.length >= 2) {
    const medio = partes[1];
    const m = medio.match(/^([A-Z]\d{4})\s+(.+)$/);
    if (m) {
      postalCode = m[1];
      addressLocality = m[2];
    } else {
      addressLocality = medio;
    }
  }
  return { streetAddress, addressLocality, addressRegion, postalCode };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: sucursal } = await supabase.from("sucursales").select("nombre, direccion").eq("slug", slug).single();
  const nombre = sucursal?.nombre || slug;
  return {
    title: `${nombre} | Sucursal Pfaffen Autos`,
    description: `Visitá nuestra sucursal ${nombre}${sucursal?.direccion ? ` en ${sucursal.direccion}` : ""}. Stock disponible, financiación y respaldo oficial.`,
    alternates: { canonical: `https://pfaffenautos.com.ar/sucursales/${slug}` },
  };
}

export default async function SucursalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: sucursal } = await supabase
    .from("sucursales")
    .select("id, nombre, direccion, telefono:telefono_encargado, slug, google_maps_url")
    .eq("slug", slug)
    .single();

  if (!sucursal) notFound();

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(CAMPOS_VEHICULO_PUBLICO)
    .eq("sucursal_id", sucursal.id)
    .in("estado", ["disponible", "reservado"])
    .order("created_at", { ascending: false });

  const fallback = FALLBACK_DATA[slug] || FALLBACK_DATA["casa-central"];

  const imagenFondo = fallback.imagen;
  const direccion = sucursal.direccion || fallback.direccion;
  const telefono = sucursal.telefono || fallback.telefono;
  const horario = fallback.horario;
  const nombreSucursal = sucursal.nombre;

  const { streetAddress, addressLocality, addressRegion, postalCode } = parseDireccion(direccion);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `https://pfaffenautos.com.ar/sucursales/${slug}`,
    name: `Pfaffen Autos ${nombreSucursal}`,
    url: `https://pfaffenautos.com.ar/sucursales/${slug}`,
    telephone: telefono,
    parentOrganization: { "@type": "Organization", name: "Pfaffen Autos", url: "https://pfaffenautos.com.ar" },
    address: {
      "@type": "PostalAddress",
      streetAddress,
      addressLocality,
      addressRegion,
      postalCode,
      addressCountry: "AR",
    },
    ...(sucursal.google_maps_url ? { hasMap: sucursal.google_maps_url } : {}),
    ...(GEO_SUCURSALES[slug] ? { geo: { "@type": "GeoCoordinates", ...GEO_SUCURSALES[slug] } } : {}),
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "19:00",
    },
  };

  return (
    <div className="w-full bg-[#f8f9fa] dark:bg-[#0a0a0f] min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SucursalHeroAnimated
        slug={slug}
        nombre={nombreSucursal}
        imagen={imagenFondo}
        direccion={direccion}
        telefono={telefono}
        horario={horario}
      />

      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 pt-10">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Stock disponible en esta sucursal</h2>
      </div>
      <VehiculosGrid vehiculos={vehiculos} />
    </div>
  );
}