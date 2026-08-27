import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Receipt, Plus, Printer, CarFront, AlertTriangle, ExternalLink, Search } from "lucide-react";
import NotificacionesBell from "../../NotificacionesBell";

const COLOR_ETAPA: Record<string, string> = {
  "Seña": "border-l-amber-400", "Documentación": "border-l-amber-400", "Patentamiento": "border-l-amber-400",
  "Transferencia": "border-l-amber-400", "Entrega": "border-l-amber-400", "Completado": "border-l-emerald-400",
};
const BADGE_ETAPA: Record<string, string> = {
  "Seña": "bg-amber-500", "Documentación": "bg-amber-500", "Patentamiento": "bg-amber-500",
  "Transferencia": "bg-amber-500", "Entrega": "bg-amber-500", "Completado": "bg-emerald-500",
};

export default async function BoletosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: boletosCrudos } = await supabase
    .from("boletos_venta")
    .select("*, perfiles ( nombre ), sucursales ( nombre )")
    .order("created_at", { ascending: false })
    .limit(100);

  const boletos = q
    ? (boletosCrudos || []).filter((b: any) => {
        const texto = `${b.nombre ?? ""} ${b.apellido ?? ""} ${b.marca ?? ""} ${b.modelo ?? ""} ${b.dominio ?? ""} ${b.numero ?? ""}`.toLowerCase();
        return texto.includes(q.toLowerCase());
      })
    : boletosCrudos || [];

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-[#002a6e] border border-emerald-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Ventas</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Boletos de compraventa</p>
          </div>
        </div>
        <form method="GET" className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" name="q" defaultValue={q} placeholder="Buscar cliente, auto o número..." className="w-full sm:w-64 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg py-1.5 pl-9 pr-3 text-[13px] outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" />
          </div>
          <NotificacionesBell seccion="boletos" />
          <Link href="/panel/boletos/nuevo" className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-colors shadow-sm shrink-0">
            <Plus className="w-4 h-4" /> Nueva Venta
          </Link>
        </form>
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
                    <th className="p-4">Sucursal</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Vehículo</th>
                    <th className="p-4">Etapa</th>
                    <th className="p-4 text-right">Venta</th>
                    <th className="p-4 text-right">Saldo</th>
                    <th className="p-4 pr-6 text-center">Gestionar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                  {boletos?.map((b: any) => (
                    <tr key={b.id} className={`hover:bg-indigo-50/40 dark:hover:bg-[#00246b] transition-colors border-l-4 ${COLOR_ETAPA[b.etapa_seguimiento] || "border-l-slate-200"}`}>
                      <td className="p-4 pl-6 font-mono text-[13px] font-bold text-indigo-600 dark:text-sky-300">{b.numero || "—"}</td>
                      <td className="p-4 text-[13px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {b.fecha ? new Date(`${b.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—"}
                      </td>
                      <td className="p-4 text-[13px] text-slate-500 dark:text-slate-400">{b.sucursales?.nombre || "—"}</td>
                      <td className="p-4 text-[13px] font-medium text-slate-900 dark:text-white">
                        <Link href={`/panel/ventas/seguimiento/${b.id}`} className="hover:text-indigo-600 dark:hover:text-sky-300 hover:underline">
                          {b.apellido}, {b.nombre}
                        </Link>
                        {b.precio_confirmado === false && (
                          <span title="Precio a confirmar" className="inline-flex ml-1.5 align-middle">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-[13px] text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <CarFront className="w-3.5 h-3.5 text-slate-400" /> {b.marca} {b.modelo}
                      </td>
                      <td className="p-4">
                        {b.etapa_seguimiento ? (
                          <span className={`text-[10px] font-bold uppercase tracking-widest text-white px-2 py-1 rounded-lg ${BADGE_ETAPA[b.etapa_seguimiento] || "bg-slate-400"}`}>
                            {b.etapa_seguimiento}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="p-4 text-right font-mono text-[13px] font-bold text-slate-900 dark:text-white">
                        {b.venta_ars ? `$ ${Number(b.venta_ars).toLocaleString("es-AR")}` : "—"}
                      </td>
                      <td className="p-4 text-right font-mono text-[13px] font-bold text-indigo-600 dark:text-sky-300">
                        {b.saldo_abonar_ars ? `$ ${Number(b.saldo_abonar_ars).toLocaleString("es-AR")}` : "—"}
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/panel/ventas/seguimiento/${b.id}`} className="inline-flex p-2 bg-white dark:bg-[#00246b] hover:bg-indigo-50 dark:hover:bg-[#002a6e] border border-slate-200 dark:border-[#0a2a6b] hover:border-indigo-200 rounded-lg text-slate-400 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-sky-300 transition-all shadow-sm" title="Gestionar venta">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <Link href={`/panel/boletos/imprimir/${b.id}`} className="inline-flex p-2 bg-white dark:bg-[#00246b] hover:bg-indigo-50 dark:hover:bg-[#002a6e] border border-slate-200 dark:border-[#0a2a6b] hover:border-indigo-200 rounded-lg text-slate-400 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-sky-300 transition-all shadow-sm" title="Imprimir">
                            <Printer className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {boletos.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-16 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                        {q ? "Sin resultados para esa búsqueda." : "Sin ventas cargadas todavía."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: tarjetas apiladas, mismos datos sin scroll horizontal */}
          <div className="md:hidden space-y-3">
            {boletos.length === 0 && (
              <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                {q ? "Sin resultados para esa búsqueda." : "Sin ventas cargadas todavía."}
              </div>
            )}
            {boletos?.map((b: any) => (
              <div key={b.id} className={`bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-4 shadow-sm space-y-2 border-l-4 ${COLOR_ETAPA[b.etapa_seguimiento] || "border-l-slate-200"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] font-bold text-indigo-600 dark:text-sky-300">N° {b.numero || "—"}</span>
                  {b.etapa_seguimiento ? (
                    <span className={`text-[10px] font-bold uppercase tracking-widest text-white px-2 py-1 rounded-lg ${BADGE_ETAPA[b.etapa_seguimiento] || "bg-slate-400"}`}>
                      {b.etapa_seguimiento}
                    </span>
                  ) : null}
                </div>
                <p className="text-[13px] font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Link href={`/panel/ventas/seguimiento/${b.id}`} className="hover:text-indigo-600 dark:hover:text-sky-300 hover:underline">
                    {b.apellido}, {b.nombre}
                  </Link>
                  {b.precio_confirmado === false && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                </p>
                <p className="text-[12px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><CarFront className="w-3.5 h-3.5 text-slate-400" /> {b.marca} {b.modelo}</p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">{b.sucursales?.nombre || "Sin sucursal"}</p>
                <div className="flex items-center justify-between text-[12px] text-slate-700 dark:text-slate-200">
                  <span>Venta: <span className="font-mono font-bold text-slate-900 dark:text-white">{b.venta_ars ? `$ ${Number(b.venta_ars).toLocaleString("es-AR")}` : "—"}</span></span>
                  <span>Saldo: <span className="font-mono font-bold text-indigo-600 dark:text-sky-300">{b.saldo_abonar_ars ? `$ ${Number(b.saldo_abonar_ars).toLocaleString("es-AR")}` : "—"}</span></span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#0a2a6b]">
                  <span className="text-[12px] text-slate-500 dark:text-slate-400">{b.fecha ? new Date(`${b.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—"}</span>
                  <div className="flex items-center gap-2">
                    <Link href={`/panel/ventas/seguimiento/${b.id}`} className="inline-flex p-1.5 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg text-slate-400 dark:text-slate-300" title="Gestionar venta">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <Link href={`/panel/boletos/imprimir/${b.id}`} className="inline-flex p-1.5 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg text-slate-400 dark:text-slate-300" title="Imprimir">
                      <Printer className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
