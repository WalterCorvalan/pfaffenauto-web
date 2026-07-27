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
  Star,
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

  // PLAN B (Tu idea): Rango de precios similares (+/- 30%)
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

  // PLAN C: Últimos 3 cargados absolutos (Para evitar que quede vacío si hay muy poco stock general)
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
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col relative">
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-24 lg:pb-20">
        {/* TÍTULO MÓVIL */}
        <div className="block lg:hidden mb-4">
          <div className="text-[10px] sm:text-xs text-gray-400 font-medium mb-2">
            <Link href="/" className="hover:text-primary">Inicio</Link> /{" "}
            <Link href="/catalogo" className="hover:text-primary">Catálogo</Link> /{" "}
            <span className="text-gray-600">{auto.marca}</span> /{" "}
            <span className="text-gray-600">{auto.modelo}</span>
          </div>
          <h1 className="text-2xl font-black text-navy uppercase tracking-tight leading-tight">
            {auto.marca} {auto.modelo}
          </h1>

          <BotonesInteractivos auto={auto} />
        </div>

        {/* CONTENEDOR GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* BLOQUE 1: GALERÍA DE IMÁGENES Y DATOS RÁPIDOS */}
          <div className="lg:col-span-7 flex flex-col gap-6 order-1">
            <div className="hidden lg:block text-xs text-gray-400 font-medium mb-[-10px]">
              <Link href="/" className="hover:text-primary">Inicio</Link> /{" "}
              <Link href="/catalogo" className="hover:text-primary">Catálogo</Link> /{" "}
              <span className="text-gray-600">{auto.marca}</span> /{" "}
              <span className="text-gray-600">{auto.modelo}</span>
            </div>

            <GaleriaVehiculo
              imagenes={auto.multimedia_vehiculos || []}
              altText={`${auto.marca} ${auto.modelo}`}
            />
            
            {/* GRILLA RÁPIDA DE DATOS TÉCNICOS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-2">
              <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:border-[#0145F2]/30 transition-colors">
                <CalendarDays className="w-6 h-6 text-[#0145F2] mb-2 opacity-80" />
                <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Año</span>
                <span className="text-sm md:text-base font-black text-navy">{auto.anio}</span>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:border-[#0145F2]/30 transition-colors">
                <Gauge className="w-6 h-6 text-[#0145F2] mb-2 opacity-80" />
                <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Kilometraje</span>
                <span className="text-sm md:text-base font-black text-navy">
                  {auto.kilometraje === 0 ? "0 km" : `${auto.kilometraje?.toLocaleString("es-AR")} km`}
                </span>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:border-[#0145F2]/30 transition-colors">
                <Fuel className="w-6 h-6 text-[#0145F2] mb-2 opacity-80" />
                <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Combustible</span>
                <span className="text-sm md:text-base font-black text-navy capitalize">{auto.tipo_combustible || "-"}</span>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:border-[#0145F2]/30 transition-colors">
                <Settings2 className="w-6 h-6 text-[#0145F2] mb-2 opacity-80" />
                <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Transmisión</span>
                <span className="text-sm md:text-base font-black text-navy capitalize">{auto.transmision || "-"}</span>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: COLUMNA DERECHA PANEL FIJO */}
          <div className="lg:col-span-5 lg:row-span-2 relative order-2">
            <div className="lg:sticky lg:top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-xl shadow-gray-200/50 flex flex-col gap-6">
              <div className="hidden lg:block border-b border-gray-100 pb-4">
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest block mb-1">
                  {esCeroKm ? "0km" : "Usado seleccionado"} | {auto.anio}
                </span>
                <h1 className="text-2xl lg:text-[28px] font-black text-navy uppercase tracking-tight leading-tight">
                  {auto.marca} {auto.modelo}
                </h1>

                <BotonesInteractivos auto={auto} />
              </div>

              {/* BLOQUE DE PRECIO */}
              <div>
                <div className="flex flex-col gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-4xl md:text-5xl font-black text-navy tracking-tighter">
                      $ {precioArs.toLocaleString("es-AR")}
                    </h2>
                    <Info className="w-4 h-4 text-gray-400 cursor-pointer" />
                  </div>

                  {precioUsd && precioUsd > 0 && (
                    <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg w-max">
                      <span className="text-sm font-black text-emerald-700 tracking-tight">
                        US$ {precioUsd.toLocaleString("en-US")}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  Incluye flete y formularios. <span className="text-gray-400 underline cursor-pointer">¿Qué es?</span><br />
                  No incluye patentamiento. <span className="text-primary underline cursor-pointer">Calcular</span>.<br />
                  Precio sin impuestos nacionales: ${" "}
                  {(precioArs * 0.7).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                </p>
              </div>

              {/* COMPRA PROTEGIDA */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 md:p-4 flex items-center justify-between hover:bg-emerald-100/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-full">
                    <ShieldCheck className="text-emerald-600 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-emerald-800 font-bold text-xs md:text-sm">Compra protegida - Gratis</p>
                    <p className="text-emerald-600 text-[10px] md:text-xs font-medium">Sin costo adicional para vos</p>
                  </div>
                </div>
                <ChevronRight className="text-emerald-600 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* LISTA DE INFO LATERAL */}
              <ul className="space-y-5 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <Palette className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <strong className="text-gray-800 block text-xs uppercase tracking-wide">Colores disponibles</strong>
                    <span className="text-gray-500">A consultar</span>
                  </div>
                </li>

                <li className="hidden lg:block w-full pt-2">
                  <a
                    href={linkWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-secondary hover:bg-cyan-500 text-white font-bold text-sm uppercase tracking-widest text-center py-4 rounded-xl shadow-lg shadow-secondary/30 transition-all hover:-translate-y-0.5"
                  >
                    Consultar
                  </a>
                </li>

                <li className="flex items-start gap-3 pt-4 border-t border-gray-100">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <strong className="text-gray-800 block text-xs uppercase tracking-wide">Disponibilidad</strong>
                    <span className="text-gray-500 font-medium">Inmediata</span>
                  </div>
                </li>

                <li className="flex items-start gap-3 pt-4 border-t border-gray-100">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="w-full">
                    <strong className="text-gray-800 block text-xs uppercase tracking-wide mb-1.5">Punto de Venta Oficial</strong>
                    <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                      <span className="text-xs font-bold text-navy">Sucursal {auto.sucursales?.nombre || "Central"}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* BLOQUE 3: ESPECIFICACIONES Y BANNER USADO */}
          <div className="lg:col-span-7 order-3 flex flex-col gap-6">

            {/* BANNER TOMAMOS TU USADO */}
            <div className="bg-gradient-to-r from-navy to-[#0145F2] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-[#0145F2]/20 relative overflow-hidden mt-2">
              <div className="absolute -right-4 -top-8 opacity-10 rotate-12">
                <CarFront className="w-48 h-48 text-white" />
              </div>
              <div className="relative z-10 text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-black text-white mb-2 uppercase tracking-tight">
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
                className="relative z-10 shrink-0 bg-white hover:bg-gray-50 text-navy font-black text-[10px] md:text-xs uppercase tracking-widest px-6 py-3.5 md:py-4 rounded-full transition-all shadow-xl flex items-center gap-2 active:scale-95"
              >
                Cotizar mi auto <ChevronRight className="w-4 h-4 text-[#0145F2]" />
              </a>
            </div>
            <h3 className="text-lg font-bold text-navy mb-[-10px]">Detalles de la unidad</h3>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm hover:border-primary/30 transition-colors">
              <div className="mb-5 pb-5 border-b border-gray-100">
                <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                  Versión y Especificaciones
                </span>
                <p className="text-base font-black text-navy uppercase">
                  {auto.version || `${auto.tipo || "Vehículo"} • ${auto.transmision || "Manual"}`}
                </p>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="bg-sky-100 text-primary text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-sky-200">
                  {esCeroKm ? "0KM" : "USADO"}
                </span>
                <span className="bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-gray-200">
                  CRÉDITO BNA
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-2xl font-black text-navy">$ {precioArs.toLocaleString("es-AR")}</h4>
                  {precioUsd && precioUsd > 0 && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded text-[11px] font-bold tracking-wide">
                      US$ {precioUsd.toLocaleString("en-US")}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Incluye flete y formularios. <span className="text-gray-400 underline cursor-pointer">¿Qué es?</span><br />
                  No incluye patentamiento. <span className="text-primary underline cursor-pointer">Calcular</span>.
                </p>
              </div>

              <ul className="space-y-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <strong className="text-gray-800 block text-xs uppercase tracking-wide">Disponibilidad</strong>
                    <span className="text-gray-500 font-medium">Inmediata</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <strong className="text-gray-800 block text-xs uppercase tracking-wide mb-1.5">Punto de Venta Oficial</strong>
                    <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                      <span className="text-xs font-bold text-navy">Sucursal {auto.sucursales?.nombre || "Central"}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CreditCard className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <strong className="text-gray-800 block text-xs uppercase tracking-wide">Precio al contado</strong>
                    <span className="text-xs text-gray-500">Se puede financiar, consultar planes.</span>
                  </div>
                </li>
              </ul>
            </div>

            
          </div>
        </div>

        {/* SECCIÓN AUTOS SIMILARES */}
        {vehiculosSimilares && vehiculosSimilares.length > 0 && (
          <div className="mt-16 md:mt-24 border-t border-gray-200 pt-10">
            <h3 className="text-xl md:text-2xl font-black text-navy uppercase tracking-tight mb-6">
              También podría interesarte
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {vehiculosSimilares.map((simil) => (
                <Link
                  key={simil.id}
                  href={`/catalogo/${simil.slug}`}
                  className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="relative h-48 bg-gray-50 overflow-hidden flex items-center justify-center p-4">
                    <img
                      src={simil.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"}
                      alt={`${simil.marca} ${simil.modelo}`}
                      className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">
                      {simil.marca} • {simil.anio}
                    </span>
                    <h4 className="text-lg font-black text-navy uppercase leading-tight truncate">
                      {simil.modelo}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {simil.version || "Ver especificaciones"}
                    </p>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Desde</span>
                        <span className="text-lg font-black text-navy tracking-tight">
                          $ {simil.precio_publicado_ars?.toLocaleString("es-AR")}
                        </span>
                      </div>
                      <span className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center group-hover:bg-primary transition-colors">
                        <ChevronRight className="w-4 h-4 text-primary group-hover:text-white" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
      </div>

      {/* BOTÓN FLOTANTE MÓVIL DE CONSULTA */}
      <div className="lg:hidden sticky bottom-0 w-full bg-white border-t border-gray-200 p-4 z-[40] shadow-[0_-10px_20px_rgba(0,0,0,0.05)] mt-auto">
        <a
          href={linkWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-secondary hover:bg-cyan-500 text-white font-bold text-sm uppercase tracking-widest text-center py-3.5 rounded-xl shadow-lg transition-colors"
        >
          Consultar
        </a>
      </div>
    </div>
  );
}