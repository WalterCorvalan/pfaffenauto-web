import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Megaphone, TrendingUp, TrendingDown, Minus, MousePointerClick, Users, DollarSign } from "lucide-react";
import NuevaCampanaModal from "./NuevaCampanaModal";

const PLATAFORMAS = ["Google Ads", "Meta Ads", "MercadoLibre"] as const;

const COLOR_PLATAFORMA: Record<string, { bg: string; text: string; border: string }> = {
  "Google Ads": { bg: "bg-blue-50 dark:bg-[#002a6e]", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-[#0a2a6b]" },
  "Meta Ads": { bg: "bg-indigo-50 dark:bg-[#002a6e]", text: "text-indigo-700 dark:text-sky-300", border: "border-indigo-200 dark:border-[#0a2a6b]" },
  "MercadoLibre": { bg: "bg-yellow-50 dark:bg-[#002a6e]", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-200 dark:border-[#0a2a6b]" },
};

function inicioMes(offset: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 10);
}

function sumar(campanas: any[]) {
  return campanas.reduce(
    (acc, c) => ({
      gasto: acc.gasto + (Number(c.gasto) || 0),
      clics: acc.clics + (Number(c.clics) || 0),
      leads: acc.leads + (Number(c.leads) || 0),
    }),
    { gasto: 0, clics: 0, leads: 0 }
  );
}

function variacion(actual: number, anterior: number) {
  if (anterior === 0) return actual > 0 ? 100 : 0;
  return ((actual - anterior) / anterior) * 100;
}

export default async function PautasMarketingPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const mesActualInicio = inicioMes(0);
  const mesAnteriorInicio = inicioMes(-1);
  const mesSiguienteInicio = inicioMes(1);

  const [{ data: sucursales }, { data: campanasMesActual }, { data: campanasMesAnterior }, { data: todas }] = await Promise.all([
    supabase.from("sucursales").select("id, nombre").order("nombre"),
    supabase.from("campanas_marketing").select("*, sucursales ( nombre )").gte("periodo", mesActualInicio).lt("periodo", mesSiguienteInicio),
    supabase.from("campanas_marketing").select("*").gte("periodo", mesAnteriorInicio).lt("periodo", mesActualInicio),
    supabase.from("campanas_marketing").select("*, sucursales ( nombre )").order("periodo", { ascending: false }).limit(50),
  ]);

  const actual = campanasMesActual || [];
  const anterior = campanasMesAnterior || [];

  const totalActual = sumar(actual);
  const totalAnterior = sumar(anterior);
  const varGasto = variacion(totalActual.gasto, totalAnterior.gasto);
  const costoPorLead = totalActual.leads > 0 ? totalActual.gasto / totalActual.leads : 0;

  const nombreMesActual = new Date(mesActualInicio).toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Pautas Publicitarias</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 capitalize">Google Ads, Meta Ads y MercadoLibre — {nombreMesActual}</p>
          </div>
        </div>
        <NuevaCampanaModal sucursales={sucursales || []} />
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* ================= RESUMEN GLOBAL DEL MES ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Gasto Total
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">$ {totalActual.gasto.toLocaleString("es-AR")}</h3>
              <span className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${varGasto > 0 ? "text-rose-600 dark:text-rose-300" : varGasto < 0 ? "text-emerald-600 dark:text-emerald-300" : "text-slate-400 dark:text-slate-500"}`}>
                {varGasto > 0 ? <TrendingUp className="w-3 h-3" /> : varGasto < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {varGasto.toFixed(0)}% vs mes anterior
              </span>
            </div>

            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <MousePointerClick className="w-3.5 h-3.5" /> Clics / Alcance
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{totalActual.clics.toLocaleString("es-AR")}</h3>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1 block">Mes anterior: {totalAnterior.clics.toLocaleString("es-AR")}</span>
            </div>

            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Leads Generados
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{totalActual.leads.toLocaleString("es-AR")}</h3>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1 block">Mes anterior: {totalAnterior.leads.toLocaleString("es-AR")}</span>
            </div>

            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">Costo por Lead</span>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-sky-300 mt-1 font-mono">
                {costoPorLead > 0 ? `$ ${costoPorLead.toLocaleString("es-AR", { maximumFractionDigits: 0 })}` : "—"}
              </h3>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1 block">Gasto total / leads del mes</span>
            </div>
          </div>

          {/* ================= DESGLOSE POR PLATAFORMA ================= */}
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Rendimiento por plataforma (este mes)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLATAFORMAS.map((plataforma) => {
                const col = COLOR_PLATAFORMA[plataforma];
                const campanasPlataforma = actual.filter((c) => c.plataforma === plataforma);
                const campanasPlataformaAnterior = anterior.filter((c) => c.plataforma === plataforma);
                const totales = sumar(campanasPlataforma);
                const totalesAnterior = sumar(campanasPlataformaAnterior);
                const cpl = totales.leads > 0 ? totales.gasto / totales.leads : 0;
                const varPlataforma = variacion(totales.gasto, totalesAnterior.gasto);

                return (
                  <div key={plataforma} className={`bg-white dark:bg-[#001c55] border ${col.border} rounded-2xl p-5 shadow-sm`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${col.bg} ${col.text} ${col.border}`}>
                        {plataforma}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{campanasPlataforma.length} campañas</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Gasto</span>
                        <span className="font-mono font-bold text-[13px] text-slate-900 dark:text-white">$ {totales.gasto.toLocaleString("es-AR")}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Clics/Alcance</span>
                        <span className="font-mono font-bold text-[13px] text-slate-900 dark:text-white">{totales.clics.toLocaleString("es-AR")}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Leads</span>
                        <span className="font-mono font-bold text-[13px] text-slate-900 dark:text-white">{totales.leads.toLocaleString("es-AR")}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-[#0a2a6b]">
                        <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Costo/Lead</span>
                        <span className="font-mono font-bold text-[13px] text-indigo-600 dark:text-sky-300">{cpl > 0 ? `$ ${cpl.toLocaleString("es-AR", { maximumFractionDigits: 0 })}` : "—"}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-[11px] font-bold ${varPlataforma > 0 ? "text-rose-600 dark:text-rose-300" : varPlataforma < 0 ? "text-emerald-600 dark:text-emerald-300" : "text-slate-400 dark:text-slate-500"}`}>
                        {varPlataforma > 0 ? <TrendingUp className="w-3 h-3" /> : varPlataforma < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {varPlataforma.toFixed(0)}% gasto vs mes anterior
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= HISTORIAL DE CAMPAÑAS CARGADAS ================= */}
          <div className="hidden md:block bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-[#0a2a6b]">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Historial de cargas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#00246b] border-b border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6">Mes</th>
                    <th className="p-4">Plataforma</th>
                    <th className="p-4">Campaña</th>
                    <th className="p-4">Destino</th>
                    <th className="p-4 text-right">Gasto</th>
                    <th className="p-4 text-right">Clics</th>
                    <th className="p-4 pr-6 text-right">Leads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                  {(todas || []).map((c: any) => {
                    const col = COLOR_PLATAFORMA[c.plataforma] || COLOR_PLATAFORMA["Google Ads"];
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-[#00246b] transition-colors">
                        <td className="p-4 pl-6 text-[13px] text-slate-600 dark:text-slate-300 capitalize whitespace-nowrap">
                          {new Date(`${c.periodo}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${col.bg} ${col.text} ${col.border}`}>
                            {c.plataforma}
                          </span>
                        </td>
                        <td className="p-4 text-[13px] text-slate-700 dark:text-slate-200">{c.nombre_campana || "—"}</td>
                        <td className="p-4 text-[13px] text-slate-600 dark:text-slate-300">{c.sucursales?.nombre || "Página general"}</td>
                        <td className="p-4 text-right font-mono text-[13px] font-bold text-slate-900 dark:text-white">$ {Number(c.gasto).toLocaleString("es-AR")}</td>
                        <td className="p-4 text-right font-mono text-[13px] text-slate-600 dark:text-slate-300">{c.clics}</td>
                        <td className="p-4 pr-6 text-right font-mono text-[13px] text-slate-600 dark:text-slate-300">{c.leads}</td>
                      </tr>
                    );
                  })}
                  {(!todas || todas.length === 0) && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                        Sin métricas cargadas todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: tarjetas apiladas, mismos datos sin scroll horizontal */}
          <div className="md:hidden bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-[#0a2a6b]">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Historial de cargas</h2>
            </div>
            <div className="p-4 space-y-3">
              {(!todas || todas.length === 0) && (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                  Sin métricas cargadas todavía.
                </div>
              )}
              {(todas || []).map((c: any) => {
                const col = COLOR_PLATAFORMA[c.plataforma] || COLOR_PLATAFORMA["Google Ads"];
                return (
                  <div key={c.id} className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${col.bg} ${col.text} ${col.border}`}>
                        {c.plataforma}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize font-medium">
                        {new Date(`${c.periodo}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}
                      </span>
                    </div>
                    <p className="text-[13px] font-medium text-slate-900 dark:text-white">{c.nombre_campana || "—"}</p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">{c.sucursales?.nombre || "Página general"}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#0a2a6b] text-[12px]">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">$ {Number(c.gasto).toLocaleString("es-AR")}</span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">{c.clics} clics</span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">{c.leads} leads</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
