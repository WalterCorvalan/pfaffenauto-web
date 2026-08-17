import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Bot, HelpCircle, ThumbsDown, Clock } from "lucide-react";

export default async function AsistenteVirtualPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: preguntas } = await supabase
    .from("chatbot_log")
    .select("pregunta, respondida, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const datos = preguntas || [];

  // ================= AGRUPACIÓN POR PREGUNTA (match exacto normalizado) =================
  const preguntaMap: Record<string, { veces: number; sinResponder: number; ultima: string }> = {};
  datos.forEach((p) => {
    const key = (p.pregunta || "").trim().toLowerCase();
    if (!key) return;
    if (!preguntaMap[key]) preguntaMap[key] = { veces: 0, sinResponder: 0, ultima: p.created_at };
    preguntaMap[key].veces += 1;
    if (!p.respondida) preguntaMap[key].sinResponder += 1;
  });

  const rankingPreguntas = Object.entries(preguntaMap)
    .sort((a, b) => b[1].veces - a[1].veces)
    .slice(0, 20);

  const totalPreguntas = datos.length;
  const totalSinResponder = datos.filter((p) => !p.respondida).length;
  const pctRespondidas = totalPreguntas > 0 ? Math.round(((totalPreguntas - totalSinResponder) / totalPreguntas) * 100) : 0;

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-[#002a6e] border border-sky-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-sky-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Asistente Virtual</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Qué le pregunta la gente al chatbot de la web</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300">
            {totalPreguntas} preguntas registradas
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-[#002a6e] border border-emerald-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            {pctRespondidas}% respondidas
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* ================= RANKING DE PREGUNTAS ================= */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-[#0a2a6b] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500 dark:text-sky-300" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Preguntas más repetidas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#00246b] border-b border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6">Pregunta</th>
                    <th className="p-4 text-center">Veces preguntada</th>
                    <th className="p-4 text-center">Última vez</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                  {rankingPreguntas.map(([pregunta, stats]) => (
                    <tr key={pregunta} className="hover:bg-slate-50/50 dark:hover:bg-[#00246b] transition-colors">
                      <td className="p-4 pl-6 font-medium text-[13px] text-slate-800 dark:text-white max-w-[500px] truncate" title={pregunta}>{pregunta}</td>
                      <td className="p-4 text-center font-mono text-[14px] font-bold text-indigo-600 dark:text-sky-300">{stats.veces}</td>
                      <td className="p-4 text-center text-[12px] text-slate-500 dark:text-slate-400">
                        {new Date(stats.ultima).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                  {rankingPreguntas.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                        Todavía no hay preguntas registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= SIN RESPONDER (OPORTUNIDAD DE MEJORA DEL BOT) ================= */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-[#0a2a6b] flex items-center gap-2">
              <ThumbsDown className="w-4 h-4 text-rose-500" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Preguntas que el bot no supo responder <span className="text-slate-400 dark:text-slate-500 normal-case font-medium">— usalas para mejorar el guion</span>
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-[#0a2a6b] max-h-[350px] overflow-y-auto custom-scrollbar">
              {datos.filter((p) => !p.respondida).slice(0, 30).map((p, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3 text-[13px]">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{p.pregunta}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 ml-4">
                    {new Date(p.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              ))}
              {datos.filter((p) => !p.respondida).length === 0 && (
                <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm italic">El bot respondió todo. 🎉</div>
              )}
            </div>
          </div>

          {/* ================= ACTIVIDAD RECIENTE ================= */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-[#0a2a6b] flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Últimas preguntas</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-[#0a2a6b] max-h-[400px] overflow-y-auto custom-scrollbar">
              {datos.slice(0, 30).map((p, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3 text-[13px]">
                  <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[600px]" title={p.pregunta}>{p.pregunta}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${p.respondida ? "bg-emerald-50 dark:bg-[#002a6e] text-emerald-600 dark:text-emerald-300" : "bg-rose-50 dark:bg-[#002a6e] text-rose-600 dark:text-rose-300"}`}>
                      {p.respondida ? "Respondida" : "Sin responder"}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 w-24 text-right">
                      {new Date(p.created_at).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
              {datos.length === 0 && (
                <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm italic">Sin actividad todavía.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
