"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone } from "lucide-react";

const TABS: { label: string; href?: string }[] = [
  { label: "Métricas Generales", href: "/panel-v2/marketing/generales" },
  { label: "Embudo", href: "/panel-v2/marketing/embudo" },
  { label: "Pautas", href: "/panel-v2/marketing/pautas" },
  { label: "Autos Pautados", href: "/panel-v2/marketing/pautados" },
  { label: "Búsquedas", href: "/panel-v2/marketing/busquedas" },
  { label: "Asistente IA", href: "/panel-v2/marketing/chatbot" },
  { label: "Instagram", href: "/panel-v2/marketing/instagram" },
  { label: "WhatsApp", href: "/panel-v2/marketing/whatsapp-metricas" },
];

export default function MarketingHeader() {
  const pathname = usePathname();

  return (
    <header className="flex flex-col border-b border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shrink-0 pt-6 px-6">
      <div className="flex items-center gap-3 pb-6">
        <Megaphone className="w-6 h-6 text-rose-600" />
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
            Marketing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Métricas, pautas publicitarias y rendimiento de canales.
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
                  ? "border-rose-600 text-rose-600 dark:text-rose-400"
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