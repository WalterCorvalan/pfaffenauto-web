import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
export const revalidate = 60;

// Diccionario para personalizar textos y logos por marca de forma elegante
const BRAND_DATA: Record<
  string,
  { logoR: string; logo: string; descripcion: string; pills: string[] }
> = {
  chevrolet: {
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Chevrolet-logo.png",
    logoR: "",
    descripcion: "Chevrolet combina tradición y modernidad: desde pickups robustas hasta autos urbanos, la marca ofrece confianza y tecnología.",
    pills: ["Fuerza 💪", "Confianza 🤝", "Conectividad 📱"],
  },
  volkswagen: {
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg",
    logoR: "",
    descripcion: "Volkswagen es sinónimo de ingeniería alemana confiable, diseño atemporal y un confort de marcha excepcional para cualquier viaje.",
    pills: ["Ingeniería ⚙️", "Confort 🛋️", "Respaldo 🛡️"],
  },
  toyota: {
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg",
    logoR: "",
    descripcion: "La marca líder a nivel mundial. Toyota destaca por su durabilidad legendaria, valor de reventa y excelencia en servicio de postventa.",
    pills: ["Durabilidad 🛠️", "Reventa 📈", "Híbridos ⚡"],
  },
  default: {
    logo: "/logo.png",
    logoR: "/r.png",
    descripcion: "Encontrá los mejores modelos 0km y usados seleccionados con el respaldo y la garantía que merecés.",
    pills: ["Calidad ⭐", "Seguridad 🛡️", "Garantía ✅"],
  },
};

export default async function MarcaPage({
  params,
}: {
  params: Promise<{ marca: string }>;
}) {
  const { marca } = await params;
  const supabase = await createClient();

  const marcaName = marca.charAt(0).toUpperCase() + marca.slice(1).toLowerCase();
  // Si busca "ford" y no está en la lista, usamos default (Pfaffen)
  const marcaInfo = BRAND_DATA[marca.toLowerCase()] || BRAND_DATA.default;

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(`
      *,
      multimedia_vehiculos ( url_archivo )
    `)
    .ilike("marca", marca)
    .in("estado", ["Disponible", "Reservado"])
    .order("precio_publicado_ars", { ascending: true });

  // ESTADO VACÍO (Glassmorphism)
  if (!vehiculos || vehiculos.length === 0) {
    return (
      <div className="min-h-[80vh] bg-[#E9ECEF] relative overflow-hidden flex flex-col items-center justify-center px-4 w-full">
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-[#0145F2]/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
        
        <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[40px] p-8 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.05)] text-center relative z-10 max-w-xl">
          <div className="w-20 h-20 bg-white/60 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/80">
             <ShieldCheck className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-3xl font-black text-navy mb-4 tracking-tight drop-shadow-sm">
            No hay stock de {marcaName}
          </h2>
          <p className="text-gray-600 font-medium mb-8 text-sm md:text-base leading-relaxed">
            Por el momento no tenemos unidades disponibles de esta marca en ninguna de nuestras sucursales.
          </p>
          <a
            href={`https://wa.me/5491121907000?text=¡Hola! Buscaba un ${marcaName} en la página y vi que no hay stock. ¿Me pueden avisar cuando ingrese uno?`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0145F2] to-sky-500 hover:from-blue-600 hover:to-sky-400 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest px-8 py-4 rounded-full transition-all duration-300 shadow-[0_8px_25px_rgba(1,69,242,0.3)] active:scale-95 mb-6"
          >
            Avisarme si ingresa
          </a>
          <br/>
          <Link href="/marcas" className="text-[#0145F2] font-black hover:text-navy text-xs uppercase tracking-widest transition-colors">
            Volver a Marcas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E9ECEF] font-sans text-foreground pb-24 relative overflow-hidden">
      
      {/* ================= LUCES AMBIENTALES ================= */}
      <div className="absolute top-[-5%] left-[-10%] w-[600px] h-[600px] bg-slate-400/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] bg-[#0145F2]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* ================= PORTADA DE LA MARCA (Glass Header) ================= */}
      <div className="relative w-full pt-10 pb-16 px-4 md:px-6 z-10">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mb-8 flex items-center gap-2 justify-center">
            <Link href="/" className="hover:text-[#0145F2] transition-colors">Inicio</Link> 
            <span className="text-gray-400">/</span>
            <Link href="/marcas" className="hover:text-[#0145F2] transition-colors">Marcas</Link> 
            <span className="text-gray-400">/</span>
            <strong className="text-navy">{marcaName}</strong>
          </div>

          <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[40px] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent pointer-events-none z-0"></div>

            <div className="relative z-10 flex flex-col items-center">
              
              {/* ========================================================
                  CAJA DEL LOGO: Ahora controlamos la "R" independientemente
                  ======================================================== */}
              <div className="relative w-24 h-24 md:w-28 md:h-28 bg-white/60 backdrop-blur-md rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-white/80 flex items-center justify-center p-5 mb-6">
                
                {/* Logo Principal */}
                <img
                  src={marcaInfo.logo}
                  alt={`Logo ${marcaName}`}
                  className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm"
                />
                
                {/* R de Marca Registrada: brightness-0 la fuerza a ser NEGRA */}
                {marcaInfo.logoR && (
                  <img
                    src={marcaInfo.logoR}
                    alt="Marca Registrada"
                    className="absolute top-10.5 right-1.5 w-2.5 h-2.5 object-contain brightness-0 opacity-80"
                  />
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-navy tracking-tighter mb-4 drop-shadow-sm uppercase">
                Modelos <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy to-[#0145F2]">{marcaName}</span>
              </h1>

              <p className="text-sm md:text-base text-gray-600 font-medium mb-8 leading-relaxed max-w-xl">
                {marcaInfo.descripcion}
              </p>

              {/* Píldoras de ventajas (Glass) */}
              <div className="flex flex-wrap justify-center gap-3">
                {marcaInfo.pills.map((pill, idx) => (
                  <span
                    key={idx}
                    className="bg-white/50 backdrop-blur-md border border-white/80 text-navy text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.02)]"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= GRILLA DE VEHÍCULOS (Glass Cards) ================= */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        <div className="text-center mb-8">
          <span className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-[#0145F2] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
            <strong className="text-navy">{vehiculos.length}</strong> modelos encontrados
          </span>
        </div>

        {/* FORZAMOS 2 COLUMNAS EN MÓVIL y escalamos hacia arriba */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {vehiculos.map((auto) => (
            <Link
              href={`/catalogo/${auto.slug}`}
              key={auto.id}
              className="block group focus:outline-none h-full"
            >
              <div className="bg-white/40 backdrop-blur-2xl rounded-[24px] md:rounded-[28px] border border-white/60 overflow-hidden flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(1,69,242,0.12)] hover:border-white hover:bg-white/70 transition-all duration-500 relative transform group-hover:-translate-y-1 p-3 md:p-4">
                
                {/* Reflejo hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20"></div>

                {/* Imagen */}
                <div className="relative h-[120px] sm:h-[160px] flex items-center justify-center overflow-hidden mb-4 bg-white/30 rounded-xl md:rounded-[20px] mix-blend-multiply">
                  <img
                    src={auto.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"}
                    alt={`${auto.marca} ${auto.modelo}`}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out p-2"
                  />
                  {auto.estado === "Reservado" && (
                    <div className="absolute top-2 right-2 bg-yellow-100/90 backdrop-blur-md text-yellow-800 border border-yellow-200/80 px-2.5 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest shadow-sm z-10">
                      Reservado
                    </div>
                  )}
                </div>

                {/* Info Textual */}
                <div className="flex flex-col flex-grow relative z-10 px-1">
                  <span className="text-[9px] sm:text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">
                    {auto.marca}
                  </span>
                  <h3 className="text-sm sm:text-base md:text-lg font-black text-navy leading-tight uppercase truncate drop-shadow-sm">
                    {auto.modelo}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-1 truncate">
                    {auto.version || auto.tipo || "Vehículo"}
                  </p>

                  {/* Bloque de Precio y Botón */}
                  <div className="mt-auto pt-4">
                    <div className="bg-white/50 backdrop-blur-md rounded-xl p-3 mb-3 border border-white/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                      <span className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase tracking-widest block mb-0.5">
                        Desde
                      </span>
                      <span className="text-xs sm:text-base md:text-lg font-black text-navy tracking-tighter drop-shadow-sm">
                        $ {auto.precio_publicado_ars?.toLocaleString("es-AR")}
                      </span>
                    </div>

                    <button className="w-full bg-white/80 backdrop-blur-md text-navy border border-white/80 hover:bg-[#0145F2] hover:text-white hover:border-[#0145F2] font-black text-[10px] sm:text-xs uppercase tracking-widest py-2.5 sm:py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow-[0_8px_20px_rgba(1,69,242,0.3)] active:scale-95">
                      Ver detalles
                    </button>
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}