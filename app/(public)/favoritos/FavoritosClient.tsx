"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Phone, ChevronRight, Sparkles } from "lucide-react";
import FavoritosPedidoModal from "@/components/modals/FavoritosPedidoModal";
import { VehicleCard } from "@/components/Stock";
import { CAMPOS_VEHICULO_PUBLICO } from "@/lib/vehiculos";
import { supabase2 as supabase } from "@/lib/supabase/client";

export default function FavoritosClient() {
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [modalPedidoAbierto, setModalPedidoAbierto] = useState(false);

  // Cargamos los favoritos desde el localStorage al iniciar. Ahí solo se
  // guarda un resumen (marca, modelo, precio, foto), así que además traemos
  // los datos completos de cada auto para dibujar la misma tarjeta que el
  // catálogo (año, km, sucursal). Si un auto ya se vendió/despublicó no
  // viene en la respuesta y se oculta, en vez de mostrar un link roto.
  useEffect(() => {
    let favs: any[] = [];
    try {
      favs = JSON.parse(localStorage.getItem("pfaffen_favs") || "[]");
    } catch {
      favs = [];
    }

    // Fallback con lo guardado, con la forma que espera VehicleCard
    const desdeResumen = (f: any) => ({
      id: f.id, marca: f.marca, modelo: f.modelo, slug: f.slug,
      precio_publicado_ars: f.precio_ars, precio_publicado_usd: f.precio_usd,
      fotos: f.imagen ? [f.imagen] : [],
    });

    if (favs.length === 0) {
      setFavoritos([]);
      setMounted(true);
      return;
    }

    supabase
      .from("vehiculos")
      .select(CAMPOS_VEHICULO_PUBLICO)
      .in("id", favs.map((f) => f.id))
      .in("estado", ["disponible", "reservado"])
      .then(({ data, error }) => {
        if (error || !data) {
          setFavoritos(favs.map(desdeResumen));
        } else {
          const porId = new Map((data as any[]).map((v) => [v.id, v]));
          setFavoritos(favs.map((f) => porId.get(f.id)).filter(Boolean) as any[]);
        }
        setMounted(true); // Previene errores de hidratación en Next.js
      });
  }, []);

  // La tarjeta ya actualiza localStorage al tocar el corazón; acá solo
  // sacamos el auto de la lista en pantalla.
  const quitarDeLista = (id: string, sigueSiendoFavorito: boolean) => {
    if (sigueSiendoFavorito) return;
    setFavoritos((prev) => prev.filter((f) => f.id !== id));
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
            onClick={() => setModalPedidoAbierto(true)}
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
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {favoritos.map((auto) => (
              <VehicleCard
                key={auto.id}
                auto={auto}
                variante="alt"
                compacta
                onToggleFavorito={(esFav) => quitarDeLista(auto.id, esFav)}
              />
            ))}
          </div>
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

      <FavoritosPedidoModal
        isOpen={modalPedidoAbierto}
        favoritos={favoritos}
        onClose={() => setModalPedidoAbierto(false)}
      />
    </div>
  );
}
