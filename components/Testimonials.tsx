"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquareQuote } from "lucide-react";

// Reseñas estáticas de respaldo por si falla la API o está cargando
const fallbackReviews = [
  { id: 1, name: "Claudia Adari", date: "20 nov 2024", text: "El trámite fue muy sencillo y el trato fue impecable de principio a fin. Muy recomendables.", initials: "CA" },
  { id: 2, name: "Leana Carballo", date: "12 oct 2024", text: "Atención impecable, cumplieron con los tiempos estipulados. ¡Gracias a todo el equipo!", initials: "LC" },
  { id: 3, name: "José Rodríguez", date: "17 ene 2025", text: "Auto usado pero en condiciones impecables y un trato que te hace sentir especial.", initials: "JR" },
  { id: 4, name: "Carlos Moreno", date: "30 jun 2024", text: "Muy buena experiencia de compra. Conforme con la atención.", initials: "CM" },
  { id: 5, name: "Martina Silva", date: "5 may 2024", text: "Excelente el servicio post-venta. Tuve una duda con el auto y me la resolvieron en el día.", initials: "MS" },
  { id: 6, name: "Diego Fernández", date: "22 mar 2024", text: "Entregué mi usado como parte de pago y me lo cotizaron súper bien.", initials: "DF" }
];

export default function Testimonials() {
  const [reviews, setReviews] = useState(fallbackReviews);

  useEffect(() => {
    // Llamamos a nuestra API interna para buscar las de Google Maps
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews);
        }
      })
      .catch((err) => console.log("Usando reseñas estáticas de respaldo", err));
  }, []);

  const duplicatedReviews = [...reviews, ...reviews];

  return (
    <section className="py-24 bg-transparent border-t border-transparent overflow-hidden relative">
      
      {/* ================= LUCES AMBIENTALES (SPATIAL UI) ================= */}
      <div className="absolute top-[10%] left-[-5%] w-[500px] h-[500px] bg-sky-300/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#0145F2]/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* ================= ENCABEZADO GLASSMORPHISM ================= */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-16 relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <span className="flex items-center gap-1.5 text-yellow-600 bg-yellow-50/50 backdrop-blur-xl border border-yellow-100/50 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.03)] w-fit mb-4">
            <MessageSquareQuote className="w-3.5 h-3.5 text-yellow-500" /> Excelencia comprobada
          </span>
          <h2 className="text-3xl md:text-4xl text-navy font-light tracking-tighter drop-shadow-sm">
            Lo que opinan <strong className="font-black bg-clip-text text-transparent bg-gradient-to-r from-navy to-[#0145F2]">nuestros clientes</strong>
          </h2>
        </div>
        
        {/* Píldora de estadística (Glass) */}
        <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-left md:text-right max-w-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
          <p className="text-gray-600 text-sm font-medium relative z-10">
            Más de <strong className="text-navy font-black text-base drop-shadow-sm">5.180</strong> clientes satisfechos avalan nuestro compromiso y transparencia.
          </p>
        </div>
      </div>

      {/* ================= MARQUEE ANIMADO (Doble Carrusel) ================= */}
      <div className="relative w-full flex flex-col gap-6 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] z-10">
        
        {/* Fila 1 - Hacia la izquierda */}
        <motion.div 
          className="flex gap-4 md:gap-6 w-max" 
          animate={{ x: ["0%", "-50%"] }} 
          transition={{ ease: "linear", duration: 35, repeat: Infinity }}
        >
          {duplicatedReviews.map((review, idx) => (
            <ReviewCard key={`row1-${idx}`} review={review} />
          ))}
        </motion.div>
        
        {/* Fila 2 - Hacia la derecha */}
        <motion.div 
          className="flex gap-4 md:gap-6 w-max" 
          animate={{ x: ["-50%", "0%"] }} 
          transition={{ ease: "linear", duration: 40, repeat: Infinity }}
        >
          {[...duplicatedReviews].reverse().map((review, idx) => (
            <ReviewCard key={`row2-${idx}`} review={review} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ================= TARJETA INDIVIDUAL (GLASSMORPHISM) =================
function ReviewCard({ review }: { review: typeof fallbackReviews[0] }) {
  return (
    <div className="w-[280px] md:w-[380px] bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[28px] p-6 md:p-8 shrink-0 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_48px_rgba(1,69,242,0.12)] hover:border-white hover:bg-white/70 transition-all duration-500 relative group overflow-hidden select-none">
      
      {/* Reflejo de luz interior al hacer hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0"></div>

      <div className="flex items-center gap-4 mb-5 relative z-10">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/80 to-white/30 border border-white/80 flex items-center justify-center text-[#0145F2] font-black text-sm shadow-inner group-hover:bg-[#0145F2] group-hover:text-white transition-colors duration-300">
          {review.initials}
        </div>
        
        <div>
          <h3 className="text-navy font-black text-sm md:text-base tracking-wide drop-shadow-sm transition-colors">{review.name}</h3>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mt-0.5">{review.date}</p>
        </div>
      </div>
      
      {/* Estrellas */}
      <div className="flex items-center gap-1 mb-4 relative z-10">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400 drop-shadow-[0_2px_4px_rgba(250,204,21,0.3)]" />
        ))}
      </div>
      
      {/* Texto de la reseña */}
      <p className="text-slate-700 text-sm md:text-base leading-relaxed font-medium relative z-10">
        "{review.text}"
      </p>
    </div>
  );
}