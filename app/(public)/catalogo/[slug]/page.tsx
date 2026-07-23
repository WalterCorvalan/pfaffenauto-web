import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { MapPin, ArrowLeft, Fuel, Cog, Gauge, CalendarDays, Palette, CheckCircle2, Phone, ShieldCheck, Car } from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export const revalidate = 60;

export default async function VehiculoDetallePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: auto } = await supabase
    .from("vehiculos")
    .select(`
      *, 
      multimedia_vehiculos ( url_archivo, tipo, orden ), 
      sucursales ( nombre, direccion )
    `)
    .eq("slug", slug)
    .single();

  if (!auto) notFound();

  const mensajeWhatsApp = encodeURIComponent(`Hola Pfaffen Autos, estoy interesado en el ${auto.marca} ${auto.modelo} (${auto.anio}) que vi en la web.`);
  const linkWhatsApp = `https://wa.me/5491100000000?text=${mensajeWhatsApp}`;

  const tecnicas = [
    { icon: CalendarDays, label: "Año", value: auto.anio },
    { icon: Gauge, label: "Kilómetros", value: `${auto.kilometraje?.toLocaleString("es-AR")} km` },
    { icon: Cog, label: "Transmisión", value: auto.transmision },
    { icon: Fuel, label: "Combustible", value: auto.tipo_combustible },
    { icon: Palette, label: "Color", value: auto.color },
    { icon: Car, label: "Tipo", value: auto.tipo || "N/D" },
    { icon: ShieldCheck, label: "Origen", value: auto.origen },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 pb-20 font-sans">
      <div className="max-w-[90rem] mx-auto px-4 md:px-8">
        
        {/* Botón Volver */}
        <div className="mb-8">
          <Link 
            href="/catalogo" 
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al Catálogo
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Galería */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="w-full h-[40svh] md:h-[60svh] bg-[#0A0F16] rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative">
              <img
                src={auto.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"}
                alt={`${auto.marca} ${auto.modelo}`}
                className="w-full h-full object-cover object-center"
              />
              {auto.estado === "Reservado" && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
                  Reservado
                </div>
              )}
            </div>

            {/* Miniaturas */}
            <div className="grid grid-cols-5 gap-3 md:gap-4">
              {auto.multimedia_vehiculos?.slice(1, 6).map((img: any, idx: number) => (
                <div key={idx} className="h-20 md:h-28 bg-[#0A0F16] rounded-xl border border-white/5 overflow-hidden hover:border-[#0145F2]/50 transition-colors cursor-pointer shadow-md">
                  <img src={img.url_archivo} alt="Thumbnail" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar de Compra / Contacto */}
          <aside className="lg:col-span-4 flex flex-col gap-8 lg:sticky lg:top-36 h-max">
            <div className="bg-[#0A0F16] border border-white/10 rounded-2xl p-8 shadow-xl">
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-2 leading-tight">
                {auto.marca} {auto.modelo}
              </h1>
              <p className="text-gray-400 text-sm font-medium mb-8">
                {auto.version || "Unidad Seleccionada"}
              </p>

              <div className="flex justify-between items-center mb-8 pb-8 border-b border-white/5">
                <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Precio publicado ARS</span>
                <p className="text-white font-black text-3xl tracking-tight">
                  ${auto.precio_publicado_ars?.toLocaleString("es-AR")}
                </p>
              </div>

              <a 
                href={linkWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#1fbe58] text-white font-bold uppercase tracking-widest text-xs py-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(37,211,102,0.3)] hover:shadow-[0_0_35px_rgba(37,211,102,0.5)] hover:-translate-y-1"
              >
                <Phone className="w-4 h-4" /> Consultar por WhatsApp
              </a>
            </div>

            {/* Ficha Técnica */}
            <div className="bg-[#0A0F16] border border-white/10 rounded-2xl p-8 shadow-xl">
              <h4 className="text-white font-black uppercase tracking-widest text-[11px] mb-8">Ficha Técnica</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                {tecnicas.map((spec, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <spec.icon className="w-5 h-5 text-[#0145F2] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{spec.label}</p>
                      <p className="text-sm text-white font-medium">{spec.value || "N/D"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sucursal */}
            <div className="bg-[#0A0F16] border border-white/10 rounded-xl p-5 flex items-center gap-4 text-gray-400 text-xs shadow-lg">
              <MapPin className="w-5 h-5 text-gray-600 shrink-0" />
              <p>
                Ubicado en Sucursal <span className="text-white font-bold">{auto.sucursales?.nombre || "Casa Central"}</span> <br/>
                {auto.sucursales?.direccion}
              </p>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}