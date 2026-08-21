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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0a0f] font-sans text-slate-900 dark:text-white pb-24 relative overflow-hidden">
      
      {/* ================= LUCES AMBIENTALES ================= */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0145F2]/10 dark:bg-sky-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-red-500/5 dark:bg-red-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* ================= HEADER ================= */}
      <div className="relative border-b border-slate-200/80 dark:border-white/10 pt-10 pb-12 mb-10 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-8">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Inicio</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
            <span className="text-slate-900 dark:text-white">Mis Favoritos</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3 flex items-center gap-4">
                <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center">
                  <Heart className="w-7 h-7 text-red-500 fill-red-500 drop-shadow-sm" />
                </div>
                Mis Favoritos
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium pl-2">
                Tenés <strong className="text-slate-900 dark:text-white">{favoritos.length}</strong> {favoritos.length === 1 ? 'vehículo guardado' : 'vehículos guardados'} en tu lista.
              </p>
            </div>
            
            {/* BOTÓN WHATSAPP GLOBAL */}
            {favoritos.length > 0 && (
              <button 
                onClick={enviarPorWhatsApp}
                className="bg-[#0145F2] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2.5 active:scale-95 shrink-0"
              >
                <Phone className="w-4 h-4" /> 
                Consultar por {favoritos.length} {favoritos.length === 1 ? 'auto' : 'autos'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= CONTENIDO ================= */}
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
                  <div className="bg-white dark:bg-[#0f172a] rounded-[24px] border border-slate-200/80 dark:border-white/10 overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl dark:shadow-none transition-all duration-300 relative group-hover:-translate-y-1">

                    {/* IMAGEN DEL VEHÍCULO Y BOTÓN ELIMINAR */}
                    <div className="relative h-48 w-full bg-slate-100 dark:bg-[#1e293b] overflow-hidden">
                      {/* Botón Flotante Glassmorphism para eliminar */}
                      <button
                        onClick={(e) => eliminarFavorito(auto.id, e)}
                        className="absolute top-3 right-3 z-10 bg-white/70 dark:bg-black/40 backdrop-blur-md hover:bg-red-500 text-slate-500 dark:text-slate-300 hover:text-white p-2.5 rounded-full shadow-sm transition-all duration-300 border border-white/50 dark:border-white/10"
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
                          className="object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                      
                      {/* Gradiente sutil en la base de la imagen para que el texto resalte */}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* CUERPO DE LA TARJETA */}
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="mb-4">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest block mb-1">
                          {auto.marca}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
                          {auto.modelo}
                        </h3>
                      </div>

                      <div className="mt-auto">
                        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 mb-4 border border-slate-100 dark:border-white/5">
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block mb-0.5">
                            Precio de lista
                          </span>
                          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            {auto.precio_usd
                              ? `US$ ${auto.precio_usd.toLocaleString("en-US")}`
                              : `$ ${auto.precio_ars?.toLocaleString("es-AR")}`}
                          </span>
                        </div>

                        {/* Botón Ver Unidad */}
                        <div className="w-full bg-slate-100 dark:bg-white/5 hover:bg-[#0145F2] hover:dark:bg-sky-500 text-slate-600 dark:text-slate-300 hover:text-white border border-transparent hover:border-[#0145F2] hover:dark:border-sky-400 font-black text-[11px] uppercase tracking-widest py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5">
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
          /* ================= ESTADO VACÍO (Empty State) ================= */
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-white/10 py-24 px-4 text-center shadow-sm max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-black/20 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-white/10 shadow-inner">
                <Heart className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                Aún no tenés favoritos
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-10 max-w-sm mx-auto leading-relaxed">
                Explorá nuestro catálogo y guardá los vehículos que más te gusten tocando el ícono del corazón para tenerlos siempre a mano.
              </p>
              <Link 
                href="/catalogo"
                className="inline-flex items-center gap-2 bg-[#0145F2] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <Sparkles className="w-4 h-4" /> Ir al catálogo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}