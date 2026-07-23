"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

// ================= DATOS DE LAS RESEÑAS =================
const reviews = [
  {
    id: 1,
    name: "Claudia Adari",
    date: "20 noviembre 2024",
    text: "El trámite fue muy sencillo y el trato fue impecable de principio a fin. Muy recomendables.",
    initials: "CA",
  },
  {
    id: 2,
    name: "Leana Carballo",
    date: "12 octubre 2024",
    text: "Atención impecable, cumplieron con los tiempos estipulados. ¡Gracias a todo el equipo!",
    initials: "LC",
  },
  {
    id: 3,
    name: "José Rodríguez",
    date: "17 enero 2025",
    text: "Auto usado pero en condiciones impecables y un trato que te hace sentir especial.",
    initials: "JR",
  },
  {
    id: 4,
    name: "Carlos Moreno",
    date: "30 junio 2024",
    text: "Muy buena experiencia de compra. Conforme con la atención personalizada y las condiciones claras.",
    initials: "CM",
  },
  {
    id: 5,
    name: "Martina Silva",
    date: "5 mayo 2024",
    text: "Excelente el servicio post-venta. Tuve una duda con el auto y me la resolvieron en el día.",
    initials: "MS",
  },
  {
    id: 6,
    name: "Diego Fernández",
    date: "22 marzo 2024",
    text: "Entregué mi usado como parte de pago y me lo cotizaron súper bien. Me llevé un 0KM en una hora.",
    initials: "DF",
  }
];

// Duplicamos el array para que el efecto infinito no se corte nunca
const duplicatedReviews = [...reviews, ...reviews];

export default function Testimonials() {
  return (
    <section className="py-24 bg-[#050505] border-t border-white/5 overflow-hidden">
      <div className="max-w-[85rem] mx-auto px-6 mb-12 text-center md:text-left">
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
          Lo que opinan <span className="text-[#0145F2]">nuestros clientes</span>
        </h2>
        <p className="text-gray-400 mt-3 text-sm md:text-base font-medium">
          Más de 1.180 clientes satisfechos avalan nuestro compromiso.
        </p>
      </div>

      {/* 
        Contenedor con máscara de gradiente 
        Hace que los bordes izquierdo y derecho se desvanezcan hacia el negro
      */}
      <div className="relative w-full flex flex-col gap-6 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        
        {/* ================= FILA 1 (Se mueve hacia la IZQUIERDA) ================= */}
        <motion.div
          className="flex gap-6 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            ease: "linear",
            duration: 35, // Velocidad (más alto = más lento)
            repeat: Infinity,
          }}
        >
          {duplicatedReviews.map((review, idx) => (
            <ReviewCard key={`row1-${idx}`} review={review} />
          ))}
        </motion.div>

        {/* ================= FILA 2 (Se mueve hacia la DERECHA) ================= */}
        <motion.div
          className="flex gap-6 w-max"
          animate={{ x: ["-50%", "0%"] }}
          transition={{
            ease: "linear",
            duration: 40, // Ligeramente distinta velocidad para dar un efecto más dinámico
            repeat: Infinity,
          }}
        >
          {/* Mezclamos un poco el orden para la segunda fila */}
          {[...duplicatedReviews].reverse().map((review, idx) => (
            <ReviewCard key={`row2-${idx}`} review={review} />
          ))}
        </motion.div>

      </div>
    </section>
  );
}

// ================= COMPONENTE DE LA TARJETA (CARD) =================
function ReviewCard({ review }: { review: typeof reviews[0] }) {
  return (
    <div className="w-[300px] md:w-[400px] bg-[#0A0F16] border border-white/10 rounded-2xl p-6 shrink-0 flex flex-col shadow-lg hover:border-[#0145F2]/50 transition-colors">
      <div className="flex items-center gap-4 mb-4">
        {/* Avatar / Iniciales */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0055A4] to-[#1E6FD9] flex items-center justify-center text-white font-black text-sm shadow-md">
          {review.initials}
        </div>
        
        {/* Nombre y Fecha */}
        <div>
          <h3 className="text-white font-bold text-sm tracking-wide">{review.name}</h3>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest">{review.date}</p>
        </div>
      </div>
      
      {/* Estrellitas */}
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 fill-[#FBBF24] text-[#FBBF24]" />
        ))}
      </div>

      {/* Texto del comentario */}
      <p className="text-gray-300 text-sm leading-relaxed font-medium">
        "{review.text}"
      </p>
    </div>
  );
}