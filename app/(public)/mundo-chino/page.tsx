import { createClient } from "@/lib/supabase/server";
import { CAMPOS_VEHICULO_PUBLICO } from "@/lib/vehiculos";
import VehiculosGrid from "@/components/VehiculosGrid";
import { MARCAS_CHINAS } from "@/lib/marcasChinas";
import { Globe2, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Mundo Chino | BAIC, Chery, Changan, JAC, BYD | Pfaffen Autos",
  description: "Descubrí nuestra selección de marcas chinas: BAIC, Chery, Changan, JAC, BYD y más, con respaldo oficial en Pfaffen Autos.",
  alternates: { canonical: "https://www.pfaffencars.com/mundo-chino" },
};

export default async function MundoChinoPage() {
  const supabase = await createClient();

  const filtroMarcas = Array.from(MARCAS_CHINAS)
    .map((m) => `marca.ilike.${m}`)
    .join(",");

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(CAMPOS_VEHICULO_PUBLICO)
    .in("estado", ["disponible", "reservado"])
    .or(filtroMarcas)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#E9ECEF] dark:bg-[#0a0a0f] font-sans text-foreground dark:text-white pb-20 relative overflow-hidden">
      <div className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] bg-red-400/10 dark:bg-red-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-[#0145F2]/10 dark:bg-sky-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="relative w-full pt-12 pb-16 px-4 md:px-6 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-500 font-bold uppercase tracking-widest mb-8 flex items-center gap-2 justify-center">
            <Link href="/" className="hover:text-[#0145F2] dark:hover:text-sky-400 transition-colors">
              Inicio
            </Link>
            <span className="text-gray-400 dark:text-slate-700">/</span>
            <strong className="text-navy dark:text-white">Mundo Chino</strong>
          </div>

          <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-[40px] p-8 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.05)] text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 dark:from-white/5 to-transparent pointer-events-none z-0"></div>

            <div className="relative z-10 flex flex-col items-center">
              <span className="flex items-center gap-2 bg-gradient-to-r from-blue-100/80 to-sky-100/80 dark:from-sky-400/10 dark:to-blue-500/10 backdrop-blur-md text-[#0145F2] dark:text-sky-300 border border-blue-200/80 dark:border-sky-400/20 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6 shadow-sm">
                <Globe2 className="w-3.5 h-3.5" /> BAIC · Chery · Changan · JAC · Haval · BYD y más
              </span>

              <h1 className="text-4xl md:text-6xl lg:text-[72px] font-black text-navy dark:text-white tracking-tighter mb-4 uppercase drop-shadow-sm leading-[0.9]">
                Mundo{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0145F2] to-sky-400 drop-shadow-[0_0_20px_rgba(1,69,242,0.3)]">
                  Chino
                </span>
              </h1>

              <p className="text-sm md:text-base text-gray-600 dark:text-slate-400 font-medium max-w-lg leading-relaxed">
                Toda la nueva generación de marcas chinas en un mismo lugar: tecnología, equipamiento y garantía oficial a precios competitivos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 relative z-10 mb-8">
        <div className="bg-blue-500/10 dark:bg-sky-500/10 backdrop-blur-xl border border-blue-500/20 dark:border-sky-400/20 py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-[#0145F2] dark:text-sky-400 animate-pulse" />
          <span className="text-[10px] md:text-xs font-black text-[#0145F2] dark:text-sky-400 tracking-widest uppercase text-center">
            Stock de marcas chinas actualizado en tiempo real.
          </span>
        </div>
      </div>

      <div className="relative z-10">
        <VehiculosGrid vehiculos={vehiculos} />
      </div>
    </div>
  );
}
