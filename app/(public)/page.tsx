import { createClient } from "@/lib/supabase2/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pfaffen Autos | Concesionaria de 0KM y Usados en Zona Norte",
  description: "Comprá o vendé tu auto con la concesionaria líder de Zona Norte. Stock de 0KM y usados seleccionados, financiación propia y respaldo oficial.",
  alternates: { canonical: "https://pfaffenautos.com.ar" },
};

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

import { CAMPOS_VEHICULO_PUBLICO } from "@/lib/vehiculos";

export default async function Page() {
  const supabase = await createClient();
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(CAMPOS_VEHICULO_PUBLICO)
    .in("estado", ["disponible", "reservado"])
    .order("created_at", { ascending: false });

  return (
    // Usamos el fondo claro premium que definimos para el resto de la web
    <main className="w-full bg-[#f8f9fa] dark:bg-[#0a0a0f] min-h-screen relative flex flex-col gap-0 md:gap-20 pb-20">

      <IntroLoader />

      {/* 1. Hero Principal */}
      <Hero />

      {/* 2. Catálogo Destacado (Stock) — lo que la mayoría vino a buscar, justo
         después del Hero en vez de competir con un banner promocional primero */}
      <Stock vehiculos={vehiculos || []} />

      {/* 3. Banners de sucursales / promos */}
      <BannersPublicitarios />

      {/* 4. Marcas con las que trabajan */}
      <Marcas />

      {/* 5. Propuesta de Valor / Servicios */}
      <Servicios />

      {/* 6. Banner CTA de Financiación / Permutas */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6">
        <BannerFinanciacion linkAFinanciacion />
      </div>

      {/* 7. Reseñas de Clientes */}
      <Testimonials />

      <VentasRealizadas />

      <Location />

      {/* Seguimiento de compra: utilidad post-venta, no es lo primero que
         necesita un visitante nuevo — más abajo, cerca del cierre */}
      <div>
        <Seguimiento />
      </div>

      <AgendarCitaForm />

      {/* 8. Preguntas Frecuentes */}
      <FAQ />
      
    </main>
  );
}