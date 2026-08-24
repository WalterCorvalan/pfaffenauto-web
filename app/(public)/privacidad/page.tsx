import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad | Pfaffen Autos",
  description: "Cómo Pfaffen Autos recopila, usa y protege tus datos personales.",
  alternates: { canonical: "https://pfaffenautos.com.ar/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0a0f] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#0145F2] dark:hover:text-sky-300 transition-colors">Inicio</Link>
          <span className="text-gray-400 dark:text-slate-600">/</span>
          <span className="text-navy dark:text-white">Privacidad</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-navy dark:text-white tracking-tight mb-2">
          Política de Privacidad
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-10">Última actualización: agosto 2026.</p>

        <div className="space-y-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-navy dark:text-white mb-2">1. Quiénes somos</h2>
            <p>
              Pfaffen Autos es una concesionaria de vehículos 0KM y usados con sucursales en Casa Central y Don Torcuato,
              Buenos Aires, Argentina. Esta política explica qué datos recopilamos a través de{" "}
              <strong>pfaffenautos.com.ar</strong>, para qué los usamos y qué derechos tenés sobre ellos, conforme a la
              Ley 25.326 de Protección de Datos Personales de la República Argentina.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy dark:text-white mb-2">2. Qué datos recopilamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Datos que nos das voluntariamente en formularios: nombre, teléfono, email, datos del vehículo que cotizás o buscás.</li>
              <li>Mensajes que nos escribís por WhatsApp, Instagram o el chat del sitio.</li>
              <li>Datos de navegación (páginas visitadas, dispositivo, origen del tráfico) mediante cookies y herramientas de analítica.</li>
              <li>CV y datos de contacto si te postulás a una búsqueda laboral.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy dark:text-white mb-2">3. Para qué los usamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Responder tus consultas, cotizaciones y solicitudes de contacto.</li>
              <li>Gestionar la compra, venta o consignación de vehículos.</li>
              <li>Mejorar el sitio, entender qué secciones se usan más y corregir errores.</li>
              <li>Enviarte información comercial relacionada a tu consulta (podés pedir que dejemos de hacerlo en cualquier momento).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy dark:text-white mb-2">4. Con quién compartimos tus datos</h2>
            <p>
              No vendemos tus datos a terceros. Los compartimos únicamente con proveedores que nos ayudan a operar el
              sitio (hosting, envío de WhatsApp/Instagram, analítica web), bajo confidencialidad, y solo en la medida
              necesaria para prestar el servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy dark:text-white mb-2">5. Cookies y analítica</h2>
            <p>
              Usamos cookies propias y de terceros (como Google Analytics) para entender cómo se usa el sitio —
              qué páginas y funciones se visitan más — y así mejorarlo. Podés bloquear las cookies desde la
              configuración de tu navegador; el sitio sigue funcionando igual, aunque perdemos esa información agregada.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy dark:text-white mb-2">6. Tus derechos</h2>
            <p>
              Podés pedirnos en cualquier momento acceder, corregir o eliminar tus datos personales, o retirar tu
              consentimiento para recibir comunicaciones. Escribinos a{" "}
              <a href="mailto:info@pfaffenautos.com.ar" className="text-[#0145F2] dark:text-sky-300 font-medium hover:underline">
                info@pfaffenautos.com.ar
              </a>{" "}
              o por WhatsApp y lo resolvemos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy dark:text-white mb-2">7. Uso de Inteligencia Artificial</h2>
            <p className="mb-2">
              Usamos inteligencia artificial en distintas partes del sitio y la atención: un asistente virtual que
              responde consultas por el chat del sitio, WhatsApp e Instagram; un buscador que interpreta lo que
              escribís para encontrar autos en el catálogo; y una herramienta interna que ayuda a nuestro equipo a
              sugerir precios de tasación a partir de fotos de tu vehículo.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Las respuestas del asistente son generadas automáticamente y pueden contener errores — siempre podés pedir hablar con una persona del equipo.</li>
              <li>Los datos que le escribís al asistente (texto, y en el caso de la tasación, fotos del vehículo) se procesan con proveedores externos de IA (como Anthropic u OpenAI) bajo sus propias políticas de privacidad, únicamente para generar la respuesta o el resultado — no se usan para entrenar modelos de terceros.</li>
              <li>Ninguna decisión totalmente automatizada de IA es definitiva: los precios finales, condiciones de venta y cualquier compromiso comercial siempre los confirma una persona de Pfaffen Autos.</li>
              <li>No subas por el chat datos sensibles que no hagan falta para tu consulta (por ejemplo, no compartas contraseñas ni datos de tarjetas).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy dark:text-white mb-2">8. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política ocasionalmente. Los cambios importantes los vamos a publicar en esta
              misma página con la fecha de actualización correspondiente.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
