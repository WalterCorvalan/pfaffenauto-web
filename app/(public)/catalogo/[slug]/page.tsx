import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  ShieldCheck,
  Palette,
  Clock,
  CreditCard,
  MapPin,
  CheckCircle2,
  Info,
  CalendarDays,
  Gauge,
  Fuel,
  Settings2,
  CarFront,
} from "lucide-react";

import BotonesInteractivos from "@/components/BotonesInteractivos";
import GaleriaVehiculo from "@/components/GaleriaVehiculo";
import AgendarVisita from "@/components/AgendarVisita";

export const revalidate = 60;

export default async function VehiculoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: autoExacto } = await supabase
    .from("vehiculos")
    .select(
      `
      *, 
      multimedia_vehiculos ( url_archivo, tipo, orden ), 
      sucursales ( nombre, direccion, telefono )
    `,
    )
    .eq("slug", slug)
    .maybeSingle();

  let auto = autoExacto;

  if (!auto) {
    const { data: autosSimilares } = await supabase
      .from("vehiculos")
      .select(
        `
        *, 
        multimedia_vehiculos ( url_archivo, tipo, orden ), 
        sucursales ( nombre, direccion, telefono )
      `,
      )
      .ilike("slug", `${slug}%`)
      .limit(1);

    if (autosSimilares && autosSimilares.length > 0) {
      auto = autosSimilares[0];
    }
  }

  if (!auto) notFound();

  // Lógica de WhatsApp
  const telefonoDb = auto.sucursales?.telefono || "1121907000";
  let numeroLimpio = telefonoDb.replace(/\D/g, "");
  if (!numeroLimpio.startsWith("549") && !numeroLimpio.startsWith("54")) {
    numeroLimpio = "549" + numeroLimpio;
  } else if (numeroLimpio.startsWith("54") && !numeroLimpio.startsWith("549")) {
    numeroLimpio = numeroLimpio.replace(/^54/, "549");
  }

  const mensajeWhatsApp = encodeURIComponent(
    `Hola Pfaffen Autos, estoy interesado en el ${auto.marca} ${auto.modelo} (${auto.anio}) que tienen en la sucursal de ${auto.sucursales?.nombre || "ustedes"}.`,
  );
  const linkWhatsApp = `https://wa.me/${numeroLimpio}?text=${mensajeWhatsApp}`;

  const esCeroKm = auto.kilometraje === 0;
  const precioArs = auto.precio_publicado_ars || 0;
  const precioUsd = auto.precio_publicado_usd || null;

  // =========================================================
  // ---> ESTRATEGIA TRIPLE DE AUTOS SIMILARES <---
  // =========================================================

  // PLAN A: Misma marca
  let { data: vehiculosSimilares } = await supabase
    .from("vehiculos")
    .select(
      `id, marca, modelo, version, anio, precio_publicado_ars, precio_publicado_usd, slug, multimedia_vehiculos ( url_archivo )`,
    )
    .eq("marca", auto.marca)
    .neq("id", auto.id)
    .in("estado", ["Disponible", "Reservado"])
    .limit(3);

  // PLAN B: Rango de precios similares (+/- 30%)
  if (!vehiculosSimilares || vehiculosSimilares.length === 0) {
    const precioMin = precioArs * 0.7;
    const precioMax = precioArs * 1.3;

    const { data: porPrecio } = await supabase
      .from("vehiculos")
      .select(
        `id, marca, modelo, version, anio, precio_publicado_ars, precio_publicado_usd, slug, multimedia_vehiculos ( url_archivo )`,
      )
      .gte("precio_publicado_ars", precioMin)
      .lte("precio_publicado_ars", precioMax)
      .neq("id", auto.id)
      .in("estado", ["Disponible", "Reservado"])
      .limit(3);

    vehiculosSimilares = porPrecio;
  }

  // PLAN C: Últimos 3 cargados absolutos
  if (!vehiculosSimilares || vehiculosSimilares.length === 0) {
    const { data: ultimosIngresos } = await supabase
      .from("vehiculos")
      .select(
        `id, marca, modelo, version, anio, precio_publicado_ars, precio_publicado_usd, slug, multimedia_vehiculos ( url_archivo )`,
      )
      .neq("id", auto.id)
      .in("estado", ["Disponible", "Reservado"])
      .order("created_at", { ascending: false })
      .limit(3);

    vehiculosSimilares = ultimosIngresos;
  }

  return (
    // ELIMINAMOS overflow-x-hidden PARA QUE EL EFECTO STICKY DEL FOOTER FUNCIONE
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-foreground flex flex-col relative">
      
      {/* EFECTOS ESPACIALES (Encapsulados para no desbordar) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0145F2]/5 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-sky-300/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[10%] -right-[5%] w-[600px] h-[600px] bg-blue-400/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-12 flex flex-col relative z-10">
        
        {/* TÍTULO MÓVIL */}
        <div className="block lg:hidden mb-6">
          <div className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-[#0145F2] transition-colors">
              Inicio
            </Link>
            <span className="text-slate-400">/</span>
            <Link href="/catalogo" className="hover:text-[#0145F2] transition-colors">
              Catálogo
            </Link>
            <span className="text-slate-400">/</span>
            <Link href={`/marcas/${auto.marca.toLowerCase().replace(/\s+/g, "-")}`} className="text-slate-500 hover:text-[#0145F2] transition-colors">
              {auto.marca}
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-navy">{auto.modelo}</span>
          </div>
          <h1 className="text-3xl font-black text-navy uppercase tracking-tighter leading-tight drop-shadow-sm">
            {auto.marca}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy to-[#0145F2]">
              {auto.modelo}
            </span>
          </h1>

          <div className="mt-4">
            <BotonesInteractivos auto={auto} />
          </div>
        </div>

        {/* CONTENEDOR GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          
          {/* ================= BLOQUE 1: GALERÍA DE IMÁGENES ================= */}
          <div className="lg:col-span-7 flex flex-col gap-6 order-1 pt-1 md:pt-7">
            <div className="hidden lg:flex text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mb-[-10px] items-center gap-2">
              <Link href="/" className="hover:text-[#0145F2] transition-colors">Inicio</Link>
              <span className="text-slate-400">/</span>
              <Link href="/catalogo" className="hover:text-[#0145F2] transition-colors">Catálogo</Link>
              <span className="text-slate-400">/</span>
              <Link href={`/marcas/${auto.marca.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-[#0145F2] transition-colors">
                {auto.marca}
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-navy">{auto.modelo}</span>
            </div>

            <div className="w-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[20px] md:rounded-[32px] border border-slate-200/50 bg-white">
              <GaleriaVehiculo
                imagenes={auto.multimedia_vehiculos || []}
                altText={`${auto.marca} ${auto.modelo}`}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-2">
              <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(1,69,242,0.1)] hover:bg-white transition-all duration-300 group">
                <CalendarDays className="w-6 h-6 text-[#0145F2] mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 group-hover:text-[#0145F2] transition-colors">Año</span>
                <span className="text-sm md:text-base font-black text-navy">{auto.anio}</span>
              </div>

              <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(1,69,242,0.1)] hover:bg-white transition-all duration-300 group">
                <Gauge className="w-6 h-6 text-[#0145F2] mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 group-hover:text-[#0145F2] transition-colors">Kilometraje</span>
                <span className="text-sm md:text-base font-black text-navy">
                  {auto.kilometraje === 0 ? "0 km" : `${auto.kilometraje?.toLocaleString("es-AR")} km`}
                </span>
              </div>

              <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(1,69,242,0.1)] hover:bg-white transition-all duration-300 group">
                <Fuel className="w-6 h-6 text-[#0145F2] mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 group-hover:text-[#0145F2] transition-colors">Combustible</span>
                <span className="text-sm md:text-base font-black text-navy capitalize">{auto.tipo_combustible || "-"}</span>
              </div>

              <div className="bg-white/60 backdrop-blur-xl border border-white rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(1,69,242,0.1)] hover:bg-white transition-all duration-300 group">
                <Settings2 className="w-6 h-6 text-[#0145F2] mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 group-hover:text-[#0145F2] transition-colors">Transmisión</span>
                <span className="text-sm md:text-base font-black text-navy capitalize">{auto.transmision || "-"}</span>
              </div>
            </div>
          </div>

          {/* ================= BLOQUE 2: COLUMNA DERECHA PANEL FIJO (DESKTOP) ================= */}
          <div className="lg:col-span-5 lg:row-span-2 relative order-2">
            <div className="lg:sticky lg:top-28 bg-white/70 backdrop-blur-3xl border border-white rounded-[32px] p-6 lg:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)] flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none z-0"></div>

              <div className="hidden lg:block border-b border-slate-200/50 pb-5 relative z-10">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2">
                  {esCeroKm ? "0km" : "Usado seleccionado"} | {auto.anio}
                </span>
                <h1 className="text-3xl lg:text-4xl font-black text-navy uppercase tracking-tighter leading-tight drop-shadow-sm">
                  {auto.marca}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy to-[#0145F2]">
                    {auto.modelo}
                  </span>
                </h1>

                <div className="mt-5">
                  <BotonesInteractivos auto={auto} />
                </div>
              </div>

              <div className="relative z-10">
                <div className="flex flex-col gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-4xl md:text-5xl font-black text-navy tracking-tighter drop-shadow-sm">
                      $ {precioArs.toLocaleString("es-AR")}
                    </h2>
                    <Info className="w-5 h-5 text-slate-400 cursor-pointer hover:text-[#0145F2] transition-colors" />
                  </div>

                  {precioUsd && precioUsd > 0 && (
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 px-4 py-2 rounded-xl w-max">
                      <span className="text-sm font-black text-emerald-700 tracking-wide">
                        US$ {precioUsd.toLocaleString("en-US")}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-medium">
                  Incluye flete y formularios.{" "}
                  <span className="text-slate-400 underline cursor-pointer hover:text-navy transition-colors">
                    ¿Qué es?
                  </span>
                  <br />
                  No incluye patentamiento.{" "}
                  <span className="text-[#0145F2] underline cursor-pointer font-bold hover:text-blue-700 transition-colors">
                    Calcular
                  </span>
                </p>
              </div>

              <div className="bg-emerald-50/80 backdrop-blur-md border border-emerald-200/60 rounded-[20px] p-4 flex items-center justify-between hover:bg-emerald-100 transition-all duration-300 cursor-pointer group relative z-10 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-2.5 rounded-full shadow-sm">
                    <ShieldCheck className="text-emerald-600 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-emerald-800 font-black text-xs md:text-sm tracking-wide">
                      Compra protegida - Gratis
                    </p>
                    <p className="text-emerald-600 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5">
                      Sin costo adicional
                    </p>
                  </div>
                </div>
                <ChevronRight className="text-emerald-600 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>

              <ul className="space-y-5 text-sm text-slate-600 relative z-10">
                <li className="flex items-start gap-3">
                  <div className="bg-white p-2 rounded-full border border-slate-100 shadow-sm">
                    <Palette className="w-4 h-4 text-[#0145F2]" />
                  </div>
                  <div className="mt-1">
                    <strong className="text-navy block text-[11px] uppercase tracking-widest font-black">
                      Colores disponibles
                    </strong>
                    <span className="text-slate-500 font-medium text-xs">
                      A consultar
                    </span>
                  </div>
                </li>

                {/* BOTONES EXCLUSIVOS DE PC */}
                <li className="hidden lg:block w-full pt-2 space-y-3">
                  <a
                    href={linkWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-[#0145F2] to-sky-500 hover:from-blue-600 hover:to-sky-400 text-white font-black text-sm uppercase tracking-widest text-center py-4 rounded-2xl shadow-[0_8px_20px_rgba(1,69,242,0.3)] hover:shadow-[0_12px_25px_rgba(1,69,242,0.4)] transition-all duration-300 active:scale-95"
                  >
                    Consultar por WhatsApp
                  </a>
                  <AgendarVisita auto={auto} />
                </li>

                <li className="flex items-start gap-3 pt-5 border-t border-slate-200/50">
                  <div className="bg-white p-2 rounded-full border border-slate-100 shadow-sm">
                    <Clock className="w-4 h-4 text-[#0145F2]" />
                  </div>
                  <div className="mt-1">
                    <strong className="text-navy block text-[11px] uppercase tracking-widest font-black">
                      Disponibilidad
                    </strong>
                    <span className="text-slate-500 font-medium text-xs">
                      Inmediata
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-3 pt-5 border-t border-slate-200/50">
                  <div className="bg-white p-2 rounded-full border border-slate-100 shadow-sm">
                    <MapPin className="w-4 h-4 text-[#0145F2]" />
                  </div>
                  <div className="w-full mt-1">
                    <strong className="text-navy block text-[11px] uppercase tracking-widest font-black mb-2">
                      Punto de Venta Oficial
                    </strong>
                    <div className="inline-flex items-center gap-1.5 bg-white backdrop-blur-md border border-slate-100 px-3 py-1.5 rounded-xl shadow-sm">
                      <span className="text-xs font-black text-navy uppercase tracking-wide">
                        Sucursal {auto.sucursales?.nombre || "Central"}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <div className="bg-white p-2 rounded-full border border-slate-100 shadow-sm">
                    <CreditCard className="w-4 h-4 text-[#0145F2]" />
                  </div>
                  <div className="mt-1">
                    <strong className="text-navy block text-[11px] uppercase tracking-widest font-black">
                      Precio al contado
                    </strong>
                    <span className="text-xs text-slate-500 font-medium">
                      Se puede financiar, consultar planes disponibles.
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* ================= BLOQUE 3: ESPECIFICACIONES ================= */}
          <div className="lg:col-span-7 order-3 flex flex-col gap-8">
            <div className="bg-gradient-to-r from-navy to-[#0145F2] rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_12px_40px_rgba(1,69,242,0.2)] relative overflow-hidden mt-2">
              <div className="absolute inset-0 bg-white/5 backdrop-blur-sm pointer-events-none z-0"></div>
              <div className="absolute -right-4 -top-8 opacity-10 rotate-12 z-0 mix-blend-overlay">
                <CarFront className="w-48 h-48 text-white" />
              </div>
              <div className="relative z-10 text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-black text-white mb-2 uppercase tracking-tight drop-shadow-md">
                  ¿Querés entregar tu usado?
                </h3>
                <p className="text-xs md:text-sm text-sky-100 font-medium max-w-md">
                  Lo cotizamos en el acto y lo tomamos como parte de pago
                  asegurándote el mejor valor del mercado para tu vehículo.
                </p>
              </div>
              <a
                href="/cotizador"
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 shrink-0 bg-white/10 backdrop-blur-xl border border-white/40 hover:bg-white text-white hover:text-navy font-black text-[10px] md:text-xs uppercase tracking-widest px-6 py-4 rounded-full transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.3)] flex items-center gap-2 active:scale-95 group"
              >
                Cotizar mi auto{" "}
                <ChevronRight className="w-4 h-4 text-white group-hover:text-[#0145F2] transition-colors" />
              </a>
            </div>

            <h3 className="text-2xl font-black text-navy tracking-tight drop-shadow-sm mb-[-10px] mt-4">
              Detalles de la unidad
            </h3>

            <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-[32px] p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.03)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none z-0"></div>
              <div className="mb-6 pb-6 border-b border-slate-200/50 relative z-10">
                <span className="block text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">
                  Versión y Especificaciones
                </span>
                <p className="text-lg font-black text-navy uppercase drop-shadow-sm">
                  {auto.version ||
                    `${auto.tipo || "Vehículo"} • ${auto.transmision || "Manual"}`}
                </p>
              </div>
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <span className="bg-sky-500/10 backdrop-blur-md text-[#0145F2] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-sky-500/20 shadow-sm">
                  {esCeroKm ? "0KM" : "USADO"}
                </span>
                <span className="bg-slate-100 backdrop-blur-md text-slate-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                  CRÉDITO BNA
                </span>
              </div>
              <div className="mb-6 relative z-10">
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="text-3xl font-black text-navy drop-shadow-sm">
                    $ {precioArs.toLocaleString("es-AR")}
                  </h4>
                  {precioUsd && precioUsd > 0 && (
                    <span className="bg-emerald-500/10 backdrop-blur-md text-emerald-700 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-black tracking-wide shadow-sm">
                      US$ {precioUsd.toLocaleString("en-US")}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  Incluye flete y formularios.{" "}
                  <span className="text-slate-400 underline cursor-pointer hover:text-navy transition-colors">
                    ¿Qué es?
                  </span>
                  <br />
                  No incluye patentamiento.{" "}
                  <span className="text-[#0145F2] underline cursor-pointer font-bold hover:text-blue-700 transition-colors">
                    Calcular
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECCIÓN AUTOS SIMILARES ================= */}
        {vehiculosSimilares && vehiculosSimilares.length > 0 && (
          <div className="mt-20 md:mt-28 border-t border-slate-200/50 pt-16 relative z-10">
            <h3 className="text-2xl md:text-3xl font-black text-navy uppercase tracking-tighter mb-8 drop-shadow-sm">
              También podría{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy to-[#0145F2]">
                interesarte
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {vehiculosSimilares.map((simil) => (
                <Link
                  key={simil.id}
                  href={`/catalogo/${simil.slug}`}
                  className="block group h-full focus:outline-none"
                >
                  <div className="bg-white/60 backdrop-blur-2xl rounded-[28px] border border-white overflow-hidden flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(1,69,242,0.12)] hover:bg-white transition-all duration-500 relative transform group-hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20"></div>

                    <div className="relative h-[160px] sm:h-[180px] bg-slate-50/50 flex items-center justify-center overflow-hidden p-3 mix-blend-multiply">
                      {simil.multimedia_vehiculos?.[0] ? (
                        <img
                          src={simil.multimedia_vehiculos[0].url_archivo}
                          alt={`${simil.marca} ${simil.modelo}`}
                          className="w-full h-full object-cover rounded-[20px] group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-medium">
                          Sin foto
                        </div>
                      )}
                    </div>

                    <div className="p-5 sm:p-6 flex flex-col flex-grow relative z-10">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">
                        {simil.marca} • {simil.anio}
                      </span>
                      <h4 className="text-lg font-black text-navy uppercase leading-tight truncate drop-shadow-sm">
                        {simil.modelo}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                        {simil.version || "Ver especificaciones"}
                      </p>

                      <div className="mt-auto pt-5 flex items-end justify-between border-t border-slate-200/50">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black mb-0.5">
                            Desde
                          </span>
                          <span className="text-xl font-black text-navy tracking-tighter">
                            ${" "}
                            {simil.precio_publicado_ars?.toLocaleString(
                              "es-AR",
                            )}
                          </span>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-white border border-slate-100 shadow-sm group-hover:bg-[#0145F2] group-hover:border-[#0145F2] group-hover:text-white flex items-center justify-center transition-all duration-300 text-slate-400 group-hover:shadow-[0_0_15px_rgba(1,69,242,0.4)]">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= BOTONERA FLOTANTE MÓVIL (AHORA 50/50 Y STICKY) ================= */}
      <div className="lg:hidden sticky bottom-4 left-0 w-full px-4 z-[40] mt-4 mb-4">
        <div className="pointer-events-auto flex items-center gap-3 w-full max-w-md mx-auto bg-white/90 backdrop-blur-xl p-2.5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-200/60">
          
          {/* BOTÓN VISITA (50%) */}
          <div className="flex-1 h-[48px]">
            <AgendarVisita auto={auto} isMobile={true} />
          </div>
          
          {/* BOTÓN WHATSAPP (50%) */}
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-[48px] bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-[11px] sm:text-xs uppercase tracking-widest rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.98 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}