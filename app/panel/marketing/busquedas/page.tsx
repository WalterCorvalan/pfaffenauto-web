import { createClient } from "@/lib/supabase/server";
import { Search, SearchX, TrendingUp, Percent } from "lucide-react";
import TarjetaCostoIA from "@/components/panel/TarjetaCostoIA";

function inicioDia(offsetDias: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - offsetDias);
  return d.toISOString();
}

export default async function BusquedasWebPage() {
  const supabase = await createClient();
  const desde30 = inicioDia(30);
  const [{ data: busquedas }, { data: usoIA30 }] = await Promise.all([
    supabase.from("busquedas_log").select("termino, resultados_encontrados, created_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("uso_ia_anthropic").select("input_tokens, output_tokens").eq("origen", "api/buscar-ia").gte("created_at", desde30),
  ]);

  const datos = busquedas || [];
  const sinResultadosTotal = datos.filter((b) => !b.resultados_encontrados).length;
  const pctSinResultados = datos.length ? Math.round((sinResultadosTotal / datos.length) * 100) : 0;
  const tokensIn = (usoIA30 || []).reduce((acc, r) => acc + (r.input_tokens || 0), 0);
  const tokensOut = (usoIA30 || []).reduce((acc, r) => acc + (r.output_tokens || 0), 0);
  const costoEstimado30 = (tokensIn / 1_000_000) * 1 + (tokensOut / 1_000_000) * 5;

  const terminoMap: Record<string, { veces: number; sinResultados: number }> = {};
  for (const b of datos) {
    const key = (b.termino || "").trim().toLowerCase();
    if (!key) continue;
    if (!terminoMap[key]) terminoMap[key] = { veces: 0, sinResultados: 0 };
    terminoMap[key].veces += 1;
    if (!b.resultados_encontrados) terminoMap[key].sinResultados += 1;
  }

  const ranking = Object.entries(terminoMap).sort((a, b) => b[1].veces - a[1].veces).slice(0, 15);
  const sinResultados = Object.entries(terminoMap).filter(([, v]) => v.sinResultados > 0).sort((a, b) => b[1].sinResultados - a[1].sinResultados).slice(0, 15);

  return (
    <div className="p-6">
      <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1"><Search className="w-4 h-4 text-rose-600" /> Búsquedas Web</h2>
      <p className="text-xs text-slate-400 mb-4">{datos.length} búsquedas registradas (últimas 500)</p>

      {datos.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
            <Search className="w-5 h-5 text-rose-600 mb-2" />
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{datos.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Búsquedas registradas</p>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
            <Percent className="w-5 h-5 text-amber-600 mb-2" />
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{pctSinResultados}%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Sin resultados ({sinResultadosTotal})</p>
          </div>
          <TarjetaCostoIA costo={costoEstimado30} label="Costo IA del buscador (30d)" />
        </div>
      )}

      {datos.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center text-sm text-slate-400">Todavía no hay búsquedas registradas en el catálogo.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-3"><TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Más buscados</p>
            <div className="space-y-1.5">
              {ranking.map(([termino, v]) => (
                <div key={termino} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-200 truncate">{termino}</span>
                  <span className="font-bold text-slate-400 shrink-0 ml-2">{v.veces}×</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-3"><SearchX className="w-3.5 h-3.5 text-rose-600" /> Sin resultados</p>
            <div className="space-y-1.5">
              {sinResultados.length === 0 ? (
                <p className="text-xs text-slate-400">Todas las búsquedas encontraron algo.</p>
              ) : (
                sinResultados.map(([termino, v]) => (
                  <div key={termino} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-200 truncate">{termino}</span>
                    <span className="font-bold text-rose-500 shrink-0 ml-2">{v.sinResultados}×</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
