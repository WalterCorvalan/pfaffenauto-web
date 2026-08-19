import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { FileText, Plus, Printer, CarFront, AlertTriangle } from "lucide-react";
import NotificacionesBell from "../../NotificacionesBell";

export default async function PresupuestosPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: presupuestos } = await supabase
    .from("presupuestos")
    .select("*, perfiles ( nombre )")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Presupuestos</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Cotizaciones formales enviadas a clientes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificacionesBell seccion="presupuestos" />
          <Link href="/panel/presupuestos/nuevo" className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Nuevo Presupuesto
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1400px] mx-auto p-6">
          <div className="hidden md:block bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 dark:bg-[#00246b] text-white text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6">N°</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Vehículo</th>
                    <th className="p-4">Vendedor</th>
                    <th className="p-4 text-right">Precio</th>
                    <th className="p-4 pr-6 text-center">Imprimir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                  {presupuestos?.map((p: any) => (
                    <tr key={p.id} className={`hover:bg-indigo-50/40 dark:hover:bg-[#00246b] transition-colors border-l-4 ${p.precio_confirmado === false ? "border-l-amber-400" : "border-l-indigo-300"}`}>
                      <td className="p-4 pl-6 font-mono text-[13px] font-bold text-indigo-600 dark:text-sky-300">{p.numero || "—"}</td>
                      <td className="p-4 text-[13px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {p.fecha ? new Date(`${p.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—"}
                      </td>
                      <td className="p-4 text-[13px] font-medium text-slate-900 dark:text-white">
                        {p.cliente}
                        {p.precio_confirmado === false && (
                          <span title="Precio a confirmar" className="inline-flex ml-1.5 align-middle">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-[13px] text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <CarFront className="w-3.5 h-3.5 text-slate-400" /> {p.marca} {p.modelo}
                      </td>
                      <td className="p-4 text-[13px] text-slate-500 dark:text-slate-400">{p.perfiles?.nombre || "—"}</td>
                      <td className="p-4 text-right font-mono text-[13px] font-bold text-slate-900 dark:text-white">
                        {p.precio_venta_ars ? `$ ${Number(p.precio_venta_ars).toLocaleString("es-AR")}` : (p.precio_venta_usd ? `US$ ${Number(p.precio_venta_usd).toLocaleString("es-AR")}` : "—")}
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <Link href={`/panel/presupuestos/imprimir/${p.id}`} className="inline-flex p-2 bg-white dark:bg-[#00246b] hover:bg-indigo-50 dark:hover:bg-[#002a6e] border border-slate-200 dark:border-[#0a2a6b] hover:border-indigo-200 rounded-lg text-slate-400 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-sky-300 transition-all shadow-sm">
                          <Printer className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {(!presupuestos || presupuestos.length === 0) && (
                    <tr>
                      <td colSpan={7} className="p-16 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                        Sin presupuestos cargados todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: tarjetas apiladas, mismos datos sin scroll horizontal */}
          <div className="md:hidden space-y-3">
            {(!presupuestos || presupuestos.length === 0) && (
              <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                Sin presupuestos cargados todavía.
              </div>
            )}
            {presupuestos?.map((p: any) => (
              <div key={p.id} className={`bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-4 shadow-sm space-y-2 border-l-4 ${p.precio_confirmado === false ? "border-l-amber-400" : "border-l-indigo-300"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] font-bold text-indigo-600 dark:text-sky-300">N° {p.numero || "—"}</span>
                  <span className="font-mono text-[13px] font-bold text-slate-900 dark:text-white">
                    {p.precio_venta_ars ? `$ ${Number(p.precio_venta_ars).toLocaleString("es-AR")}` : (p.precio_venta_usd ? `US$ ${Number(p.precio_venta_usd).toLocaleString("es-AR")}` : "—")}
                  </span>
                </div>
                <p className="text-[13px] font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                  {p.cliente}
                  {p.precio_confirmado === false && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                </p>
                <p className="text-[12px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><CarFront className="w-3.5 h-3.5 text-slate-400" /> {p.marca} {p.modelo}</p>
                <div className="flex items-center justify-between text-[12px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-[#0a2a6b]">
                  <span>{p.fecha ? new Date(`${p.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—"} · {p.perfiles?.nombre || "Sin vendedor"}</span>
                  <Link href={`/panel/presupuestos/imprimir/${p.id}`} className="inline-flex p-1.5 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg text-slate-400 dark:text-slate-300">
                    <Printer className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
