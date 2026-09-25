"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Facebook, Settings } from "lucide-react";

// Módulo separado de WhatsApp/Instagram (25/9), pero todavía sin integración
// real con Meta: no existe messenger_conversaciones ni webhook -- ver
// app/panel/whatsapp/ARCHITECTURE.md para el motivo de por qué no se armó
// de cero en el mismo pedido (requiere permisos de Messenger en la app de
// Meta, tablas nuevas y el bot de IA para ese canal). Esta pantalla queda
// lista para el día que se conecte: mismo layout de tabs que
// ConversacionesShell, pero con estado vacío en vez de datos reales. Cuando
// se conecte, seguir el patrón de instagram_conversaciones/instagram_mensajes
// (tablas + webhook + ChatClient/LeadsTab compartidos en
// components/panel/conversaciones/) y sumar messenger_conversaciones como
// 5ta fuente de leads (ver app/panel/leads/ARCHITECTURE.md, "No agregar un
// 5° canal sin actualizar los 3 lugares").
export default function MessengerClient() {
  const [tab, setTab] = useState<"bandeja" | "leads">("bandeja");

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-[#0A0A0A]">
      <div className="px-4 py-2 border-b border-slate-200 dark:border-white/10 shrink-0 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {[{ v: "bandeja" as const, l: "Bandeja" }, { v: "leads" as const, l: "Leads" }].map((t) => (
            <button key={t.v} onClick={() => setTab(t.v)} className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${tab === t.v ? "bg-slate-900 dark:bg-white/10 text-white" : "bg-white dark:bg-transparent border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"}`}>
              {t.l}
            </button>
          ))}
        </div>
        <h1 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 ml-auto shrink-0">
          <MessageCircle className="w-4 h-4 text-blue-600" /> Messenger
        </h1>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <Facebook className="w-7 h-7 text-blue-600 dark:text-blue-300" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">Facebook Messenger todavía no está conectado</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            {tab === "bandeja"
              ? "Cuando se habilite el canal en Meta for Developers y se conecte la app, los mensajes de Messenger van a aparecer acá mismo, con la misma bandeja que WhatsApp e Instagram."
              : "Los leads que lleguen por Messenger se van a sumar acá y al módulo unificado de Leads, igual que hoy pasa con WhatsApp e Instagram."}
          </p>
          <Link href="/panel/configuracion" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-300 hover:underline">
            <Settings className="w-3.5 h-3.5" /> Ir a Configuración
          </Link>
        </div>
      </div>
    </div>
  );
}
