"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // La primera abierta por defecto

  const faqs = [
    {
      pregunta: "¿Cómo puedo comprar un vehículo en Pfaffen Autos?",
      respuesta: "Podés ver nuestro stock actualizado online, elegir el modelo que te guste y contactarte de forma inmediata con nuestros asesores a través de WhatsApp para coordinar una seña o visita en nuestras sucursales."
    },
    {
      pregunta: "¿Ofrecen financiación para la compra de autos?",
      respuesta: "Sí, contamos con líneas de financiación exclusivas y planes a medida tanto para vehículos 0KM como para usados seleccionados. Podés cotizar tu plan directamente con nosotros."
    },
    {
      pregunta: "¿Puedo entregar mi auto usado como parte de pago?",
      respuesta: "Sí. Tomamos tu vehículo usado al mejor precio del mercado bajo un sistema ágil y transparente de tasación presencial en cualquiera de nuestras sucursales."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.pregunta,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.respuesta
      }
    }))
  };

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12 md:py-20 bg-[#f8f9fa] dark:bg-[#0a0a0f] border-t border-slate-200/80 dark:border-transparent relative overflow-hidden">

      {/* Script SEO JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Efectos ambientales sutiles */}
      <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-blue-400/5 dark:bg-sky-400/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10">

        {/* ================= ENCABEZADO ================= */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#0145F2]/10 dark:bg-sky-400/10 text-[#0145F2] dark:text-sky-300 text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-3 border border-[#0145F2]/20 dark:border-sky-400/20">
            <HelpCircle className="w-3.5 h-3.5" /> Resolvé tus dudas
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-[#0f293e] dark:text-white tracking-tight">
            Preguntas <span className="text-[#0145F2] dark:text-sky-300">Frecuentes</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium mt-2">
            Todo lo que necesitás saber sobre nuestros procesos de compra, financiación y permutas.
          </p>
        </div>

        {/* ================= ACORDEÓN DE PREGUNTAS ================= */}
        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div 
                key={index}
                className={`bg-white dark:bg-white/5 border rounded-2xl transition-all duration-300 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-none ${
                  isOpen ? 'border-[#0145F2]/50 dark:border-sky-400/50 shadow-[0_10px_30px_rgba(1,69,242,0.06)] dark:shadow-none' : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-colors ${
                      isOpen ? 'bg-[#0145F2] text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                    }`}>
                      0{index + 1}
                    </span>
                    <h3 className="text-base md:text-lg font-black text-[#0f293e] dark:text-white tracking-tight">
                      {faq.pregunta}
                    </h3>
                  </div>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 shrink-0 ${
                    isOpen ? 'rotate-180 bg-blue-50 dark:bg-sky-400/10 text-[#0145F2] dark:text-sky-300' : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-0 pl-16 md:pl-20 pr-8">
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                          {faq.respuesta}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}