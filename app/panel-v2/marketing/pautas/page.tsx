import { createClient } from "@/lib/supabase2/server";
import { Megaphone, TrendingUp, TrendingDown, Minus, MousePointerClick, Users, DollarSign, Zap, ZapOff } from "lucide-react";
import NuevaCampanaModal from "./NuevaCampanaModal";
import TablaResponsiva, { type ColumnaTabla } from "@/components/panelV2/TablaResponsiva";

// Si estas funciones no existen en tu repo V2, podés reemplazarlas devolviendo "false"
import { metaAdsConfigurado } from "@/lib/ads/meta";
import { googleAdsConfigurado } from "@/lib/ads/google";
import { mercadoLibreAdsConfigurado } from "@/lib/ads/mercadolibre";

const PLATAFORMAS = ["Google Ads", "Meta Ads", "MercadoLibre"] as const;

const COLOR_PLATAFORMA: Record<string, { bg: string; text: string; border: string }> = {
  "Google Ads": { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-500/20" },
  "Meta Ads": { bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-500/20" },
  "MercadoLibre": { bg: "bg-yellow-50 dark:bg-yellow-500/10", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-200 dark:border-yellow-500/20" },
};

function inicioMes(offset: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 10);
}

function sumar(campanas: any[]) {
  return campanas.reduce(
    (acc: any, c: any) => ({
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
  const supabase = await createClient();

  const mesActualInicio = inicioMes(0);
  const mesAnteriorInicio = inicioMes(-1);
  const mesSiguienteInicio = inicioMes(1);

  const [{ data: campanasMesActual }, { data: campanasMesAnterior }, { data: todas }, { data: leadsPorUtm }] = await Promise.all([
    supabase.from("campanas_marketing").select("*").gte("periodo", mesActualInicio).lt("periodo", mesSiguienteInicio),
    supabase.from("campanas_marketing").select("*").gte("periodo", mesAnteriorInicio).lt("periodo", mesActualInicio),
    supabase.from("campanas_marketing").select("*").order("periodo", { ascending: false }).limit(50),
    supabase.from("v_reportes_leads_por_utm").select("*").limit(30),
  ]);

  const actual = campanasMesActual || [];
  const anterior = campanasMesAnterior || [];

  const totalActual = sumar(actual);
  const totalAnterior = sumar(anterior);
  const varGasto = variacion(totalActual.gasto, totalAnterior.gasto);
  const costoPorLead = totalActual.leads > 0 ? totalActual.gasto / totalActual.leads : 0;

  const nombreMesActual = new Date(mesActualInicio).toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" });

  const estadoSync = [
    { plataforma: "Meta Ads", ok: metaAdsConfigurado() },
    { plataforma: "Google Ads", ok: googleAdsConfigurado() },
    { plataforma: "MercadoLibre", ok: mercadoLibreAdsConfigurado() },
  ];

  return (
    <div className="animate-fadeIn space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Rendimiento publicitario</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{nombreMesActual}</p>
        </div>
        <NuevaCampanaModal />
      </div>

      {/* ESTADO DE SINCRONIZACIÓN AUTOMÁTICA */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-1">Sincronización automática</span>
        {estadoSync.map((e) => (
          <span
            key={e.plataforma}
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
              e.ok
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                : "bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/10"
            }`}
            title={e.ok ? "Configurado, sincroniza solo" : "Faltan las variables de entorno"}
          >
            {e.ok ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />} {e.plataforma}
          </span>
        ))}
      </div>

      {/* RESUMEN GLOBAL DEL MES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> Gasto Total
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">$ {totalActual.gasto.toLocaleString("es-AR")}</h3>
          <span className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${varGasto > 0 ? "text-rose-600 dark:text-rose-400" : varGasto < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
            {varGasto > 0 ? <TrendingUp className="w-3 h-3" /> : varGasto < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {varGasto.toFixed(0)}% vs mes anterior
          </span>
        </div>

        <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5" /> Clics / Alcance
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{totalActual.clics.toLocaleString("es-AR")}</h3>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Mes anterior: {totalAnterior.clics.toLocaleString("es-AR")}</span>
        </div>

        <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Leads Generados
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{totalActual.leads.toLocaleString("es-AR")}</h3>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Mes anterior: {totalAnterior.leads.toLocaleString("es-AR")}</span>
        </div>

        <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Costo por Lead</span>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
            {costoPorLead > 0 ? `$ ${costoPorLead.toLocaleString("es-AR", { maximumFractionDigits: 0 })}` : "—"}
          </h3>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">Gasto total / leads del mes</span>
        </div>
      </div>

      {/* DESGLOSE POR PLATAFORMA */}
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Rendimiento por plataforma (este mes)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLATAFORMAS.map((plataforma) => {
            const col = COLOR_PLATAFORMA[plataforma];
            const campanasPlataforma = actual.filter((c: any) => c.plataforma === plataforma);
            const campanasPlataformaAnterior = anterior.filter((c: any) => c.plataforma === plataforma);
            const totales = sumar(campanasPlataforma);
            const totalesAnterior = sumar(campanasPlataformaAnterior);
            const cpl = totales.leads > 0 ? totales.gasto / totales.leads : 0;
            const varPlataforma = variacion(totales.gasto, totalesAnterior.gasto);

            return (
              <div key={plataforma} className={`bg-white dark:bg-[#111] border ${col.border} rounded-2xl p-5 shadow-sm`}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${col.bg} ${col.text} ${col.border}`}>
                    {plataforma}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{campanasPlataforma.length} campañas</span>
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
                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-white/5">
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Costo/Lead</span>
                    <span className="font-mono font-bold text-[13px] text-rose-600 dark:text-rose-400">{cpl > 0 ? `$ ${cpl.toLocaleString("es-AR", { maximumFractionDigits: 0 })}` : "—"}</span>
                  </div>
                  <div className={`flex items-center gap-1 text-[11px] font-bold pt-1 ${varPlataforma > 0 ? "text-rose-600 dark:text-rose-400" : varPlataforma < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                    {varPlataforma > 0 ? <TrendingUp className="w-3 h-3" /> : varPlataforma < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {varPlataforma.toFixed(0)}% gasto vs mes anterior
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LEADS REALES POR UTM (atribución automática, no carga manual) */}
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Leads reales por campaña (UTM)</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Detectado automáticamente del link con que entró cada lead a Cotizador/Vender/Financiación — a diferencia del historial de abajo, esto no se carga a mano.</p>
        </div>
        {!leadsPorUtm || leadsPorUtm.length === 0 ? (
          <p className="p-10 text-center text-slate-400 text-sm italic">Sin leads con UTM detectado todavía.</p>
        ) : (
          <TablaResponsiva<any>
            filas={leadsPorUtm}
            keyExtractor={(l) => `${l.utm_source}-${l.utm_campaign}-${l.utm_medium}`}
            encabezadoMobile={(l) => <p className="text-[13px] text-slate-700 dark:text-slate-200 font-bold">{l.utm_campaign}</p>}
            columnas={
              [
                { key: "utm_source", header: "Fuente", cell: (l) => l.utm_source, claseTd: "text-[13px] font-bold text-slate-700 dark:text-slate-200" },
                { key: "utm_campaign", header: "Campaña", cell: (l) => l.utm_campaign, claseTd: "text-[13px] text-slate-600 dark:text-slate-300", ocultarEnMobile: true },
                { key: "utm_medium", header: "Medio", cell: (l) => l.utm_medium, claseTd: "text-[13px] text-slate-500 dark:text-slate-400", ocultarEnMobile: true },
                { key: "leads", header: "Leads", cell: (l) => l.leads, claseTd: "font-mono text-[13px] font-bold text-slate-900 dark:text-white" },
              ] as ColumnaTabla<any>[]
            }
          />
        )}
      </div>

      {/* HISTORIAL DE CAMPAÑAS CARGADAS */}
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Historial de cargas manuales</h2>
        </div>
        {!todas || todas.length === 0 ? (
          <p className="p-10 text-center text-slate-400 text-sm italic">Sin métricas cargadas todavía.</p>
        ) : (
          <TablaResponsiva<any>
            filas={todas}
            keyExtractor={(c) => c.id}
            encabezadoMobile={(c) => <p className="text-[13px] text-slate-700 dark:text-slate-200 font-bold">{c.nombre_campana || "General"}</p>}
            columnas={
              [
                { key: "mes", header: "Mes", cell: (c) => new Date(`${c.periodo}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }), claseTd: "text-[13px] text-slate-600 dark:text-slate-300 capitalize whitespace-nowrap" },
                { key: "plataforma", header: "Plataforma", cell: (c) => { const col = COLOR_PLATAFORMA[c.plataforma] || COLOR_PLATAFORMA["Google Ads"]; return <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${col.bg} ${col.text} ${col.border}`}>{c.plataforma}</span>; } },
                { key: "campana", header: "Campaña", cell: (c) => c.nombre_campana || "General", claseTd: "text-[13px] text-slate-700 dark:text-slate-200", ocultarEnMobile: true },
                { key: "gasto", header: "Gasto", cell: (c) => `$ ${Number(c.gasto).toLocaleString("es-AR")}`, claseTd: "font-mono text-[13px] font-bold text-slate-900 dark:text-white" },
                { key: "clics", header: "Clics", cell: (c) => c.clics, claseTd: "font-mono text-[13px] text-slate-600 dark:text-slate-400" },
                { key: "leads", header: "Leads", cell: (c) => c.leads, claseTd: "font-mono text-[13px] text-slate-600 dark:text-slate-400" },
              ] as ColumnaTabla<any>[]
            }
          />
        )}
      </div>
    </div>
  );
}