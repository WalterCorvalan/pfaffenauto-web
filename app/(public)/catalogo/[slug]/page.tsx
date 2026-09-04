import { cache } from "react";
import { createClient } from "@/lib/supabase2/server";
import {
  CalendarDays,
  CarFront,
  ChevronRight,
  Clock,
  Fuel,
  Gauge,
  MapPin,
  Settings2,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import BotonesInteractivos from "@/components/BotonesInteractivos";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import AgendarVisitaForm from "@/components/forms/AgendarVisitaForm";
import GaleriaVehiculo from "@/components/GaleriaVehiculo";
import SimuladorFinanciacion from "@/components/SimuladorFinanciacion";
import { CAMPOS_VEHICULO_DETALLE } from "@/lib/vehiculos";
import DestacadosCarousel from "./DestacadosCarousel";

export const revalidate = 60;

// cache() dedupe: generateMetadata y el componente de página piden el mismo auto
// en el mismo request — sin esto se dispara la consulta 2 veces.
const buscarAuto = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data: autoExacto } = await supabase
    .from("vehiculos")
    .select(CAMPOS_VEHICULO_DETALLE)
    .eq("slug", slug)
    .maybeSingle();
  if (autoExacto) return autoExacto as any;

  const { data: autosSimilares } = await supabase
    .from("vehiculos")
    .select(CAMPOS_VEHICULO_DETALLE)
    .ilike("slug", `${slug}%`)
    .limit(1);
  return (autosSimilares?.[0] as any) || null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const auto = await buscarAuto(slug);
  if (!auto) return { title: "Vehículo no encontrado | Pfaffen Autos" };

  const esCeroKm = auto.km === 0;
  const titulo = `${auto.marca} ${auto.modelo} ${auto.anio} ${esCeroKm ? "0KM" : "Usado"} | Pfaffen Autos`;
  const precioTexto = auto.precio_publicado_usd
    ? `US$ ${auto.precio_publicado_usd.toLocaleString("en-US")}`
    : `$${(auto.precio_publicado_ars || 0).toLocaleString("es-AR")}`;
  const descripcion = `${auto.marca} ${auto.modelo} ${auto.anio}, ${esCeroKm ? "0km" : `${auto.km?.toLocaleString("es-AR")} km`}. Precio ${precioTexto}. Financiación disponible en Pfaffen Autos.`;
  const imagen = (auto.fotos as any)?.[0];

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `/catalogo/${auto.slug}` },
    openGraph: {
      title: titulo,
      description: descripcion,
      images: imagen ? [{ url: imagen }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
      images: imagen ? [imagen] : undefined,
    },
  };
}

export default async function VehiculoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // ================= 1. CONSULTA BD PRINCIPAL (deduped con generateMetadata) =================
  const auto = await buscarAuto(slug);

  if (!auto) notFound();

  // ================= 2. LÓGICA WHATSAPP & PRECIOS =================
  const telefonoDb = auto.sucursales?.telefono || "1121907000";
  let numeroLimpio = telefonoDb.replace(/\D/g, "");
  if (!numeroLimpio.startsWith("549") && !numeroLimpio.startsWith("54"))
    numeroLimpio = "549" + numeroLimpio;
  else if (numeroLimpio.startsWith("54") && !numeroLimpio.startsWith("549"))
    numeroLimpio = numeroLimpio.replace(/^54/, "549");

  const mensajeWhatsApp = encodeURIComponent(
    `Hola Pfaffen Autos, estoy interesado en el ${auto.marca} ${auto.modelo} (${auto.anio}) que tienen en la sucursal de ${auto.sucursales?.nombre || "ustedes"}.`,
  );
  const linkWhatsApp = `https://wa.me/${numeroLimpio}?text=${mensajeWhatsApp}`;

  const esCeroKm = auto.km === 0;
  const precioArs = auto.precio_publicado_ars || 0;
  const precioUsd = auto.precio_publicado_usd || null;

  // ================= 3. QUERIES SECUNDARIAS PARALELIZADAS (PROMISE.ALL) =================
  const CAMPOS_CARD = `id, marca, modelo, segmento, anio, km, transmision, precio_publicado_ars, precio_publicado_usd, slug, sucursales!vehiculos_sucursal_id_fkey ( nombre ), fotos`;

  // Disparamos las 3 consultas al mismo tiempo
  const [reqPorMarca, reqPrecioSimilar, reqDestacados] = await Promise.all([
    // A. También te podría interesar (Por Marca)
    supabase.from("vehiculos").select(CAMPOS_CARD).eq("marca", auto.marca).neq("id", auto.id).in("estado", ["disponible", "reservado"]).order("created_at", { ascending: false }).limit(4),

    // B. Precio similar (+- 15%)
    supabase.from("vehiculos").select(CAMPOS_CARD).gte("precio_publicado_ars", precioArs * 0.85).lte("precio_publicado_ars", precioArs * 1.15).neq("id", auto.id).in("estado", ["disponible", "reservado"]).limit(4),

    // C. Autos Destacados
    supabase.from("vehiculos").select("id, marca, modelo, slug, precio_publicado_ars, precio_publicado_usd, fotos").eq("destacado", true).neq("id", auto.id).in("estado", ["disponible", "reservado"]).order("created_at", { ascending: false }).limit(10)
  ]);

  let tambienTeInteresa = reqPorMarca.data || [];
  let precioSimilar = reqPrecioSimilar.data || [];
  const destacados = reqDestacados.data || [];

  // Fallback 1: Si no hay 4 autos de la misma marca, completamos con el mismo "tipo" (SUV, Pick-up, etc)
  if (tambienTeInteresa.length < 4 && auto.tipo) {
    const idsYaIncluidos = [auto.id, ...tambienTeInteresa.map((v: any) => v.id)];
    const { data: porTipo } = await supabase
      .from("vehiculos")
      .select(CAMPOS_CARD)
      .eq("tipo", auto.tipo)
      .not("id", "in", `(${idsYaIncluidos.join(",")})`)
      .in("estado", ["disponible", "reservado"])
      .order("created_at", { ascending: false })
      .limit(4 - tambienTeInteresa.length);
    tambienTeInteresa = [...tambienTeInteresa, ...(porTipo || [])];
  }

  // Fallback 2: Si sigue vacío, traemos los últimos ingresos
  if (!tambienTeInteresa || tambienTeInteresa.length === 0) {
    const { data: ultimosIngresos } = await supabase
      .from("vehiculos")
      .select(CAMPOS_CARD)
      .neq("id", auto.id)
      .in("estado", ["disponible", "reservado"])
      .order("created_at", { ascending: false })
      .limit(4);
    tambienTeInteresa = ultimosIngresos || [];
  }

  // ================= 4. RENDERIZADO =================
  const jsonLdVehicle = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${auto.marca} ${auto.modelo}`,
    brand: auto.marca,
    model: auto.modelo,
    vehicleModelDate: String(auto.anio),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: auto.km,
      unitCode: "KMT",
    },
    fuelType: auto.combustible || undefined,
    vehicleTransmission: auto.transmision || undefined,
    image: auto.fotos || [],
    offers: {
      "@type": "Offer",
      priceCurrency: precioUsd ? "USD" : "ARS",
      price: precioUsd || precioArs,
      availability: "https://schema.org/InStock",
      url: `https://pfaffenautos.com.ar/catalogo/${auto.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f] print:bg-white font-sans text-foreground flex flex-col relative pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdVehicle) }}
      />
      <BackgroundEffects />
      <PrintHeader auto={auto} />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-12 flex flex-col relative z-10 print:pt-0">
        <MobileTitle auto={auto} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start mt-2 lg:mt-6">
          <div className="lg:col-span-8 flex flex-col gap-8 order-1 print:col-span-12">
            <div className="hidden lg:flex text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest items-center gap-2.5 print:hidden">
              <Link href="/" className="hover:text-[#0145F2] dark:hover:text-sky-300 transition-colors">Inicio</Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <Link href="/catalogo" className="hover:text-[#0145F2] dark:hover:text-sky-300 transition-colors">Catálogo</Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <Link href={`/marcas/${auto.marca.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-[#0145F2] dark:hover:text-sky-300 transition-colors">{auto.marca}</Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-navy dark:text-white font-black">{auto.modelo}</span>
            </div>

            <VehiculoGallery auto={auto} />
            <VehiculoSpecs auto={auto} esCeroKm={esCeroKm} />

            <div className="print:hidden">
              <SimuladorFinanciacion
                precioTotal={precioArs}
                autoNombre={`${auto.marca} ${auto.modelo}`}
                telefono={numeroLimpio}
                vehiculo={{
                  id: auto.id,
                  marca: auto.marca,
                  modelo: auto.modelo,
                  anio: auto.anio,
                  km: auto.km,
                  precio_publicado_ars: auto.precio_publicado_ars,
                  sucursales: auto.sucursales,
                }}
              />
            </div>
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-28 order-2 print:col-span-12">
            <VehiculoPriceCard
              auto={auto}
              precioArs={precioArs}
              precioUsd={precioUsd}
              linkWhatsApp={linkWhatsApp}
              esCeroKm={esCeroKm}
            />
          </div>
        </div>
        
        <VehiculoPermuta vehiculoId={auto.id} />

        <VehiculosRelacionados titulo="También te podría interesar" vehiculos={tambienTeInteresa || []} />
        <VehiculosRelacionados titulo="Autos con precio similar" vehiculos={precioSimilar || []} />

        <div className="mt-16">
          <DestacadosCarousel vehiculos={destacados || []} />
        </div>
      </div>

      <MobileBottomBar auto={auto} linkWhatsApp={linkWhatsApp} />
    </div>
  );
}

// ============================================================================
// ========================= COMPONENTES MODULARES ============================
// ============================================================================

function BackgroundEffects() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden print:hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0145F2]/5 dark:bg-sky-400/5 blur-[120px] rounded-full"></div>
      <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-sky-300/10 dark:bg-sky-400/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[10%] -right-[5%] w-[600px] h-[600px] bg-blue-400/5 dark:bg-blue-400/5 blur-[120px] rounded-full"></div>
    </div>
  );
}

function PrintHeader({ auto }: { auto: any }) {
  return (
    <div className="hidden print:block text-center border-b-2 border-navy pb-6 mb-6 mt-8">
      <img src="/logo.png" alt="Pfaffen Autos" className="h-10 mx-auto mb-2" />
      <h1 className="text-xl font-black uppercase text-navy">
        Ficha Técnica Oficial
      </h1>
      <p className="text-xs text-slate-500">
        {auto.sucursales?.nombre} - {auto.sucursales?.direccion}
      </p>
    </div>
  );
}

function MobileTitle({ auto }: { auto: any }) {
  return (
    <div className="block lg:hidden mb-2 print:hidden relative z-10">
      <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-[#0145F2] dark:hover:text-sky-300 transition-colors">Inicio</Link>
        <span className="text-slate-400 dark:text-slate-600">/</span>
        <Link href="/catalogo" className="hover:text-[#0145F2] dark:hover:text-sky-300 transition-colors">Catálogo</Link>
        <span className="text-slate-400 dark:text-slate-600">/</span>
        <Link href={`/marcas/${auto.marca.toLowerCase().replace(/\s+/g, "-")}`} className="text-slate-500 dark:text-slate-400 hover:text-[#0145F2] dark:hover:text-sky-300 transition-colors">{auto.marca}</Link>
      </div>

      <h1 className="text-3xl font-black text-navy dark:text-white uppercase tracking-tighter leading-tight drop-shadow-sm">
        {auto.marca}{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy to-[#0145F2] dark:from-white dark:to-sky-400">
          {auto.modelo}
        </span>
      </h1>
      <p className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase mt-1">
        {auto.version || `${auto.tipo || "Vehículo"} • ${auto.transmision || "Manual"}`}
      </p>

      <div className="mt-5 flex items-center gap-2">
        <BotonesInteractivos auto={auto} />
      </div>
    </div>
  );
}

function VehiculoGallery({ auto }: { auto: any }) {
  return (
    <div className="w-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-[20px] md:rounded-[32px] border border-slate-200/50 dark:border-white/10 bg-white dark:bg-white/5 print:shadow-none print:border-slate-300">
      <div className="print:hidden">
        <GaleriaVehiculo
          imagenes={auto.fotos || []}
          altText={`${auto.marca} ${auto.modelo}`}
        />
      </div>
      <div className="hidden print:block w-full h-[400px]">
        {auto.fotos?.[0] ? (
          <img
            src={auto.fotos[0]}
            className="w-full h-full object-cover"
            alt="Vehículo"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-medium">
            Sin imagen
          </div>
        )}
      </div>
    </div>
  );
}

function VehiculoSpecs({ auto, esCeroKm }: { auto: any; esCeroKm: boolean }) {
  return (
    <div className="bg-white/60 dark:bg-white/5 print:bg-white backdrop-blur-xl border border-white dark:border-white/10 print:border-slate-200 rounded-[24px] p-6 md:p-8 shadow-[0_4px_15px_rgba(0,0,0,0.03)] dark:shadow-none print:shadow-none grid grid-cols-2 md:flex md:flex-wrap items-center justify-between gap-6 relative z-10">
      <div className="flex items-center gap-4">
        <div className="bg-white dark:bg-white/5 p-3 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-white/10">
          <CalendarDays className="w-6 h-6 text-[#0145F2] dark:text-sky-400 opacity-80" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Año</span>
          <span className="text-base font-black text-navy dark:text-white">{auto.anio}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-white dark:bg-white/5 p-3 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-white/10">
          <Gauge className="w-6 h-6 text-[#0145F2] dark:text-sky-400 opacity-80" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Kilómetros</span>
          <span className="text-base font-black text-navy dark:text-white">{esCeroKm ? "0 km" : `${auto.km?.toLocaleString("es-AR")} km`}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-white dark:bg-white/5 p-3 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-white/10">
          <Fuel className="w-6 h-6 text-[#0145F2] dark:text-sky-400 opacity-80" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Combustible</span>
          <span className="text-base font-black text-navy dark:text-white capitalize">{auto.combustible || "-"}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-white dark:bg-white/5 p-3 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-white/10">
          <Settings2 className="w-6 h-6 text-[#0145F2] dark:text-sky-400 opacity-80" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Transmisión</span>
          <span className="text-base font-black text-navy dark:text-white capitalize">{auto.transmision || "-"}</span>
        </div>
      </div>
    </div>
  );
}

function VehiculoPriceCard({
  auto,
  precioArs,
  precioUsd,
  linkWhatsApp,
  esCeroKm,
}: any) {
  return (
    <div className="bg-white/70 dark:bg-white/5 print:bg-white backdrop-blur-3xl border border-white dark:border-white/10 print:border-slate-300 rounded-[32px] p-6 lg:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)] dark:shadow-none print:shadow-none flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/[0.03] to-transparent pointer-events-none z-0 print:hidden"></div>

      <div className="hidden lg:block border-b border-slate-200/50 dark:border-white/10 pb-5 mb-6 relative z-10">
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest block mb-2">
          {esCeroKm ? "0km" : "Usado seleccionado"} | {auto.anio}
        </span>
        <h1 className="text-3xl lg:text-4xl font-black text-navy dark:text-white uppercase tracking-tighter leading-tight drop-shadow-sm">
          {auto.marca}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy to-[#0145F2] dark:from-white dark:to-sky-400">
            {auto.modelo}
          </span>
        </h1>
        <p className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase mt-2">
          {auto.version || `${auto.tipo || "Vehículo"} • ${auto.transmision || "Manual"}`}
        </p>

        <div className="mt-5 flex items-center gap-2 print:hidden">
          <BotonesInteractivos auto={auto} />
        </div>
      </div>

      <div className="relative z-10 mb-8">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 block mb-1">Precio al contado</span>
          <h2 className="text-4xl md:text-5xl font-black text-navy dark:text-white tracking-tighter drop-shadow-sm">
            {precioUsd && precioUsd > 0
              ? `US$ ${precioUsd.toLocaleString("en-US")}`
              : `$ ${precioArs.toLocaleString("es-AR")}`}
          </h2>
          <span className="block w-10 h-1 rounded-full bg-gradient-to-r from-[#0145F2] to-sky-400 mt-1"></span>
        </div>
      </div>

      <div className="hidden lg:flex flex-col gap-3 relative z-10 print:hidden">
        <a
          href={linkWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-sm uppercase tracking-widest text-center py-4 rounded-2xl shadow-[0_8px_20px_rgba(37,211,102,0.3)] hover:shadow-[0_12px_25px_rgba(37,211,102,0.4)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
        >
          <WhatsAppIcon className="w-4 h-4" /> Consultar
        </a>
        <AgendarVisitaForm auto={auto} />
      </div>

      <hr className="border-slate-200/50 dark:border-white/10 my-6 relative z-10 print:my-4" />

      <div className="flex flex-col gap-5 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-white/5 p-2 rounded-full border border-slate-100 dark:border-white/10 shadow-sm dark:shadow-none">
              <MapPin className="w-4 h-4 text-[#0145F2] dark:text-sky-400" />
            </div>
            <span className="text-navy dark:text-white text-xs uppercase tracking-widest font-black">Sucursal</span>
          </div>

          <Link
            href={`/sucursales/${(auto.sucursales?.nombre || "casa-central")
              .toLowerCase()
              .replace(/\s+/g, "-")
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")}`}
            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-[#0145F2] dark:hover:text-sky-300 hover:underline transition-colors"
            title="Ver información de esta sucursal"
          >
            {auto.sucursales?.nombre || "Central"}
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-white/5 p-2 rounded-full border border-slate-100 dark:border-white/10 shadow-sm dark:shadow-none">
              <Clock className="w-4 h-4 text-[#0145F2] dark:text-sky-400" />
            </div>
            <span className="text-navy dark:text-white text-xs uppercase tracking-widest font-black">Entrega</span>
          </div>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Inmediata</span>
        </div>
      </div>

      <div className="hidden print:block mt-8 text-center text-xs text-slate-500">
        Documento generado automáticamente desde pfaffenautos.com.ar. Precios sujetos a modificación sin previo aviso.
      </div>
    </div>
  );
}

function VehiculosRelacionados({ titulo, vehiculos }: { titulo: string; vehiculos: any[] }) {
  if (!vehiculos || vehiculos.length === 0) return null;

  return (
    <div className="mt-16 print:hidden relative z-10">
      <h2 className="text-xl md:text-2xl font-black text-navy dark:text-white tracking-tight mb-5">{titulo}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {vehiculos.map((v) => {
          const precioMostrar = v.precio_publicado_usd && !v.precio_publicado_ars
            ? `US$ ${v.precio_publicado_usd.toLocaleString("es-AR")}`
            : `$ ${(v.precio_publicado_ars || 0).toLocaleString("es-AR")}`;

          return (
            <Link
              key={v.id}
              href={`/catalogo/${v.slug}`}
              className="block group bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[24px] border border-white/60 dark:border-white/10 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_20px_48px_rgba(1,69,242,0.12)] dark:hover:shadow-none hover:border-white dark:hover:border-white/20 hover:bg-white/70 dark:hover:bg-white/10 transition-all duration-500"
            >
              <div className="relative h-[140px] sm:h-[160px] bg-white/30 dark:bg-white/5 overflow-hidden mix-blend-multiply dark:mix-blend-normal">
                {v.fotos?.[0] ? (
                  <Image
                    src={v.fotos[0]}
                    alt={`${v.marca} ${v.modelo}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-slate-500 text-xs font-medium">Sin foto</div>
                )}
              </div>
              <div className="p-4 flex flex-col">
                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1">{v.marca}</span>
                <h3 className="text-sm font-black text-navy dark:text-white leading-tight uppercase truncate">{v.modelo}</h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mt-0.5">
                  {v.anio} · {v.km?.toLocaleString("es-AR")} km · {v.transmision || "—"}
                </p>
                <div className="mt-3 pt-3 flex items-center justify-between border-t border-gray-200/50 dark:border-white/10">
                  <span className="text-base font-black text-navy dark:text-white tracking-tighter">{precioMostrar}</span>
                  <div className="w-7 h-7 rounded-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none group-hover:bg-[#0145F2] group-hover:border-[#0145F2] group-hover:text-white flex items-center justify-center transition-all duration-300 text-gray-400 dark:text-slate-500">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500 font-medium mt-1.5">
                  <MapPin className="w-2.5 h-2.5" /> {v.sucursales?.nombre || "Buenos Aires"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function VehiculoPermuta({ vehiculoId }: { vehiculoId: string }) {
  return (
    <div className="mt-24 print:hidden relative z-10">
      <div className="bg-gradient-to-r from-navy to-[#0145F2] rounded-[32px] px-6 py-6 md:px-10 md:py-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_12px_40px_rgba(1,69,242,0.2)] relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm pointer-events-none z-0"></div>
        <div className="absolute -right-4 -top-8 opacity-10 rotate-12 z-0 mix-blend-overlay">
          <CarFront className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 text-center md:text-left">
          <h3 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tight drop-shadow-md">
            ¿Tenés un usado para entregar?
          </h3>
          <p className="text-xs md:text-sm text-sky-100 font-medium max-w-xl">
            Lo cotizamos en el acto y lo tomamos como parte de pago asegurándote el mejor valor del mercado.
          </p>
        </div>
        <a
          href={`/cotizador?permuta=${vehiculoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 shrink-0 bg-white/10 backdrop-blur-xl border border-white/40 hover:bg-white text-white hover:text-navy font-black text-[10px] md:text-xs uppercase tracking-widest px-8 py-4 rounded-full transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.3)] flex items-center gap-2 active:scale-95 group"
        >
          Cotizar mi auto{" "}
          <ChevronRight className="w-4 h-4 text-white group-hover:text-[#0145F2] transition-colors" />
        </a>
      </div>
    </div>
  );
}

function MobileBottomBar({ auto, linkWhatsApp }: { auto: any; linkWhatsApp: string; }) {
  return (
    <div className="lg:hidden sticky bottom-4 left-0 w-full px-4 z-[40] mt-4 print:hidden">
      <div className="pointer-events-auto flex items-center gap-3 w-full max-w-md mx-auto bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl p-2.5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-slate-200/60 dark:border-white/10">
        <div className="flex-1 h-[48px]">
          <AgendarVisitaForm auto={auto} isMobile={true} />
        </div>
        <a
          href={linkWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-[48px] bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-[11px] sm:text-xs uppercase tracking-widest rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.98 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>{" "}
          WhatsApp
        </a>
      </div>
    </div>
  );
}