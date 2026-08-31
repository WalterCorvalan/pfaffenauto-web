import { createClient } from "@/lib/supabase2/server";
import { Bot, MessageCircle, Flame, PhoneCall } from "lucide-react";

function inicioDia(offsetDias: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offsetDias);
  return d.toISOString();
}

export default async function ChatbotMetricasPage() {
  const supabase = await createClient();
  const desde7 = inicioDia(7);

  const [
    { count: conversaciones7 }, { count: mensajesEntrantes7 },
    { count: calientes7 }, { count: handoffs7 },
  ] = await Promise.all([
    supabase.from("rodi_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("rodi_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "in").gte("created_at", desde7),
    supabase.from("rodi_conversaciones").select("id", { count: "exact", head: true }).eq("calificacion", "caliente").gte("created_at", desde7),
    supabase.from("rodi_conversaciones").select("id", { count: "exact", head: true }).not("handoff_at", "is", null).gte("created_at", desde7),
  ]);

  const tarjetas = [
    { label: "Conversaciones (7d)", valor: conversaciones7 ?? 0, icon: MessageCircle, color: "text-indigo-600" },
    { label: "Mensajes de clientes (7d)", valor: mensajesEntrantes7 ?? 0, icon: Bot, color: "text-emerald-600" },
    { label: "Leads calientes (7d)", valor: calientes7 ?? 0, icon: Flame, color: "text-rose-600" },
    { label: "Pidieron hablar con humano (7d)", valor: handoffs7 ?? 0, icon: PhoneCall, color: "text-amber-600" },
  ];

  return (
    <div className="p-6">
      <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4"><Bot className="w-4 h-4 text-rose-600" /> Asistente Virtual (Rodi)</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tarjetas.map((t) => (
          <div key={t.label} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
            <t.icon className={`w-5 h-5 ${t.color} mb-2`} />
            <p className="text-2xl font-black text-slate-900 dark:text-white">{t.valor}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{t.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
