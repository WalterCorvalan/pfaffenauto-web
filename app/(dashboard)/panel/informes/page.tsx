import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  FileBarChart, CarFront, DollarSign, TrendingUp, AlertTriangle, Trophy, Wallet, Calendar,
} from "lucide-react";
import { obtenerDatosMes } from "@/lib/informes";
import ReporteIA from "./ReporteIA";

export default async function InformesGlobalesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const {
    nombreMes, cantidadVendidos, ingresosTotales, ventaMasCara,
    egresosTotales, gastosMasCaros, gastosAtipicos, netoDelMes,
  } = await obtenerDatosMes(supabase as any);

  const { data: reportesPrevios } = await supabase
    .from("reportes_mensuales")
    .select("id, mes, contenido, generado_en")
    .order("generado_en", { ascending: false })
    .limit(6);

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 px-6 py-4 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <FileBarChart className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 leading-tight">Informes Globales</h1>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 capitalize flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {nombreMes}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] custom-scrollbar">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* ================= RESUMEN PRINCIPAL ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3"><CarFront className="w-4 h-4 text-indigo-600" /></div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Autos Vendidos</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">{cantidadVendidos}</h3>
            </div>
            <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Ingresos por Ventas</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1 font-mono">$ {ingresosTotales.toLocaleString("es-AR")}</h3>
            </div>
            <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center mb-3"><Wallet className="w-4 h-4 text-rose-600" /></div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Egresos Totales</span>
              <h3 className="text-2xl font-black text-rose-600 mt-1 font-mono">$ {egresosTotales.toLocaleString("es-AR")}</h3>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-3 ${netoDelMes >= 0 ? "bg-indigo-50 border-indigo-100" : "bg-rose-50 border-rose-100"}`}><TrendingUp className={`w-4 h-4 ${netoDelMes >= 0 ? "text-indigo-600" : "text-rose-600"}`} /></div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Neto del Mes</span>
              <h3 className={`text-2xl font-black mt-1 font-mono ${netoDelMes >= 0 ? "text-slate-900" : "text-rose-600"}`}>$ {netoDelMes.toLocaleString("es-AR")}</h3>
            </div>
          </div>

          {/* ================= REPORTE IA ================= */}
          <ReporteIA reportesPrevios={reportesPrevios || []} />

          {/* ================= AUTO MÁS CARO VENDIDO ================= */}
          <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0"><Trophy className="w-6 h-6 text-amber-600" /></div>
            {ventaMasCara ? (
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Venta más cara del mes</span>
                <h3 className="text-lg font-black text-slate-900">
                  {ventaMasCara.vehiculos?.marca} {ventaMasCara.vehiculos?.modelo} {ventaMasCara.vehiculos?.patente ? `(${ventaMasCara.vehiculos.patente})` : ""}
                </h3>
                <p className="text-[13px] text-slate-500">
                  {ventaMasCara.clientes?.nombre} {ventaMasCara.clientes?.apellido} · <span className="font-mono font-bold text-amber-600">$ {Number(ventaMasCara.precio_final_ars).toLocaleString("es-AR")}</span>
                </p>
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">Sin ventas registradas este mes.</p>
            )}
          </div>

          {/* ================= GASTOS MÁS CAROS DEL MES ================= */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Los 10 gastos más caros del mes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6">Concepto</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4 pr-6 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gastosMasCaros.map((g, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 text-[13px] font-medium text-slate-800 flex items-center gap-2">
                        {g.concepto}
                        {g.atipico && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-2.5 h-2.5" /> Atípico
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-[12px] text-slate-500">{g.categoria}</td>
                      <td className="p-4 text-[12px] text-slate-500">{new Date(`${g.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", timeZone: "UTC" })}</td>
                      <td className="p-4 pr-6 text-right font-mono text-[13px] font-bold text-rose-600">$ {g.monto.toLocaleString("es-AR")}</td>
                    </tr>
                  ))}
                  {gastosMasCaros.length === 0 && (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 text-sm italic">Sin egresos registrados este mes.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= GASTOS QUE SE FUERON DE LAS MANOS ================= */}
          <div className="bg-white border border-rose-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-rose-100 bg-rose-50/40">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Gastos atípicos — más del doble del promedio de su categoría
              </h2>
              <p className="text-[11px] text-slate-500 mt-1">Comparado contra el promedio histórico de los últimos 6 meses de cada categoría.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {gastosAtipicos.map((g, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <span className="text-[13px] font-bold text-slate-800">{g.concepto}</span>
                    <span className="text-[11px] text-slate-500 block">{g.categoria} · {new Date(`${g.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", timeZone: "UTC" })}</span>
                  </div>
                  <span className="font-mono text-[13px] font-bold text-rose-600">$ {g.monto.toLocaleString("es-AR")}</span>
                </div>
              ))}
              {gastosAtipicos.length === 0 && (
                <div className="p-10 text-center text-slate-400 text-sm italic">Ningún gasto se salió del promedio este mes. 🎉</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
