import { createClient } from "@/lib/supabase2/server";
import Link from "next/link";
import { BarChart3, MessageSquareText, AtSign, Bot, Megaphone, Search, DollarSign } from "lucide-react";

function inicioDia(offsetDias: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offsetDias);
  return d.toISOString();
}

export default async function MetricasGeneralesPage() {
  const supabase = await createClient();
  const desde7 = inicioDia(7);
  const inicioMes = new Date();
  inicioMes.setUTCDate(1);
  inicioMes.setUTCHours(0, 0, 0, 0);

  const [
    { count: waConversaciones7 }, { count: waMensajes7 },
    { count: igConversaciones7 }, { count: igMensajes7 },
    { count: rodiConversaciones7 }, { count: rodiMensajes7 },
    { count: pautados }, { data: campanasMes },
    { data: busquedas7 },
  ] = await Promise.all([
    supabase.from("whatsapp_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("instagram_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("instagram_mensajes").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("rodi_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("rodi_mensajes").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("vehiculos").select("id", { count: "exact", head: true }).eq("pautado", true),
    supabase.from("campanas_marketing").select("gasto, leads").gte("periodo", inicioMes.toISOString().slice(0, 10)),
    supabase.from("busquedas_log").select("resultados_encontrados").gte("created_at", desde7),
  ]);

  const gastoMes = (campanasMes || []).reduce((acc, c) => acc + Number(c.gasto || 0), 0);
  const leadsMesPautas = (campanasMes || []).reduce((acc, c) => acc + Number(c.leads || 0), 0);
  const busquedasSinResultado = (busquedas7 || []).filter((b) => !b.resultados_encontrados).length;

  const canales = [
    { label: "WhatsApp", icon: MessageSquareText, color: "text-emerald-600", conversaciones: waConversaciones7 ?? 0, mensajes: waMensajes7 ?? 0, href: "/panel-v2/marketing/whatsapp-metricas" },
    { label: "Instagram", icon: AtSign, color: "text-pink-600", conversaciones: igConversaciones7 ?? 0, mensajes: igMensajes7 ?? 0, href: "/panel-v2/marketing/instagram" },
    { label: "Rodi (web)", icon: Bot, color: "text-rose-600", conversaciones: rodiConversaciones7 ?? 0, mensajes: rodiMensajes7 ?? 0, href: "/panel-v2/marketing/chatbot" },
  ];

  return (
    <div className="p-6">
      <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1"><BarChart3 className="w-4 h-4 text-rose-600" /> Métricas Generales</h2>
      <p className="text-xs text-slate-400 mb-5">Resumen de todos los canales — últimos 7 días, gasto del mes en curso.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {canales.map((c) => (
          <Link key={c.label} href={c.href} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 hover:shadow-md transition-shadow">
            <c.icon className={`w-5 h-5 ${c.color} mb-2`} />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{c.label}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{c.conversaciones}</p>
            <p className="text-[11px] text-slate-400">conversaciones nuevas · {c.mensajes} mensajes</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/panel-v2/marketing/pautas" className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 hover:shadow-md transition-shadow">
          <DollarSign className="w-5 h-5 text-amber-600 mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Gasto en pautas (mes)</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">${gastoMes.toLocaleString("es-AR")}</p>
          <p className="text-[11px] text-slate-400">{leadsMesPautas} leads generados</p>
        </Link>
        <Link href="/panel-v2/marketing/pautados" className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 hover:shadow-md transition-shadow">
          <Megaphone className="w-5 h-5 text-indigo-600 mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Autos pautados</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pautados ?? 0}</p>
          <p className="text-[11px] text-slate-400">unidades en pauta activa</p>
        </Link>
        <Link href="/panel-v2/marketing/busquedas" className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 hover:shadow-md transition-shadow">
          <Search className="w-5 h-5 text-slate-600 mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Búsquedas web (7d)</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{busquedas7?.length ?? 0}</p>
          <p className="text-[11px] text-slate-400">{busquedasSinResultado} sin resultado</p>
        </Link>
      </div>
    </div>
  );
}
