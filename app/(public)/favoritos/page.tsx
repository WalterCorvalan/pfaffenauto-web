"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Heart, Phone, Car, ChevronRight } from "lucide-react";
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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f] font-sans text-navy dark:text-white pt-6 pb-20">

      {/* HEADER ESPACIAL */}
      <div className="relative w-full bg-gradient-to-b from-blue-50 dark:from-sky-400/10 to-white dark:to-transparent border-b border-gray-100 dark:border-white/10 overflow-hidden pt-6 pb-12 mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 dark:bg-sky-400/10 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-8">
            <Link href="/" className="hover:text-[#0145F2] dark:hover:text-sky-300 transition-colors">Inicio</Link> / <strong className="text-navy dark:text-white">Mis Favoritos</strong>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-navy dark:text-white tracking-tight mb-2 flex items-center gap-3">
                <Heart className="w-8 h-8 md:w-10 md:h-10 text-red-500 fill-red-500" />
                Mis Favoritos
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                Tenés <strong className="text-navy dark:text-white">{favoritos.length}</strong> {favoritos.length === 1 ? 'vehículo guardado' : 'vehículos guardados'}
              </p>
            </div>
            
            {/* BOTÓN WHATSAPP GLOBAL */}
            {favoritos.length > 0 && (
              <button 
                onClick={enviarPorWhatsApp}
                className="bg-[#0145F2] hover:bg-blue-700 text-white font-black text-[10px] md:text-xs uppercase tracking-widest px-6 py-3.5 rounded-full transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 shrink-0"
              >
                <Phone className="w-4 h-4" /> Consultar por {favoritos.length} {favoritos.length === 1 ? 'auto' : 'autos'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {favoritos.length > 0 ? (
          <motion.div 
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {favoritos.map((auto) => (
              <motion.div 
                key={auto.id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="h-full"
              >
                <Link href={`/catalogo/${auto.slug}`} className="block group h-full">
                  <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col h-full shadow-sm dark:shadow-none hover:shadow-xl dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 relative">

                    {/* BOTÓN ELIMINAR */}
                    <button
                      onClick={(e) => eliminarFavorito(auto.id, e)}
                      className="absolute top-3 right-3 z-10 bg-white/90 dark:bg-white/10 hover:bg-red-50 dark:hover:bg-red-400/10 text-gray-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-full shadow-md dark:shadow-none transition-colors backdrop-blur-md border border-gray-100 dark:border-white/10"
                      title="Quitar de favoritos"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="relative h-[160px] bg-gray-50 dark:bg-white/5 flex items-center justify-center overflow-hidden p-2">
                      {auto.imagen ? (
                        <Image src={auto.imagen} alt={auto.modelo} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <Car className="w-10 h-10 text-gray-300 dark:text-slate-600" />
                      )}
                    </div>

                    <div className="p-4 md:p-5 flex flex-col flex-grow">
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-0.5">{auto.marca}</span>
                      <h3 className="text-base font-black text-navy dark:text-white uppercase leading-tight line-clamp-1">{auto.modelo}</h3>

                      <div className="mt-auto pt-4">
                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 mb-3 border border-gray-100 dark:border-white/10">
                          <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest block mb-0.5">Precio</span>
                          <div className="flex flex-col">
                            <span className="text-lg font-black text-navy dark:text-white tracking-tight">
                              {auto.precio_usd
                                ? `US$ ${auto.precio_usd.toLocaleString("en-US")}`
                                : `$ ${auto.precio_ars?.toLocaleString("es-AR")}`}
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-white dark:bg-white/5 text-[#0145F2] dark:text-sky-300 border border-blue-100 dark:border-sky-400/20 group-hover:bg-blue-50 dark:group-hover:bg-sky-400/10 font-black text-[10px] uppercase tracking-widest py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1">
                          Ver unidad <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          /* ESTADO VACÍO */
          <div className="bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10 py-20 px-4 text-center shadow-sm dark:shadow-none max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-white/10">
              <Heart className="w-8 h-8 text-gray-300 dark:text-slate-600" />
            </div>
            <h2 className="text-2xl font-black text-navy dark:text-white mb-2">Aún no tenés favoritos</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
              Explorá nuestro catálogo y guardá los vehículos que más te gusten tocando el ícono del corazón para tenerlos a mano.
            </p>
            <Link 
              href="/catalogo"
              className="inline-flex bg-gradient-to-r from-[#0145F2] to-blue-600 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-full transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              Ir al catálogo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}