import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { MousePointerClick, SearchX, TrendingUp, Clock } from "lucide-react";

export default async function BusquedasWebPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: busquedas } = await supabase
    .from("busquedas_log")
    .select("termino, resultados_encontrados, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const datos = busquedas || [];

  // ================= AGRUPACIÓN POR TÉRMINO =================
  const terminoMap: Record<string, { veces: number; sinResultados: number; ultima: string }> = {};
  datos.forEach((b) => {
    const key = (b.termino || "").trim().toLowerCase();
    if (!key) return;
    if (!terminoMap[key]) terminoMap[key] = { veces: 0, sinResultados: 0, ultima: b.created_at };
    terminoMap[key].veces += 1;
    if (!b.resultados_encontrados || b.resultados_encontrados === 0) terminoMap[key].sinResultados += 1;
  });

  const rankingBusquedas = Object.entries(terminoMap)
    .sort((a, b) => b[1].veces - a[1].veces)
    .slice(0, 20);

  const busquedasSinResultados = Object.entries(terminoMap)
    .filter(([, v]) => v.sinResultados > 0)
    .sort((a, b) => b[1].sinResultados - a[1].sinResultados)
    .slice(0, 15);

  const totalBusquedas = datos.length;
  const totalSinResultados = datos.filter((b) => !b.resultados_encontrados || b.resultados_encontrados === 0).length;
  const pctSinResultados = totalBusquedas > 0 ? Math.round((totalSinResultados / totalBusquedas) * 100) : 0;

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 px-6 py-4 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <MousePointerClick className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 leading-tight">Búsquedas Web</h1>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Qué busca la gente en el catálogo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600">
            {totalBusquedas} búsquedas registradas
          </div>
          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-[11px] font-bold text-rose-700">
            {pctSinResultados}% sin resultados
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] custom-scrollbar">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* ================= RANKING DE BÚSQUEDAS ================= */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Términos más buscados</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6">Término</th>
                    <th className="p-4 text-center">Veces buscado</th>
                    <th className="p-4 text-center">Última vez</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankingBusquedas.map(([termino, stats]) => (
                    <tr key={termino} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-[13px] text-slate-800 capitalize">{termino}</td>
                      <td className="p-4 text-center font-mono text-[14px] font-bold text-indigo-600">{stats.veces}</td>
                      <td className="p-4 text-center text-[12px] text-slate-500">
                        {new Date(stats.ultima).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                  {rankingBusquedas.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-10 text-center text-slate-400 text-sm italic">
                        Todavía no hay búsquedas registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= BÚSQUEDAS SIN RESULTADOS (OPORTUNIDAD) ================= */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <SearchX className="w-4 h-4 text-rose-500" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Búsquedas sin resultados <span className="text-slate-400 normal-case font-medium">— demanda que no estás cubriendo</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6">Término</th>
                    <th className="p-4 text-center">Veces sin resultados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {busquedasSinResultados.map(([termino, stats]) => (
                    <tr key={termino} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-[13px] text-slate-800 capitalize">{termino}</td>
                      <td className="p-4 text-center font-mono text-[14px] font-bold text-rose-600">{stats.sinResultados}</td>
                    </tr>
                  ))}
                  {busquedasSinResultados.length === 0 && (
                    <tr>
                      <td colSpan={2} className="p-10 text-center text-slate-400 text-sm italic">
                        Ninguna búsqueda quedó sin resultados. 🎉
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= ACTIVIDAD RECIENTE ================= */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Últimas búsquedas</h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
              {datos.slice(0, 30).map((b, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3 text-[13px]">
                  <span className="font-medium text-slate-700 capitalize">{b.termino}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${b.resultados_encontrados ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                      {b.resultados_encontrados ?? 0} resultados
                    </span>
                    <span className="text-[11px] text-slate-400 w-24 text-right">
                      {new Date(b.created_at).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
              {datos.length === 0 && (
                <div className="p-10 text-center text-slate-400 text-sm italic">Sin actividad todavía.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
