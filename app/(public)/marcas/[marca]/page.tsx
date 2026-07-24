import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const revalidate = 60;

// Diccionario para personalizar textos y logos por marca de forma elegante
const BRAND_DATA: Record<string, { logo: string; descripcion: string; pills: string[] }> = {
  chevrolet: {
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Chevrolet-logo.png",
    descripcion: "Chevrolet combina tradición y modernidad: desde pickups robustas hasta autos urbanos, la marca ofrece confianza y tecnología a millones de conductores.",
    pills: ["Fuerza 💪", "Confianza 🤝", "Conectividad 📱"]
  },
  volkswagen: {
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg",
    descripcion: "Volkswagen es sinónimo de ingeniería alemana confiable, diseño atemporal y un confort de marcha excepcional para cualquier tipo de viaje.",
    pills: ["Ingeniería ⚙️", "Confort 🛋️", "Respaldo 🛡️"]
  },
  toyota: {
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg",
    descripcion: "La marca líder a nivel mundial. Toyota destaca por su durabilidad legendaria, valor de reventa y excelencia en servicio de postventa.",
    pills: ["Durabilidad 🛠️", "Reventa 📈", "Híbridos ⚡"]
  },
  // Fallback para marcas que no estén en el diccionario
  default: {
    logo: "/logo.png",
    descripcion: "Encontrá los mejores modelos 0km y usados seleccionados con el respaldo y la garantía que merecés.",
    pills: ["Calidad ⭐", "Seguridad 🛡️", "Garantía ✅"]
  }
};

export default async function MarcaPage({
  params,
}: {
  params: Promise<{ marca: string }>;
}) {
  const { marca } = await params;
  const supabase = await createClient();

  // 1. Convertir el slug ("chevrolet") a Título ("Chevrolet")
  const marcaName = marca.charAt(0).toUpperCase() + marca.slice(1).toLowerCase();

  // 2. Traer datos personalizados de la marca o usar los genéricos
  const marcaInfo = BRAND_DATA[marca.toLowerCase()] || BRAND_DATA.default;

  // 3. Consultar a Supabase los autos de esta marca
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(`
      *,
      multimedia_vehiculos ( url_archivo )
    `)
    .ilike("marca", marca)
    .in("estado", ["Disponible", "Reservado"])
    .order("precio_publicado_ars", { ascending: true });

  if (!vehiculos || vehiculos.length === 0) {
    // Si la marca existe pero no hay stock, mostramos un mensaje amigable
    return (
      <div className="min-h-screen bg-background pt-6 pb-20 text-center flex flex-col items-center justify-center">
        <h2 className="text-2xl font-black text-navy mb-2">No hay stock de {marcaName}</h2>
        <p className="text-gray-500 mb-6">Por el momento no tenemos unidades disponibles de esta marca.</p>
        <Link href="/marcas" className="text-primary font-bold hover:underline">Volver a Marcas</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20">
      
      {/* ================= PORTADA DE LA MARCA (Header) ================= */}
      <div className="relative w-full bg-gradient-to-b from-[#fdfbf7] to-white border-b border-gray-100 overflow-hidden pt-6 pb-12">
        {/* Círculo decorativo de fondo simulando el diseño */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f3efe6] rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#f3efe6] rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          {/* Migas de pan */}
          <div className="text-xs text-gray-500 font-medium mb-10">
            <Link href="/" className="hover:text-primary">Inicio</Link> /{" "}
            <Link href="/marcas" className="hover:text-primary">Marcas</Link> /{" "}
            <strong className="text-navy">{marcaName}</strong>
          </div>

          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            {/* Logo en caja flotante */}
            <div className="w-24 h-24 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-4 mb-6">
              <img 
                src={marcaInfo.logo} 
                alt={`Logo ${marcaName}`} 
                className="w-full h-full object-contain"
              />
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-navy tracking-tight mb-4">
              Modelos de {marcaName} 0km
            </h1>
            
            <p className="text-sm md:text-base text-gray-500 font-medium mb-8 leading-relaxed">
              {marcaInfo.descripcion}
            </p>

            {/* Píldoras de ventajas */}
            <h3 className="text-lg font-bold text-navy mb-4">¿Por qué elegir {marcaName}?</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {marcaInfo.pills.map((pill, idx) => (
                <span key={idx} className="bg-white border border-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-full shadow-sm">
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= GRILLA DE VEHÍCULOS ================= */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-10">
        <div className="text-center text-sm font-bold text-navy mb-8">
          {vehiculos.length} modelos encontrados.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {vehiculos.map((auto) => (
            <Link href={`/catalogo/${auto.slug}`} key={auto.id} className="block group">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl transition-all duration-300 p-4">
                
                {/* Imagen */}
                <div className="relative h-[160px] flex items-center justify-center overflow-hidden mb-4 bg-gray-50 rounded-xl">
                  <img
                    src={auto.multimedia_vehiculos?.[0]?.url_archivo || "/placeholder.jpg"}
                    alt={`${auto.marca} ${auto.modelo}`}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 p-2"
                  />
                </div>

                {/* Info Textual */}
                <div className="flex flex-col flex-grow">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                    {auto.marca}
                  </span>
                  <h3 className="text-lg font-black text-navy leading-tight capitalize truncate">
                    {auto.modelo}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    {auto.version || auto.tipo || "Vehículo"}
                  </p>

                  {/* Bloque de Precio y Botón */}
                  <div className="mt-auto pt-4">
                    <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-0.5">
                        Desde
                      </span>
                      <span className="text-lg font-black text-navy tracking-tight">
                        $ {auto.precio_publicado_ars?.toLocaleString("es-AR")}
                      </span>
                    </div>

                    {/* Botón Ver Detalles (Estilo Celeste Hollow) */}
                    <button className="w-full bg-white text-primary border border-primary/30 hover:bg-sky-50 font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-colors">
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