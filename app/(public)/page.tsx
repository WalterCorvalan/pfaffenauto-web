import { createClient } from "@supabase/supabase-js";
import Hero from "@/components/Hero";
import Stock from "@/components/Stock";
import Location from "@/components/Location";
import FAQ from "@/components/FAQ";
import FadeIn from "@/components/FadeIn";
import Testimonials from "@/components/Testimonials";
import Marcas from "@/components/Marcas";
import OutletBanner from "@/components/banners/OutletBanner";
import ServiciosWobble from "@/components/ServiciosWobble";
import BannersPublicitarios from "@/components/banners/BannerPublicitario";
import BannerRRHH from "@/components/banners/BannerRRHH";
import BannerFinanciacion from "@/components/banners/BannerFinanciacion";
import AgendarCitaForm from "@/components/AgendarCitaForm";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

export const revalidate = 60; 

export default async function HomePage() {
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(
      `
        *,
        multimedia_vehiculos ( url_archivo ),
        sucursales ( nombre )
      `,
    )
    .in("estado", ["Disponible", "Reservado"])
    .order("created_at", { ascending: false });

  return (
    // Agregamos bg-[#E9ECEF] y min-h-screen al contenedor principal
    <main className="w-full bg-[#E9ECEF] min-h-screen">
      
      {/* Al Hero NO lo envolvemos con scroll porque ya está arriba de todo */}
      <Hero />

      <FadeIn direction="up">
        <BannersPublicitarios />
      </FadeIn>

      {/* Las demás secciones las envolvemos para que aparezcan suavemente */}
      <FadeIn direction="up">
        <Stock vehiculos={vehiculos} />
      </FadeIn>

      {/* 2. Colocalo acá para que rompa el esquema y llame la atención */}
      <FadeIn direction="up">
        <ServiciosWobble /> 
      </FadeIn>

      <FadeIn direction="up">
        <OutletBanner />
      </FadeIn>

      <FadeIn direction="up">
        <Marcas />
      </FadeIn>

      <FadeIn direction="up">
        <Testimonials />
      </FadeIn>

      <FadeIn direction="up">
        <AgendarCitaForm />
      </FadeIn>

      <FadeIn direction="up">
        <BannerFinanciacion /> 
      </FadeIn>
      
      <FadeIn direction="up">
        <Location />
      </FadeIn>

      <FadeIn direction="up">
        <BannerRRHH />
      </FadeIn>

      <FadeIn direction="up">
        <FAQ />
      </FadeIn>
      
    </main>
  );
}