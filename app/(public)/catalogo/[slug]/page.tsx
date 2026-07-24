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
  Info
} from "lucide-react";

export const revalidate = 60;

export default async function VehiculoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Búsqueda del vehículo
  const { data: autoExacto } = await supabase
    .from("vehiculos")
    .select(`
      *, 
      multimedia_vehiculos ( url_archivo, tipo, orden ), 
      sucursales ( nombre, direccion )
    `)
    .eq("slug", slug)
    .maybeSingle();

  let auto = autoExacto;

  if (!auto) {
    const { data: autosSimilares } = await supabase
      .from("vehiculos")
      .select(`
        *, 
        multimedia_vehiculos ( url_archivo, tipo, orden ), 
        sucursales ( nombre, direccion )
      `)
      .ilike("slug", `${slug}%`)
      .limit(1);

    if (autosSimilares && autosSimilares.length > 0) {
      auto = autosSimilares[0];
    }
  }

  if (!auto) notFound();

  const mensajeWhatsApp = encodeURIComponent(`Hola Pfaffen Autos, estoy interesado en el ${auto.marca} ${auto.modelo} (${auto.anio}) que vi en la web.`);
  const linkWhatsApp = `https://wa.me/5491100000000?text=${mensajeWhatsApp}`;

  const esCeroKm = auto.kilometraje === 0;
  const precioArs = auto.precio_publicado_ars || 0;
  // Simulamos un valor USD referencial como en el diseño si no existe en BD
  const precioUsd = auto.precio_publicado_usd || Math.round(precioArs / 1485);

  return (
    <div className="min-h-screen bg-background pt-6 pb-32 lg:pb-20 font-sans text-foreground">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* ================= TÍTULO MÓVIL (Visible solo en celus, arriba de todo) ================= */}
        <div className="block lg:hidden mb-4">
          <div className="text-[10px] sm:text-xs text-gray-400 font-medium mb-2">
            <Link href="/" className="hover:text-primary">Inicio</Link> /{" "}
            <Link href="/catalogo" className="hover:text-primary">Catálogo</Link> /{" "}
            <span className="text-gray-600">{auto.marca}</span> / <span className="text-gray-600">{auto.modelo}</span>
          </div>
          <h1 className="text-2xl font-black text-navy uppercase tracking-tight leading-tight">
            {auto.marca} {auto.modelo}
          </h1>
          <p className="text-sm font-bold text-gray-600 uppercase">
            {auto.version || `${auto.tipo || "Vehículo"} • ${auto.transmision || "Manual"}`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          
          {/* ================= COLUMNA IZQUIERDA (Imagen y Detalles) ================= */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Migas de pan de Escritorio */}
            <div className="hidden lg:block text-xs text-gray-400 font-medium mb-[-10px]">
              <Link href="/" className="hover:text-primary">Inicio</Link> /{" "}
              <Link href="/catalogo" className="hover:text-primary">Catálogo</Link> /{" "}
              <span className="text-gray-600">{auto.marca}</span> / <span className="text-gray-600">{auto.modelo}</span>
            </div>

            {/* FOTO DEL VEHÍCULO (Silueta sobre fondo gris claro) */}
            <div className="relative w-full h-[250px] sm:h-[350px] md:h-[450px] bg-gray-50/80 rounded-2xl flex items-center justify-center p-4 md:p-10 overflow-hidden border border-gray-100 shadow-sm">
              <img
                src={auto.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"}
                alt={`${auto.marca} ${auto.modelo}`}
                className="w-full h-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded text-[10px] font-bold text-gray-500 uppercase tracking-widest border border-gray-200 shadow-sm">
                elcerokm.com
              </div>
              <div className="absolute bottom-4 right-4 text-[10px] font-medium text-gray-400 italic">
                * Imagen ilustrativa
              </div>
            </div>

            {/* Simulación de selectores de color (Referencia de diseño) */}
            <div className="flex items-center justify-center gap-4 bg-gray-50 rounded-full py-3 px-6 mx-auto w-max border border-gray-100">
              <div className="w-5 h-5 rounded-full bg-gray-400 border-2 border-white ring-2 ring-gray-400 cursor-pointer"></div>
              <div className="w-4 h-4 rounded-full bg-slate-300 cursor-pointer hover:scale-110 transition-transform"></div>
              <div className="w-4 h-4 rounded-full bg-blue-900 cursor-pointer hover:scale-110 transition-transform"></div>
              <div className="w-4 h-4 rounded-full bg-gray-100 border border-gray-300 cursor-pointer hover:scale-110 transition-transform"></div>
              <div className="w-4 h-4 rounded-full bg-black cursor-pointer hover:scale-110 transition-transform"></div>
            </div>

            {/* BLOQUE DE COTIZACIÓN / ESPECIFICACIONES */}
            <div className="mt-4">
              <h3 className="text-lg font-bold text-navy mb-4">Detalles de la unidad</h3>
              <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm hover:border-primary/30 transition-colors">
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-sky-100 text-primary text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-sky-200">
                    {esCeroKm ? "0KM" : "USADO"}
                  </span>
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-gray-200">
                    CRÉDITO BNA
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="text-xl md:text-2xl font-black text-navy">$ {precioArs.toLocaleString("es-AR")}</h4>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Incluye flete y formularios. <span className="text-gray-400 underline cursor-pointer">¿Qué es?</span><br />
                    No incluye patentamiento. <span className="text-primary underline cursor-pointer">Calcular</span>.
                  </p>
                </div>

                <ul className="space-y-3 pt-4 border-t border-gray-100 text-sm text-gray-600">
                  <li className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <strong className="text-gray-700">Disponibilidad:</strong> Inmediata / 30 días
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <strong className="text-gray-700 block">Concesionario oficial {auto.marca}</strong>
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Sucursal {auto.sucursales?.nombre || "Central"}
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CreditCard className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <strong className="text-gray-700 block">Precio al contado</strong>
                      <span className="text-xs text-gray-500">Se puede financiar, consultar planes.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

          </div>

          {/* ================= COLUMNA DERECHA (Panel Fijo Desktop) ================= */}
          <div className="lg:col-span-5 relative">
            
            {/* Contenedor Sticky para PC */}
            <div className="lg:sticky lg:top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-xl shadow-gray-200/50 flex flex-col gap-6">
              
              {/* Título Desktop */}
              <div className="hidden lg:block border-b border-gray-100 pb-4">
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest block mb-1">
                  {esCeroKm ? "0km" : "Usado seleccionado"} | {auto.anio}
                </span>
                <h1 className="text-2xl lg:text-[28px] font-black text-navy uppercase tracking-tight leading-tight">
                  {auto.marca} {auto.modelo}
                </h1>
                <p className="text-sm font-bold text-gray-500 uppercase mt-1">
                  {auto.version || `${auto.tipo || "Vehículo"} • ${auto.transmision || "Manual"}`}
                </p>
              </div>

              {/* BLOQUE DE PRECIO */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-4xl md:text-5xl font-black text-navy tracking-tighter">
                    $ {precioArs.toLocaleString("es-AR")}
                  </h2>
                  <Info className="w-4 h-4 text-gray-400 cursor-pointer" />
                </div>
                
                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  Incluye flete y formularios. <span className="text-gray-400 underline cursor-pointer">¿Qué es?</span><br />
                  No incluye patentamiento. <span className="text-primary underline cursor-pointer">Calcular</span>.<br />
                  Precio sin impuestos nacionales: $ {(precioArs * 0.7).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-sm font-bold text-gray-600">US$ {precioUsd.toLocaleString("en-US")}</span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    Dólar oficial prom $ 1.485 <span className="bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded font-bold">dolarito</span>
                  </span>
                </div>
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
                
                {/* Botón Desktop (En móvil se oculta porque va fijo abajo) */}
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
                    <span className="text-gray-500">Inmediata / 30 días</span>
                  </div>
                </li>

                <li className="flex items-start gap-3 pt-4 border-t border-gray-100">
                  <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <strong className="text-gray-800 block text-xs uppercase tracking-wide mb-1">Formas de pago</strong>
                    <span className="text-gray-500 text-xs block mb-2">Precio al contado / Se puede financiar, pero es otro precio. ⚠️</span>
                    <span className="bg-sky-100 text-primary text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-sky-200">
                      CRÉDITO BNA
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-3 pt-4 border-t border-gray-100">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="w-full">
                    <strong className="text-gray-800 block text-xs uppercase tracking-wide mb-1">
                      Concesionario oficial {auto.marca}
                    </strong>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      Ubicado en Sucursal {auto.sucursales?.nombre} <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between mt-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span className="text-[11px] font-bold text-gray-500">Calificaciones</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-navy mr-1">4.8</span>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              </ul>

            </div>
          </div>
        </div>

      </div>

      {/* ================= BARRA FIJA MÓVIL INFERIOR ================= */}
      {/* Esta barra solo aparece en celulares y se queda pegada abajo, empujando el logo de WhatsApp */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-[40] shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
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