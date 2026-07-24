import { createClient } from "@supabase/supabase-js";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Sucursales from "@/components/Sucursales";
import Stock from "@/components/Stock";
import Location from "@/components/Location";
import Socials from "@/components/Socials";
import FAQ from "@/components/FAQ";
import FadeIn from "@/components/FadeIn";
import Testimonials from "@/components/Testimonials";
import Marcas from "@/components/Marcas";

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
    // Reemplazamos el div por <main> y quitamos overflow-x-hidden y text-white
    <main className="w-full">
      
      {/* Al Hero NO lo envolvemos con scroll porque ya está arriba de todo */}
      <Hero />

      <FadeIn direction="up">
        <Sucursales />
      </FadeIn>

      {/* Las demás secciones las envolvemos para que aparezcan suavemente */}
      <FadeIn direction="up">
        <Stock vehiculos={vehiculos} />
      </FadeIn>

      <FadeIn direction="up">
        <Stats />
      </FadeIn>

      <FadeIn direction="up">
        <Marcas />
      </FadeIn>

      <FadeIn direction="up">
        <Testimonials />
      </FadeIn>
      
      <FadeIn direction="up">
        <Location />
      </FadeIn>

      <FadeIn direction="up">
        <Socials />
      </FadeIn>

      <FadeIn direction="up">
        <FAQ />
      </FadeIn>
      
    </main>
  );
}