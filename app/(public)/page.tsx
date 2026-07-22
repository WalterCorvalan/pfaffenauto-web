import { createClient } from "@supabase/supabase-js";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Sucursales from "@/components/Sucursales";
import Stock from "@/components/Stock";
import Location from "@/components/Location";
import Socials from "@/components/Socials";
import FAQ from "@/components/FAQ";

// Conexión a Supabase (modo lectura pública)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

// En lugar de revalidate = 0, haz esto para que la web vuele:
export const revalidate = 60; // Revalida la página automáticamente cada 60 segundos o cuando actualices un auto
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
    <div className="w-full text-white font-sans scroll-smooth">
      <Hero />
      <Stats />
      <Sucursales />
      
      {/* Le pasamos la data de Supabase al componente */}
      <Stock vehiculos={vehiculos} />
      
      <Location />
      <Socials />
      <FAQ />
    </div>
  );
}