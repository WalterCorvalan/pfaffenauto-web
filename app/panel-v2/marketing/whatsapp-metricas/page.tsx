import { createClient } from "@/lib/supabase2/server";
import Link from "next/link";
import { MessageSquareText, ArrowDownToLine, ArrowUpFromLine, Users, Bot, ChevronLeft, ChevronRight } from "lucide-react";

function inicioDia(offsetDias: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offsetDias);
  return d.toISOString();
}

const POR_PAGINA = 6;

// Mismo semáforo que usa /panel/chat (ChatClient.tsx: colorCalificacion).
const COLOR_SEMAFORO: Record<string, { borde: string; fondo: string; punto: string; texto: string }> = {
  caliente: { borde: "border-rose-300 dark:border-rose-500/40", fondo: "bg-rose-50/60 dark:bg-rose-950/20", punto: "bg-rose-500", texto: "text-rose-700 dark:text-rose-300" },
  tibio: { borde: "border-amber-300 dark:border-amber-500/40", fondo: "bg-amber-50/60 dark:bg-amber-950/20", punto: "bg-amber-500", texto: "text-amber-700 dark:text-amber-300" },
  frio: { borde: "border-slate-200 dark:border-[#0a2a6b]", fondo: "bg-white dark:bg-[#001c55]", punto: "bg-slate-300 dark:bg-slate-600", texto: "text-slate-500 dark:text-slate-400" },
};

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
    { data: conversaciones, count: totalConversaciones },
  ] = await Promise.all([
    supabase.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "in").gte("created_at", desdeHoy),
    supabase.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "out").gte("created_at", desdeHoy),
    supabase.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "in").gte("created_at", desde7dias),
    supabase.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "out").gte("created_at", desde7dias),
    supabase.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "in").gte("created_at", desde30dias),
    supabase.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("direccion", "out").gte("created_at", desde30dias),
    supabase.from("whatsapp_conversaciones").select("id", { count: "exact", head: true }).gte("created_at", desde7dias),
    supabase.from("uso_ia_anthropic").select("input_tokens, output_tokens").gte("created_at", desde30dias),
    supabase
      .from("whatsapp_conversaciones")
      .select("id, calificacion, last_message_at, whatsapp_contactos(nombre_perfil, telefono)", { count: "exact" })
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .range(desde, hasta),
  ]);

  // Pricing Haiku 4.5: $1/$5 por millón de tokens — ver lib/ai/index.ts (MODELO_ANTHROPIC).
  const tokensIn = (usoIA30 || []).reduce((acc, r) => acc + (r.input_tokens || 0), 0);
  const tokensOut = (usoIA30 || []).reduce((acc, r) => acc + (r.output_tokens || 0), 0);
  const costoEstimado30 = (tokensIn / 1_000_000) * 1 + (tokensOut / 1_000_000) * 5;

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
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex items-center gap-4 border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-[#002a6e] border border-emerald-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
          <MessageSquareText className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
        </div>
        <div>
          <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Métricas de WhatsApp</h1>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Volumen de mensajes del bot y costo estimado de IA</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1200px] mx-auto space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tarjetas.map((t) => (
              <div key={t.label} className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">{t.label}</span>
                <div className="flex items-center gap-5 mt-2">
                  <div className="flex items-center gap-1.5">
                    <ArrowDownToLine className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                    <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{t.entrantes}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">recibidos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ArrowUpFromLine className="w-4 h-4 text-indigo-600 dark:text-sky-300" />
                    <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{t.salientes}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">enviados</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Conversaciones nuevas (7 días)
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{conversacionesNuevas7 || 0}</h3>
            </div>
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" /> Costo estimado de IA (30 días, Claude Haiku)
              </span>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-sky-300 mt-1 font-mono">
                {costoEstimado30 > 0 ? `US$ ${costoEstimado30.toLocaleString("es-AR", { maximumFractionDigits: 2 })}` : "—"}
              </h3>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">{tokensIn.toLocaleString("es-AR")} tokens entrada · {tokensOut.toLocaleString("es-AR")} salida</span>
            </div>
          </div>

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
              <MessageSquareText className="w-3.5 h-3.5" /> Mensajes por conversación
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
                      <span className={`text-[9px] font-bold uppercase tracking-widest shrink-0 ${color.texto}`}>
                        {c.calificacion || "frío"}
                      </span>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="flex items-center gap-1.5">
                        <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                        <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{conteo.in}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">recibidos</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ArrowUpFromLine className="w-3.5 h-3.5 text-indigo-600 dark:text-sky-300" />
                        <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{conteo.out}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">enviados</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {(!conversaciones || conversaciones.length === 0) && (
                <div className="col-span-full py-12 text-center text-[13px] text-slate-400 dark:text-slate-500 italic bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl">
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
                      ? "pointer-events-none opacity-40 border-slate-200 dark:border-[#0a2a6b] text-slate-400"
                      : "border-slate-200 dark:border-[#0a2a6b] text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#001c55]"
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                </Link>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <Link
                  href={`/panel-v2/marketing/whatsapp-metricas?p=${paginaActual + 1}`}
                  aria-disabled={paginaActual >= totalPaginas}
                  className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg border transition-colors ${
                    paginaActual >= totalPaginas
                      ? "pointer-events-none opacity-40 border-slate-200 dark:border-[#0a2a6b] text-slate-400"
                      : "border-slate-200 dark:border-[#0a2a6b] text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#001c55]"
                  }`}
                >
                  Siguiente <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
