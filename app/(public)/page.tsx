import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { MapPin, Phone, Award, Users, CheckCircle } from "lucide-react";
import { Bebas_Neue } from "next/font/google";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"] });

// Conexión a Supabase (modo lectura pública)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

export const revalidate = 0;

// Íconos SVG personalizados para redes sociales
const InstagramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4 text-[#0055A4]"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4 text-[#0055A4]"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export default async function HomePage() {
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
      {/* ================= 1. HERO ================= */}
      <section
        id="inicio"
        className="relative h-screen w-full flex flex-col justify-between items-center text-center px-4 pt-24 pb-4 overflow-hidden"
      >
        {/* Imagen de fondo - Ajustamos a 'center top 15%' para bajar los autos y alejar el plano */}
        <div
          className="absolute inset-0 bg-cover bg-[center_top_100%] z-0"
          style={{
            backgroundImage: "url('/hero-bg.png')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#050505] opacity-0"></div>
        </div>

        {/* CONTENEDOR SUPERIOR: Títulos agrupados más arriba para liberar el centro */}
        <div className="relative z-20 w-full flex flex-col items-center justify-start mt-0">
          <h1 className={`text-5xl md:text-7xl lg:text-[8rem] uppercase tracking-normal leading-[0.9] flex flex-col gap-1 md:gap-2 ${bebas.className}`}>
            <span className="text-white drop-shadow-lg">Tu próximo vehículo</span>
            <span className="text-[#0145F2] drop-shadow-[0_0_50px_rgba(59,130,246,0.8)]">Empieza acá.</span>
          </h1>

          <p className="mt-5 text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-white drop-shadow-md">
            Usados Seleccionados y <span className="text-[#3b82f6]">0 KM.</span>
          </p>

          <div className="my-5 relative flex justify-center items-center w-full max-w-[300px]">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent opacity-80"></div>
            <div className="absolute w-12 h-[2px] bg-white rounded-full shadow-[0_0_15px_#3b82f6]"></div>
          </div>

          <div className="font-serif">
            <p className="text-sm md:text-lg uppercase tracking-[0.25em] text-black mb-1 drop-shadow-md">
              La forma <span className="text-[#0145F2]">más confiable</span>
            </p>
            <p className="text-sm md:text-lg uppercase tracking-[0.25em] text-black drop-shadow-md">
              De comprar o vender tu auto
            </p>
          </div>
        </div>

        {/* CONTENEDOR INFERIOR: Botones pegados al borde inferior */}
        <div className="relative z-20 w-full max-w-6xl mt-auto mb-2 flex flex-wrap justify-center gap-3 md:gap-4 px-2">
          <a
            href="#stock"
            className="flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md transition-all group w-[160px] md:w-[180px]"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white mx-2">
              Ver Stock
            </span>
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </a>

          <a
            href="#contacto"
            className="flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md transition-all group w-[160px] md:w-[180px]"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              ></path>
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white mx-2 text-center leading-tight">
              Cotizar
              <br />
              Ahora
            </span>
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </a>

          <a
            href="#stock"
            className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#0047b3] to-[#0066ff] hover:from-[#0055cc] hover:to-[#1a75ff] border border-[#3b82f6] shadow-[0_0_25px_rgba(59,130,246,0.5)] rounded-2xl backdrop-blur-md transition-all transform hover:-translate-y-1 group w-[160px] md:w-[200px] z-30"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
            <span className="text-[12px] font-black uppercase tracking-widest text-white mx-2">
              Comprar
            </span>
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </a>

          <a
            href="#contacto"
            className="flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md transition-all group w-[160px] md:w-[180px]"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m11 17 2 2a1 1 0 1 0 3-3m-2 1 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-1.42-1.42l.88-.88a5 5 0 0 1 7.07 0l3.88 3.88a3 3 0 1 1-4.24 4.24l-2.5-2.5m-6 3-2.5-2.5a1 1 0 1 0-3 3l3.88 3.88a3 3 0 0 0 4.24 0l.88-.88a1 1 0 1 1 1.42 1.42l-.88.88a5 5 0 0 1-7.07 0l-3.88-3.88a3 3 0 1 1 4.24-4.24l2.5 2.5"
              ></path>
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white mx-2">
              Vender
            </span>
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </a>

          <a
            href="#contacto"
            className="flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md transition-all group w-[160px] md:w-[180px]"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path>
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white mx-2">
              Cambiar
            </span>
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </a>
        </div>

        {/* Doble Flecha hacia abajo */}
        <div className="relative z-20 animate-bounce text-white/40 hover:text-white transition-colors mt-2">
          <a href="#stock">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 13l-7 7-7-7m14-8l-7 7-7-7"
              />
            </svg>
          </a>
        </div>
      </section>

      {/* ================= 2. SUCURSALES (ACCESO A LANDINGS DE STOCK) ================= */}
      <section
        id="sucursales"
        className="py-24 bg-[#161616] relative overflow-hidden"
      >
        {/* Brillo de fondo sutil para dar profundidad */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#3b82f6]/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Encabezado con el estilo del Hero */}
          <div className="text-center mb-16 flex flex-col items-center">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white drop-shadow-lg">
              Nuestras Sucursales
            </h2>

            {/* Línea Divisoria Brillante (Igual al Hero) */}
            <div className="mt-8 mb-6 relative flex justify-center items-center w-full max-w-[200px]">
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent opacity-80"></div>
              <div className="absolute w-8 h-[2px] bg-white rounded-full shadow-[0_0_15px_#3b82f6]"></div>
            </div>

            <p className="text-gray-400 text-xs uppercase tracking-[0.2em]">
              Seleccioná tu concesionaria para ver el stock disponible
            </p>
          </div>

          {/* Grid de Tarjetas Glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                nombre: "Casa Central",
                zona: "Villa de Mayo",
                desc: "Unidades 0km y usados selectos",
              },
              {
                nombre: "Panamericana",
                zona: "Don Torcuato",
                desc: "Amplia exposición al aire libre",
              },
              {
                nombre: "Olivos",
                zona: "Vicente López",
                desc: "Showroom vidriado de alta gama",
              },
            ].map((sucursal, i) => (
              <Link
                key={i}
                href={`/sucursales/${sucursal.nombre.toLowerCase().replace(" ", "-")}`}
                className="relative p-[1px] rounded-3xl group overflow-hidden bg-gradient-to-b from-white/10 to-transparent hover:from-[#3b82f6]/60 transition-all duration-500 shadow-2xl hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transform hover:-translate-y-1"
              >
                {/* Fondo translúcido (Efecto Vidrio) */}
                <div className="bg-[#0a0a0a]/90 backdrop-blur-xl rounded-3xl p-8 h-full flex flex-col justify-between group-hover:bg-[#050505]/80 transition-all duration-500">
                  <div>
                    <div className="flex justify-between items-start mb-8">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#3b82f6] bg-[#3b82f6]/10 px-3 py-1.5 rounded-full border border-[#3b82f6]/20">
                        {sucursal.zona}
                      </span>
                      <MapPin className="w-5 h-5 text-white/20 group-hover:text-[#3b82f6] transition-colors duration-500" />
                    </div>

                    <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-3 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all">
                      {sucursal.nombre}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-mono">
                      {sucursal.desc}
                    </p>
                  </div>

                  {/* Botón inferior integrado */}
                  <div className="mt-10 flex items-center justify-between border-t border-white/5 pt-6 group-hover:border-[#3b82f6]/30 transition-colors">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 group-hover:text-white transition-colors">
                      Ver Catálogo
                    </span>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-[#0047b3] group-hover:to-[#0066ff] group-hover:shadow-[0_0_15px_#3b82f6] transition-all duration-500 border border-white/10 group-hover:border-[#3b82f6]">
                      <svg
                        className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 3. STOCK ACTUALIZADO ================= */}
      <section id="stock" className="py-20 bg-[#050505]">
        <div className="max-w-[95%] mx-auto px-4">
          <h2 className="text-xl font-black uppercase tracking-tighter mb-12 text-center">
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
                    {auto.multimedia_vehiculos?.[0] && (
                      <img
                        src={auto.multimedia_vehiculos[0].url_archivo}
                        alt={`${auto.marca} ${auto.modelo}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    {auto.estado === "Reservado" && (
                      <div className="absolute top-3 right-3 bg-[#D4AF37] text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        RESERVADO
                      </div>
                    )}
                  </div>

                  <div className="p-6 mb-4 flex-grow flex flex-col">
                    <h3 className="text-lg font-black uppercase mb-4">
                      {auto.marca} {auto.modelo}
                    </h3>

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

                    <div className="flex-grow min-h-[1.5rem]"></div>

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

      {/* ================= 4. LAS 3 COLUMNAS DE TARJETAS ================= */}
      <section className="py-20 bg-[#080808] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#111] p-8 rounded-3xl border border-white/5 flex flex-col justify-between hover:border-[#0055A4]/50 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#0055A4]/10 flex items-center justify-center text-[#0055A4] mb-6">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-4">
                Entregas Exclusivas
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Viví el momento único de retirar tu unidad en nuestros
                showrooms. Cada entrega se realiza con documentación al día,
                transferencia asegurada y el vehículo acondicionado al 100%.
              </p>
            </div>
            <div className="border-t border-white/5 pt-4 text-xs font-bold text-[#0055A4] uppercase tracking-wider">
              +5000 Clientes felices
            </div>
          </div>

          <div className="bg-[#111] p-8 rounded-3xl border border-white/5 flex flex-col justify-between hover:border-[#0055A4]/50 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#0055A4]/10 flex items-center justify-center text-[#0055A4] mb-6">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-4">
                Proceso Transparente
              </h3>
              <ul className="text-gray-400 text-sm space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-[#0055A4] font-bold">01.</span> Peritaje
                  mecánico riguroso al ingresar.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0055A4] font-bold">02.</span>{" "}
                  Verificación policial e informes de dominio.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0055A4] font-bold">03.</span>{" "}
                  Acondicionamiento estético y publicación al mejor precio.
                </li>
              </ul>
            </div>
            <div className="border-t border-white/5 pt-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
              Calidad garantizada
            </div>
          </div>

          <div className="bg-[#111] p-8 rounded-3xl border border-white/5 flex flex-col justify-between hover:border-[#0055A4]/50 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#0055A4]/10 flex items-center justify-center text-[#0055A4] mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-4">
                Quiénes Somos
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Somos una empresa familiar liderada por la familia Pfaffen junto
                a un equipo de asesores profesionales especializados en el
                mercado automotor de alta gama y 0km.
              </p>
            </div>
            <div className="border-t border-white/5 pt-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
              Trayectoria y Confianza
            </div>
          </div>
        </div>
      </section>

      {/* ================= ESTAMOS UBICADOS ================= */}
      <section className="py-28 bg-[#050505] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          {/* Encabezado Editorial */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-[#0055A4] font-black text-xs uppercase tracking-[0.4em] mb-4 block">
              Infraestructura & Presencia
            </span>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-6">
              Estamos Ubicados
            </h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              Espacios exclusivos diseñados para ofrecerle una experiencia
              superior.
            </p>
          </div>

          {/* Grid de Showrooms de Alta Gama */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Sucursal 1: Villa de Mayo */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between group hover:border-[#0055A4]/60 transition-all duration-500 shadow-2xl">
              <div>
                <div className="relative h-64 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-black/40 z-10"></div>
                  <img
                    src="https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=1000&auto=format&fit=crop"
                    alt="Villa de Mayo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <div className="p-8">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                    Villa de Mayo
                  </h3>
                  <p className="text-xs text-gray-400 mb-6 font-mono">
                    Casa Central
                  </p>
                </div>
              </div>

              <div className="p-8 pt-0 flex flex-col sm:flex-row gap-3">
                <a
                  href="#stock"
                  className="flex-1 bg-[#0055A4] hover:bg-[#1E6FD9] text-white text-center font-black uppercase text-[10px] tracking-widest py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(0,85,164,0.3)]"
                >
                  Ver Stock
                </a>
                <a
                  href="https://maps.app.goo.gl/YJUS51WcCzP46Roa9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white text-center font-black uppercase text-[10px] tracking-widest py-3.5 rounded-xl border border-white/10 transition-all"
                >
                  Cómo llegar
                </a>
              </div>
            </div>

            {/* Sucursal 2: Panamericana */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between group hover:border-[#0055A4]/60 transition-all duration-500 shadow-2xl">
              <div>
                <div className="relative h-64 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-black/40 z-10"></div>
                  <Link href="/" className="flex items-center">
                    <img
                      src="/pana.png"
                      alt="Panamericana"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </Link>
                </div>

                <div className="p-8">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                    Panamericana
                  </h3>
                  <p className="text-xs text-gray-400 mb-6 font-mono">
                    Sucursal Panamericana
                  </p>
                </div>
              </div>

              <div className="p-8 pt-0 flex flex-col sm:flex-row gap-3">
                <a
                  href="#stock"
                  className="flex-1 bg-[#0055A4] hover:bg-[#1E6FD9] text-white text-center font-black uppercase text-[10px] tracking-widest py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(0,85,164,0.3)]"
                >
                  Ver Stock
                </a>
                <a
                  href="https://maps.app.goo.gl/yayviUYc287UMUet7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white text-center font-black uppercase text-[10px] tracking-widest py-3.5 rounded-xl border border-white/10 transition-all"
                >
                  Cómo llegar
                </a>
              </div>
            </div>

            {/* Sucursal 3: Olivos */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between group hover:border-[#0055A4]/60 transition-all duration-500 shadow-2xl">
              <div>
                <div className="relative h-64 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-black/40 z-10"></div>
                  <img
                    src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1000&auto=format&fit=crop"
                    alt="Olivos"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <div className="p-8">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                    Olivos
                  </h3>
                  <p className="text-xs text-gray-400 mb-6 font-mono">
                    Sucursal Olivos
                  </p>
                </div>
              </div>

              <div className="p-8 pt-0 flex flex-col sm:flex-row gap-3">
                <a
                  href="#stock"
                  className="flex-1 bg-[#0055A4] hover:bg-[#1E6FD9] text-white text-center font-black uppercase text-[10px] tracking-widest py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(0,85,164,0.3)]"
                >
                  Ver Stock
                </a>
                <a
                  href="https://maps.app.goo.gl/gq9G5uCV1GhRdiDdA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white text-center font-black uppercase text-[10px] tracking-widest py-3.5 rounded-xl border border-white/10 transition-all"
                >
                  Cómo llegar
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 6 REDES SOCIALES CON ICONOS GRANDES Y ANIMACIÓN ================= */}
      <section className="py-20 bg-[#030303] border-t border-white/5 text-center">
        <div className="max-w-5xl mx-auto px-6">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-3 text-white">
            Nuestras Redes Oficiales
          </h3>
          <p className="text-gray-400 text-xs mb-12">
            Seguinos y enterate de los nuevos ingresos antes que nadie.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            {/* WhatsApp */}
            <a
              href="https://wa.me/5491100000000"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#111] hover:bg-[#25D366]/20 border border-white/5 hover:border-[#25D366] p-6 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-110 group shadow-xl"
            >
              <svg
                className="w-10 h-10 fill-current text-[#25D366] group-hover:rotate-12 transition-transform"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                WhatsApp
              </span>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#111] hover:bg-pink-500/20 border border-white/5 hover:border-pink-500 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-110 group shadow-xl"
            >
              <svg
                className="w-10 h-10 fill-current text-pink-500 group-hover:rotate-12 transition-transform"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Instagram
              </span>
            </a>

            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#111] hover:bg-blue-600/20 border border-white/5 hover:border-blue-600 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-110 group shadow-xl"
            >
              <svg
                className="w-10 h-10 fill-current text-blue-600 group-hover:rotate-12 transition-transform"
                viewBox="0 0 24 24"
              >
                <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.37 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.582 9 4.75V8z" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Facebook
              </span>
            </a>

            {/* Mercado Libre */}
            <a
              href="https://www.mercadolibre.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#111] hover:bg-yellow-400/20 border border-white/5 hover:border-yellow-400 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-110 group shadow-xl"
            >
              <svg
                className="w-10 h-10 fill-current text-yellow-400 group-hover:rotate-12 transition-transform"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3.125 17.518c-1.396 0-2.483-.418-3.262-1.254-.779-.836-1.168-1.996-1.168-3.48v-2.002h2.234v2.002c0 .762.207 1.34.62 1.734.414.394.974.591 1.678.591.704 0 1.264-.197 1.678-.591.413-.394.62-.972.62-1.734v-2.002h2.234v2.002c0 1.484-.389 2.644-1.168 3.48-.779.836-1.866 1.254-3.262 1.254zm-4.717-9.522v-2.234h6.318v2.234h-6.318z" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Mercado Libre
              </span>
            </a>

            {/* TikTok */}
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#111] hover:bg-cyan-400/20 border border-white/5 hover:border-cyan-400 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-110 group shadow-xl"
            >
              <svg
                className="w-10 h-10 fill-current text-cyan-400 group-hover:rotate-12 transition-transform"
                viewBox="0 0 24 24"
              >
                <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.242V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.144-4.53v-3.49a6.341 6.341 0 0 0-6.035 6.347 6.342 6.342 0 0 0 6.67 6.331 6.344 6.344 0 0 0 5.955-6.331V9.08a8.17 8.17 0 0 0 4.634 1.446V7.082a4.816 4.816 0 0 1-1.002-.396z" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                TikTok
              </span>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#111] hover:bg-red-600/20 border border-white/5 hover:border-red-600 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-110 group shadow-xl"
            >
              <svg
                className="w-10 h-10 fill-current text-red-600 group-hover:rotate-12 transition-transform"
                viewBox="0 0 24 24"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                YouTube
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ================= 7. FOOTER ================= */}
      <footer className="bg-[#050505] border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-white font-black uppercase tracking-wider text-sm mb-4">
              Contacto Directo
            </h4>
            <p className="text-xs text-gray-500 mb-4">
              Comunicate con nuestros asesores de ventas de forma inmediata.
            </p>
            <a
              href="https://wa.me/5491100000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-full hover:scale-105 transition-transform"
            >
              <Phone className="w-4 h-4" /> WhatsApp Oficial
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-white/5 pt-8 text-center text-[10px] text-gray-600 uppercase tracking-widest">
          © 2026 Pfaffen Autos. Todos los derechos reservados.
        </div>
      </footer>

      {/* BOTÓN FLOTANTE WHATSAPP */}
      <a
        href="https://wa.me/5491100000000"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 bg-[#25D366] text-white p-4 rounded-full shadow-[0_0_30px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform z-50 flex items-center justify-center"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );
}
