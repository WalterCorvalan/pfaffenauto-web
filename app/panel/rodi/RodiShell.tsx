"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import RodiBandeja from "./RodiBandeja";
import RodiLeadsTab from "./RodiLeadsTab";

interface Perfil { id: string; nombre: string; roles: string[] }

export default function RodiShell({ conversacionesIniciales, vendedores }: { conversacionesIniciales: any[]; vendedores: Perfil[] }) {
  const [tab, setTab] = useState<"bandeja" | "leads">("bandeja");
  const leadsConConversacion = conversacionesIniciales.filter((c) => c.estado_lead && c.estado_lead !== "nuevo").length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-[#0A0A0A]">
      <div className="px-6 pt-5 pb-3 border-b border-slate-200 dark:border-white/10 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Conversaciones (Rodi)</h1>
            <p className="text-xs text-slate-400 mt-0.5">{leadsConConversacion} lead{leadsConConversacion === 1 ? "" : "s"} con conversación · chat del sitio web</p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-bold">
            <Bot className="w-3.5 h-3.5" /> Rodi
          </span>
        </div>

        <div className="flex items-center gap-1 mt-4">
          {[{ v: "bandeja" as const, l: "Bandeja" }, { v: "leads" as const, l: "Leads" }].map((t) => (
            <button key={t.v} onClick={() => setTab(t.v)} className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-colors ${tab === t.v ? "bg-slate-900 dark:bg-white/10 text-white" : "bg-white dark:bg-transparent border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"}`}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {tab === "bandeja" ? <RodiBandeja conversacionesIniciales={conversacionesIniciales} vendedores={vendedores} /> : <RodiLeadsTab conversacionesIniciales={conversacionesIniciales} vendedores={vendedores} />}
      </div>
    </div>
  );
}
