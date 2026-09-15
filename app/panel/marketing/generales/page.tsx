import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BarChart3, MessageSquareText, AtSign, Bot, Megaphone, Search, DollarSign, TrendingUp, TrendingDown, ArrowRight, Users } from "lucide-react";
import TarjetaCostoIA from "@/components/panel/TarjetaCostoIA";

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
  const desde60 = inicioDia(60);
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
    { count: waTotal }, { count: waGanados },
    { count: igTotal }, { count: igGanados },
    { count: rodiTotal }, { count: rodiGanados },
    { count: manualesTotal }, { count: manualesGanados },
    // "Leads nuevos" y "Leads por canal" -- las mismas 4 fuentes de siempre
    // (ver app/panel/leads/ARCHITECTURE.md), acá filtradas por fecha de
    // ingreso en vez de estado. "Canal" = de qué fuente vino el lead, no
    // canal_origen (esa es la atribución de publicidad dentro de cada
    // fuente, un dato distinto).
    { count: waNuevos30 }, { count: igNuevos30 }, { count: rodiNuevos30 }, { count: manualesNuevos30 },
    { count: waNuevosAnt30 }, { count: igNuevosAnt30 }, { count: rodiNuevosAnt30 }, { count: manualesNuevosAnt30 },
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
    // "Tasa de cierre global" tiene que contar leads reales, no clientes del
    // CRM -- un lead no vive en una sola tabla (ver app/panel/leads/ARCHITECTURE.md,
    // esta confusión clientes-vs-leads ya generó 2 bugs de auditoría antes de
    // este). Se suman las 4 fuentes: total y "convertido" (estado_lead) de cada una.
    supabase.from("whatsapp_conversaciones").select("id", { count: "exact", head: true }),
    supabase.from("whatsapp_conversaciones").select("id", { count: "exact", head: true }).eq("estado_lead", "convertido"),
    supabase.from("instagram_conversaciones").select("id", { count: "exact", head: true }),
    supabase.from("instagram_conversaciones").select("id", { count: "exact", head: true }).eq("estado_lead", "convertido"),
    supabase.from("rodi_conversaciones").select("id", { count: "exact", head: true }),
    supabase.from("rodi_conversaciones").select("id", { count: "exact", head: true }).eq("estado_lead", "convertido"),
    supabase.from("leads_manuales").select("id", { count: "exact", head: true }),
    supabase.from("leads_manuales").select("id", { count: "exact", head: true }).eq("estado_lead", "convertido"),
    supabase.from("whatsapp_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde30),
    supabase.from("instagram_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde30),
    supabase.from("rodi_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde30),
    supabase.from("leads_manuales").select("id", { count: "exact", head: true }).gte("created_at", desde30),
    supabase.from("whatsapp_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde60).lt("created_at", desde30),
    supabase.from("instagram_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde60).lt("created_at", desde30),
    supabase.from("rodi_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde60).lt("created_at", desde30),
    supabase.from("leads_manuales").select("id", { count: "exact", head: true }).gte("created_at", desde60).lt("created_at", desde30),
  ]);

  const leadsTotal = (waTotal ?? 0) + (igTotal ?? 0) + (rodiTotal ?? 0) + (manualesTotal ?? 0);
  const leadsGanados = (waGanados ?? 0) + (igGanados ?? 0) + (rodiGanados ?? 0) + (manualesGanados ?? 0);

  const gastoMes = (campanasMes || []).reduce((acc, c) => acc + Number(c.gasto || 0), 0);
  const leadsMesPautas = (campanasMes || []).reduce((acc, c) => acc + Number(c.leads || 0), 0);
  const busquedasSinResultado = (busquedas7 || []).filter((b) => !b.resultados_encontrados).length;

  const tokensIn = (usoIA30 || []).reduce((acc, r) => acc + (r.input_tokens || 0), 0);
  const tokensOut = (usoIA30 || []).reduce((acc, r) => acc + (r.output_tokens || 0), 0);
  const costoIaTotal30 = (tokensIn / 1_000_000) * 1 + (tokensOut / 1_000_000) * 5;

  const tasaCierreGlobal = leadsTotal ? Math.round(((leadsGanados || 0) / leadsTotal) * 100) : 0;

  const leadsPorCanal = [
    { label: "WhatsApp", n: waNuevos30 ?? 0 },
    { label: "Instagram", n: igNuevos30 ?? 0 },
    { label: "Web (Rodi)", n: rodiNuevos30 ?? 0 },
    { label: "Carga manual", n: manualesNuevos30 ?? 0 },
  ].sort((a, b) => b.n - a.n);
  const leadsNuevos30 = leadsPorCanal.reduce((acc, c) => acc + c.n, 0);
  const leadsNuevosAnt30 = (waNuevosAnt30 ?? 0) + (igNuevosAnt30 ?? 0) + (rodiNuevosAnt30 ?? 0) + (manualesNuevosAnt30 ?? 0);
  const variacionLeadsPct = leadsNuevosAnt30 > 0 ? Math.round(((leadsNuevos30 - leadsNuevosAnt30) / leadsNuevosAnt30) * 100) : null;

  const canales = [
    { label: "WhatsApp", icon: MessageSquareText, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", conversaciones: waConversaciones7 ?? 0, mensajes: waMensajes7 ?? 0, href: "/panel/marketing/whatsapp-metricas" },
    { label: "Instagram", icon: AtSign, color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-500/10", conversaciones: igConversaciones7 ?? 0, mensajes: igMensajes7 ?? 0, href: "/panel/marketing/instagram" },
    { label: "Rodi (web)", icon: Bot, color: "text-[#0145F2]", bg: "bg-rose-50 dark:bg-rose-500/10", conversaciones: rodiConversaciones7 ?? 0, mensajes: rodiMensajes7 ?? 0, href: "/panel/marketing/chatbot" },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#0145F2]" /> Métricas Generales</h2>
        <p className="text-xs text-slate-400 mt-0.5">Resumen ejecutivo de todos los canales — últimos 7 días, gasto y costo de IA del mes en curso.</p>
      </div>

      {/* LEADS NUEVOS — de dónde vienen los clientes (últimos 30 días) */}
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Leads nuevos — últimos 30 días</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
            <Users className="w-5 h-5 text-[#0145F2] mb-2" />
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{leadsNuevos30}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              Leads nuevos (30d)
              {variacionLeadsPct !== null && (
                <span className={`inline-flex items-center gap-0.5 font-bold ${variacionLeadsPct >= 0 ? "text-emerald-600" : "text-[#0145F2]"}`}>
                  {variacionLeadsPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {Math.abs(variacionLeadsPct)}%
                </span>
              )}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Período anterior (30d previos): {leadsNuevosAnt30}</p>
          </div>
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
            <p className="text-sm font-bold text-slate-800 dark:text-white mb-3">Leads por canal</p>
            {leadsNuevos30 === 0 ? (
              <p className="text-xs text-slate-400 py-2">Sin leads nuevos en el período.</p>
            ) : (
              <div className="space-y-2">
                {leadsPorCanal.map((c) => {
                  const pct = Math.round((c.n / leadsNuevos30) * 100);
                  return (
                    <div key={c.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{c.label}</span>
                        <span className="font-black text-slate-700 dark:text-slate-200">{c.n} · {pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full bg-rose-500" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-3">Cada persona cuenta una vez, por fecha de ingreso a whatsapp_conversaciones/instagram_conversaciones/rodi_conversaciones/leads_manuales.</p>
          </div>
        </div>
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
          <CardResumen href="/panel/marketing/pautas" icon={DollarSign} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-500/10" label="Gasto en pautas" valor={`$ ${gastoMes.toLocaleString("es-AR")}`} sub={`${leadsMesPautas} leads (carga manual)`} />
          <CardResumen href="/panel/marketing/pautados" icon={Megaphone} color="text-indigo-600 dark:text-sky-300" bg="bg-indigo-50 dark:bg-indigo-500/10" label="Autos pautados" valor={pautados ?? 0} sub="unidades en pauta activa" />
          <CardResumen href="/panel/marketing/busquedas" icon={Search} color="text-slate-600 dark:text-slate-300" bg="bg-slate-100 dark:bg-white/10" label="Búsquedas web (7d)" valor={busquedas7?.length ?? 0} sub={`${busquedasSinResultado} sin resultado`} />
        </div>
      </div>
    </div>
  );
}
