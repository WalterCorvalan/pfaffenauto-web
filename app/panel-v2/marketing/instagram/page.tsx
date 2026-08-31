import { createClient } from "@/lib/supabase2/server";
import { AtSign, ArrowDownToLine, ArrowUpFromLine, Users, Bot } from "lucide-react";

function inicioDia(offsetDias: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offsetDias);
  return d.toISOString();
}

export default async function InstagramMetricasPage() {
  const supabase = await createClient();
  const desde7 = inicioDia(7);
  const desde30 = inicioDia(30);

  const [
    { count: entrantes7 }, { count: salientes7 },
    { count: entrantes30 }, { count: salientes30 },
    { count: conversacionesNuevas7 }, { data: usoIA30 },
  ] = await Promise.all([
    supabase.from("instagram_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "in").gte("created_at", desde7),
    supabase.from("instagram_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "out").gte("created_at", desde7),
    supabase.from("instagram_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "in").gte("created_at", desde30),
    supabase.from("instagram_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "out").gte("created_at", desde30),
    supabase.from("instagram_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("instagram_mensajes").select("ai_generado").eq("direccion", "out").gte("created_at", desde30),
  ]);

  const salientesIA30 = (usoIA30 || []).filter((m) => m.ai_generado).length;
  const pctIA30 = salientes30 ? Math.round((salientesIA30 / salientes30) * 100) : 0;

  const tarjetas = [
    { label: "Mensajes entrantes (7d)", valor: entrantes7 ?? 0, icon: ArrowDownToLine, color: "text-emerald-600" },
    { label: "Mensajes salientes (7d)", valor: salientes7 ?? 0, icon: ArrowUpFromLine, color: "text-blue-600" },
    { label: "Conversaciones nuevas (7d)", valor: conversacionesNuevas7 ?? 0, icon: Users, color: "text-purple-600" },
    { label: "Respondidos por IA (30d)", valor: `${pctIA30}%`, icon: Bot, color: "text-pink-600" },
  ];

  return (
    <div className="p-6">
      <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4"><AtSign className="w-4 h-4 text-pink-600" /> Métricas de Instagram</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tarjetas.map((t) => (
          <div key={t.label} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
            <t.icon className={`w-5 h-5 ${t.color} mb-2`} />
            <p className="text-2xl font-black text-slate-900 dark:text-white">{t.valor}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{t.label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4">Últimos 30 días: {entrantes30 ?? 0} entrantes · {salientes30 ?? 0} salientes.</p>
    </div>
  );
}
