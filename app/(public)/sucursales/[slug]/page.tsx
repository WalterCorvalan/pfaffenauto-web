import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { CAMPOS_VEHICULO_PUBLICO } from "@/lib/vehiculos";
import VehiculosGrid from "@/components/VehiculosGrid";
// Importación crucial para permitir Framer Motion en Next.js App Router (Client Component Inline)
import SucursalHeroAnimated from "./SucursalHeroAnimated";
import Testimonials from "@/components/Testimonials";
import type { Metadata } from "next";
import { getBrandingSeo } from "@/lib/brandingSeo";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
);

export const revalidate = 60;

// Fallback genérico (no por-sucursal) para cuando una sucursal nueva todavía
// no tiene imagen/horario cargados en Configuración → Sucursales -- antes
// esto era un mapa hardcodeado por slug (FALLBACK_DATA/GEO_SUCURSALES) que
// solo cubría las 2 sucursales originales; una sucursal nueva cargada desde
// el panel usa sus propias columnas (imagen_url, horario_texto, etc.), y
// solo cae acá si todavía no las completaron.
const IMAGEN_GENERICA = "/logo.png";
const HORARIO_GENERICO = "Consultanos el horario de atención";

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
  const { data: sucursal } = await supabase.from("sucursales").select("nombre, direccion").eq("slug", slug).maybeSingle();
  const nombreSucursal = sucursal?.nombre || slug;
  const { nombre } = await getBrandingSeo();
  return {
    title: `${nombreSucursal} | Sucursal ${nombre}`,
    description: `Visitá nuestra sucursal ${nombreSucursal}${sucursal?.direccion ? ` en ${sucursal.direccion}` : ""}. Stock disponible, financiación y respaldo oficial.`,
    alternates: { canonical: `https://www.pfaffencars.com/sucursales/${slug}` },
  };
}

export default async function SucursalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: sucursal } = await supabase
    .from("sucursales")
    .select("id, nombre, direccion, telefono:telefono_encargado, slug, google_maps_url, imagen_url, horario_texto, horario_dia_desde, horario_dia_hasta, horario_hora_desde, horario_hora_hasta, horario2_dia_desde, horario2_dia_hasta, horario2_hora_desde, horario2_hora_hasta, latitude, longitude")
    .eq("slug", slug)
    .maybeSingle();

  if (!sucursal) notFound();

  const { nombre: nombreMarca } = await getBrandingSeo();

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(CAMPOS_VEHICULO_PUBLICO)
    .eq("sucursal_id", sucursal.id)
    .in("estado", ["disponible", "reservado"])
    .order("created_at", { ascending: false });

  const imagenFondo = sucursal.imagen_url || IMAGEN_GENERICA;
  const direccion = sucursal.direccion || "";
  const telefono = sucursal.telefono || "";
  const horario = sucursal.horario_texto || HORARIO_GENERICO;
  const nombreSucursal = sucursal.nombre;
  const horarioDiaDesde = sucursal.horario_dia_desde ?? 1;
  const horarioDiaHasta = sucursal.horario_dia_hasta ?? 6;
  const horarioHoraDesde = sucursal.horario_hora_desde ?? 9;
  const horarioHoraHasta = sucursal.horario_hora_hasta ?? 19;
  const horarioDiaDesde2 = sucursal.horario2_dia_desde ?? null;
  const horarioDiaHasta2 = sucursal.horario2_dia_hasta ?? null;
  const horarioHoraDesde2 = sucursal.horario2_hora_desde ?? null;
  const horarioHoraHasta2 = sucursal.horario2_hora_hasta ?? null;
  const tieneRango2 = horarioDiaDesde2 != null && horarioDiaHasta2 != null && horarioHoraDesde2 != null && horarioHoraHasta2 != null;

  const { streetAddress, addressLocality, addressRegion, postalCode } = parseDireccion(direccion);
  const DIAS_SCHEMA = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const formatearHora = (h: number) => `${String(Math.trunc(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
  const rangoSchema = (diaDesde: number, diaHasta: number, horaDesde: number, horaHasta: number) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: Array.from({ length: diaHasta - diaDesde + 1 }, (_, i) => DIAS_SCHEMA[diaDesde + i]),
    opens: formatearHora(horaDesde),
    closes: formatearHora(horaHasta),
  });
  const openingHoursSpecification = tieneRango2
    ? [rangoSchema(horarioDiaDesde, horarioDiaHasta, horarioHoraDesde, horarioHoraHasta), rangoSchema(horarioDiaDesde2!, horarioDiaHasta2!, horarioHoraDesde2!, horarioHoraHasta2!)]
    : rangoSchema(horarioDiaDesde, horarioDiaHasta, horarioHoraDesde, horarioHoraHasta);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `https://www.pfaffencars.com/sucursales/${slug}`,
    name: `${nombreMarca} ${nombreSucursal}`,
    url: `https://www.pfaffencars.com/sucursales/${slug}`,
    telephone: telefono,
    parentOrganization: { "@type": "Organization", name: nombreMarca, url: "https://www.pfaffencars.com" },
    address: {
      "@type": "PostalAddress",
      streetAddress,
      addressLocality,
      addressRegion,
      postalCode,
      addressCountry: "AR",
    },
    ...(sucursal.google_maps_url ? { hasMap: sucursal.google_maps_url } : {}),
    ...(sucursal.latitude != null && sucursal.longitude != null ? { geo: { "@type": "GeoCoordinates", latitude: sucursal.latitude, longitude: sucursal.longitude } } : {}),
    openingHoursSpecification,
  };

  return (
    <div className="w-full bg-[#f8f9fa] dark:bg-[#0a0a0f] min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <SucursalHeroAnimated
        nombre={nombreSucursal}
        imagen={imagenFondo}
        direccion={direccion}
        telefono={telefono}
        horario={horario}
        navLink={sucursal.google_maps_url}
        latitude={sucursal.latitude}
        longitude={sucursal.longitude}
        horarioDiaDesde={horarioDiaDesde}
        horarioDiaHasta={horarioDiaHasta}
        horarioHoraDesde={horarioHoraDesde}
        horarioHoraHasta={horarioHoraHasta}
        horarioDiaDesde2={horarioDiaDesde2}
        horarioDiaHasta2={horarioDiaHasta2}
        horarioHoraDesde2={horarioHoraDesde2}
        horarioHoraHasta2={horarioHoraHasta2}
      />

      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 pt-10">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Stock disponible en esta sucursal</h2>
      </div>
      <VehiculosGrid vehiculos={vehiculos} />
      <Testimonials sucursalSlug={slug} sucursalNombre={nombreSucursal} />
    </div>
  );
}