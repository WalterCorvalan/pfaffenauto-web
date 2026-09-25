"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { supabase2 } from "@/lib/supabase/client";

const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/4ZMmpWJCarHcZ2sb9";

// Rating real del perfil de Google Business de cada sucursal (no se puede
// derivar del promedio de las reseñas cargadas a mano, que son una
// selección curada de las mejores -- eso siempre daría ~5.0, no el número
// real que ve cualquiera que entre a Google Maps). En la home se muestra
// 4.8 fijo (definido a mano), no el promedio matemático de las sucursales.
const GOOGLE_RATING_POR_SUCURSAL: Record<string, number> = { "casa-central": 4.6, "don-torcuato": 4.9 };
const GOOGLE_RATING_PROMEDIO = 4.8;

// Reseñas estáticas de respaldo, por si todavía no se cargó ninguna en
// Configuración → Reseñas (o la tabla resenas_manuales está vacía).
const fallbackReviews = [
  { id: "f1", name: "Claudia Adari", date: "Hace 2 semanas", rating: 5, text: "El trámite fue muy sencillo y el trato fue impecable de principio a fin. Me asesoraron en la financiación y me llevé el auto en 48hs. Muy recomendables.", initials: "CA" },
  { id: "f2", name: "Leana Carballo", date: "Hace 1 mes", rating: 5, text: "Atención impecable, cumplieron con los tiempos estipulados. Tenía miedo de entregar mi usado pero la tasación fue súper justa. ¡Gracias a todo el equipo!", initials: "LC" },
  { id: "f3", name: "José Rodríguez", date: "Hace 2 meses", rating: 5, text: "Auto usado pero en condiciones impecables y un trato que te hace sentir especial. Responden los mensajes rápido.", initials: "JR" },
  { id: "f4", name: "Carlos Moreno", date: "Hace 3 meses", rating: 4, text: "Muy buena experiencia de compra. Conforme con la atención de los vendedores del salón, súper transparentes con los papeles del vehículo.", initials: "CM" },
  { id: "f5", name: "Martina Silva", date: "Hace 4 meses", rating: 5, text: "Excelente el servicio post-venta. Tuve una duda con una configuración del auto y me la resolvieron en el día por teléfono sin vueltas.", initials: "MS" },
  { id: "f6", name: "Diego Fernández", date: "Hace 6 meses", rating: 5, text: "Entregué mi pick-up como parte de pago y me lo cotizaron súper bien. La transferencia salió rápido. 10 puntos.", initials: "DF" },
];

function iniciales(nombre: string) {
  return nombre.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
}

function mezclar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// sucursalSlug opcional: mismo componente para la home (todas las reseñas
// mezcladas) y para /sucursales/[slug] (filtradas a las de esa sucursal
// vía resenas_manuales.sucursal_slug) -- pedido explícito de reusar
// Testimonials en vez de armar algo nuevo por sucursal.
export default function Testimonials({ sucursalSlug, sucursalNombre }: { sucursalSlug?: string; sucursalNombre?: string } = {}) {
  const [reviews, setReviews] = useState(fallbackReviews);
  const rating = sucursalSlug ? (GOOGLE_RATING_POR_SUCURSAL[sucursalSlug] ?? GOOGLE_RATING_PROMEDIO) : GOOGLE_RATING_PROMEDIO;
  const [total, setTotal] = useState<number | null>(null);

  // Se cargan a mano desde Configuración → Reseñas (sin API/credenciales de
  // Google) -- se pegan tal cual del perfil de Google Maps del negocio. Se
  // muestran hasta 6 elegidas al azar entre todas las activas, para que no
  // se repitan siempre las mismas si hay cargadas más de 6.
  useEffect(() => {
    let query = supabase2.from("resenas_manuales").select("id, nombre, texto, rating, fecha_texto").eq("activo", true);
    if (sucursalSlug) query = query.eq("sucursal_slug", sucursalSlug);
    query.then(({ data }) => {
      if (!data || data.length === 0) return;
      const elegidas = mezclar(data).slice(0, 6).map((r) => ({
        id: r.id, name: r.nombre, date: r.fecha_texto || "", rating: r.rating, text: r.texto, initials: iniciales(r.nombre),
      }));
      setReviews(elegidas);
      setTotal(data.length);
    });
  }, [sucursalSlug]);

  return (
    <section className="py-16 md:py-24 bg-[#f8f9fa] dark:bg-[#0a0a0f] border-t border-gray-200 dark:border-transparent">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* ================= HEADER CLEAN ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl text-gray-900 dark:text-white font-black tracking-tight mb-4 leading-tight">
              Respaldados por quienes <br className="hidden md:block"/>
              <span className="text-[#0145F2] dark:text-sky-300">ya nos eligieron.</span>
            </h2>
            <p className="text-base text-gray-500 dark:text-slate-400 font-medium">
              {sucursalNombre
                ? `Experiencias reales de clientes que ya pasaron por ${sucursalNombre}.`
                : "Más de 3.000 operaciones concretadas con éxito. Leé las experiencias reales de clientes que ya pasaron por nuestros salones."}
            </p>
          </div>

          {/* Bloque de confianza -- lleva al perfil de Google Maps del negocio */}
          <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-xl shrink-0 hover:border-blue-400 dark:hover:border-sky-400/50 transition-colors">
            <div className="flex flex-col items-center justify-center pr-4 border-r border-gray-200 dark:border-white/10">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{rating.toFixed(1)}</span>
              <div className="flex gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 dark:fill-white/10 text-gray-300 dark:text-white/10'}`} />
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Google Reviews</span>
              <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">{total ? `${total} opiniones reales` : "Basado en opiniones reales"}</span>
            </div>
          </a>
        </div>

        {/* ================= MASONRY GRID (Diseño Asimétrico Estático) ================= */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="break-inside-avoid bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 sm:p-8 rounded-2xl hover:border-blue-400 dark:hover:border-sky-400/50 hover:shadow-md transition-all duration-300 flex flex-col"
            >
              {/* Header de la Tarjeta */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-sky-400/10 text-[#0138c9] dark:text-sky-300 font-bold text-sm flex items-center justify-center shrink-0">
                    {review.initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1">{review.name}</h4>
                    <span className="text-[10px] text-gray-500 dark:text-slate-400 uppercase tracking-wide font-semibold">{review.date}</span>
                  </div>
                </div>
              </div>

              {/* Estrellas */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < (review.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 dark:fill-white/10 text-gray-200 dark:text-white/10'}`}
                  />
                ))}
              </div>

              {/* Cita */}
              <blockquote className="text-gray-700 dark:text-slate-300 text-sm md:text-base leading-relaxed mb-4">
                "{review.text}"
              </blockquote>

            </div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <a href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#0145F2] dark:text-sky-300 hover:underline">
            Ver todas las reseñas en Google Maps →
          </a>
        </div>

      </div>
    </section>
  );
}