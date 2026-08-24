"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Heart, Phone, Car, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function FavoritosPage() {
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  // Cargamos los favoritos desde el localStorage al iniciar
  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem("pfaffen_favs") || "[]");
    setFavoritos(favs);
    setMounted(true); // Previene errores de hidratación en Next.js
  }, []);

  const eliminarFavorito = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Evita que se dispare el Link al auto
    const nuevosFavs = favoritos.filter((f) => f.id !== id);
    setFavoritos(nuevosFavs);
    localStorage.setItem("pfaffen_favs", JSON.stringify(nuevosFavs));
  };

  const enviarPorWhatsApp = () => {
    const numeroOficial = "5491121907000"; // Tu número oficial
    let mensaje = "¡Hola Pfaffen Autos! 🚘 Estoy interesado en estos vehículos que guardé en mis favoritos:%0A%0A";
    
    favoritos.forEach((fav, index) => {
      mensaje += `*${index + 1}. ${fav.marca} ${fav.modelo}*%0A`;
      mensaje += `💵 Precio: ${fav.precio_usd ? `US$${fav.precio_usd.toLocaleString("en-US")}` : `$${fav.precio_ars?.toLocaleString("es-AR")}`}%0A`;
      mensaje += `🔗 Link: https://pfaffenautos.com.ar/catalogo/${fav.slug}%0A%0A`;
    });

    mensaje += "Me gustaría recibir más información. ¡Gracias!";
    window.open(`https://wa.me/${numeroOficial}?text=${mensaje}`, "_blank");
  };

  // Evitamos renderizar hasta que el cliente esté montado
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#030303] font-sans text-slate-900 dark:text-white pb-24 relative overflow-hidden">
      
      {/* ================= MESH GRADIENT / LUCES AMBIENTALES ================= */}
      {/* Destello Rojo Central */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-500/10 dark:bg-red-500/15 rounded-[100%] blur-[120px] pointer-events-none z-0" />
      {/* Destello Azul Lateral */}
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[600px] bg-[#0145F2]/10 dark:bg-sky-500/10 rounded-full blur-[150px] pointer-events-none z-0 transform rotate-45" />

      {/* ================= HERO EXPANSIVO (ULTRA MODERNO) ================= */}
      <section className="relative z-10 pt-24 pb-20 px-4 md:px-6 flex flex-col items-center justify-center min-h-[50vh]">
        
        {/* Breadcrumb minimalista */}
        <nav className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700" />
          <span className="text-slate-900 dark:text-white">Favoritos</span>
        </nav>

        {/* Etiqueta Superior Flotante */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xl shadow-red-500/5 dark:shadow-red-500/5 backdrop-blur-xl mb-8 transform hover:scale-105 transition-transform cursor-default">
          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300">
            Tu Selección
          </span>
        </div>

        {/* Título Gigante */}
        <h1 className="text-6xl md:text-[80px] lg:text-[110px] font-black tracking-tighter text-center leading-[0.85] mb-8 text-slate-900 dark:text-white">
          MIS <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400 dark:from-red-500 dark:to-rose-400">
            FAVORITOS
          </span>
        </h1>

        {/* Bajada */}
        <p className="text-slate-500 dark:text-slate-400 max-w-xl text-center text-sm md:text-base font-medium leading-relaxed mb-10">
          Tenés <strong className="text-slate-900 dark:text-white">{favoritos.length}</strong> {favoritos.length === 1 ? 'vehículo guardado' : 'vehículos guardados'} en tu lista personal.
        </p>

        {/* BOTÓN WHATSAPP GLOBAL (CENTRALIZADO Y MASIVO) */}
        {favoritos.length > 0 && (
          <button 
            onClick={enviarPorWhatsApp}
            className="bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 active:scale-95 shrink-0"
          >
            <Phone className="w-5 h-5" /> 
            Consultar por {favoritos.length} {favoritos.length === 1 ? 'auto' : 'autos'}
          </button>
        )}
      </section>

      {/* ================= LÍNEA DIVISORIA SUTIL ================= */}
      {favoritos.length > 0 && (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 relative z-10 mb-12">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
        </div>
      )}

      {/* ================= CONTENIDO (GRILLA O ESTADO VACÍO) ================= */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        {favoritos.length > 0 ? (
          <motion.div 
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {favoritos.map((auto) => (
              <motion.div 
                key={auto.id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="h-full"
              >
                <Link href={`/catalogo/${auto.slug}`} className="block group h-full">
                  <div className="bg-white dark:bg-[#0a0a0a] rounded-[24px] border border-slate-200/80 dark:border-white/5 overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl dark:shadow-none transition-all duration-300 relative group-hover:-translate-y-1">

                    {/* IMAGEN DEL VEHÍCULO Y BOTÓN ELIMINAR */}
                    <div className="relative h-56 w-full bg-slate-100 dark:bg-[#111] overflow-hidden">
                      {/* Botón Flotante Glassmorphism para eliminar */}
                      <button
                        onClick={(e) => eliminarFavorito(auto.id, e)}
                        className="absolute top-4 right-4 z-10 bg-white/70 dark:bg-black/40 backdrop-blur-md hover:bg-red-500 text-slate-500 dark:text-slate-300 hover:text-white p-2.5 rounded-full shadow-sm transition-all duration-300 border border-white/50 dark:border-white/10"
                        title="Quitar de favoritos"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {auto.imagen ? (
                        <Image 
                          src={auto.imagen} 
                          alt={auto.modelo} 
                          fill 
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" 
                          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                      
                      {/* Gradiente sutil en la base de la imagen */}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/30 dark:from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>

                    {/* CUERPO DE LA TARJETA */}
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="mb-6">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest block mb-1">
                          {auto.marca}
                        </span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight line-clamp-2">
                          {auto.modelo}
                        </h3>
                      </div>

                      <div className="mt-auto">
                        <div className="bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-4 mb-4 border border-slate-100 dark:border-white/5">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block mb-0.5">
                            Precio de lista
                          </span>
                          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {auto.precio_usd
                              ? `US$ ${auto.precio_usd.toLocaleString("en-US")}`
                              : `$ ${auto.precio_ars?.toLocaleString("es-AR")}`}
                          </span>
                        </div>

                        {/* Botón Ver Unidad */}
                        <div className="w-full bg-slate-100 dark:bg-white/5 hover:bg-[#0145F2] hover:dark:bg-sky-500 text-slate-600 dark:text-slate-300 hover:text-white border border-transparent hover:border-[#0145F2] hover:dark:border-sky-400 font-black text-[11px] uppercase tracking-widest py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5">
                          Ver detalles <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          /* ================= ESTADO VACÍO (Empty State Ultra Moderno) ================= */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center relative z-10">
            <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-white/5 shadow-inner transform rotate-3">
              <Heart className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              Lista vacía
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
              Explorá nuestro catálogo y guardá los vehículos que más te gusten para tenerlos siempre a mano y compararlos.
            </p>
            <Link 
              href="/catalogo"
              className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-lg active:scale-95"
            >
              <Sparkles className="w-4 h-4" /> Ir al catálogo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}