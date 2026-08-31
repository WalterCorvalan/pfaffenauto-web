"use client";

import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import ChatClient from "./ChatClient";
import LeadsTab from "./LeadsTab";

interface Perfil { id: string; nombre: string; roles: string[] }

export default function ConversacionesShell({
  conversacionesIniciales, conversacionesInstagramIniciales, vendedores,
}: { conversacionesIniciales: any[]; conversacionesInstagramIniciales: any[]; vendedores: Perfil[] }) {
  const [tab, setTab] = useState<"bandeja" | "leads" | "nuevo">("bandeja");
  const leadsConConversacion = conversacionesIniciales.filter((c) => c.estado_lead && c.estado_lead !== "nuevo").length
    + conversacionesInstagramIniciales.filter((c) => c.estado_lead && c.estado_lead !== "nuevo").length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-[#0A0A0A]">
      <div className="px-4 py-2 border-b border-slate-200 dark:border-white/10 shrink-0 flex items-center gap-3 flex-wrap">
        <h1 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 shrink-0">
          <MessageSquareText className="w-4 h-4 text-emerald-600" /> Conversaciones
        </h1>
        <p className="text-[10px] text-slate-400 shrink-0 hidden sm:block">{leadsConConversacion} lead{leadsConConversacion === 1 ? "" : "s"} con conversación</p>
        <div className="flex items-center gap-1 ml-auto">
          {[{ v: "bandeja" as const, l: "Bandeja" }, { v: "leads" as const, l: "Leads" }, { v: "nuevo" as const, l: "Nuevo mensaje" }].map((t) => (
            <button key={t.v} onClick={() => setTab(t.v)} className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${tab === t.v ? "bg-slate-900 dark:bg-white/10 text-white" : "bg-white dark:bg-transparent border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"}`}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {tab === "bandeja" && (
          <ChatClient conversacionesIniciales={conversacionesIniciales} conversacionesInstagramIniciales={conversacionesInstagramIniciales} vendedores={vendedores} />
        )}
        {tab === "leads" && (
          <LeadsTab conversacionesIniciales={conversacionesIniciales} vendedores={vendedores} />
        )}
        {tab === "nuevo" && (
          <div className="p-6">
            <div className="max-w-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Envío proactivo — próximamente</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/70 mt-2 leading-relaxed">
                Para responder a una conversación existente, andá a la tab <strong>Bandeja</strong>: ya podés enviar texto libre (si estamos dentro de la ventana de 24h de Meta) o una plantilla aprobada.
              </p>
              <p className="text-xs text-amber-700/60 dark:text-amber-300/50 mt-2 leading-relaxed">
                El envío a un número nuevo (sin conversación previa) requiere siempre plantilla y todavía no está expuesto en el CRM.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
