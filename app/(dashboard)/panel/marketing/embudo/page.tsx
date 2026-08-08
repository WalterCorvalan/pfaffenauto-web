import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Megaphone, Filter, Users, MessageSquareText, Target, Trophy, ArrowRight, BarChart3, Globe, TrendingUp } from "lucide-react";

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
    <div className="flex flex-col h-full w-full bg-white overflow-hidden font-sans">
      
      {/* ================= HEADER ================= */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 px-6 py-4 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 leading-tight">
              Embudo de Conversión
            </h1>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Rendimiento de campañas, UTMs y tasas de cierre
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600">
            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
            Tasa de Cierre Global: <span className="text-emerald-600 text-[13px] ml-1">{tasaCierre}%</span>
          </div>
        </div>
      </header>

      {/* ================= ÁREA SCROLLABLE ================= */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] custom-scrollbar">
        <div className="max-w-[1200px] mx-auto space-y-6">
          
          {/* ================= VISUALIZACIÓN DEL EMBUDO ================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" /> Flujo General de Leads
            </h2>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
              
              {/* PASO 1: LEADS */}
              <div className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-xl p-5 text-center relative group hover:border-blue-200 transition-colors">
                <div className="w-10 h-10 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-1">{totalLeads}</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Total Leads</p>
              </div>

              <ArrowRight className="w-6 h-6 text-slate-300 hidden md:block shrink-0" />

              {/* PASO 2: CONTACTADOS */}
              <div className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-xl p-5 text-center relative group hover:border-amber-200 transition-colors">
                <div className="w-10 h-10 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3">
                  <MessageSquareText className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-1">{contactados}</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Contactados</p>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white border border-slate-200 text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded-full shadow-sm">
                  {tasaContactabilidad}%
                </div>
              </div>

              <ArrowRight className="w-6 h-6 text-slate-300 hidden md:block shrink-0" />

              {/* PASO 3: INTERESADOS */}
              <div className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-xl p-5 text-center relative group hover:border-indigo-200 transition-colors">
                <div className="w-10 h-10 mx-auto bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-1">{interesados}</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Interesados</p>
              </div>

              <ArrowRight className="w-6 h-6 text-slate-300 hidden md:block shrink-0" />

              {/* PASO 4: CERRADOS */}
              <div className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-xl p-5 text-center relative group hover:border-emerald-200 transition-colors">
                <div className="w-10 h-10 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-black text-emerald-600 mb-1">{ganados}</h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Clientes Nuevos</p>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white border border-emerald-200 text-[10px] font-bold text-emerald-600 px-2 py-0.5 rounded-full shadow-sm">
                  Cierre {tasaCierre}%
                </div>
              </div>

            </div>
          </div>

          {/* ================= TABLA DE ORIGENES (UTM TRACKER) ================= */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-500" /> Rendimiento por Canal (UTM)
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6 whitespace-nowrap">Origen del Lead</th>
                    <th className="p-4 text-center whitespace-nowrap">Volumen de Leads</th>
                    <th className="p-4 text-center whitespace-nowrap">Ventas Cerradas</th>
                    <th className="p-4 pr-6 text-right whitespace-nowrap">Conversión del Canal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {canalesOrdenados.map(([canal, stats]) => {
                    const convCanal = stats.total > 0 ? Math.round((stats.ganados / stats.total) * 100) : 0;
                    
                    return (
                      <tr key={canal} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <span className="font-bold text-[13px] text-slate-800 uppercase">{canal}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-mono text-[14px] font-medium text-slate-600">{stats.total}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-mono text-[14px] font-bold text-emerald-600">{stats.ganados}</span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold border ${
                            convCanal > 5 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            convCanal > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            <TrendingUp className="w-3 h-3 mr-1" /> {convCanal}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {canalesOrdenados.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-400 text-sm italic">
                        Aún no hay leads registrados con rastreo de origen.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}