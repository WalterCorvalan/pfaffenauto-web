import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Megaphone, Filter, Users, MessageSquareText, Target, Trophy, ArrowRight, ChevronDown, BarChart3, Globe, TrendingUp, Percent, CheckCircle2 } from "lucide-react";
import EmbudoCanalChart from "./EmbudoCanalChart";

export default async function EmbudoPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  // 1. Traemos todas las cotizaciones/leads para medir el embudo
  const { data: leads } = await supabase
    .from("cotizaciones")
    .select("estado, canal_origen, created_at");

  const datos = leads || [];

  // 1a-bis. Clientes cargados a mano (walk-in / venta) y cómo nos conocieron
  // — distinto de "leads" (cotizaciones): esto es gente que ya vino o compró,
  // cargada desde /panel/clientes/nuevo.
  const { data: clientesConocio } = await supabase
    .from("clientes")
    .select("como_nos_conocio")
    .not("como_nos_conocio", "is", null);

  const conocioMap: Record<string, number> = {};
  (clientesConocio || []).forEach((c: any) => {
    const k = c.como_nos_conocio || "Sin especificar";
    conocioMap[k] = (conocioMap[k] || 0) + 1;
  });
  const conocioOrdenado = Object.entries(conocioMap).sort((a, b) => b[1] - a[1]);
  const totalConocio = (clientesConocio || []).length;

  // 1b. Ventas cruzadas con si el auto estaba pautado o no, y de dónde vino
  // la venta cuando NO estaba pautado (a qué conversación quedó atado el
  // boleto, o "Presencial" si no tiene ninguna — vino directo a la sucursal).
  const { data: ventasPauta } = await supabase
    .from("boletos_venta")
    .select(`
      fecha, vehiculo_id, sucursal_id, cotizacion_id, whatsapp_conversacion_id, web_chat_conversacion_id, instagram_conversacion_id,
      vehiculos ( pautado, canal_pauta ),
      sucursales ( nombre ),
      cotizaciones ( canal_origen )
    `);

  const totalVentas = ventasPauta?.length || 0;
  const ventasConPauta = (ventasPauta || []).filter((v: any) => v.vehiculos?.pautado).length;
  const ventasSinPauta = totalVentas - ventasConPauta;
  const pctConPauta = totalVentas > 0 ? Math.round((ventasConPauta / totalVentas) * 100) : 0;
  const pctSinPauta = totalVentas > 0 ? 100 - pctConPauta : 0;

  const origenVenta = (v: any) => {
    if (v.instagram_conversacion_id) return "Instagram / Facebook";
    if (v.whatsapp_conversacion_id) return "WhatsApp";
    if (v.web_chat_conversacion_id) return "Chat Web";
    if (v.cotizaciones?.canal_origen) return v.cotizaciones.canal_origen;
    if (v.cotizacion_id) return "Formulario Web";
    return `Presencial — ${v.sucursales?.nombre || "sucursal sin datos"}`;
  };

  const origenSinPautaMap: Record<string, number> = {};
  (ventasPauta || [])
    .filter((v: any) => !v.vehiculos?.pautado)
    .forEach((v: any) => {
      const origen = origenVenta(v);
      origenSinPautaMap[origen] = (origenSinPautaMap[origen] || 0) + 1;
    });
  const origenesSinPautaOrdenados = Object.entries(origenSinPautaMap).sort((a, b) => b[1] - a[1]);

  // Canal completo por venta (pautado incluido) — para el gráfico de
  // tendencia mensual, así se ve de un vistazo si un canal empuja más en
  // ciertos meses (patrones estacionales, campañas puntuales, etc).
  const canalCompletoVenta = (v: any) =>
    v.vehiculos?.pautado ? `Pautado: ${v.vehiculos.canal_pauta || "sin canal"}` : origenVenta(v);

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
  (ventasPauta || []).forEach((v: any) => {
    if (!v.fecha) return;
    const fecha = new Date(`${v.fecha}T12:00:00Z`);
    const mesObj = ultimos6MesesVentas.find((m) => m.month === fecha.getMonth() && m.year === fecha.getFullYear());
    if (!mesObj) return;
    const canal = canalCompletoVenta(v);
    canalesVentaUnicos.add(canal);
    mesObj.canales[canal] = (mesObj.canales[canal] || 0) + 1;
  });

  const chartDataCanales = ultimos6MesesVentas.map((m) => {
    const punto: any = { name: m.label };
    Array.from(canalesVentaUnicos).forEach((c) => {
      punto[c] = m.canales[c] || 0;
    });
    return punto;
  });

  // 1c. Embudo por cita, cruzado por vendedor: citó -> asistió -> compró
  const { data: visitasVend } = await supabase
    .from("visitas_agendadas")
    .select("vendedor_id, estado, vehiculo_id")
    .not("vendedor_id", "is", null);

  const { data: ventasVehIds } = await supabase.from("boletos_venta").select("vehiculo_id");
  const vehiculosVendidos = new Set((ventasVehIds || []).map((v: any) => v.vehiculo_id));

  const { data: vendedoresPerfiles } = await supabase
    .from("perfiles")
    .select("id, nombre")
    .eq("rol", "vendedor");

  const nombreVendedor = (id: string) => vendedoresPerfiles?.find((v: any) => v.id === id)?.nombre || "Sin nombre";

  const porVendedorMap: Record<string, { citas: number; asistieron: number; compraron: number }> = {};
  (visitasVend || []).forEach((v: any) => {
    if (!porVendedorMap[v.vendedor_id]) {
      porVendedorMap[v.vendedor_id] = { citas: 0, asistieron: 0, compraron: 0 };
    }
    porVendedorMap[v.vendedor_id].citas += 1;
    if (v.estado === "Asistió") {
      porVendedorMap[v.vendedor_id].asistieron += 1;
      if (v.vehiculo_id && vehiculosVendidos.has(v.vehiculo_id)) {
        porVendedorMap[v.vendedor_id].compraron += 1;
      }
    }
  });

  const embudoPorVendedor = Object.entries(porVendedorMap)
    .map(([vendedorId, stats]) => ({ vendedorId, nombre: nombreVendedor(vendedorId), ...stats }))
    .sort((a, b) => b.citas - a.citas);

  // ================= CÁLCULOS DEL EMBUDO =================
  const totalLeads = datos.length;
  // Agregamos (l: any) para satisfacer a TypeScript
  const contactados = datos.filter((l: any) => l.estado !== "Pendiente" && l.estado !== "Nuevo").length;
  const interesados = datos.filter((l: any) => l.estado === "Interesado" || l.estado === "Cliente").length;
  const ganados = datos.filter((l: any) => l.estado === "Cliente").length;

  // Tasas de conversión
  const tasaContactabilidad = totalLeads > 0 ? Math.round((contactados / totalLeads) * 100) : 0;
  const tasaCierre = totalLeads > 0 ? Math.round((ganados / totalLeads) * 100) : 0;

  // ================= AGRUPACIÓN POR CANAL (UTM Tracker) =================
  const canalesMap: Record<string, { total: number, ganados: number }> = {};
  
  datos.forEach((l: any) => {
    const canal = l.canal_origen || "WEB DIRECTO / ORGÁNICO";
    if (!canalesMap[canal]) {
      canalesMap[canal] = { total: 0, ganados: 0 };
    }
    canalesMap[canal].total += 1;
    if (l.estado === "Cliente") {
      canalesMap[canal].ganados += 1;
    }
  });

  // Ordenamos los canales del que trajo más leads al que menos
  const canalesOrdenados = Object.entries(canalesMap).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden font-sans">

      {/* ================= HEADER ================= */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-[#002a6e] border border-orange-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5 text-orange-600 dark:text-orange-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">
              Embudo de Conversión
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Rendimiento de campañas, UTMs y tasas de cierre
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <BarChart3 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Tasa de Cierre Global: <span className="text-emerald-600 dark:text-emerald-300 text-[13px] ml-1">{tasaCierre}%</span>
          </div>
        </div>
      </header>

      {/* ================= ÁREA SCROLLABLE ================= */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* ================= VISUALIZACIÓN DEL EMBUDO ================= */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" /> Flujo General de Leads
            </h2>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">

              {/* PASO 1: LEADS */}
              <div className="flex-1 w-full bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] rounded-xl p-5 text-center relative group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                <div className="w-10 h-10 mx-auto bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{totalLeads}</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Leads</p>
              </div>

              <ArrowRight className="w-6 h-6 text-slate-300 dark:text-slate-600 hidden md:block shrink-0" />
              <ChevronDown className="w-5 h-5 text-slate-300 dark:text-slate-600 md:hidden shrink-0" />

              {/* PASO 2: CONTACTADOS */}
              <div className="flex-1 w-full bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] rounded-xl p-5 text-center relative group hover:border-amber-200 dark:hover:border-amber-800 transition-colors">
                <div className="w-10 h-10 mx-auto bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 rounded-full flex items-center justify-center mb-3">
                  <MessageSquareText className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{contactados}</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Contactados</p>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full shadow-sm">
                  {tasaContactabilidad}%
                </div>
              </div>

              <ArrowRight className="w-6 h-6 text-slate-300 dark:text-slate-600 hidden md:block shrink-0" />
              <ChevronDown className="w-5 h-5 text-slate-300 dark:text-slate-600 md:hidden shrink-0" />

              {/* PASO 3: INTERESADOS */}
              <div className="flex-1 w-full bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] rounded-xl p-5 text-center relative group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                <div className="w-10 h-10 mx-auto bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-sky-300 rounded-full flex items-center justify-center mb-3">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{interesados}</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Interesados</p>
              </div>

              <ArrowRight className="w-6 h-6 text-slate-300 dark:text-slate-600 hidden md:block shrink-0" />
              <ChevronDown className="w-5 h-5 text-slate-300 dark:text-slate-600 md:hidden shrink-0" />

              {/* PASO 4: CERRADOS */}
              <div className="flex-1 w-full bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] rounded-xl p-5 text-center relative group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                <div className="w-10 h-10 mx-auto bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mb-3">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-300 mb-1">{ganados}</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Clientes Nuevos</p>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-[#001c55] border border-emerald-200 dark:border-[#0a2a6b] text-[10px] font-bold text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded-full shadow-sm">
                  Cierre {tasaCierre}%
                </div>
              </div>

            </div>
          </div>

          {/* ================= VENTAS: PAUTADO VS NO PAUTADO ================= */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-[#0a2a6b] flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Percent className="w-4 h-4 text-orange-500" /> Ventas: Autos Pautados vs. No Pautados
              </h2>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{totalVentas} ventas totales</span>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-orange-50 dark:bg-[#002a6e] border border-orange-200 dark:border-[#0a2a6b] rounded-xl p-5 text-center">
                <div className="w-10 h-10 mx-auto bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300 rounded-full flex items-center justify-center mb-3">
                  <Megaphone className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-black text-orange-700 dark:text-orange-300 mb-1">{pctConPauta}%</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-300">Estaban Pautados ({ventasConPauta})</p>
              </div>
              <div className="bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] rounded-xl p-5 text-center">
                <div className="w-10 h-10 mx-auto bg-slate-200 dark:bg-[#002a6e] text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-black text-slate-700 dark:text-slate-200 mb-1">{pctSinPauta}%</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Sin Pauta ({ventasSinPauta})</p>
              </div>
            </div>

            {origenesSinPautaOrdenados.length > 0 && (
              <div className="px-6 pb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">De dónde vinieron las ventas sin pauta</h3>
                <div className="divide-y divide-slate-100 dark:divide-[#0a2a6b] border border-slate-100 dark:border-[#0a2a6b] rounded-xl overflow-hidden">
                  {origenesSinPautaOrdenados.map(([origen, cantidad]) => (
                    <div key={origen} className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#001c55]">
                      <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{origen}</span>
                      <span className="font-mono text-[13px] font-bold text-slate-900 dark:text-white">{cantidad}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ================= TENDENCIA MENSUAL POR CANAL ================= */}
          <EmbudoCanalChart data={chartDataCanales} canales={Array.from(canalesVentaUnicos)} />

          {/* ================= EMBUDO POR CITA X VENDEDOR ================= */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-[#0a2a6b] flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500 dark:text-sky-300" /> Embudo por Cita, según Vendedor
              </h2>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#00246b] border-b border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6 whitespace-nowrap">Vendedor</th>
                    <th className="p-4 text-center whitespace-nowrap">Citas Asignadas</th>
                    <th className="p-4 text-center whitespace-nowrap">Asistieron</th>
                    <th className="p-4 text-center whitespace-nowrap">Compraron</th>
                    <th className="p-4 pr-6 text-right whitespace-nowrap">Cierre sobre Citas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                  {embudoPorVendedor.map((v) => {
                    const cierre = v.citas > 0 ? Math.round((v.compraron / v.citas) * 100) : 0;
                    return (
                      <tr key={v.vendedorId} className="hover:bg-slate-50/50 dark:hover:bg-[#00246b] transition-colors">
                        <td className="p-4 pl-6 font-bold text-[13px] text-slate-800 dark:text-white">{v.nombre}</td>
                        <td className="p-4 text-center font-mono text-[14px] text-slate-600 dark:text-slate-300">{v.citas}</td>
                        <td className="p-4 text-center font-mono text-[14px] text-slate-600 dark:text-slate-300">{v.asistieron}</td>
                        <td className="p-4 text-center font-mono text-[14px] font-bold text-emerald-600 dark:text-emerald-300">{v.compraron}</td>
                        <td className="p-4 pr-6 text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold border ${
                            cierre > 20 ? 'bg-emerald-50 dark:bg-[#002a6e] text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-[#0a2a6b]' :
                            cierre > 0 ? 'bg-blue-50 dark:bg-[#002a6e] text-blue-700 dark:text-blue-300 border-blue-200 dark:border-[#0a2a6b]' : 'bg-slate-100 dark:bg-[#00246b] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#0a2a6b]'
                          }`}>
                            <TrendingUp className="w-3 h-3 mr-1" /> {cierre}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {embudoPorVendedor.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                        Aún no hay citas con vendedor asignado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile: tarjetas apiladas, mismos datos sin scroll horizontal */}
            <div className="md:hidden p-4 space-y-3">
              {embudoPorVendedor.length === 0 && (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                  Aún no hay citas con vendedor asignado.
                </div>
              )}
              {embudoPorVendedor.map((v) => {
                const cierre = v.citas > 0 ? Math.round((v.compraron / v.citas) * 100) : 0;
                return (
                  <div key={v.vendedorId} className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[13px] text-slate-800 dark:text-white">{v.nombre}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold border ${
                        cierre > 20 ? 'bg-emerald-50 dark:bg-[#002a6e] text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-[#0a2a6b]' :
                        cierre > 0 ? 'bg-blue-50 dark:bg-[#002a6e] text-blue-700 dark:text-blue-300 border-blue-200 dark:border-[#0a2a6b]' : 'bg-slate-100 dark:bg-[#00246b] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#0a2a6b]'
                      }`}>
                        <TrendingUp className="w-3 h-3 mr-1" /> {cierre}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#0a2a6b] text-[12px]">
                      <span className="text-slate-500 dark:text-slate-400">Citas: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{v.citas}</span></span>
                      <span className="text-slate-500 dark:text-slate-400">Asistieron: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{v.asistieron}</span></span>
                      <span className="text-slate-500 dark:text-slate-400">Compraron: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-300">{v.compraron}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= TABLA DE ORIGENES (UTM TRACKER) ================= */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-[#0a2a6b] flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-500 dark:text-sky-300" /> Rendimiento por Canal (UTM)
              </h2>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#00246b] border-b border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6 whitespace-nowrap">Origen del Lead</th>
                    <th className="p-4 text-center whitespace-nowrap">Volumen de Leads</th>
                    <th className="p-4 text-center whitespace-nowrap">Ventas Cerradas</th>
                    <th className="p-4 pr-6 text-right whitespace-nowrap">Conversión del Canal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                  {canalesOrdenados.map(([canal, stats]) => {
                    const convCanal = stats.total > 0 ? Math.round((stats.ganados / stats.total) * 100) : 0;

                    return (
                      <tr key={canal} className="hover:bg-slate-50/50 dark:hover:bg-[#00246b] transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <span className="font-bold text-[13px] text-slate-800 dark:text-white uppercase">{canal}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-mono text-[14px] font-medium text-slate-600 dark:text-slate-300">{stats.total}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-mono text-[14px] font-bold text-emerald-600 dark:text-emerald-300">{stats.ganados}</span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold border ${
                            convCanal > 5 ? 'bg-emerald-50 dark:bg-[#002a6e] text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-[#0a2a6b]' :
                            convCanal > 0 ? 'bg-blue-50 dark:bg-[#002a6e] text-blue-700 dark:text-blue-300 border-blue-200 dark:border-[#0a2a6b]' : 'bg-slate-100 dark:bg-[#00246b] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#0a2a6b]'
                          }`}>
                            <TrendingUp className="w-3 h-3 mr-1" /> {convCanal}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {canalesOrdenados.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                        Aún no hay leads registrados con rastreo de origen.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile: tarjetas apiladas, mismos datos sin scroll horizontal */}
            <div className="md:hidden p-4 space-y-3">
              {canalesOrdenados.length === 0 && (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                  Aún no hay leads registrados con rastreo de origen.
                </div>
              )}
              {canalesOrdenados.map(([canal, stats]) => {
                const convCanal = stats.total > 0 ? Math.round((stats.ganados / stats.total) * 100) : 0;
                return (
                  <div key={canal} className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <span className="font-bold text-[13px] text-slate-800 dark:text-white uppercase">{canal}</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold border ${
                        convCanal > 5 ? 'bg-emerald-50 dark:bg-[#002a6e] text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-[#0a2a6b]' :
                        convCanal > 0 ? 'bg-blue-50 dark:bg-[#002a6e] text-blue-700 dark:text-blue-300 border-blue-200 dark:border-[#0a2a6b]' : 'bg-slate-100 dark:bg-[#00246b] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#0a2a6b]'
                      }`}>
                        <TrendingUp className="w-3 h-3 mr-1" /> {convCanal}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#0a2a6b] text-[12px]">
                      <span className="text-slate-500 dark:text-slate-400">Leads: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{stats.total}</span></span>
                      <span className="text-slate-500 dark:text-slate-400">Ventas: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-300">{stats.ganados}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= CÓMO NOS CONOCIÓ (WALK-IN / CLIENTES CARGADOS) ================= */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-[#0a2a6b] flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500 dark:text-sky-300" /> Cómo nos conocieron — clientes cargados en sucursal
              </h2>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{totalConocio} con dato cargado</span>
            </div>
            <div className="p-6">
              {conocioOrdenado.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-500 text-sm italic text-center py-4">
                  Todavía no hay clientes con "¿Cómo nos conoció?" cargado. Se completa al crear un cliente en Nuevo Cliente.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-[#0a2a6b] border border-slate-100 dark:border-[#0a2a6b] rounded-xl overflow-hidden">
                  {conocioOrdenado.map(([fuente, cantidad]) => (
                    <div key={fuente} className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#001c55]">
                      <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{fuente}</span>
                      <span className="font-mono text-[13px] font-bold text-slate-900 dark:text-white">{cantidad}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}