import { createClient } from "@/lib/supabase2/server";
import { Users, MessageSquareText, Target, Trophy, ArrowRight, ChevronDown, BarChart3, Globe, TrendingUp, Percent, CheckCircle2, Filter, Megaphone } from "lucide-react";
import EmbudoCanalChart from "./EmbudoCanalChart";

export default async function EmbudoPage() {
  const supabase = await createClient();

  // 1. Traemos clientes (leads) de v2 para medir el pipeline
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, origen, canal_ingreso, pipeline_stage, created_at, vendedor_id");

  const datos = clientes || [];

  // 1a-bis. Clientes cargados a mano (walk-in) y su origen
  const walkIns = datos.filter((c: any) => c.canal_ingreso === "walk_in");
  const conocioMap: Record<string, number> = {};
  walkIns.forEach((c: any) => {
    const k = c.origen || "Otro";
    conocioMap[k] = (conocioMap[k] || 0) + 1;
  });
  const conocioOrdenado = Object.entries(conocioMap).sort((a, b) => b[1] - a[1]);
  const totalConocio = walkIns.length;

  // 1b. Ventas cruzadas con vehículos (adaptación V2: pautado = publicado_ml)
  const { data: ventas } = await supabase
    .from("ventas")
    .select(`
      id, fecha_cierre, cliente_id, vehiculo_id,
      vehiculos ( publicado_ml )
    `)
    .eq("estado", "cerrada");

  const ventasTotalesArr = ventas || [];
  const totalVentas = ventasTotalesArr.length;
  const ventasConPauta = ventasTotalesArr.filter((v: any) => v.vehiculos?.publicado_ml).length;
  const ventasSinPauta = totalVentas - ventasConPauta;
  const pctConPauta = totalVentas > 0 ? Math.round((ventasConPauta / totalVentas) * 100) : 0;
  const pctSinPauta = totalVentas > 0 ? 100 - pctConPauta : 0;

  // Mapeamos el cliente_id de la venta para saber el origen
  const getOrigenVenta = (clienteId: string | null) => {
    const cliente = datos.find((c: any) => c.id === clienteId);
    return cliente?.origen || "Desconocido";
  };

  const origenSinPautaMap: Record<string, number> = {};
  ventasTotalesArr.filter((v: any) => !v.vehiculos?.publicado_ml).forEach((v: any) => {
    const origen = getOrigenVenta(v.cliente_id);
    origenSinPautaMap[origen] = (origenSinPautaMap[origen] || 0) + 1;
  });
  const origenesSinPautaOrdenados = Object.entries(origenSinPautaMap).sort((a, b) => b[1] - a[1]);

  // Gráfico de los últimos 6 meses
  const ultimos6MesesVentas = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      label: d.toLocaleDateString("es-AR", { month: "short" }).toUpperCase(),
      month: d.getMonth(),
      year: d.getFullYear(),
      canales: {} as Record<string, number>,
    };
  });

  const canalesVentaUnicos = new Set<string>();
  ventasTotalesArr.forEach((v: any) => {
    if (!v.fecha_cierre) return;
    const fecha = new Date(`${v.fecha_cierre}T12:00:00Z`);
    const mesObj = ultimos6MesesVentas.find((m: any) => m.month === fecha.getMonth() && m.year === fecha.getFullYear());
    if (!mesObj) return;
    const canal = v.vehiculos?.publicado_ml ? "Plataforma (Pautado)" : getOrigenVenta(v.cliente_id);
    canalesVentaUnicos.add(canal);
    mesObj.canales[canal] = (mesObj.canales[canal] || 0) + 1;
  });

  const chartDataCanales = ultimos6MesesVentas.map((m: any) => {
    const punto: any = { name: m.label };
    Array.from(canalesVentaUnicos).forEach((c: any) => { punto[c] = m.canales[c] || 0; });
    return punto;
  });

  // 1c. Embudo por vendedor (adaptación V2 con pipeline_stage de clientes)
  const { data: vendedoresPerfiles } = await supabase
    .from("perfiles")
    .select("id, nombre")
    .contains("roles", ["vendedor"]);

  const porVendedorMap: Record<string, { citas: number; asistieron: number; compraron: number }> = {};
  datos.forEach((c: any) => {
    if (!c.vendedor_id) return;
    if (!porVendedorMap[c.vendedor_id]) porVendedorMap[c.vendedor_id] = { citas: 0, asistieron: 0, compraron: 0 };
    
    // Asumimos que llegar a "visita" o más implica cita agendada
    if (["visita", "negociacion", "cerrado"].includes(c.pipeline_stage)) {
      porVendedorMap[c.vendedor_id].citas += 1;
      porVendedorMap[c.vendedor_id].asistieron += 1; // Simplificación hasta enlazar actividades
    }
    if (c.pipeline_stage === "cerrado") {
      porVendedorMap[c.vendedor_id].compraron += 1;
    }
  });

  const embudoPorVendedor = Object.entries(porVendedorMap)
    .map(([vendedorId, stats]) => ({
      vendedorId,
      nombre: vendedoresPerfiles?.find((v: any) => v.id === vendedorId)?.nombre || "Sin nombre",
      ...stats
    }))
    .sort((a: any, b: any) => b.citas - a.citas);

  // Cálculos del embudo global
  const totalLeads = datos.length;
  const contactados = datos.filter((l: any) => l.pipeline_stage !== "sin_contactar").length;
  const interesados = datos.filter((l: any) => ["negociacion", "cerrado"].includes(l.pipeline_stage)).length;
  const ganados = datos.filter((l: any) => l.pipeline_stage === "cerrado").length;

  const tasaContactabilidad = totalLeads > 0 ? Math.round((contactados / totalLeads) * 100) : 0;
  const tasaCierre = totalLeads > 0 ? Math.round((ganados / totalLeads) * 100) : 0;

  // Agrupación por canal
  const canalesMap: Record<string, { total: number, ganados: number }> = {};
  datos.forEach((l: any) => {
    const canal = l.origen || "Orgánico";
    if (!canalesMap[canal]) canalesMap[canal] = { total: 0, ganados: 0 };
    canalesMap[canal].total += 1;
    if (l.pipeline_stage === "cerrado") canalesMap[canal].ganados += 1;
  });
  const canalesOrdenados = Object.entries(canalesMap).sort((a: any, b: any) => b[1].total - a[1].total);

  return (
    <div className="animate-fadeIn space-y-6 max-w-[1200px] mx-auto">
      
      {/* Botones de acción del header interno */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300">
          <BarChart3 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          Tasa de Cierre Global: <span className="text-rose-600 dark:text-rose-400 text-[13px] ml-1">{tasaCierre}%</span>
        </div>
        <button className="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors">
          <Filter className="w-3.5 h-3.5" /> Filtrar
        </button>
      </div>

      {/* VISUALIZACIÓN DEL EMBUDO */}
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" /> Flujo General de Leads
        </h2>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
          {/* PASO 1 */}
          <div className="flex-1 w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-5 text-center relative group transition-colors hover:border-blue-200">
            <div className="w-10 h-10 mx-auto bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{totalLeads}</h3>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Leads</p>
          </div>

          <ArrowRight className="w-6 h-6 text-slate-300 dark:text-slate-600 hidden md:block shrink-0" />
          <ChevronDown className="w-5 h-5 text-slate-300 dark:text-slate-600 md:hidden shrink-0" />

          {/* PASO 2 */}
          <div className="flex-1 w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-5 text-center relative group transition-colors hover:border-amber-200">
            <div className="w-10 h-10 mx-auto bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 rounded-full flex items-center justify-center mb-3">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{contactados}</h3>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Contactados</p>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded-full shadow-sm">
              {tasaContactabilidad}%
            </div>
          </div>

          <ArrowRight className="w-6 h-6 text-slate-300 dark:text-slate-600 hidden md:block shrink-0" />
          <ChevronDown className="w-5 h-5 text-slate-300 dark:text-slate-600 md:hidden shrink-0" />

          {/* PASO 3 */}
          <div className="flex-1 w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-5 text-center relative group transition-colors hover:border-indigo-200">
            <div className="w-10 h-10 mx-auto bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-sky-300 rounded-full flex items-center justify-center mb-3">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{interesados}</h3>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Interesados</p>
          </div>

          <ArrowRight className="w-6 h-6 text-slate-300 dark:text-slate-600 hidden md:block shrink-0" />
          <ChevronDown className="w-5 h-5 text-slate-300 dark:text-slate-600 md:hidden shrink-0" />

          {/* PASO 4 */}
          <div className="flex-1 w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-5 text-center relative group transition-colors hover:border-emerald-200">
            <div className="w-10 h-10 mx-auto bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mb-3">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-300 mb-1">{ganados}</h3>
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Clientes Nuevos</p>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-[#111] border border-emerald-200 dark:border-white/10 text-[10px] font-bold text-emerald-600 px-2 py-0.5 rounded-full shadow-sm">
              Cierre {tasaCierre}%
            </div>
          </div>
        </div>
      </div>

      {/* VENTAS: PAUTADO VS NO PAUTADO */}
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Percent className="w-4 h-4 text-rose-500" /> Ventas: Autos Publicados vs. No Publicados
          </h2>
          <span className="text-[11px] font-bold text-slate-400">{totalVentas} ventas totales</span>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-5 text-center">
            <div className="w-10 h-10 mx-auto bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 rounded-full flex items-center justify-center mb-3">
              <Megaphone className="w-5 h-5" />
            </div>
            <h3 className="text-3xl font-black text-rose-700 dark:text-rose-300 mb-1">{pctConPauta}%</h3>
            <p className="text-[11px] font-bold uppercase tracking-widest text-rose-600">Estaban Publicados ({ventasConPauta})</p>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-5 text-center">
            <div className="w-10 h-10 mx-auto bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-3xl font-black text-slate-700 dark:text-slate-200 mb-1">{pctSinPauta}%</h3>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Sin Publicar ({ventasSinPauta})</p>
          </div>
        </div>

        {origenesSinPautaOrdenados.length > 0 && (
          <div className="px-6 pb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Origen de las ventas no publicadas</h3>
            <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-100 dark:border-white/10 rounded-xl overflow-hidden">
              {origenesSinPautaOrdenados.map(([origen, cantidad]: any) => (
                <div key={origen} className="flex items-center justify-between px-4 py-2.5 bg-slate-50/50 dark:bg-white/[0.02]">
                  <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{origen}</span>
                  <span className="font-mono text-[13px] font-bold text-slate-900 dark:text-white">{cantidad}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* GRÁFICO TENDENCIA MENSUAL */}
      <EmbudoCanalChart data={chartDataCanales} canales={Array.from(canalesVentaUnicos)} />

      {/* EMBUDO POR CITA X VENDEDOR */}
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" /> Rendimiento por Vendedor
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="p-4 pl-6 whitespace-nowrap">Vendedor</th>
                <th className="p-4 text-center whitespace-nowrap">Visitas (Aprox)</th>
                <th className="p-4 text-center whitespace-nowrap">Compraron</th>
                <th className="p-4 pr-6 text-right whitespace-nowrap">Cierre Global</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {embudoPorVendedor.map((v: any) => {
                const cierre = v.citas > 0 ? Math.round((v.compraron / v.citas) * 100) : 0;
                return (
                  <tr key={v.vendedorId} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="p-4 pl-6 font-bold text-[13px] text-slate-800 dark:text-white">{v.nombre}</td>
                    <td className="p-4 text-center font-mono text-[14px] text-slate-600 dark:text-slate-300">{v.citas}</td>
                    <td className="p-4 text-center font-mono text-[14px] font-bold text-emerald-600 dark:text-emerald-400">{v.compraron}</td>
                    <td className="p-4 pr-6 text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold border bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">
                        <TrendingUp className="w-3 h-3 mr-1 text-slate-400" /> {cierre}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {embudoPorVendedor.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 text-sm italic">
                    No hay suficientes datos procesados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}