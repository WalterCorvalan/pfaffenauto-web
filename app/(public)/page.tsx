"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Scale } from "lucide-react";

// ================= COMPONENTES DE LA LANDING =================
import Hero from "@/components/Hero";
import Stock from "@/components/Stock";
import Marcas from "@/components/Marcas";
import Servicios from "@/components/Servicios";
import BannerFinanciacion from "@/components/banners/BannerFinanciacion";
import Sucursales from "@/components/Sucursales";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import AgendarCitaForm from "@/components/AgendarCitaForm";
import Seguimiento from "@/components/Seguimiento";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function Page() {
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [isComparadorOpen, setIsComparadorOpen] = useState(false);
  const [autosComparar, setAutosComparar] = useState<any[]>([]);

  useEffect(() => {
    async function cargarVehiculos() {
      const { data } = await supabase
        .from("vehiculos")
        .select(`*, multimedia_vehiculos ( url_archivo ), sucursales ( nombre )`)
        .in("estado", ["Disponible", "Reservado"])
        .order("created_at", { ascending: false });
      
      if (data) setVehiculos(data);
    }
    cargarVehiculos();
  }, []);

  const manejarSeleccionComparar = (auto: any) => {
    setAutosComparar((prev) => {
      const yaExiste = prev.some((a) => a.id === auto.id);
      if (yaExiste) return prev.filter((a) => a.id !== auto.id);
      if (prev.length >= 3) {
        alert("Solo podés comparar hasta 3 vehículos a la vez.");
        return prev;
      }
      return [...prev, auto];
    });
  };

  return (
    // Usamos el fondo claro premium que definimos para el resto de la web
    <main className="w-full bg-[#F8FAFC] min-h-screen relative flex flex-col gap-12 md:gap-20 pb-20">
      
      {/* 1. Hero Principal */}
      <Hero />
      
      {/* 2. Catálogo Destacado (Stock) */}
      <Stock 
        vehiculos={vehiculos} 
        onSelectParaComparar={manejarSeleccionComparar}
        autosParaComparar={autosComparar}
      />
      
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
      
      {/* 6. Puntos de Venta */}
      <Sucursales />
      
      {/* 7. Reseñas de Clientes */}
      <Testimonials />

      <AgendarCitaForm />
      
      {/* 8. Preguntas Frecuentes */}
      <FAQ />
      
    </main>
  );
}