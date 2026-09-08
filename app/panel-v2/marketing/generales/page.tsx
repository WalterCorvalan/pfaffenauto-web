import { createClient } from "@/lib/supabase2/server";
import Link from "next/link";
import { BarChart3, MessageSquareText, AtSign, Bot, Megaphone, Search, DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import TarjetaCostoIA from "@/components/panelV2/TarjetaCostoIA";

function inicioDia(offsetDias: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offsetDias);
  return d.toISOString();
}

function CardCanal({ href, icon: Icon, color, bg, label, conversaciones, mensajes }: { href: string; icon: any; color: string; bg: string; label: string; conversaciones: number; mensajes: number }) {
  return (
    <Link href={href} className="group bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></span>
        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 group-hover:text-slate-500 transition-all" />
      </div>
      <p className="text-sm font-bold text-slate-800 dark:text-white mt-3">{label}</p>
      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{conversaciones}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">conversaciones nuevas (7d) · {mensajes} mensajes</p>
    </Link>
  );
}

function CardResumen({ href, icon: Icon, color, bg, label, valor, sub }: { href: string; icon: any; color: string; bg: string; label: string; valor: React.ReactNode; sub: string }) {
  return (
    <Link href={href} className="group bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></span>
        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 group-hover:text-slate-500 transition-all" />
      </div>
      <p className="text-sm font-bold text-slate-800 dark:text-white mt-3">{label}</p>
      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{valor}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
    </Link>
  );
}

export default async function MetricasGeneralesPage() {
  const supabase = await createClient();
  const desde7 = inicioDia(7);
  const desde30 = inicioDia(30);
  const inicioMesDate = new Date();
  inicioMesDate.setUTCDate(1);
  inicioMesDate.setUTCHours(0, 0, 0, 0);
  const inicioMes = inicioMesDate.toISOString().slice(0, 10);

  const [
    { count: waConversaciones7 }, { count: waMensajes7 },
    { count: igConversaciones7 }, { count: igMensajes7 },
    { count: rodiConversaciones7 }, { count: rodiMensajes7 },
    { count: pautados }, { data: campanasMes },
    { data: busquedas7 },
    { data: usoIA30 },
    { count: leadsRealesUtmMes },
    { count: leadsTotal }, { count: leadsGanados },
  ] = await Promise.all([
    supabase.from("whatsapp_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("instagram_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("instagram_mensajes").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("rodi_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("rodi_mensajes").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("vehiculos").select("id", { count: "exact", head: true }).eq("pautado", true),
    supabase.from("campanas_marketing").select("gasto, leads").gte("periodo", inicioMes),
    supabase.from("busquedas_log").select("resultados_encontrados").gte("created_at", desde7),
    supabase.from("uso_ia_anthropic").select("input_tokens, output_tokens").gte("created_at", desde30).in("origen", ["panel-v2/webhooks/whatsapp", "panel-v2/webhooks/instagram", "panel-v2/rodi", "api/buscar-ia"]),
    supabase.from("leads_tasacion").select("id", { count: "exact", head: true }).not("utm_source", "is", null).gte("created_at", inicioMes),
    supabase.from("clientes").select("id", { count: "exact", head: true }),
    supabase.from("clientes").select("id", { count: "exact", head: true }).eq("pipeline_stage", "cerrado"),
  ]);

  const gastoMes = (campanasMes || []).reduce((acc, c) => acc + Number(c.gasto || 0), 0);
  const leadsMesPautas = (campanasMes || []).reduce((acc, c) => acc + Number(c.leads || 0), 0);
  const busquedasSinResultado = (busquedas7 || []).filter((b) => !b.resultados_encontrados).length;

  const tokensIn = (usoIA30 || []).reduce((acc, r) => acc + (r.input_tokens || 0), 0);
  const tokensOut = (usoIA30 || []).reduce((acc, r) => acc + (r.output_tokens || 0), 0);
  const costoIaTotal30 = (tokensIn / 1_000_000) * 1 + (tokensOut / 1_000_000) * 5;

  const tasaCierreGlobal = leadsTotal ? Math.round(((leadsGanados || 0) / leadsTotal) * 100) : 0;

  const canales = [
    { label: "WhatsApp", icon: MessageSquareText, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", conversaciones: waConversaciones7 ?? 0, mensajes: waMensajes7 ?? 0, href: "/panel-v2/marketing/whatsapp-metricas" },
    { label: "Instagram", icon: AtSign, color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-500/10", conversaciones: igConversaciones7 ?? 0, mensajes: igMensajes7 ?? 0, href: "/panel-v2/marketing/instagram" },
    { label: "Rodi (web)", icon: Bot, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-500/10", conversaciones: rodiConversaciones7 ?? 0, mensajes: rodiMensajes7 ?? 0, href: "/panel-v2/marketing/chatbot" },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-rose-600" /> Métricas Generales</h2>
        <p className="text-xs text-slate-400 mt-0.5">Resumen ejecutivo de todos los canales — últimos 7 días, gasto y costo de IA del mes en curso.</p>
      </div>

      {/* RESUMEN EJECUTIVO — lo primero que hay que mirar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 text-white">
          <TrendingUp className="w-5 h-5 text-indigo-200 mb-2" />
          <p className="text-2xl font-black font-mono">{tasaCierreGlobal}%</p>
          <p className="text-[11px] text-indigo-100 mt-0.5">Tasa de cierre global ({leadsGanados ?? 0} de {leadsTotal ?? 0} leads)</p>
        </div>
        <TarjetaCostoIA costo={costoIaTotal30} label="Costo IA total — todos los bots (30d)" limite={20} />
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
          <DollarSign className="w-5 h-5 text-amber-600 mb-2" />
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">$ {gastoMes.toLocaleString("es-AR")}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Gasto en pautas — mes en curso</p>
        </div>
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
          <Megaphone className="w-5 h-5 text-emerald-600 mb-2" />
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{leadsRealesUtmMes ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Leads reales por UTM (mes) — atribución automática</p>
        </div>
      </div>

      {/* CANALES DE CONVERSACIÓN */}
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Canales de conversación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {canales.map((c) => <CardCanal key={c.label} {...c} />)}
        </div>
      </div>

      {/* PUBLICIDAD Y ALCANCE */}
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Publicidad y alcance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CardResumen href="/panel-v2/marketing/pautas" icon={DollarSign} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-500/10" label="Gasto en pautas" valor={`$ ${gastoMes.toLocaleString("es-AR")}`} sub={`${leadsMesPautas} leads (carga manual)`} />
          <CardResumen href="/panel-v2/marketing/pautados" icon={Megaphone} color="text-indigo-600 dark:text-sky-300" bg="bg-indigo-50 dark:bg-indigo-500/10" label="Autos pautados" valor={pautados ?? 0} sub="unidades en pauta activa" />
          <CardResumen href="/panel-v2/marketing/busquedas" icon={Search} color="text-slate-600 dark:text-slate-300" bg="bg-slate-100 dark:bg-white/10" label="Búsquedas web (7d)" valor={busquedas7?.length ?? 0} sub={`${busquedasSinResultado} sin resultado`} />
        </div>
      </div>
    </div>
  );
}
