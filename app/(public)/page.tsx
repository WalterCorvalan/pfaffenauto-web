import { createClient } from "@/lib/supabase/server";

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

const CAMPOS_PUBLICOS = "id, marca, modelo, anio, kilometraje, tipo, segmento, estado, slug, precio_publicado_ars, precio_publicado_usd, multimedia_vehiculos ( url_archivo ), sucursales!vehiculos_sucursal_id_fkey ( nombre )";

export default async function Page() {
  const supabase = await createClient();
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(CAMPOS_PUBLICOS)
    .in("estado", ["Disponible", "Reservado"])
    .order("created_at", { ascending: false });

  return (
    // Usamos el fondo claro premium que definimos para el resto de la web
    <main className="w-full bg-[#f8f9fa] dark:bg-[#0a0a0f] min-h-screen relative flex flex-col gap-0 md:gap-20 pb-20">

      <IntroLoader />

      {/* 1. Hero Principal */}
      <Hero />

      {/* 3. Marcas con las que trabajan */}
      <BannersPublicitarios />

      {/* 2. Catálogo Destacado (Stock) */}
      <Stock vehiculos={vehiculos || []} />
      
      {/* 3. Marcas con las que trabajan */}
      <Marcas />
      
      {/* 4. Propuesta de Valor / Servicios */}
      <Servicios />
      
      {/* 5. Banner CTA de Financiación / Permutas */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6">
        <BannerFinanciacion />
      </div>

      <div>
        <Seguimiento />
      </div>
      
      {/* 7. Reseñas de Clientes */}
      <Testimonials />

      <VentasRealizadas />

      <Location />

      <AgendarCitaForm />
      
      {/* 8. Preguntas Frecuentes */}
      <FAQ />
      
    </main>
  );
}