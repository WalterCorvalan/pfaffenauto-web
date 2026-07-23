import { createClient } from "@supabase/supabase-js";
import { MapPin, ArrowLeft, Fuel, Cog, Gauge, CalendarDays, Palette, CheckCircle2, Phone, ShieldCheck, Car, AlertCircle } from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export const revalidate = 60;

export default async function VehiculoDetallePage({ params }: { params: Promise<any> }) {
  
  // Resolvemos los parámetros de forma segura (funciona si la carpeta es [slug] o [id])
  const resolvedParams = await params;
  const identificador = resolvedParams.slug || resolvedParams.id;

  // 1. Intentamos buscar por el slug amigable usando maybeSingle()
  let { data: vehiculo } = await supabase
    .from("vehiculos")
    .select(`
      *,
      multimedia_vehiculos ( url_archivo ),
      sucursales ( nombre, direccion )
    `)
    .eq("slug", identificador)
    .maybeSingle();

  // 2. Si no lo encuentra por slug, probamos buscando por ID (por compatibilidad)
  if (!vehiculo && identificador) {
    const { data: vehiculoPorId } = await supabase
      .from("vehiculos")
      .select(`
        *,
        multimedia_vehiculos ( url_archivo ),
        sucursales ( nombre, direccion )
      `)
      .eq("id", identificador)
      .maybeSingle();
    
    vehiculo = vehiculoPorId;
  }

  // Si definitivamente no existe en la base de datos
  if (!vehiculo) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center text-white font-sans px-6 relative overflow-hidden pt-32 pb-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0">
          <span className="text-[15vw] font-black text-white/[0.012] uppercase tracking-tighter whitespace-nowrap">
            PFAFFEN
          </span>
        </div>

        <div className="relative z-10 max-w-4xl flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0055A4] to-[#1E6FD9] rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-[#0055A4]/30">
            <AlertCircle className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-3xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4 drop-shadow-md">
            Vehículo <span className="text-[#0145F2]">no encontrado</span>
          </h2>
          
          <p className="text-sm md:text-base text-gray-400 font-medium mb-12 max-w-xl leading-relaxed">
            Lo sentimos, no pudimos encontrar el vehículo que buscás. Es posible que haya sido vendido o reservado recientemente.
          </p>

          <Link 
            href="/catalogo" 
            className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 text-white text-[11px] font-black uppercase tracking-widest px-10 py-4 rounded-full transition-all group shadow-xl hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-4 h-4 text-[#0145F2] group-hover:-translate-x-1 transition-transform" />
            Volver al catálogo completo
          </Link>
        </div>
      </div>
    );
  }

  const mensajeWhatsApp = encodeURIComponent(`Hola Pfaffen Autos, estoy interesado en el ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.anio}) que vi en la web.`);
  const linkWhatsApp = `https://wa.me/5491100000000?text=${mensajeWhatsApp}`;

  const tecnicas = [
    { icon: CalendarDays, label: "Año", value: vehiculo.anio },
    { icon: Gauge, label: "Kilómetros", value: `${vehiculo.kilometraje?.toLocaleString("es-AR")} km` },
    { icon: Cog, label: "Transmisión", value: vehiculo.transmision },
    { icon: Fuel, label: "Combustible", value: vehiculo.tipo_combustible },
    { icon: Palette, label: "Color", value: vehiculo.color },
    { icon: Car, label: "Tipo", value: vehiculo.tipo || "N/D" },
    { icon: ShieldCheck, label: "Origen", value: vehiculo.origen },
  ];

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-20 font-sans text-white">
      <div className="max-w-[90rem] mx-auto px-4 md:px-8">
        
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
          
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="w-full h-[40svh] md:h-[60svh] bg-[#0A0F16] rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative">
              <img
                src={vehiculo.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"}
                alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                className="w-full h-full object-cover object-center"
              />
              
              {vehiculo.estado === "Reservado" && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
                  Reservado
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-3 md:gap-4">
              {vehiculo.multimedia_vehiculos?.slice(1, 6).map((img: any, idx: number) => (
                <div key={idx} className="h-20 md:h-28 bg-[#0A0F16] rounded-xl border border-white/5 overflow-hidden hover:border-[#0145F2]/50 transition-colors cursor-pointer shadow-md">
                  <img src={img.url_archivo} alt="Thumbnail" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-4 flex flex-col gap-8 lg:sticky lg:top-36 h-max">
            
            <div className="bg-[#0A0F16] border border-white/10 rounded-2xl p-8 shadow-xl">
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-2 leading-tight">
                {vehiculo.marca} {vehiculo.modelo}
              </h1>
              <p className="text-gray-400 text-sm font-medium mb-8">
                {vehiculo.version}
              </p>

              <div className="flex justify-between items-center mb-8 pb-8 border-b border-white/5">
                <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Precio publicado ARS</span>
                <p className="text-white font-black text-3xl tracking-tight">
                  ${vehiculo.precio_publicado_ars?.toLocaleString("es-AR")}
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

            <div className="flex flex-col gap-4">
              <div className="bg-[#0A0F16] border border-white/10 rounded-xl p-5 flex items-center gap-4 text-gray-400 text-xs shadow-lg">
                <MapPin className="w-5 h-5 text-gray-600 shrink-0" />
                <p>
                  Ubicado en Sucursal <span className="text-white font-bold">{vehiculo.sucursales?.nombre || "Casa Central"}</span> <br/>
                  {vehiculo.sucursales?.direccion}
                </p>
              </div>
              <div className="bg-[#0A0F16] border border-white/10 rounded-xl p-5 flex items-center gap-4 text-gray-400 text-xs shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-[#0145F2] shrink-0" />
                <p>Vehículo verificado mecánicamente y con documentación lista para transferir.</p>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}