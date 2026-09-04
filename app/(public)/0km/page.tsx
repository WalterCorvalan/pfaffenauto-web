import { createClient } from "@/lib/supabase2/server";
import { CAMPOS_VEHICULO_PUBLICO } from "@/lib/vehiculos";
import VehiculosGrid from "@/components/VehiculosGrid";
import { Sparkles, ShieldCheck, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Autos 0KM | Pfaffen Autos",
  description: "Comprá tu auto 0KM con garantía oficial de fábrica, financiación a medida y entrega inmediata en Pfaffen Autos.",
  alternates: { canonical: "https://pfaffenautos.com.ar/0km" },
};

export default async function CeroKmPage() {
  const supabase = await createClient();

  // ================= FETCH DE AUTOS 0KM =================
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(CAMPOS_VEHICULO_PUBLICO)
    .in("estado", ["disponible", "reservado"])
    .eq("km", 0)
    .or("precio_publicado_ars.not.is.null,precio_publicado_usd.not.is.null")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-white dark:bg-[#030303] font-sans text-slate-900 dark:text-white pb-24 relative overflow-hidden">
      
      {/* ================= MESH GRADIENT / LUCES AMBIENTALES ================= */}
      {/* Destello Azul Superior */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#0145F2]/15 dark:bg-sky-500/15 rounded-[100%] blur-[120px] pointer-events-none z-0" />
      {/* Destello Esmeralda Lateral */}
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[600px] bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-[150px] pointer-events-none z-0 transform rotate-45" />

      {/* ================= HERO EXPANSIVO (ULTRA MODERNO) ================= */}
      <section className="relative z-10 pt-24 pb-20 px-4 md:px-6 flex flex-col items-center justify-center min-h-[55vh]">
        
        {/* Breadcrumb minimalista */}
        <nav className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700" />
          <span className="text-slate-900 dark:text-white">0KM</span>
        </nav>

        {/* Etiqueta Superior Flotante */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl shadow-[#0145F2]/5 dark:shadow-sky-500/5 backdrop-blur-xl mb-8 transform hover:scale-105 transition-transform cursor-default">
          <Zap className="w-4 h-4 text-[#0145F2] dark:text-sky-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300">
            Stock Oficial Actualizado
          </span>
        </div>

        {/* Título Gigante */}
        <h1 className="text-6xl md:text-[80px] lg:text-[110px] font-black tracking-tighter text-center leading-[0.85] mb-8 text-slate-900 dark:text-white">
          ESTRENÁ <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0145F2] via-sky-400 to-emerald-400 dark:from-sky-400 dark:via-blue-500 dark:to-emerald-400">
            TU 0KM
          </span>
        </h1>

        {/* Bajada */}
        <p className="text-slate-500 dark:text-slate-400 max-w-xl text-center text-sm md:text-base font-medium leading-relaxed mb-12">
          Llevate hoy tu auto sin rodar con garantía directa de fábrica. Financiación a medida, cuotas fijas y entrega inmediata asegurada.
        </p>

        {/* Píldoras de Información (Info Pills) */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Garantía Oficial</span>
          </div>
          
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-md">
            <Sparkles className="w-5 h-5 text-[#0145F2] dark:text-sky-400" />
            <span className="text-xs font-black uppercase tracking-widest">
              {vehiculos?.length || 0} Disponibles
            </span>
          </div>
        </div>

      </section>

      {/* ================= LÍNEA DIVISORIA SUTIL ================= */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 relative z-10 mb-12">
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
      </div>

      {/* ================= GRILLA DE VEHÍCULOS ================= */}
      <section className="relative z-10">
        <VehiculosGrid vehiculos={vehiculos} />
      </section>
      
    </div>
  );
}