"use client";

import { Space_Grotesk, Inter, Space_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

const STATS = [
  { value: "121", unit: "HP", label: "Potencia" },
  { value: "1.6", unit: "L", label: "Cilindrada" },
  { value: "1,62", unit: "ton", label: "Carga máx. (CS)" },
  { value: "7", unit: "años", label: "Garantía" },
];

const VERSIONS = [
  {
    code: "CS",
    name: "Cabina Simple",
    load: "1,62 toneladas",
    text: "Mayor espacio de carga y superficie optimizada para herramientas, mercadería o adaptaciones comerciales.",
    bullets: [
      "Capacidad de carga 1,62 ton",
      "Caja abierta de gran superficie",
      "Ideal para reparto y logística",
    ],
  },
  {
    code: "CD",
    name: "Cabina Doble",
    load: "1,54 toneladas",
    text: "Dos filas de asientos para trasladar equipo de trabajo sin resignar caja de carga.",
    bullets: [
      "Capacidad de carga 1,54 ton",
      "2 filas de asientos",
      "Ideal para cuadrillas y servicio técnico",
    ],
  },
];

const CHECKLIST = [
  "Motor 1.6L · 121 HP",
  "Dirección asistida",
  "Aire acondicionado",
  "Estructura reforzada para uso intensivo",
  "Soporte técnico y repuestos a nivel nacional",
  "Respaldo de red de concesionarios oficial",
];

const SPECS = [
  { label: "Motor", value: "1.6L · 4 cilindros" },
  { label: "Potencia", value: "121 HP" },
  { label: "Transmisión", value: "Manual" },
  { label: "Carga máx. (CS)", value: "1.620 kg" },
  { label: "Carga máx. (CD)", value: "1.540 kg" },
  { label: "Dirección", value: "Asistida" },
  { label: "Garantía", value: "7 años / 100.000 km" },
  { label: "Uso recomendado", value: "Logística, reparto, servicio técnico" },
];

const WHATSAPP_LINK =
  "https://wa.me/5491100000000?text=Hola%2C%20quiero%20cotizar%20la%20Karry%20Pick%20Up";

export default function LandingKarry() {
  return (
    <main
      className={`${spaceGrotesk.variable} ${inter.variable} ${spaceMono.variable} bg-[#0F2440] text-[#EAF0F6] font-[family-name:var(--font-body)]`}
    >
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#1E3A5F] bg-[#0F2440]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-wide">
            KARRY <span className="text-[#FF6B35]">Pick Up</span>
          </span>

          <nav className="hidden gap-8 text-sm font-medium text-[#9FB6CC] md:flex">
            <a href="#versiones" className="hover:text-[#EAF0F6]">CS / CD</a>
            <a href="#ficha" className="hover:text-[#EAF0F6]">Ficha técnica</a>
            <a href="#contacto" className="hover:text-[#EAF0F6]">Concesionario</a>
          </nav>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-[#0F2440] transition hover:bg-[#e85a26]"
          >
            Cotizar
          </a>
        </div>
      </header>

      {/* HERO */}
      <section
        className="relative overflow-hidden border-b border-[#1E3A5F]"
        style={{
          backgroundImage:
            "linear-gradient(#1A3A5C 1px, transparent 1px), linear-gradient(90deg, #1A3A5C 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[#FF6B35]">
            Fig. 01 — Utilitaria CS / CD · Motor 1.6L
          </p>
          <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            El motor de tu productividad.
          </h1>
          <p className="mt-6 max-w-lg text-base text-[#9FB6CC]">
            Fuerza utilitaria con doble versatilidad: elegí cabina simple para
            más caja, o cabina doble para llevar al equipo completo.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm bg-[#FF6B35] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#0F2440] transition hover:bg-[#e85a26]"
            >
              Cotizar por WhatsApp
            </a>
            <a
              href="#ficha"
              className="rounded-sm border border-[#2E4E70] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#EAF0F6] transition hover:border-[#FF6B35] hover:text-[#FF6B35]"
            >
              Ver ficha técnica
            </a>
          </div>

          <div className="mt-16 flex items-center gap-3 text-[#3E5C7C]">
            <span className="h-px w-10 bg-[#3E5C7C]" />
            <span className="font-[family-name:var(--font-mono)] text-xs">
              ESCALA 1:1 — TODAS LAS MEDIDAS EN MM
            </span>
            <span className="h-px flex-1 bg-[#3E5C7C]" />
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-b border-[#1E3A5F] bg-[#0C1F38]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-[#1E3A5F] px-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="px-4 py-8 text-center">
              <div className="font-[family-name:var(--font-mono)] text-3xl font-bold text-[#FF6B35] sm:text-4xl">
                {s.value}
                <span className="ml-1 text-base text-[#9FB6CC]">{s.unit}</span>
              </div>
              <div className="mt-2 text-xs uppercase tracking-widest text-[#6E8CAA]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VERSIONES CS / CD */}
      <section id="versiones" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          Dos configuraciones, un mismo motor
        </h2>
        <p className="mt-3 max-w-xl text-[#9FB6CC]">
          Elegí la que se adapte a tu operación diaria.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {VERSIONS.map((v) => (
            <div
              key={v.code}
              className="rounded-sm border border-[#1E3A5F] bg-[#0C1F38] p-8"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-[family-name:var(--font-display)] text-2xl font-bold">
                  {v.name}
                </span>
                <span className="font-[family-name:var(--font-mono)] text-sm text-[#FF6B35]">
                  {v.code}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#9FB6CC]">
                {v.text}
              </p>
              <ul className="mt-6 space-y-2 border-t border-[#1E3A5F] pt-6 text-sm text-[#C4D4E4]">
                {v.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-[#FF6B35]">→</span>
                    {b}
                  </li>
                ))}
              </ul>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block rounded-sm border border-[#2E4E70] py-2 text-center text-sm font-semibold uppercase tracking-wide transition hover:border-[#FF6B35] hover:text-[#FF6B35]"
              >
                Consultar {v.code}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CHECKLIST / MANIFIESTO */}
      <section className="border-y border-[#1E3A5F] bg-[#0C1F38] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
            Equipamiento de serie
          </h2>
          <p className="mt-3 max-w-xl text-[#9FB6CC]">
            Sin extras que no necesitás, con lo justo para trabajar todos los
            días.
          </p>
          <ul className="mt-10 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {CHECKLIST.map((item, i) => (
              <li
                key={item}
                className="flex items-center gap-4 border-b border-dotted border-[#1E3A5F] pb-4"
              >
                <span className="font-[family-name:var(--font-mono)] text-xs text-[#3E5C7C]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm text-[#EAF0F6]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FICHA TÉCNICA */}
      <section id="ficha" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
          Ficha técnica
        </h2>

        <div className="mt-10 overflow-hidden rounded-sm border border-[#1E3A5F]">
          {SPECS.map((s, i) => (
            <div
              key={s.label}
              className={`flex items-center justify-between px-6 py-4 ${
                i % 2 === 0 ? "bg-[#0C1F38]" : "bg-[#0F2440]"
              }`}
            >
              <span className="text-sm text-[#9FB6CC]">{s.label}</span>
              <span className="font-[family-name:var(--font-mono)] text-sm font-bold text-[#EAF0F6]">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACTO / CTA */}
      <section id="contacto" className="relative overflow-hidden border-t border-[#1E3A5F] bg-[#0C1F38]">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
            Activá el motor de tu negocio
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[#9FB6CC]">
            Coordiná un test drive o pedí tu cotización sin compromiso.
          </p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-sm bg-[#FF6B35] px-8 py-3 text-sm font-semibold uppercase tracking-wide text-[#0F2440] transition hover:bg-[#e85a26]"
          >
            Cotizar por WhatsApp
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1E3A5F] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-[#5E7A98] sm:flex-row">
          <span>© {new Date().getFullYear()} Karry Argentina</span>
          <span>Precios sujetos a modificación sin previo aviso.</span>
        </div>
      </footer>
    </main>
  );
}