import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ChevronRight, Sparkles } from "lucide-react";
import VehiculosGrid from "@/components/VehiculosGrid";
import { CAMPOS_VEHICULO_PUBLICO } from "@/lib/vehiculos";
import { LOGOS_MARCAS } from "@/lib/marcasLogos";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ marca: string }> }): Promise<Metadata> {
  const { marca } = await params;
  const marcaName = marca.charAt(0).toUpperCase() + marca.slice(1).toLowerCase();
  return {
    title: `Autos ${marcaName} en Zona Norte | Pfaffen Autos`,
    description: `Encontrá vehículos ${marcaName} 0KM y usados seleccionados, con financiación y respaldo oficial en Pfaffen Autos.`,
    alternates: { canonical: `https://pfaffenautos.com.ar/marcas/${marca.toLowerCase()}` },
  };
}

const BRAND_DATA: Record<
  string,
  { logoR: string; logo: string; descripcion: string; pills: string[]; color: string }
> = {
  chevrolet: {
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Chevrolet-logo.png",
    logoR: "",
    descripcion: "Chevrolet combina tradición y modernidad: desde pickups robustas hasta autos urbanos, la marca ofrece confianza y tecnología.",
    pills: ["Fuerza", "Confianza", "Conectividad"],
    color: "#FFC72C",
  },
  volkswagen: {
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg",
    logoR: "",
    descripcion: "Volkswagen es sinónimo de ingeniería alemana confiable, diseño atemporal y un confort de marcha excepcional para cualquier viaje.",
    pills: ["Ingeniería", "Confort", "Respaldo"],
    color: "#001E50",
  },
  toyota: {
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg",
    logoR: "",
    descripcion: "La marca líder a nivel mundial. Toyota destaca por su durabilidad legendaria, valor de reventa y excelencia en servicio de postventa.",
    pills: ["Durabilidad", "Reventa", "Híbridos"],
    color: "#EB0A1E",
  },
  rely: {
    logo: "/RelyLogo.png",
    logoR: "",
    descripcion: "Sub-marca del Chery Group especializada en pick-ups medianas, con la ingeniería que respalda a uno de los mayores exportadores de autos de China.",
    pills: ["Robustez", "Ingeniería Chery", "Garantía oficial"],
    color: "#F26B1D",
  },
  karry: {
    logo: "/logo-karry.webp",
    logoR: "",
    descripcion: "La marca de utilitarios del Chery Group: pick-ups y vehículos de carga pensados para el trabajo diario y la última milla.",
    pills: ["Carga y trabajo", "Confiabilidad", "Garantía oficial"],
    color: "#0145F2",
  },
  default: {
    logo: "/logo.png",
    logoR: "/r.png",
    descripcion: "Encontrá los mejores modelos 0km y usados seleccionados con el respaldo y la garantía que merecés.",
    pills: ["Calidad", "Seguridad", "Garantía"],
    color: "#0145F2",
  },
};

const BRAND_COLORS: Record<string, string> = {
  Ford: "#003478",
  Peugeot: "#003DA5",
  Renault: "#E8B200",
  Fiat: "#941E34",
  Nissan: "#C3002F",
  Honda: "#E40521",
  "Citroën": "#DA291C",
  Hyundai: "#002C5E",
  Kia: "#BB162B",
  Jeep: "#424B26",
  RAM: "#4A4A4A",
  Suzuki: "#E30613",
  Mitsubishi: "#E60012",
  BAIC: "#C8102E",
  Chery: "#CC0000",
  BYD: "#E60012",
  Geely: "#0033A0",
  Haval: "#E4002B",
  JAC: "#003DA5",
  Audi: "#BB0A30",
  BMW: "#0066B1",
  "Mercedes-Benz": "#00A19A",
};

export default async function MarcaPage({
  params,
}: {
  params: Promise<{ marca: string }>;
}) {
  const { marca } = await params;
  const supabase = await createClient();

  const marcaName = marca.charAt(0).toUpperCase() + marca.slice(1).toLowerCase();
  const marcaInfo = BRAND_DATA[marca.toLowerCase()] || {
    ...BRAND_DATA.default,
    logo: LOGOS_MARCAS[marcaName] || BRAND_DATA.default.logo,
    color: BRAND_COLORS[marcaName] || BRAND_DATA.default.color,
  };

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(CAMPOS_VEHICULO_PUBLICO)
    .ilike("marca", marca)
    .in("estado", ["Disponible", "Reservado"])
    .order("precio_publicado_ars", { ascending: true });

  // ESTADO VACÍO
  if (!vehiculos || vehiculos.length === 0) {
    return (
      <div className="min-h-[85vh] bg-[#f8fafc] dark:bg-[#0a0a0f] relative overflow-hidden flex flex-col items-center justify-center px-4 w-full">
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[140px] opacity-20 pointer-events-none"
          style={{ background: marcaInfo.color }}
        />

        <div className="bg-white dark:bg-white/5 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-8 md:p-14 shadow-xl text-center relative z-10 max-w-lg">
          <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            No hay stock de {marcaName}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-sm leading-relaxed">
            Por el momento no tenemos unidades disponibles de esta marca. Dejanos tu consulta y te avisamos ni bien ingrese una.
          </p>
          <a
            href={`https://wa.me/5491121907000?text=${encodeURIComponent(`¡Hola! Buscaba un ${marcaName} en la web y vi que no hay stock. ¿Me avisan cuando ingrese uno?`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#0145F2] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 mb-6"
          >
            Avisarme si ingresa
          </a>
          <br />
          <Link href="/marcas" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            Volver a Marcas
          </Link>
        </div>
      </div>
    );
  }

  const color = marcaInfo.color;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0a0f] font-sans text-slate-900 dark:text-slate-100 pb-24 relative overflow-hidden">
      {/* Luces ambientales con el color representativo de la marca */}
      <div
        className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[750px] h-[450px] rounded-full blur-[150px] pointer-events-none z-0 opacity-20 dark:opacity-25"
        style={{ background: color }}
      />

      {/* ================= HERO SHOWCASE DE MARCA ================= */}
      <section className="relative z-10 pt-8 pb-12 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-8">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Inicio</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
            <Link href="/marcas" className="hover:text-slate-900 dark:hover:text-white transition-colors">Marcas</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
            <span className="text-slate-900 dark:text-white">{marcaName}</span>
          </nav>

          {/* Tarjeta Glass Showcase */}
          <div className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/50 dark:shadow-none text-center flex flex-col items-center relative overflow-hidden">
            
            {/* Logo de la marca agrandado y destacado */}
            <div className="relative w-56 h-28 sm:w-72 sm:h-36 md:w-80 md:h-40 flex items-center justify-center mb-6 transition-transform duration-500 hover:scale-105">
              <div
                className="absolute -inset-16 rounded-full blur-[80px] opacity-[0.18] dark:opacity-25"
                style={{ background: color }}
              />
              <div className="relative w-full h-full flex items-center justify-center p-1">
                <Image
                  src={marcaInfo.logo}
                  alt={`Logo ${marcaName}`}
                  fill
                  sizes="(max-width: 768px) 300px, 400px"
                  className="object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_12px_24px_rgba(255,255,255,0.15)]"
                  priority
                />
              </div>
            </div>

            {/* Título & Descripción */}
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
              Modelos <span style={{ color }}>{marcaName}</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-xl mx-auto mb-8">
              {marcaInfo.descripcion}
            </p>

            {/* Pills de características */}
            <div className="flex flex-wrap justify-center gap-2.5">
              {marcaInfo.pills.map((pill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide px-4 py-2 rounded-xl border border-black/5 dark:border-white/10 shadow-sm"
                  style={{ background: `${color}14`, color }}
                >
                  <Sparkles className="w-3 h-3" />
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONTADOR & GRILLA DE VEHÍCULOS ================= */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 mt-2">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
              Stock Disponible
            </h2>
          </div>
          <span 
            className="text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-black/5 dark:border-white/10 shadow-sm"
            style={{ background: `${color}14`, color }}
          >
            {vehiculos.length} {vehiculos.length === 1 ? "unidad" : "unidades"}
          </span>
        </div>

        <VehiculosGrid vehiculos={vehiculos} />
      </section>
    </div>
  );
}