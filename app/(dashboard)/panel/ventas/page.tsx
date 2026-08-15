import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Plus, Receipt, CarFront, Search } from "lucide-react";

const COLOR_ETAPA: Record<string, string> = {
  "Seña": "border-l-amber-400", "Documentación": "border-l-sky-400", "Patentamiento": "border-l-purple-400",
  "Transferencia": "border-l-indigo-400", "Entrega": "border-l-teal-400", "Completado": "border-l-emerald-400",
};
const BADGE_ETAPA: Record<string, string> = {
  "Seña": "bg-amber-500", "Documentación": "bg-sky-500", "Patentamiento": "bg-purple-500",
  "Transferencia": "bg-indigo-500", "Entrega": "bg-teal-500", "Completado": "bg-emerald-500",
};

export default async function VentasListPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  let query = supabase
    .from("boletos_venta")
    .select("id, fecha, numero, venta_ars, apellido, nombre, marca, modelo, dominio, codigo_seguimiento, etapa_seguimiento")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: ventas } = await query;

  const filtradas = q
    ? (ventas || []).filter((v: any) => {
        const texto = `${v.nombre ?? ""} ${v.apellido ?? ""} ${v.marca ?? ""} ${v.modelo ?? ""} ${v.dominio ?? ""} ${v.numero ?? ""}`.toLowerCase();
        return texto.includes(q.toLowerCase());
      })
    : ventas || [];

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Ventas y Operaciones</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Historial de boletos de venta</p>
          </div>
        </div>

        <form method="GET" className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" name="q" defaultValue={q} placeholder="Buscar cliente, auto o código..." className="w-full sm:w-64 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg py-1.5 pl-9 pr-3 text-[13px] outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
          </div>
          <Link href="/panel/boletos/nuevo" className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-[13px] font-bold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Nueva Venta
          </Link>
        </form>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="hidden md:block bg-white dark:bg-[#001c55] border-b border-slate-200 dark:border-[#0a2a6b] w-full">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-800 dark:bg-[#00246b] border-b border-slate-200 dark:border-[#0a2a6b] text-white dark:text-slate-300 text-[10px] uppercase tracking-widest font-bold">
                <th className="p-4 whitespace-nowrap font-bold">N°</th>
                <th className="p-4 whitespace-nowrap font-bold">Fecha</th>
                <th className="p-4 whitespace-nowrap font-bold">Cliente</th>
                <th className="p-4 whitespace-nowrap font-bold">Vehículo</th>
                <th className="p-4 text-right whitespace-nowrap font-bold">Venta</th>
                <th className="p-4 whitespace-nowrap font-bold">Etapa</th>
                <th className="p-4 text-right whitespace-nowrap font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((v: any) => (
                <tr key={v.id} className={`border-b border-l-4 border-slate-100 dark:border-[#0a2a6b] hover:bg-indigo-50/40 dark:hover:bg-[#00246b] transition-colors ${COLOR_ETAPA[v.etapa_seguimiento] || "border-l-slate-200"}`}>
                  <td className="p-4 font-mono text-[13px] font-bold text-indigo-600 dark:text-sky-300 whitespace-nowrap">{v.numero || "—"}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300 text-[13px] whitespace-nowrap">{v.fecha}</td>
                  <td className="p-4 text-[13px] font-medium text-slate-900 dark:text-white whitespace-nowrap">{v.apellido}, {v.nombre}</td>
                  <td className="p-4 text-[13px] text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-1.5">
                    <CarFront className="w-3.5 h-3.5 text-slate-400" /> {v.marca} {v.modelo}
                  </td>
                  <td className="p-4 text-right font-mono text-[13px] font-bold text-slate-800 dark:text-white whitespace-nowrap">$ {Number(v.venta_ars || 0).toLocaleString("es-AR")}</td>
                  <td className="p-4 whitespace-nowrap">
                    {v.etapa_seguimiento ? (
                      <span className={`text-[10px] font-bold uppercase tracking-widest text-white px-2 py-1 rounded-lg ${BADGE_ETAPA[v.etapa_seguimiento] || "bg-slate-400"}`}>{v.etapa_seguimiento}</span>
                    ) : (
                      <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-3">
                    {v.codigo_seguimiento && (
                      <Link href={`/panel/ventas/seguimiento/${v.id}`} className="text-[11px] font-bold text-indigo-600 hover:underline">
                        Gestionar
                      </Link>
                    )}
                    <Link href={`/panel/boletos/imprimir/${v.id}`} className="text-[11px] font-bold text-slate-500 hover:underline">
                      Imprimir
                    </Link>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 text-sm italic">Sin ventas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* VISTA MÓVIL */}
        <div className="flex flex-col gap-3 p-4 md:hidden">
          {filtradas.map((v: any) => (
            <div key={v.id} className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">{v.apellido}, {v.nombre}</span>
                <span className="text-[10px] font-bold text-slate-400">{v.fecha}</span>
              </div>
              <p className="text-[13px] text-slate-600 dark:text-slate-300 mb-2">{v.marca} {v.modelo}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">$ {Number(v.venta_ars || 0).toLocaleString("es-AR")}</span>
                <div className="flex items-center gap-3">
                  {v.codigo_seguimiento && (
                    <Link href={`/panel/ventas/seguimiento/${v.id}`} className="text-[11px] font-bold text-indigo-600">Gestionar →</Link>
                  )}
                  <Link href={`/panel/boletos/imprimir/${v.id}`} className="text-[11px] font-bold text-slate-500">Imprimir</Link>
                </div>
              </div>
            </div>
          ))}
          {filtradas.length === 0 && <p className="text-center text-slate-400 text-sm italic py-10">Sin ventas registradas.</p>}
        </div>
      </div>
    </div>
  );
}
