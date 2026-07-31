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
  // ---> NUEVO: ESTRATEGIA TRIPLE DE AUTOS SIMILARES <---
  // =========================================================
  
  // PLAN A: Misma marca
  let { data: vehiculosSimilares } = await supabase
    .from("vehiculos")
    .select(`id, marca, modelo, version, anio, precio_publicado_ars, precio_publicado_usd, slug, multimedia_vehiculos ( url_archivo )`)
    .eq("marca", auto.marca)
    .neq("id", auto.id) // Que no sea el mismo que estamos viendo
    .in("estado", ["Disponible", "Reservado"])
    .limit(3);

  // PLAN B: Rango de precios similares (+/- 30%)
  if (!vehiculosSimilares || vehiculosSimilares.length === 0) {
    const precioMin = precioArs * 0.7; // 30% menos
    const precioMax = precioArs * 1.3; // 30% más

    const { data: porPrecio } = await supabase
      .from("vehiculos")
      .select(`id, marca, modelo, version, anio, precio_publicado_ars, precio_publicado_usd, slug, multimedia_vehiculos ( url_archivo )`)
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
      .select(`id, marca, modelo, version, anio, precio_publicado_ars, precio_publicado_usd, slug, multimedia_vehiculos ( url_archivo )`)
      .neq("id", auto.id)
      .in("estado", ["Disponible", "Reservado"])
      .order("created_at", { ascending: false })
      .limit(3);
      
    vehiculosSimilares = ultimosIngresos;
  }

  return (
    <div className="min-h-screen bg-[#E9ECEF] font-sans text-foreground flex flex-col relative overflow-hidden">
      
      {/* ================= LUCES AMBIENTALES (SPATIAL UI) ================= */}
      <div className="absolute top-[-5%] left-[-10%] w-[600px] h-[600px] bg-[#0145F2]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] bg-sky-300/15 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-24 lg:pb-20 relative z-10">
        
        {/* TÍTULO MÓVIL */}
        <div className="block lg:hidden mb-6">
          <div className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-[#0145F2] transition-colors">Inicio</Link> 
            <span className="text-gray-400">/</span>
            <Link href="/catalogo" className="hover:text-[#0145F2] transition-colors">Catálogo</Link> 
            <span className="text-gray-400">/</span>
            {/* AQUÍ CONVERTIMOS LA MARCA EN UN LINK DINÁMICO */}
            <Link 
              href={`/marcas/${auto.marca.toLowerCase().replace(/\s+/g, '-')}`} 
              className="text-[#0145F2] hover:text-sky-500 transition-colors"
            >
              {auto.marca}
            </Link> 
            <span className="text-gray-400">/</span>
            <span className="text-navy">{auto.modelo}</span>
          </div>
          <h1 className="text-3xl font-black text-navy uppercase tracking-tighter leading-tight drop-shadow-sm">
            {auto.marca} <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy to-[#0145F2]">{auto.modelo}</span>
          </h1>

          <div className="mt-4">
            <BotonesInteractivos auto={auto} />
          </div>
        </div>

        {/* CONTENEDOR GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* ================= BLOQUE 1: GALERÍA DE IMÁGENES Y DATOS RÁPIDOS ================= */}
          <div className="lg:col-span-7 flex flex-col gap-6 order-1">
            
            <div className="hidden lg:flex text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mb-[-10px] items-center gap-2">
              <Link href="/" className="hover:text-[#0145F2] transition-colors">Inicio</Link> 
              <span className="text-gray-400">/</span>
              <Link href="/catalogo" className="hover:text-[#0145F2] transition-colors">Catálogo</Link> 
              <span className="text-gray-400">/</span>
              {/* AQUÍ TAMBIÉN CONVERTIMOS LA MARCA EN UN LINK PARA ESCRITORIO */}
              <Link 
                href={`/marcas/${auto.marca.toLowerCase().replace(/\s+/g, '-')}`} 
                className="text-[#0145F2] hover:text-sky-500 transition-colors"
              >
                {auto.marca}
              </Link> 
              <span className="text-gray-400">/</span>
              <span className="text-navy">{auto.modelo}</span>
            </div>

            <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-2 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.03)]">
              <GaleriaVehiculo
                imagenes={auto.multimedia_vehiculos || []}
                altText={`${auto.marca} ${auto.modelo}`}
              />
            </div>
            
            {/* GRILLA RÁPIDA DE DATOS TÉCNICOS (GLASSMORPHISM) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-2">
              <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(1,69,242,0.1)] hover:border-white hover:bg-white/60 transition-all duration-300 group">
                <CalendarDays className="w-6 h-6 text-[#0145F2] mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 group-hover:text-[#0145F2] transition-colors">Año</span>
                <span className="text-sm md:text-base font-black text-navy">{auto.anio}</span>
              </div>

              <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(1,69,242,0.1)] hover:border-white hover:bg-white/60 transition-all duration-300 group">
                <Gauge className="w-6 h-6 text-[#0145F2] mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 group-hover:text-[#0145F2] transition-colors">Kilometraje</span>
                <span className="text-sm md:text-base font-black text-navy">
                  {auto.kilometraje === 0 ? "0 km" : `${auto.kilometraje?.toLocaleString("es-AR")} km`}
                </span>
              </div>

              <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(1,69,242,0.1)] hover:border-white hover:bg-white/60 transition-all duration-300 group">
                <Fuel className="w-6 h-6 text-[#0145F2] mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 group-hover:text-[#0145F2] transition-colors">Combustible</span>
                <span className="text-sm md:text-base font-black text-navy capitalize">{auto.tipo_combustible || "-"}</span>
              </div>

              <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(1,69,242,0.1)] hover:border-white hover:bg-white/60 transition-all duration-300 group">
                <Settings2 className="w-6 h-6 text-[#0145F2] mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 group-hover:text-[#0145F2] transition-colors">Transmisión</span>
                <span className="text-sm md:text-base font-black text-navy capitalize">{auto.transmision || "-"}</span>
              </div>
            </div>
          </div>

          {/* ================= BLOQUE 2: COLUMNA DERECHA PANEL FIJO (GLASS) ================= */}
          <div className="lg:col-span-5 lg:row-span-2 relative order-2">
            <div className="lg:sticky lg:top-28 bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[32px] p-6 lg:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)] flex flex-col gap-6 relative overflow-hidden">
              
              {/* Brillo interior del panel */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none z-0"></div>

              <div className="hidden lg:block border-b border-gray-200/50 pb-5 relative z-10">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-2">
                  {esCeroKm ? "0km" : "Usado seleccionado"} | {auto.anio}
                </span>
                <h1 className="text-3xl lg:text-4xl font-black text-navy uppercase tracking-tighter leading-tight drop-shadow-sm">
                  {auto.marca} <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy to-[#0145F2]">{auto.modelo}</span>
                </h1>

                <div className="mt-5">
                  <BotonesInteractivos auto={auto} />
                </div>
              </div>

              {/* BLOQUE DE PRECIO */}
              <div className="relative z-10">
                <div className="flex flex-col gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-4xl md:text-5xl font-black text-navy tracking-tighter drop-shadow-sm">
                      $ {precioArs.toLocaleString("es-AR")}
                    </h2>
                    <Info className="w-5 h-5 text-gray-400 cursor-pointer hover:text-[#0145F2] transition-colors" />
                  </div>

                  {precioUsd && precioUsd > 0 && (
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 px-4 py-2 rounded-xl w-max">
                      <span className="text-sm font-black text-emerald-700 tracking-wide">
                        US$ {precioUsd.toLocaleString("en-US")}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed font-medium">
                  Incluye flete y formularios. <span className="text-gray-400 underline cursor-pointer hover:text-navy">¿Qué es?</span><br />
                  No incluye patentamiento. <span className="text-[#0145F2] underline cursor-pointer font-bold">Calcular</span>.<br />
                  Precio sin impuestos nacionales: ${" "}
                  <span className="font-bold">{(precioArs * 0.7).toLocaleString("es-AR", { maximumFractionDigits: 0 })}</span>
                </p>
              </div>

              {/* COMPRA PROTEGIDA */}
              <div className="bg-emerald-50/60 backdrop-blur-md border border-emerald-200/60 rounded-[20px] p-4 flex items-center justify-between hover:bg-emerald-100/60 hover:border-emerald-300 transition-all duration-300 cursor-pointer group relative z-10 shadow-[0_4px_15px_rgba(16,185,129,0.05)]">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100/80 p-2.5 rounded-full shadow-inner">
                    <ShieldCheck className="text-emerald-600 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-emerald-800 font-black text-xs md:text-sm tracking-wide">Compra protegida - Gratis</p>
                    <p className="text-emerald-600 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5">Sin costo adicional</p>
                  </div>
                </div>
                <ChevronRight className="text-emerald-600 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* LISTA DE INFO LATERAL */}
              <ul className="space-y-5 text-sm text-gray-600 relative z-10">
                <li className="flex items-start gap-3">
                  <div className="bg-white/60 p-2 rounded-full border border-white shadow-sm">
                    <Palette className="w-4 h-4 text-[#0145F2]" />
                  </div>
                  <div className="mt-1">
                    <strong className="text-navy block text-[11px] uppercase tracking-widest font-black">Colores disponibles</strong>
                    <span className="text-gray-500 font-medium text-xs">A consultar</span>
                  </div>
                </li>

                <li className="hidden lg:block w-full pt-2">
                  <a
                    href={linkWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-[#0145F2] to-sky-500 hover:from-blue-600 hover:to-sky-400 text-white font-black text-sm uppercase tracking-widest text-center py-4 rounded-2xl shadow-[0_8px_20px_rgba(1,69,242,0.3)] hover:shadow-[0_12px_25px_rgba(1,69,242,0.4)] transition-all duration-300 active:scale-95"
                  >
                    Consultar a un Asesor
                  </a>
                </li>

                <li className="flex items-start gap-3 pt-5 border-t border-gray-200/50">
                  <div className="bg-white/60 p-2 rounded-full border border-white shadow-sm">
                    <Clock className="w-4 h-4 text-[#0145F2]" />
                  </div>
                  <div className="mt-1">
                    <strong className="text-navy block text-[11px] uppercase tracking-widest font-black">Disponibilidad</strong>
                    <span className="text-gray-500 font-medium text-xs">Inmediata</span>
                  </div>
                </li>

                <li className="flex items-start gap-3 pt-5 border-t border-gray-200/50">
                  <div className="bg-white/60 p-2 rounded-full border border-white shadow-sm">
                    <MapPin className="w-4 h-4 text-[#0145F2]" />
                  </div>
                  <div className="w-full mt-1">
                    <strong className="text-navy block text-[11px] uppercase tracking-widest font-black mb-2">Punto de Venta Oficial</strong>
                    <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md border border-white px-3 py-1.5 rounded-xl shadow-sm">
                      <span className="text-xs font-black text-navy uppercase tracking-wide">Sucursal {auto.sucursales?.nombre || "Central"}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* ================= BLOQUE 3: ESPECIFICACIONES Y BANNER USADO ================= */}
          <div className="lg:col-span-7 order-3 flex flex-col gap-8">

            {/* BANNER TOMAMOS TU USADO (GLASS) */}
            <div className="bg-gradient-to-r from-navy to-[#0145F2] rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_12px_40px_rgba(1,69,242,0.2)] relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 backdrop-blur-sm pointer-events-none z-0"></div>
              <div className="absolute -right-4 -top-8 opacity-10 rotate-12 z-0 mix-blend-overlay">
                <CarFront className="w-48 h-48 text-white" />
              </div>
              <div className="relative z-10 text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-black text-white mb-2 uppercase tracking-tight drop-shadow-md">
                  ¿Querés entregar tu usado?
                </h3>
                <p className="text-xs md:text-sm text-sky-100 font-medium max-w-md">
                  Lo cotizamos en el acto y lo tomamos como parte de pago asegurándote el mejor valor del mercado para tu vehículo.
                </p>
              </div>
              <a
                href="/cotizador"
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 shrink-0 bg-white/10 backdrop-blur-xl border border-white/40 hover:bg-white text-white hover:text-navy font-black text-[10px] md:text-xs uppercase tracking-widest px-6 py-4 rounded-full transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.3)] flex items-center gap-2 active:scale-95 group"
              >
                Cotizar mi auto <ChevronRight className="w-4 h-4 text-white group-hover:text-[#0145F2] transition-colors" />
              </a>
            </div>
            
            <h3 className="text-2xl font-black text-navy tracking-tight drop-shadow-sm mb-[-10px] mt-4">Detalles de la unidad</h3>
            
            {/* PANEL DE ESPECIFICACIONES (GLASS) */}
            <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[32px] p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.03)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none z-0"></div>
              
              <div className="mb-6 pb-6 border-b border-gray-200/50 relative z-10">
                <span className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">
                  Versión y Especificaciones
                </span>
                <p className="text-lg font-black text-navy uppercase drop-shadow-sm">
                  {auto.version || `${auto.tipo || "Vehículo"} • ${auto.transmision || "Manual"}`}
                </p>
              </div>

              <div className="flex items-center gap-2 mb-4 relative z-10">
                <span className="bg-sky-500/10 backdrop-blur-md text-[#0145F2] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-sky-500/20 shadow-sm">
                  {esCeroKm ? "0KM" : "USADO"}
                </span>
                <span className="bg-gray-100/50 backdrop-blur-md text-gray-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                  CRÉDITO BNA
                </span>
              </div>

              <div className="mb-6 relative z-10">
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="text-3xl font-black text-navy drop-shadow-sm">$ {precioArs.toLocaleString("es-AR")}</h4>
                  {precioUsd && precioUsd > 0 && (
                    <span className="bg-emerald-500/10 backdrop-blur-md text-emerald-700 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-xs font-black tracking-wide shadow-sm">
                      US$ {precioUsd.toLocaleString("en-US")}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-2 font-medium">
                  Incluye flete y formularios. <span className="text-gray-400 underline cursor-pointer hover:text-navy transition-colors">¿Qué es?</span><br />
                  No incluye patentamiento. <span className="text-[#0145F2] underline cursor-pointer font-bold hover:text-blue-700 transition-colors">Calcular</span>.
                </p>
              </div>

              <ul className="space-y-5 pt-6 border-t border-gray-200/50 text-sm text-gray-600 relative z-10">
                <li className="flex items-start gap-3">
                  <div className="bg-white/60 p-2 rounded-full border border-white shadow-sm">
                    <Clock className="w-4 h-4 text-[#0145F2]" />
                  </div>
                  <div className="mt-1">
                    <strong className="text-navy block text-[11px] uppercase tracking-widest font-black">Disponibilidad</strong>
                    <span className="text-gray-500 font-medium text-xs">Inmediata</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-white/60 p-2 rounded-full border border-white shadow-sm">
                    <MapPin className="w-4 h-4 text-[#0145F2]" />
                  </div>
                  <div className="mt-1">
                    <strong className="text-navy block text-[11px] uppercase tracking-widest font-black mb-2">Punto de Venta Oficial</strong>
                    <div className="inline-flex items-center gap-1.5 bg-white/60 backdrop-blur-md border border-white px-3 py-1.5 rounded-xl shadow-sm">
                      <span className="text-xs font-black text-navy uppercase tracking-wide">Sucursal {auto.sucursales?.nombre || "Central"}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-white/60 p-2 rounded-full border border-white shadow-sm">
                    <CreditCard className="w-4 h-4 text-[#0145F2]" />
                  </div>
                  <div className="mt-1">
                    <strong className="text-navy block text-[11px] uppercase tracking-widest font-black">Precio al contado</strong>
                    <span className="text-xs text-gray-500 font-medium">Se puede financiar, consultar planes disponibles.</span>
                  </div>
                </li>
              </ul>
            </div>
            
          </div>
        </div>

        {/* ================= SECCIÓN AUTOS SIMILARES ================= */}
        {vehiculosSimilares && vehiculosSimilares.length > 0 && (
          <div className="mt-20 md:mt-28 border-t border-white/60 pt-16 relative z-10">
            <h3 className="text-2xl md:text-3xl font-black text-navy uppercase tracking-tighter mb-8 drop-shadow-sm">
              También podría <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy to-[#0145F2]">interesarte</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {vehiculosSimilares.map((simil) => (
                <Link
                  key={simil.id}
                  href={`/catalogo/${simil.slug}`}
                  className="block group h-full focus:outline-none"
                >
                  <div className="bg-white/40 backdrop-blur-2xl rounded-[28px] border border-white/60 overflow-hidden flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(1,69,242,0.12)] hover:border-white hover:bg-white/70 transition-all duration-500 relative transform group-hover:-translate-y-1">
                    
                    {/* Reflejo hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20"></div>

                    <div className="relative h-[180px] bg-white/30 flex items-center justify-center overflow-hidden p-4 mix-blend-multiply">
                      {simil.multimedia_vehiculos?.[0] ? (
                        <img
                          src={simil.multimedia_vehiculos[0].url_archivo}
                          alt={`${simil.marca} ${simil.modelo}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-medium">
                          Sin foto
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 sm:p-6 flex flex-col flex-grow relative z-10">
                      <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">
                        {simil.marca} • {simil.anio}
                      </span>
                      <h4 className="text-lg font-black text-navy uppercase leading-tight truncate drop-shadow-sm">
                        {simil.modelo}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium mt-1 truncate">
                        {simil.version || "Ver especificaciones"}
                      </p>

                      <div className="mt-auto pt-5 flex items-end justify-between border-t border-gray-200/50">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Desde</span>
                          <span className="text-xl font-black text-navy tracking-tighter">
                            $ {simil.precio_publicado_ars?.toLocaleString("es-AR")}
                          </span>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm group-hover:bg-[#0145F2] group-hover:border-[#0145F2] group-hover:text-white flex items-center justify-center transition-all duration-300 text-gray-400 group-hover:shadow-[0_0_15px_rgba(1,69,242,0.4)]">
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

      {/* ================= BOTÓN FLOTANTE MÓVIL DE CONSULTA (GLASS) ================= */}
      <div className="lg:hidden sticky bottom-0 w-full bg-white/70 backdrop-blur-3xl border-t border-white/60 p-4 z-[40] shadow-[0_-10px_30px_rgba(0,0,0,0.08)] mt-auto">
        <a
          href={linkWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-gradient-to-r from-[#0145F2] to-sky-500 hover:from-blue-600 hover:to-sky-400 text-white font-black text-sm uppercase tracking-widest text-center py-4 rounded-2xl shadow-[0_8px_20px_rgba(1,69,242,0.3)] transition-all duration-300 active:scale-95"
        >
          Consultar
        </a>
      </div>
    </div>
  );
}