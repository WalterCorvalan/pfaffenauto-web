import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AtSign, ArrowDownToLine, ArrowUpFromLine, Users, PhoneCall, Flame, AlertTriangle } from "lucide-react";
import TarjetaCostoIA from "@/components/panel/TarjetaCostoIA";
import InstagramMetricsClient from "./InstagramMetricsClient";
import {
  getInstagramAccountSummary,
  getInstagramAccountInsights,
  getInstagramMedia,
  getInstagramMediaInsights,
} from "@/lib/meta/client";

// Métricas REALES de la cuenta (Meta Graph API) -- v1 las tenía, v2 solo
// mostraba el inbox de DMs. Se calcan acá, independientes del inbox de abajo
// (que sigue siendo lo que muestra esta página desde que se migró).
async function cargarMetricasCuenta() {
  const igUserId = process.env.META_INSTAGRAM_USER_ID;
  const token = process.env.META_INSTAGRAM_TOKEN;
  if (!igUserId || !token) return { ok: false as const, motivo: "Faltan META_INSTAGRAM_USER_ID / META_INSTAGRAM_TOKEN en las variables de entorno." };

  try {
    const ahora = Math.floor(Date.now() / 1000);
    const hace30dias = ahora - 30 * 24 * 3600;
    const [resumen, insights, media] = await Promise.all([
      getInstagramAccountSummary(igUserId, token),
      getInstagramAccountInsights(igUserId, token, hace30dias, ahora),
      getInstagramMedia(igUserId, token, 12),
    ]);

    const reachSerie = insights.data.find((m: any) => m.name === "reach")?.values ?? [];
    const visitasSerie = insights.data.find((m: any) => m.name === "profile_views")?.values ?? [];
    const serie = reachSerie.map((v: any, i: number) => ({
      fecha: new Date(v.end_time).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
      alcance: v.value,
      visitasPerfil: visitasSerie[i]?.value ?? 0,
    }));

    const postsConInsights = await Promise.all(
      media.data.slice(0, 6).map(async (p: any) => {
        try {
          const ins = await getInstagramMediaInsights(p.id, token);
          const reach = ins.data.find((m: any) => m.name === "reach")?.values[0]?.value;
          const saved = ins.data.find((m: any) => m.name === "saved")?.values[0]?.value;
          return { ...p, reach, saved };
        } catch {
          return { ...p, reach: undefined, saved: undefined };
        }
      })
    );

    return { ok: true as const, resumen, serie, posts: postsConInsights };
  } catch (err) {
    return { ok: false as const, motivo: err instanceof Error ? err.message : "Error desconocido al conectar con la API de Meta." };
  }
}

function inicioDia(offsetDias: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offsetDias);
  return d.toISOString();
}

const ORIGEN_IA = "panel-v2/webhooks/instagram";

const COLOR_SEMAFORO: Record<string, { borde: string; fondo: string; punto: string; texto: string }> = {
  caliente: { borde: "border-rose-200 dark:border-rose-500/20", fondo: "bg-rose-50/60 dark:bg-rose-500/10", punto: "bg-rose-500", texto: "text-rose-600 dark:text-rose-300" },
  tibio: { borde: "border-amber-200 dark:border-amber-500/20", fondo: "bg-amber-50/60 dark:bg-amber-500/10", punto: "bg-amber-500", texto: "text-amber-600 dark:text-amber-300" },
  frio: { borde: "border-slate-200 dark:border-white/10", fondo: "bg-white dark:bg-white/[0.02]", punto: "bg-slate-300 dark:bg-slate-600", texto: "text-slate-500 dark:text-slate-400" },
};

export default async function InstagramMetricasPage() {
  const supabase = await createClient();
  const desde7 = inicioDia(7);
  const desde30 = inicioDia(30);

  const [
    { count: entrantes7 }, { count: salientes7 },
    { count: entrantes30 }, { count: salientes30 },
    { count: conversacionesNuevas7 }, { data: usoIA30 },
    { count: totalCalientes }, { count: totalTibios },
    { count: totalHandoffs }, { count: totalConversacionesGlobal },
    { data: conversacionesRecientes },
  ] = await Promise.all([
    supabase.from("instagram_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "in").gte("created_at", desde7),
    supabase.from("instagram_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "out").gte("created_at", desde7),
    supabase.from("instagram_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "in").gte("created_at", desde30),
    supabase.from("instagram_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "out").gte("created_at", desde30),
    supabase.from("instagram_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde7),
    supabase.from("uso_ia_anthropic").select("input_tokens, output_tokens").eq("origen", ORIGEN_IA).gte("created_at", desde30),
    supabase.from("instagram_conversaciones").select("id", { count: "exact", head: true }).eq("calificacion", "caliente"),
    supabase.from("instagram_conversaciones").select("id", { count: "exact", head: true }).eq("calificacion", "tibio"),
    supabase.from("instagram_conversaciones").select("id", { count: "exact", head: true }).not("handoff_at", "is", null),
    supabase.from("instagram_conversaciones").select("id", { count: "exact", head: true }),
    supabase
      .from("instagram_conversaciones")
      .select("id, calificacion, last_message_at, handoff_at, instagram_contactos(username, ig_user_id)")
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(6),
  ]);

  const metricasCuenta = await cargarMetricasCuenta();

  const tokensIn = (usoIA30 || []).reduce((acc, r) => acc + (r.input_tokens || 0), 0);
  const tokensOut = (usoIA30 || []).reduce((acc, r) => acc + (r.output_tokens || 0), 0);
  const costoEstimado30 = (tokensIn / 1_000_000) * 1 + (tokensOut / 1_000_000) * 5;
  const pctHandoff = totalConversacionesGlobal ? Math.round(((totalHandoffs || 0) / totalConversacionesGlobal) * 100) : 0;

  const tarjetas = [
    { label: "Mensajes entrantes (7d)", valor: entrantes7 ?? 0, icon: ArrowDownToLine, color: "text-emerald-600" },
    { label: "Mensajes salientes (7d)", valor: salientes7 ?? 0, icon: ArrowUpFromLine, color: "text-blue-600" },
    { label: "Conversaciones nuevas (7d)", valor: conversacionesNuevas7 ?? 0, icon: Users, color: "text-purple-600" },
    { label: "Leads calientes", valor: totalCalientes ?? 0, icon: Flame, color: "text-rose-600" },
    { label: "Leads tibios", valor: totalTibios ?? 0, icon: Flame, color: "text-amber-500" },
    { label: "Pidieron humano", valor: `${pctHandoff}%`, icon: PhoneCall, color: "text-amber-600" },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><AtSign className="w-4 h-4 text-pink-600" /> Métricas de Instagram</h2>
        <p className="text-xs text-slate-400 mt-0.5">Últimos 30 días: {entrantes30 ?? 0} entrantes · {salientes30 ?? 0} salientes</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tarjetas.map((t) => (
          <div key={t.label} className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
            <t.icon className={`w-5 h-5 ${t.color} mb-2`} />
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{t.valor}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">{t.label}</p>
          </div>
        ))}
        <TarjetaCostoIA costo={costoEstimado30} label="Costo IA (30d)" />
      </div>

      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Rendimiento de la cuenta (Meta)</h2>
        {metricasCuenta.ok ? (
          <InstagramMetricsClient
            seguidores={metricasCuenta.resumen.followers_count}
            cantidadPosts={metricasCuenta.resumen.media_count}
            username={metricasCuenta.resumen.username}
            serie={metricasCuenta.serie}
            posts={metricasCuenta.posts}
          />
        ) : (
          <div className="bg-white dark:bg-white/[0.02] border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">No se pudieron cargar las métricas de la cuenta</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{metricasCuenta.motivo}</p>
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <AtSign className="w-3.5 h-3.5" /> Conversaciones recientes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(conversacionesRecientes || []).map((c: any) => {
            const contacto = c.instagram_contactos;
            const nombre = contacto?.username ? `@${contacto.username}` : contacto?.ig_user_id || "Desconocido";
            const color = COLOR_SEMAFORO[c.calificacion as string] || COLOR_SEMAFORO.frio;
            return (
              <Link
                key={c.id}
                href={`/panel/whatsapp?canal=instagram&conversacion=${c.id}`}
                className={`border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between ${color.borde} ${color.fondo}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${color.punto}`} />
                  <span className="font-bold text-[14px] text-slate-900 dark:text-white truncate">{nombre}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {c.handoff_at && <PhoneCall className="w-3 h-3 text-amber-500" />}
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${color.texto}`}>{c.calificacion || "frío"}</span>
                </div>
              </Link>
            );
          })}
          {(!conversacionesRecientes || conversacionesRecientes.length === 0) && (
            <div className="col-span-full py-12 text-center text-[13px] text-slate-400 italic bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
              Sin conversaciones todavía.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
