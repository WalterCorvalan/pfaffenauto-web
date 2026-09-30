import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { getBrandingSeo } from "@/lib/brandingSeo";

export async function generateMetadata(): Promise<Metadata> {
  const { nombre, zona } = await getBrandingSeo();
  return {
    title: `${nombre} | Concesionaria de 0KM y Usados en ${zona}`,
    description: `Comprá o vendé tu auto con la concesionaria líder de ${zona}. Stock de 0KM y usados seleccionados, financiación propia y respaldo oficial.`,
    alternates: { canonical: "https://www.pfaffencars.com" },
  };
}

// ================= COMPONENTES DE LA LANDING =================
import Hero from "@/components/Hero";
import IntroLoader from "@/components/IntroLoader";
import VentasRealizadas from "@/components/VentasRealizadas";
import Stock from "@/components/Stock";
import Marcas from "@/components/Marcas";
import Servicios from "@/components/Servicios";
import Location from "@/components/Location";
import BannerFinanciacion from "@/components/banners/BannerFinanciacion";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import AgendarCitaForm from "@/components/forms/AgendarCitaForm";
import Seguimiento from "@/components/Seguimiento";
import BannersPublicitarios from "@/components/banners/BannerPublicitario";

export const revalidate = 60;

import { CAMPOS_VEHICULO_PUBLICO, normalizarMarca } from "@/lib/vehiculos";
import BannerRRHH from "@/components/banners/BannerRRHH";

export default async function Page() {
  const supabase = await createClient();
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(CAMPOS_VEHICULO_PUBLICO)
    .in("estado", ["disponible", "reservado"])
    .order("created_at", { ascending: false });

  const marcasEnStock = [...new Set((vehiculos || []).map((v: any) => normalizarMarca(v.marca || "")))];

  const { data: entregas } = await supabase
    .from("entregas_realizadas")
    .select("id, tipo, src, titulo, link")
    .eq("activo", true)
    .order("orden", { ascending: true });

  const { data: sucursales } = await supabase
    .from("sucursales")
    .select("id, nombre, slug, direccion, google_maps_url, latitude, longitude")
    .order("nombre", { ascending: true });

  const { nombre: nombreMarca } = await getBrandingSeo();

  // Sin RLS pública sobre configuracion_empresa todavía -- se lee con
  // service role, igual que las redes del footer en (public)/layout.tsx.
  let heroContenido;
  let serviciosContenido;
  try {
    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
    const { data } = await admin
      .from("configuracion_empresa")
      .select("hero_video_url, hero_badge, hero_titulo_prefijo, hero_titulo_destacado, hero_subtitulo, servicios_b1_titulo, servicios_b1_texto, servicios_b1_imagen_url, servicios_b2_titulo, servicios_b2_texto, servicios_b2_boton_texto, servicios_b2_link_url, servicios_b2_imagen_url, servicios_b3_titulo, servicios_b3_texto, servicios_b3_imagen_url")
      .eq("id", true)
      .maybeSingle();
    if (data) {
      heroContenido = {
        videoUrl: data.hero_video_url,
        badge: data.hero_badge,
        tituloPrefijo: data.hero_titulo_prefijo,
        tituloDestacado: data.hero_titulo_destacado,
        subtitulo: data.hero_subtitulo,
      };
      serviciosContenido = {
        b1Titulo: data.servicios_b1_titulo,
        b1Texto: data.servicios_b1_texto,
        b1ImagenUrl: data.servicios_b1_imagen_url,
        b2Titulo: data.servicios_b2_titulo,
        b2Texto: data.servicios_b2_texto,
        b2BotonTexto: data.servicios_b2_boton_texto,
        b2LinkUrl: data.servicios_b2_link_url,
        b2ImagenUrl: data.servicios_b2_imagen_url,
        b3Titulo: data.servicios_b3_titulo,
        b3Texto: data.servicios_b3_texto,
        b3ImagenUrl: data.servicios_b3_imagen_url,
      };
    }
  } catch {
    heroContenido = undefined;
    serviciosContenido = undefined;
  }

  return (
    // Usamos el fondo claro premium que definimos para el resto de la web
    <main className="w-full bg-[#f8f9fa] dark:bg-[#0a0a0f] min-h-screen relative flex flex-col gap-0 pb-20">

      <IntroLoader />

      {/* 1. Hero Principal */}
      <Hero contenido={heroContenido} />

      {/* 2. Catálogo Destacado (Stock) — lo que la mayoría vino a buscar, justo
         después del Hero en vez de competir con un banner promocional primero */}
      <Stock vehiculos={vehiculos || []} />

      {/* 3. Banners de sucursales / promos */}
      <BannersPublicitarios />

      {/* 4. Marcas con las que trabajan */}
      <Marcas marcasEnStock={marcasEnStock} />

      {/* 5. Propuesta de Valor / Servicios */}
      <Servicios contenido={serviciosContenido} />

      {/* Seguimiento de compra: utilidad post-venta, no es lo primero que
         necesita un visitante nuevo — más abajo, cerca del cierre */}
      <div>
        <Seguimiento />
      </div>

      <AgendarCitaForm />

      {/* 6. Banner CTA de Financiación / Permutas */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6">
        <BannerFinanciacion linkAFinanciacion />
      </div>

      <Location sucursales={sucursales || []} nombreMarca={nombreMarca} />

      <VentasRealizadas items={entregas || []} />

      <BannerRRHH />

      {/* 7. Reseñas de Clientes */}
      <Testimonials />

      {/* 8. Preguntas Frecuentes */}
      <FAQ />
      
    </main>
  );
}