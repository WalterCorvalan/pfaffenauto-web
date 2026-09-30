"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { label: string; href?: string }[] = [
  { label: "Entregas", href: "/panel/contenido-sitio/entregas" },
  { label: "Hero (portada)" },
  { label: "Nuestra Historia" },
  { label: "Footer y redes", href: "/panel/contenido-sitio/footer-redes" },
  { label: "Formulario RRHH" },
];

export default function ContenidoSitioHeader() {
  const pathname = usePathname();

  return (
    <header className="flex flex-col border-b border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shrink-0 pt-6 px-6">
      <div className="flex items-center gap-3 pb-6">
        <img src="/icons/panel/marketing.png" alt="" className="w-6 h-6 object-contain shrink-0" />
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
            Contenido del Sitio
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Todo lo que hoy está fijo en el código de la web pública (imágenes, textos, redes, formularios) pasa a editarse desde acá.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar">
        {TABS.map((tab) => {
          if (!tab.href) {
            return (
              <span key={tab.label} title="Todavía no construido" className="pb-3 text-[13px] font-bold border-b-2 border-transparent text-slate-300 dark:text-slate-600 whitespace-nowrap cursor-not-allowed">
                {tab.label}
              </span>
            );
          }
          const activo = pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-3 text-[13px] font-bold transition-colors border-b-2 whitespace-nowrap ${
                activo
                  ? "border-[#0145F2] text-[#0145F2] dark:text-[#5b8dff]"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
