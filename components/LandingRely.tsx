"use client";

import { Oswald, Inter, IBM_Plex_Mono } from "next/font/google";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

const STATS = [
  { value: "161", unit: "CV", label: "Potencia máx." },
  { value: "420", unit: "Nm", label: "Torque máx." },
  { value: "4×4", unit: "", label: "Tracción integral" },
  { value: "1.000", unit: "kg", label: "Capacidad de carga" },
];

const FEATURES = [
  {
    n: "01",
    title: "Frenado autónomo de emergencia",
    text: "Detecta riesgo de colisión y frena solo cuando vos no llegás a hacerlo.",
  },
  {
    n: "02",
    title: "Control de crucero adaptativo",
    text: "Mantiene la distancia con el vehículo de adelante en ruta, sin que toques el pedal.",
  },
  {
    n: "03",
    title: "Pantalla multimedia de 12,3″",
    text: "Apple CarPlay y Android Auto inalámbricos, más carga por inducción para el celular.",
  },
  {
    n: "04",
    title: "Cámara 360°",
    text: "Visión completa del entorno para maniobrar en obra, playa de carga o cochera.",
  },
  {
    n: "05",
    title: "Hasta 7 airbags",
    text: "Frontales, laterales, de cortina y de rodilla según versión.",
  },
  {
    n: "06",
    title: "Modos de tracción 4×4",
    text: "2H / 4H / 4L con bloqueo de diferencial para terrenos exigentes.",
  },
];

const VERSIONS = [
  {
    name: "Comfort",
    trans: "Manual",
    price: "32.000",
    bullets: ["Motor 2.3 turbodiésel", "Doble airbag frontal", "4×4"],
  },
  {
    name: "Comfort",
    trans: "Automática",
    price: "34.000",
    bullets: ["Motor 2.3 turbodiésel", "Caja automática 8 vel.", "4×4"],
  },
  {
    name: "Luxury",
    trans: "Manual",
    price: "36.500",
    bullets: ["Equipamiento ampliado", "Pantalla 12,3″", "4×4"],
    highlight: true,
  },
  {
    name: "Limited",
    trans: "Automática",
    price: "39.500",
    bullets: ["Tope de gama", "7 airbags + ADAS", "Cámara 360°"],
  },
];

const SPECS = [
  { label: "Largo", value: "5.370 mm" },
  { label: "Ancho", value: "1.960 mm" },
  { label: "Alto", value: "1.880 mm" },
  { label: "Entre ejes", value: "3.230 mm" },
  { label: "Altura libre al piso", value: "200 mm" },
  { label: "Motor", value: "2.3L turbodiésel · 4 cil." },
  { label: "Potencia", value: "161 CV @ 3.500 rpm" },
  { label: "Torque", value: "420 Nm @ 1.500–2.500 rpm" },
  { label: "Transmisión", value: "Manual 6 vel. / Automática 8 vel." },
  { label: "Tracción", value: "4×4" },
  { label: "Garantía", value: "5 años / 200.000 km" },
];

const WHATSAPP_LINK =
  "https://wa.me/5491100000000?text=Hola%2C%20quiero%20cotizar%20la%20Rely%20R8";

export default function LandingRely() {
  return (
    <main
      className={`${oswald.variable} ${inter.variable} ${mono.variable} bg-[#121210] text-[#ECE8DD] font-[family-name:var(--font-body)]`}
    >
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#2A2A24] bg-[#121210]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-wide">
            RELY <span className="text-[#FFC629]">R8</span>
          </span>

          <nav className="hidden gap-8 text-sm font-medium text-[#B9B4A6] md:flex">
            <a href="#versiones" className="hover:text-[#ECE8DD]">Versiones</a>
            <a href="#ficha" className="hover:text-[#ECE8DD]">Ficha técnica</a>
            <a href="#contacto" className="hover:text-[#ECE8DD]">Concesionario</a>
          </nav>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm bg-[#FFC629] px-4 py-2 text-sm font-semibold text-[#121210] transition hover:bg-[#e6b024]"
          >
            Cotizar
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b-8 border-[#FFC629]">
        <div
          className="absolute inset-x-0 top-0 h-2 opacity-70"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #FFC629 0 18px, #121210 18px 36px)",
          }}
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1.2fr_0.8fr] md:py-28">
          <div className="relative z-10">
            <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[#FFC629]">
              Pick-up mediana · 4×4 · Turbodiésel
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-5xl font-semibold uppercase leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
              No hay obstáculo
              <br />
              que la <span className="text-[#FFC629]">detenga.</span>
            </h1>
            <p className="mt-6 max-w-md text-base text-[#B9B4A6]">
              La Rely R8 llega a la Argentina como la 4×4 más accesible de su
              segmento, con equipamiento y diseño interior por encima del
              resto del mercado.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm bg-[#FFC629] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#121210] transition hover:bg-[#e6b024]"
              >
                Cotizar por WhatsApp
              </a>
              <a
                href="#ficha"
                className="rounded-sm border border-[#3A3A32] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#ECE8DD] transition hover:border-[#FFC629] hover:text-[#FFC629]"
              >
                Ver ficha técnica
              </a>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none relative z-0 flex items-center justify-center"
          >
            <span className="select-none font-[family-name:var(--font-display)] text-[13rem] font-bold leading-none text-[#1D1D18] sm:text-[16rem] md:text-[19rem]">
              R8
            </span>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-b border-[#2A2A24] bg-[#17170F]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-[#2A2A24] px-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="px-4 py-8 text-center">
              <div className="font-[family-name:var(--font-mono)] text-3xl font-semibold text-[#FFC629] sm:text-4xl">
                {s.value}
                <span className="ml-1 text-base text-[#B9B4A6]">{s.unit}</span>
              </div>
              <div className="mt-2 text-xs uppercase tracking-widest text-[#8D897C]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
          Tecnología pensada para el trabajo
        </h2>
        <p className="mt-3 max-w-xl text-[#B9B4A6]">
          Cada función tiene un propósito concreto: menos riesgo, más
          control, menos vueltas.
        </p>
        <div className="mt-12 grid gap-px overflow-hidden rounded-sm bg-[#2A2A24] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.n} className="bg-[#17170F] p-6">
              <span className="font-[family-name:var(--font-mono)] text-sm text-[#FFC629]">
                {f.n}
              </span>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg font-semibold uppercase tracking-tight">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#B9B4A6]">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* VERSIONES / PRECIOS */}
      <section id="versiones" className="border-y border-[#2A2A24] bg-[#17170F] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
            Versiones y precios
          </h2>
          <p className="mt-3 max-w-xl text-[#B9B4A6]">
            Cuatro configuraciones, todas con tracción 4×4 de serie.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VERSIONS.map((v) => (
              <div
                key={`${v.name}-${v.trans}`}
                className={`flex flex-col rounded-sm border p-6 ${
                  v.highlight
                    ? "border-[#FFC629] bg-[#1D1D14]"
                    : "border-[#2A2A24] bg-[#121210]"
                }`}
              >
                {v.highlight && (
                  <span className="mb-3 w-fit rounded-sm bg-[#FFC629] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-wider text-[#121210]">
                    Más elegida
                  </span>
                )}
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold uppercase">
                  {v.name}
                </h3>
                <p className="text-sm text-[#8D897C]">{v.trans}</p>
                <p className="mt-4 font-[family-name:var(--font-mono)] text-2xl font-semibold text-[#FFC629]">
                  USD {v.price}
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-[#B9B4A6]">
                  {v.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="text-[#FFC629]">—</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 rounded-sm border border-[#3A3A32] py-2 text-center text-sm font-semibold uppercase tracking-wide transition hover:border-[#FFC629] hover:text-[#FFC629]"
                >
                  Consultar
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FICHA TÉCNICA */}
      <section id="ficha" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
          Ficha técnica
        </h2>

        <div className="mt-10 rounded-sm border-2 border-[#3A3A32] bg-[#17170F] p-1">
          <div className="rounded-sm border border-[#2A2A24] p-6 sm:p-10">
            <div className="mb-6 flex items-center justify-between border-b border-[#2A2A24] pb-4">
              <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[#8D897C]">
                Placa de especificaciones
              </span>
              <span className="font-[family-name:var(--font-mono)] text-xs text-[#8D897C]">
                MOD. R8 · 2026
              </span>
            </div>
            <dl className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
              {SPECS.map((s) => (
                <div
                  key={s.label}
                  className="flex items-baseline justify-between gap-4 border-b border-dotted border-[#2A2A24] pb-2"
                >
                  <dt className="text-sm text-[#8D897C]">{s.label}</dt>
                  <dd className="font-[family-name:var(--font-mono)] text-sm font-medium text-[#ECE8DD]">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* CONTACTO / CTA */}
      <section id="contacto" className="relative overflow-hidden border-t-8 border-[#FFC629] bg-[#17170F]">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
            Probala en tu concesionario
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[#B9B4A6]">
            Coordiná un test drive o pedí tu cotización personalizada, sin
            compromiso.
          </p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-sm bg-[#FFC629] px-8 py-3 text-sm font-semibold uppercase tracking-wide text-[#121210] transition hover:bg-[#e6b024]"
          >
            Cotizar por WhatsApp
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#2A2A24] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-[#6F6C61] sm:flex-row">
          <span>© {new Date().getFullYear()} Rely Argentina</span>
          <span>Precios sujetos a modificación sin previo aviso.</span>
        </div>
      </footer>
    </main>
  );
}