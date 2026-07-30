export default function FAQ() {
  const faqSchema = { /* Mismo schema JSON-LD que ya tenías */ };

  return (
    <section className="py-24 bg-[#E9ECEF] border-gray-400 border-t border-gray-400 relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        <div className="text-center mb-16">
          <span className="text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest mb-3 block">
            Resolvé tus dudas
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-navy tracking-tight">
            Preguntas <strong className="font-black">Frecuentes</strong>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm hover:border-primary/40 transition-colors">
            <h3 className="text-base md:text-lg font-bold text-navy mb-3 flex items-center gap-3">
              <span className="text-primary font-black text-lg bg-sky-50 w-8 h-8 flex items-center justify-center rounded-full">1</span>
              ¿Cómo puedo comprar un vehículo en Pfaffen Autos?
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed pl-11">
              Podés ver nuestro stock actualizado online, elegir el modelo que te guste y contactarte de forma inmediata con nuestros asesores a través de WhatsApp para coordinar una seña o visita en nuestras sucursales.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm hover:border-primary/40 transition-colors">
            <h3 className="text-base md:text-lg font-bold text-navy mb-3 flex items-center gap-3">
              <span className="text-primary font-black text-lg bg-sky-50 w-8 h-8 flex items-center justify-center rounded-full">2</span>
              ¿Ofrecen financiación para la compra de autos?
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed pl-11">
              Sí, contamos con líneas de financiación exclusivas y planes a medida tanto para vehículos 0KM como para usados seleccionados. Podés cotizar tu plan directamente con nosotros.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm hover:border-primary/40 transition-colors">
            <h3 className="text-base md:text-lg font-bold text-navy mb-3 flex items-center gap-3">
              <span className="text-primary font-black text-lg bg-sky-50 w-8 h-8 flex items-center justify-center rounded-full">3</span>
              ¿Puedo entregar mi auto usado como parte de pago?
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed pl-11">
              Sí. Tomamos tu vehículo usado al mejor precio del mercado bajo un sistema ágil y transparente de tasación presencial en cualquiera de nuestras sucursales.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}