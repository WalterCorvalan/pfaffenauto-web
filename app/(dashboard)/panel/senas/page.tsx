import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { Wallet, Plus, Printer, CarFront, AlertTriangle } from "lucide-react";
import EstadoSenaSelector from "./EstadoSenaSelector";
import NotificacionesBell from "../../NotificacionesBell";

const COLOR_ESTADO: Record<string, string> = {
  Activa: "border-l-amber-400", Convertida: "border-l-emerald-400", Perdida: "border-l-rose-400",
};

export default async function SenasPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: senas } = await supabase
    .from("senas")
    .select("*, perfiles ( nombre ), sucursales ( nombre )")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-[#002a6e] border border-amber-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Señas</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Anticipos y reservas de unidades</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificacionesBell seccion="senas" />
          <Link href="/panel/senas/nuevo" className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Nueva Seña
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
                    <th className="p-4">Sucursal</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Vehículo</th>
                    <th className="p-4 text-right">Seña</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 pr-6 text-center">Imprimir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                  {senas?.map((s: any) => (
                    <tr key={s.id} className={`hover:bg-indigo-50/40 dark:hover:bg-[#00246b] transition-colors border-l-4 ${COLOR_ESTADO[s.estado] || "border-l-slate-200"}`}>
                      <td className="p-4 pl-6 font-mono text-[13px] font-bold text-indigo-600 dark:text-sky-300">{s.numero || "—"}</td>
                      <td className="p-4 text-[13px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {s.fecha ? new Date(`${s.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—"}
                      </td>
                      <td className="p-4 text-[13px] text-slate-500 dark:text-slate-400">{s.sucursales?.nombre || "—"}</td>
                      <td className="p-4 text-[13px] font-medium text-slate-900 dark:text-white">
                        {s.apellido}, {s.nombre}
                        {s.precio_confirmado === false && (
                          <span title="Precio a confirmar" className="inline-flex ml-1.5 align-middle">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-[13px] text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <CarFront className="w-3.5 h-3.5 text-slate-400" /> {s.marca} {s.modelo}
                      </td>
                      <td className="p-4 text-right font-mono text-[13px] font-bold text-slate-900 dark:text-white">
                        {s.sena_ars ? `$ ${Number(s.sena_ars).toLocaleString("es-AR")}` : "—"}
                      </td>
                      <td className="p-4 text-center">
                        <EstadoSenaSelector id={s.id} estado={s.estado} />
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <Link href={`/panel/senas/imprimir/${s.id}`} className="inline-flex p-2 bg-white dark:bg-[#00246b] hover:bg-indigo-50 dark:hover:bg-[#002a6e] border border-slate-200 dark:border-[#0a2a6b] hover:border-indigo-200 rounded-lg text-slate-400 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-sky-300 transition-all shadow-sm">
                          <Printer className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {(!senas || senas.length === 0) && (
                    <tr>
                      <td colSpan={8} className="p-16 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                        Sin señas cargadas todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: tarjetas apiladas, mismos datos sin scroll horizontal */}
          <div className="md:hidden space-y-3">
            {(!senas || senas.length === 0) && (
              <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                Sin señas cargadas todavía.
              </div>
            )}
            {senas?.map((s: any) => (
              <div key={s.id} className={`bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-4 shadow-sm space-y-2 border-l-4 ${COLOR_ESTADO[s.estado] || "border-l-slate-200"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] font-bold text-indigo-600 dark:text-sky-300">N° {s.numero || "—"}</span>
                  <span className="font-mono text-[13px] font-bold text-slate-900 dark:text-white">
                    {s.sena_ars ? `$ ${Number(s.sena_ars).toLocaleString("es-AR")}` : "—"}
                  </span>
                </div>
                <p className="text-[13px] font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                  {s.apellido}, {s.nombre}
                  {s.precio_confirmado === false && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                </p>
                <p className="text-[12px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><CarFront className="w-3.5 h-3.5 text-slate-400" /> {s.marca} {s.modelo}</p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">{s.sucursales?.nombre || "Sin sucursal"}</p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#0a2a6b]">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-slate-500 dark:text-slate-400">{s.fecha ? new Date(`${s.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—"}</span>
                    <EstadoSenaSelector id={s.id} estado={s.estado} />
                  </div>
                  <Link href={`/panel/senas/imprimir/${s.id}`} className="inline-flex p-1.5 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg text-slate-400 dark:text-slate-300">
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
