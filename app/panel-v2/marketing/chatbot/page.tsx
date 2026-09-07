import { createClient } from "@/lib/supabase2/server";
import { Bot, MessageCircle, Flame, PhoneCall, DollarSign } from "lucide-react";

function inicioDia(offsetDias: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offsetDias);
  return d.toISOString();
}

const ORIGEN_IA = "panel-v2/rodi";

export default async function ChatbotMetricasPage() {
  const supabase = await createClient();
  const desde7 = inicioDia(7);
  const desde30 = inicioDia(30);

  const [
    { count: conversaciones7 }, { count: mensajesEntrantes7 },
    { count: calientes7 }, { count: tibios7 }, { count: handoffs7 },
    { count: totalConversacionesGlobal }, { count: totalHandoffs },
    { data: usoIA30 },
  ] = await Promise.all([
    supabase.from("rodi_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("rodi_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "in").gte("created_at", desde7),
    supabase.from("rodi_conversaciones").select("id", { count: "exact", head: true }).eq("calificacion", "caliente").gte("created_at", desde7),
    supabase.from("rodi_conversaciones").select("id", { count: "exact", head: true }).eq("calificacion", "tibio").gte("created_at", desde7),
    supabase.from("rodi_conversaciones").select("id", { count: "exact", head: true }).not("handoff_at", "is", null).gte("created_at", desde7),
    supabase.from("rodi_conversaciones").select("id", { count: "exact", head: true }),
    supabase.from("rodi_conversaciones").select("id", { count: "exact", head: true }).not("handoff_at", "is", null),
    supabase.from("uso_ia_anthropic").select("input_tokens, output_tokens").eq("origen", ORIGEN_IA).gte("created_at", desde30),
  ]);

  const tokensIn = (usoIA30 || []).reduce((acc, r) => acc + (r.input_tokens || 0), 0);
  const tokensOut = (usoIA30 || []).reduce((acc, r) => acc + (r.output_tokens || 0), 0);
  const costoEstimado30 = (tokensIn / 1_000_000) * 1 + (tokensOut / 1_000_000) * 5;
  const pctHandoffGlobal = totalConversacionesGlobal ? Math.round(((totalHandoffs || 0) / totalConversacionesGlobal) * 100) : 0;

  const tarjetas = [
    { label: "Conversaciones (7d)", valor: conversaciones7 ?? 0, icon: MessageCircle, color: "text-indigo-600" },
    { label: "Mensajes de clientes (7d)", valor: mensajesEntrantes7 ?? 0, icon: Bot, color: "text-emerald-600" },
    { label: "Leads calientes (7d)", valor: calientes7 ?? 0, icon: Flame, color: "text-rose-600" },
    { label: "Leads tibios (7d)", valor: tibios7 ?? 0, icon: Flame, color: "text-amber-500" },
    { label: "Pidieron humano (7d)", valor: handoffs7 ?? 0, icon: PhoneCall, color: "text-amber-600" },
    { label: "Tasa de derivación (histórico)", valor: `${pctHandoffGlobal}%`, icon: PhoneCall, color: "text-amber-600" },
    {
      label: "Costo IA (30d)",
      valor: costoEstimado30 > 0 ? `US$ ${costoEstimado30.toLocaleString("es-AR", { maximumFractionDigits: 2 })}` : "—",
      icon: DollarSign,
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Bot className="w-4 h-4 text-rose-600" /> Asistente Virtual (Rodi)</h2>
        <p className="text-xs text-slate-400 mt-0.5">Chatbot del sitio público — distinto del bot de WhatsApp, cada uno con su propia charla y costo de IA</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tarjetas.map((t) => (
          <div key={t.label} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
            <t.icon className={`w-5 h-5 ${t.color} mb-2`} />
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{t.valor}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{t.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
