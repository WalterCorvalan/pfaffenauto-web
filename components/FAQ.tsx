export default function FAQ() {
  // Schema JSON-LD específico para FAQ (AEO & GEO)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Cómo puedo comprar un vehículo en Pfaffen Autos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Podés ver nuestro stock actualizado online, elegir el modelo que te guste y contactarte de forma inmediata con nuestros asesores a través de WhatsApp para coordinar una seña o visita en nuestras sucursales de Villa de Mayo, Olivos o Panamericana."
        }
      },
      {
        "@type": "Question",
        "name": "¿Ofrecen financiación para la compra de autos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, contamos con líneas de financiación exclusivas y planes a medida tanto para vehículos 0KM como para usados seleccionados. Podés cotizar tu plan directamente con nosotros."
        }
      },
      {
        "@type": "Question",
        "name": "¿Puedo entregar mi auto usado como parte de pago?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí. Tomamos tu vehículo usado al mejor precio del mercado bajo un sistema ágil y transparente de tasación presencial en cualquiera de nuestras sucursales."
        }
      }
    ]
  };

  return (
    <section className="py-24 bg-[#050505] border-t border-white/5 relative">
      {/* Inyectamos el Schema de FAQ para que Google lo lea de inmediato */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-5xl mx-auto px-6">
        
        {/* Encabezado optimizado */}
        <div className="text-center mb-16">
          <span className="text-[#0145F2] text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-3 block">
            Resolvé tus dudas
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
            Preguntas Frecuentes
          </h2>
        </div>

        {/* Acordeón / Tarjetas de Preguntas */}
        <div className="flex flex-col gap-6">
          
          {/* Pregunta 1 */}
          <div className="bg-[#09090b] border border-white/5 rounded-3xl p-8 hover:border-[#0145F2]/40 transition-colors">
            <h3 className="text-lg md:text-xl font-bold text-white mb-3 uppercase tracking-tight flex items-center gap-3">
              <span className="text-[#0145F2] font-mono text-sm">01.</span>
              ¿Cómo puedo comprar un vehículo en Pfaffen Autos?
            </h3>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed pl-7">
              Podés ver nuestro stock actualizado online, elegir el modelo que te guste y contactarte de forma inmediata con nuestros asesores a través de WhatsApp para coordinar una seña o visita en nuestras sucursales de Villa de Mayo, Olivos o Panamericana.
            </p>
          </div>

          {/* Pregunta 2 */}
          <div className="bg-[#09090b] border border-white/5 rounded-3xl p-8 hover:border-[#0145F2]/40 transition-colors">
            <h3 className="text-lg md:text-xl font-bold text-white mb-3 uppercase tracking-tight flex items-center gap-3">
              <span className="text-[#0145F2] font-mono text-sm">02.</span>
              ¿Ofrecen financiación para la compra de autos?
            </h3>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed pl-7">
              Sí, contamos con líneas de financiación exclusivas y planes a medida tanto para vehículos 0KM como para usados seleccionados. Podés cotizar tu plan directamente con nosotros.
            </p>
          </div>

          {/* Pregunta 3 */}
          <div className="bg-[#09090b] border border-white/5 rounded-3xl p-8 hover:border-[#0145F2]/40 transition-colors">
            <h3 className="text-lg md:text-xl font-bold text-white mb-3 uppercase tracking-tight flex items-center gap-3">
              <span className="text-[#0145F2] font-mono text-sm">03.</span>
              ¿Puedo entregar mi auto usado como parte de pago?
            </h3>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed pl-7">
              Sí. Tomamos tu vehículo usado al mejor precio del mercado bajo un sistema ágil y transparente de tasación presencial en cualquiera de nuestras sucursales.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}