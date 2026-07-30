"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  { id: 1, name: "Claudia Adari", date: "20 nov 2024", text: "El trámite fue muy sencillo y el trato fue impecable de principio a fin. Muy recomendables.", initials: "CA" },
  { id: 2, name: "Leana Carballo", date: "12 oct 2024", text: "Atención impecable, cumplieron con los tiempos estipulados. ¡Gracias a todo el equipo!", initials: "LC" },
  { id: 3, name: "José Rodríguez", date: "17 ene 2025", text: "Auto usado pero en condiciones impecables y un trato que te hace sentir especial.", initials: "JR" },
  { id: 4, name: "Carlos Moreno", date: "30 jun 2024", text: "Muy buena experiencia de compra. Conforme con la atención.", initials: "CM" },
  { id: 5, name: "Martina Silva", date: "5 may 2024", text: "Excelente el servicio post-venta. Tuve una duda con el auto y me la resolvieron en el día.", initials: "MS" },
  { id: 6, name: "Diego Fernández", date: "22 mar 2024", text: "Entregué mi usado como parte de pago y me lo cotizaron súper bien.", initials: "DF" }
];

const duplicatedReviews = [...reviews, ...reviews];

export default function Testimonials() {
  return (
    <section className="py-24 bg-[#dee2e6] border-gray-400 border-t overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-12 text-center md:text-left">
        <h2 className="text-3xl md:text-4xl font-light text-navy tracking-tight">
          Lo que opinan <strong className="font-black text-primary">nuestros clientes</strong>
        </h2>
        <p className="text-gray-500 mt-3 text-sm font-medium">
          Más de 1.180 clientes satisfechos avalan nuestro compromiso.
        </p>
      </div>

      <div className="relative w-full flex flex-col gap-6 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <motion.div className="flex gap-4 md:gap-6 w-max" animate={{ x: ["0%", "-50%"] }} transition={{ ease: "linear", duration: 35, repeat: Infinity }}>
          {duplicatedReviews.map((review, idx) => (
            <ReviewCard key={`row1-${idx}`} review={review} />
          ))}
        </motion.div>
        <motion.div className="flex gap-4 md:gap-6 w-max" animate={{ x: ["-50%", "0%"] }} transition={{ ease: "linear", duration: 40, repeat: Infinity }}>
          {[...duplicatedReviews].reverse().map((review, idx) => (
            <ReviewCard key={`row2-${idx}`} review={review} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: typeof reviews[0] }) {
  return (
    <div className="w-[280px] md:w-[350px] bg-white border border-gray-200 rounded-2xl p-6 shrink-0 flex flex-col shadow-sm hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-primary font-black text-sm border border-sky-100">
          {review.initials}
        </div>
        <div>
          <h3 className="text-navy font-bold text-sm tracking-wide">{review.name}</h3>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest">{review.date}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
      </div>
      <p className="text-gray-600 text-sm leading-relaxed font-medium">
        "{review.text}"
      </p>
    </div>
  );
}