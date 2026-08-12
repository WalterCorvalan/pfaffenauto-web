"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquareQuote, ThumbsUp, CheckCircle2 } from "lucide-react";

// Reseñas estáticas de respaldo
const fallbackReviews = [
  { id: 1, name: "Claudia Adari", date: "Hace 2 semanas", source: "Google Reviews", rating: 5, text: "El trámite fue muy sencillo y el trato fue impecable de principio a fin. Me asesoraron en la financiación y me llevé el auto en 48hs. Muy recomendables.", initials: "CA" },
  { id: 2, name: "Leana Carballo", date: "Hace 1 mes", source: "Compra Verificada", rating: 5, text: "Atención impecable, cumplieron con los tiempos estipulados. Tenía miedo de entregar mi usado pero la tasación fue súper justa. ¡Gracias a todo el equipo!", initials: "LC" },
  { id: 3, name: "José Rodríguez", date: "Hace 2 meses", source: "Google Reviews", rating: 5, text: "Auto usado pero en condiciones impecables y un trato que te hace sentir especial. Responden los mensajes rápido.", initials: "JR" },
  { id: 4, name: "Carlos Moreno", date: "Hace 3 meses", source: "Compra Verificada", rating: 4, text: "Muy buena experiencia de compra. Conforme con la atención de los vendedores del salón, súper transparentes con los papeles del vehículo.", initials: "CM" },
  { id: 5, name: "Martina Silva", date: "Hace 4 meses", source: "Google Reviews", rating: 5, text: "Excelente el servicio post-venta. Tuve una duda con una configuración del auto y me la resolvieron en el día por teléfono sin vueltas.", initials: "MS" },
  { id: 6, name: "Diego Fernández", date: "Hace 6 meses", source: "Compra Verificada", rating: 5, text: "Entregué mi pick-up como parte de pago y me lo cotizaron súper bien. La transferencia salió rápido. 10 puntos.", initials: "DF" }
];

export default function Testimonials() {
  const [reviews, setReviews] = useState(fallbackReviews);
  const [rating, setRating] = useState(4.8);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews.slice(0, 6)); // Tomamos máximo 6 para la grilla
        }
        if (data.rating) setRating(data.rating);
        if (data.total) setTotal(data.total);
      })
      .catch((err) => console.log("Usando reseñas estáticas de respaldo", err));
  }, []);

  return (
    <section className="py-16 md:py-24 bg-[#f8f9fa] border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* ================= HEADER CLEAN ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl text-gray-900 font-black tracking-tight mb-4 leading-tight">
              Respaldados por quienes <br className="hidden md:block"/>
              <span className="text-blue-600">ya nos eligieron.</span>
            </h2>
            <p className="text-base text-gray-500 font-medium">
              Más de 5.000 operaciones concretadas con éxito. Leé las experiencias reales de clientes que ya pasaron por nuestros salones.
            </p>
          </div>
          
          {/* Bloque de confianza */}
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl shrink-0">
            <div className="flex flex-col items-center justify-center pr-4 border-r border-gray-200">
              <span className="text-2xl font-black text-gray-900">{rating.toFixed(1)}</span>
              <div className="flex gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'}`} />
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">Google Reviews</span>
              <span className="text-xs text-gray-500 font-medium">{total ? `${total} opiniones reales` : "Basado en opiniones reales"}</span>
            </div>
          </div>
        </div>

        {/* ================= MASONRY GRID (Diseño Asimétrico Estático) ================= */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="break-inside-avoid bg-white border border-gray-200 p-6 sm:p-8 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all duration-300 flex flex-col"
            >
              {/* Header de la Tarjeta */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                    {review.initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 leading-none mb-1">{review.name}</h4>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">{review.date}</span>
                  </div>
                </div>
              </div> 

              {/* Estrellas */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < (review.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} 
                  />
                ))}
              </div>

              {/* Cita */}
              <blockquote className="text-gray-700 text-sm md:text-base leading-relaxed mb-4">
                "{review.text}"
              </blockquote>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}