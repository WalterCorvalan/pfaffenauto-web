import { createClient } from "@/lib/supabase2/server";
import Link from "next/link";
import { MessageSquareText, ArrowDownToLine, ArrowUpFromLine, Users, ChevronLeft, ChevronRight, PhoneCall, Flame } from "lucide-react";
import TarjetaCostoIA from "@/components/panelV2/TarjetaCostoIA";

function inicioDia(offsetDias: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offsetDias);
  return d.toISOString();
}

const POR_PAGINA = 6;
const ORIGEN_IA = "panel-v2/webhooks/whatsapp";

// Mismo semáforo que usa /panel/chat (ChatClient.tsx: colorCalificacion).
const COLOR_SEMAFORO: Record<string, { borde: string; fondo: string; punto: string; texto: string }> = {
  caliente: { borde: "border-rose-200 dark:border-rose-500/20", fondo: "bg-rose-50/60 dark:bg-rose-500/10", punto: "bg-rose-500", texto: "text-rose-600 dark:text-rose-300" },
  tibio: { borde: "border-amber-200 dark:border-amber-500/20", fondo: "bg-amber-50/60 dark:bg-amber-500/10", punto: "bg-amber-500", texto: "text-amber-600 dark:text-amber-300" },
  frio: { borde: "border-slate-200 dark:border-white/10", fondo: "bg-white dark:bg-white/[0.02]", punto: "bg-slate-300 dark:bg-slate-600", texto: "text-slate-500 dark:text-slate-400" },
};

function StatTile({ label, valor, icon: Icon, color = "text-slate-500", sub }: { label: string; valor: React.ReactNode; icon?: any; color?: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
      {Icon && <Icon className={`w-5 h-5 ${color} mb-2`} />}
      <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{valor}</p>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default async function WhatsappMetricasPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const paginaActual = Math.max(1, Number(p) || 1);
  const desde = (paginaActual - 1) * POR_PAGINA;
  const hasta = desde + POR_PAGINA - 1;

  const supabase = await createClient();

  const desdeHoy = inicioDia(0);
  const desde7dias = inicioDia(7);
  const desde30dias = inicioDia(30);

  const [
    { count: entrantesHoy },
    { count: salientesHoy },
    { count: entrantes7 },
    { count: salientes7 },
    { count: entrantes30 },
    { count: salientes30 },
    { count: conversacionesNuevas7 },
    { data: usoIA30 },
    { count: totalCalientes },
    { count: totalTibios },
    { count: totalFrios },
    { count: totalHandoffs },
    { count: totalConversacionesGlobal },
    { data: conversaciones, count: totalConversaciones },
  ] = await Promise.all([
    supabase.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "in").gte("created_at", desdeHoy),
    supabase.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "out").gte("created_at", desdeHoy),
    supabase.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "in").gte("created_at", desde7dias),
    supabase.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "out").gte("created_at", desde7dias),
    supabase.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "in").gte("created_at", desde30dias),
    supabase.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "out").gte("created_at", desde30dias),
    supabase.from("whatsapp_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde7dias),
    supabase.from("uso_ia_anthropic").select("input_tokens, output_tokens").eq("origen", ORIGEN_IA).gte("created_at", desde30dias),
    supabase.from("whatsapp_conversaciones").select("id", { count: "exact", head: true }).eq("calificacion", "caliente"),
    supabase.from("whatsapp_conversaciones").select("id", { count: "exact", head: true }).eq("calificacion", "tibio"),
    supabase.from("whatsapp_conversaciones").select("id", { count: "exact", head: true }).eq("calificacion", "frio"),
    supabase.from("whatsapp_conversaciones").select("id", { count: "exact", head: true }).not("handoff_at", "is", null),
    supabase.from("whatsapp_conversaciones").select("id", { count: "exact", head: true }),
    supabase
      .from("whatsapp_conversaciones")
      .select("id, calificacion, last_message_at, handoff_at, whatsapp_contactos(nombre_perfil, telefono)", { count: "exact" })
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .range(desde, hasta),
  ]);

  // Pricing Haiku 4.5: $1/$5 por millón de tokens — ver lib/ai/indexV2.ts (MODELO_ANTHROPIC).
  const tokensIn = (usoIA30 || []).reduce((acc, r) => acc + (r.input_tokens || 0), 0);
  const tokensOut = (usoIA30 || []).reduce((acc, r) => acc + (r.output_tokens || 0), 0);
  const costoEstimado30 = (tokensIn / 1_000_000) * 1 + (tokensOut / 1_000_000) * 5;

  const pctHandoff = totalConversacionesGlobal ? Math.round(((totalHandoffs || 0) / totalConversacionesGlobal) * 100) : 0;

  const tarjetas = [
    { label: "Hoy", entrantes: entrantesHoy || 0, salientes: salientesHoy || 0 },
    { label: "Últimos 7 días", entrantes: entrantes7 || 0, salientes: salientes7 || 0 },
    { label: "Últimos 30 días", entrantes: entrantes30 || 0, salientes: salientes30 || 0 },
  ];

  const idsPagina = (conversaciones || []).map((c) => c.id);
  const { data: mensajesPagina } = idsPagina.length
    ? await supabase.from("whatsapp_mensajes").select("conversacion_id, direccion").in("conversacion_id", idsPagina)
    : { data: [] as { conversacion_id: string; direccion: string }[] };

  const conteoPorConversacion = new Map<string, { in: number; out: number }>();
  for (const m of mensajesPagina || []) {
    const actual = conteoPorConversacion.get(m.conversacion_id) || { in: 0, out: 0 };
    if (m.direccion === "in") actual.in += 1;
    else actual.out += 1;
    conteoPorConversacion.set(m.conversacion_id, actual);
  }

  const totalPaginas = Math.max(1, Math.ceil((totalConversaciones || 0) / POR_PAGINA));

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><MessageSquareText className="w-4 h-4 text-emerald-600" /> Métricas de WhatsApp</h2>
        <p className="text-xs text-slate-400 mt-0.5">Volumen de mensajes del bot, calificación de leads y costo estimado de IA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tarjetas.map((t) => (
          <div key={t.label} className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{t.label}</span>
            <div className="flex items-center gap-5 mt-2">
              <div className="flex items-center gap-1.5">
                <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{t.entrantes}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">recibidos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowUpFromLine className="w-4 h-4 text-indigo-600 dark:text-sky-300" />
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{t.salientes}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">enviados</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatTile label="Nuevas (7d)" valor={conversacionesNuevas7 || 0} icon={Users} color="text-indigo-600 dark:text-sky-300" />
        <StatTile label="Leads calientes" valor={totalCalientes || 0} icon={Flame} color="text-rose-600" />
        <StatTile label="Leads tibios" valor={totalTibios || 0} icon={Flame} color="text-amber-500" />
        <StatTile label="Pidieron humano" valor={`${pctHandoff}%`} icon={PhoneCall} color="text-amber-600" sub={`${totalHandoffs || 0} de ${totalConversacionesGlobal || 0} conversaciones`} />
        <TarjetaCostoIA costo={costoEstimado30} label="Costo IA (30d)" sub={`${tokensIn.toLocaleString("es-AR")} in · ${tokensOut.toLocaleString("es-AR")} out`} />
      </div>

      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <MessageSquareText className="w-3.5 h-3.5" /> Conversaciones recientes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(conversaciones || []).map((c: any) => {
            const contacto = c.whatsapp_contactos;
            const nombre = contacto?.nombre_perfil || contacto?.telefono || "Desconocido";
            const conteo = conteoPorConversacion.get(c.id) || { in: 0, out: 0 };
            const color = COLOR_SEMAFORO[c.calificacion as string] || COLOR_SEMAFORO.frio;

            return (
              <Link
                key={c.id}
                href={`/panel-v2/whatsapp?conversacion=${c.id}`}
                className={`border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all ${color.borde} ${color.fondo}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${color.punto}`} />
                    <span className="font-bold text-[14px] text-slate-900 dark:text-white truncate">{nombre}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {c.handoff_at && <PhoneCall className="w-3 h-3 text-amber-500" aria-label="Derivado a un vendedor" />}
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${color.texto}`}>{c.calificacion || "frío"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1.5">
                    <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{conteo.in}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">recibidos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ArrowUpFromLine className="w-3.5 h-3.5 text-indigo-600 dark:text-sky-300" />
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{conteo.out}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">enviados</span>
                  </div>
                </div>
              </Link>
            );
          })}
          {(!conversaciones || conversaciones.length === 0) && (
            <div className="col-span-full py-12 text-center text-[13px] text-slate-400 italic bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
              Sin conversaciones todavía.
            </div>
          )}
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-center gap-3 mt-5">
            <Link
              href={`/panel-v2/marketing/whatsapp-metricas?p=${paginaActual - 1}`}
              aria-disabled={paginaActual <= 1}
              className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg border transition-colors ${
                paginaActual <= 1
                  ? "pointer-events-none opacity-40 border-slate-200 dark:border-white/10 text-slate-400"
                  : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </Link>
            <span className="text-[11px] font-bold text-slate-400">
              Página {paginaActual} de {totalPaginas}
            </span>
            <Link
              href={`/panel-v2/marketing/whatsapp-metricas?p=${paginaActual + 1}`}
              aria-disabled={paginaActual >= totalPaginas}
              className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg border transition-colors ${
                paginaActual >= totalPaginas
                  ? "pointer-events-none opacity-40 border-slate-200 dark:border-white/10 text-slate-400"
                  : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              Siguiente <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
