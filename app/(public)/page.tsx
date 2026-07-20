import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

// Conexión a Supabase (modo lectura pública)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

// Le decimos a Next.js que siempre traiga datos frescos (no cachee esta página)
export const revalidate = 0;

export default async function HomePage() {
  // CONSULTA RELACIONAL: Traemos el vehículo, sus fotos y el nombre de su sucursal
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(
      `
      *,
      multimedia_vehiculos ( url_archivo ),
      sucursales ( nombre )
    `,
    )
    .in("estado", ["Disponible", "Reservado"])
    .order("created_at", { ascending: false });

  return (
    <div className="w-full text-white font-sans scroll-smooth">
      {/* 1. HERO */}
      <section
        id="inicio"
        className="relative h-screen w-full flex flex-col justify-center items-center text-center px-6 overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1614200187524-dc4b892acf16?q=80&w=2000&auto=format&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        <div className="relative z-20 max-w-7xl w-full flex flex-col items-center gap-2">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] w-full">
            LA FORMA MÁS <span className="text-[#0055A4]">CONFIABLE</span>
          </h1>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] w-full">
            DE COMPRAR O VENDER TU AUTO
          </h1>
          <p className="mt-8 text-sm md:text-lg font-serif italic text-gray-300">
            Vehículos premium seleccionados. Garantía absoluta en Zona Norte.
          </p>
        </div>
      </section>

      {/* 2. SUCURSALES */}
      <section id="sucursales" className="py-20 bg-[#050505]">
        <div className="max-w-[95%] mx-auto px-4">
          <h2 className="text-xl font-black uppercase tracking-tighter mb-10 text-center">
            Nuestras Sucursales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["Casa Central", "Panamericana", "La Lucila"].map((s, i) => (
              <Link
                key={i}
                href={`/sucursales/${s.toLowerCase().replace(" ", "-")}`}
                className="bg-[#111] p-8 rounded-2xl border border-white/5 hover:border-[#0055A4] transition-all text-center"
              >
                <h3 className="text-md font-black uppercase">{s}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CONTACTO */}
      <section id="contacto" className="py-16 bg-[#080808]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-black uppercase text-center mb-10">
            Contacto
          </h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#111] p-8 rounded-2xl border border-white/5">
            <input
              type="text"
              placeholder="Nombre"
              className="bg-[#050505] border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-[#0055A4]"
            />
            <input
              type="tel"
              placeholder="Teléfono"
              className="bg-[#050505] border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-[#0055A4]"
            />
            <textarea
              placeholder="Mensaje"
              className="md:col-span-2 bg-[#050505] border border-white/10 p-4 rounded-xl text-sm h-32 outline-none focus:border-[#0055A4]"
            ></textarea>
            <button
              type="button"
              className="md:col-span-2 bg-[#0055A4] hover:bg-[#1E6FD9] py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all"
            >
              Enviar Consulta
            </button>
          </form>
        </div>
      </section>

      {/* 4. STOCK ACTUALIZADO */}
      <section id="stock" className="py-20 bg-[#050505]">
        <div className="max-w-[95%] mx-auto px-4">
          <h2 className="text-xl font-black uppercase tracking-tighter mb-12">
            Nuestro Stock
          </h2>

          {vehiculos && vehiculos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {vehiculos.map((auto) => (
                <div
                  key={auto.id}
                  className="bg-[#111] rounded-2xl overflow-hidden border border-white/5 flex flex-col group"
                >
                  <div className="relative h-48 bg-gray-900 overflow-hidden">
                    {/* Renderizamos la foto directamente desde el array anidado */}
                    {auto.multimedia_vehiculos?.[0] && (
                      <img
                        src={auto.multimedia_vehiculos[0].url_archivo}
                        alt={`${auto.marca} ${auto.modelo}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}

                    {/* Etiqueta condicional si está reservado */}
                    {auto.estado === "Reservado" && (
                      <div className="absolute top-3 right-3 bg-[#D4AF37] text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        RESERVADO
                      </div>
                    )}
                  </div>

                  {/* PRECIOS: ARS prioritario, USD secundario */}
                  <div className="mb-4">
                    <div className="text-2xl font-black text-white font-mono">
                      ${auto.precio_ars?.toLocaleString()}{" "}
                      <span className="text-xs font-sans text-gray-400 font-normal">
                        ARS
                      </span>
                    </div>
                    {auto.precio_usd && (
                      <div className="text-xs font-bold text-[#0055A4] font-mono mt-0.5">
                        (${auto.precio_usd?.toLocaleString()} USD)
                      </div>
                    )}

                    {/* Espaciador flexible para empujar el botón hacia abajo */}
                    <div className="flex-grow"></div>

                    <a
                      href={`https://wa.me/5491100000000?text=Hola,%20me%20interesa%20el%20${auto.marca}%20${auto.modelo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-center text-[10px] font-bold uppercase border border-[#0055A4] px-4 py-3 rounded-full hover:bg-[#0055A4] transition-colors w-full inline-block"
                    >
                      Consultar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#111] rounded-2xl border border-white/5">
              <p className="text-gray-400">
                Actualmente estamos actualizando nuestro catálogo. ¡Volvé a
                consultar pronto!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="py-12 border-t border-white/5 text-center bg-[#050505]">
        <div className="flex justify-center gap-8 mb-8 text-gray-400">
          <a
            href="#"
            className="font-black text-xs hover:text-[#FFE600] transition-colors"
          >
            MELI
          </a>
          <a
            href="#"
            className="font-black text-xs hover:text-[#00F2EA] transition-colors"
          >
            TIKTOK
          </a>
        </div>
        <p className="text-[10px] text-gray-600 uppercase tracking-widest">
          © 2026 Pfaffen Autos
        </p>
      </footer>

      {/* BOTÓN FLOTANTE WHATSAPP */}
      <a
        href="https://wa.me/5491100000000"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 bg-[#25D366] text-white p-4 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
}
