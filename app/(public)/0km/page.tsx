import { createClient } from "@/lib/supabase-server";
import Stock from "@/components/Stock";
import { Sparkles, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const revalidate = 60;

export default async function CeroKmPage() {
  const supabase = await createClient();

  // ================= FETCH DE AUTOS 0KM =================
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
    .eq("condicion", "0km") // Ajusta este filtro según el campo que uses en tu base de datos (ej: .eq("tipo", "0km") o .eq("kilometraje", 0))
    .not("precio_publicado_ars", "is", null)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#E9ECEF] font-sans text-foreground pb-20 relative overflow-hidden">
      {/* ================= LUCES AMBIENTALES (SPATIAL UI) ================= */}
      <div className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-[#0145F2]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* ================= PORTADA DE 0KM (Glass Panel) ================= */}
      <div className="relative w-full pt-12 pb-16 px-4 md:px-6 z-10">
        <div className="max-w-4xl mx-auto">
          {/* Migas de pan */}
          <div className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mb-8 flex items-center gap-2 justify-center">
            <Link href="/" className="hover:text-[#0145F2] transition-colors">
              Inicio
            </Link>
            <span className="text-gray-400">/</span>
            <strong className="text-navy">0km</strong>
          </div>

          <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[40px] p-8 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.05)] text-center relative overflow-hidden group">
            {/* Brillo interior */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent pointer-events-none z-0"></div>

            <div className="relative z-10 flex flex-col items-center">
              <span className="flex items-center gap-2 bg-gradient-to-r from-emerald-100/80 to-teal-100/80 backdrop-blur-md text-emerald-700 border border-emerald-200/80 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> 100% Sin Rodar
              </span>

              <h1 className="text-4xl md:text-6xl lg:text-[72px] font-black text-navy tracking-tighter mb-4 uppercase drop-shadow-sm leading-[0.9]">
                Autos{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0145F2] to-emerald-500 drop-shadow-[0_0_20px_rgba(1,69,242,0.3)]">
                  0km
                </span>
              </h1>

              <p className="text-sm md:text-base text-gray-600 font-medium max-w-lg leading-relaxed">
                Estrená tu próximo vehículo con garantía oficial de fábrica, opciones de financiación a medida y entrega inmediata.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BARRA DE AVISO SUTIL (Glass) ================= */}
      <div className="max-w-3xl mx-auto px-4 relative z-10 mb-8">
        <div className="bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span className="text-[10px] md:text-xs font-black text-emerald-700 tracking-widest uppercase text-center">
            Unidades disponibles con garantía oficial y planes de financiación exclusivos.
          </span>
        </div>
      </div>

      {/* ================= CATÁLOGO ================= */}
      <div className="relative z-10">
        <Stock vehiculos={vehiculos} />
      </div>
    </div>
  );
}