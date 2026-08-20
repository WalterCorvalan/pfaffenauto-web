import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { ClipboardCheck, CarFront, User, Calendar } from "lucide-react";

export default async function PeritajesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: peritajes } = await supabase
    .from("peritajes")
    .select("*, cotizaciones ( marca, modelo, anio, nombre ), vehiculos ( marca, modelo, patente ), perfiles ( nombre )")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex items-center gap-4 border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
          <ClipboardCheck className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
        </div>
        <div>
          <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Peritajes</h1>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Inspecciones de vehículos tasados</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(peritajes || []).map((p: any) => {
            const vehiculo = p.vehiculos || p.cotizaciones;
            return (
              <Link
                key={p.id}
                href={`/panel/peritajes/${p.id}`}
                className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-sky-400/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${p.estado === "Completado" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                    {p.estado}
                  </span>
                  {p.puntaje !== null && (
                    <span className={`text-sm font-black ${p.puntaje >= 70 ? "text-emerald-600 dark:text-emerald-300" : p.puntaje >= 40 ? "text-amber-600 dark:text-amber-300" : "text-rose-600 dark:text-rose-300"}`}>
                      {p.puntaje}%
                    </span>
                  )}
                </div>
                <p className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CarFront className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {vehiculo?.marca} {vehiculo?.modelo}
                </p>
                {p.cotizaciones?.nombre && (
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                    <User className="w-3 h-3" /> {p.cotizaciones.nombre}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-2">
                  <Calendar className="w-3 h-3" /> {new Date(p.created_at).toLocaleDateString("es-AR")} · {p.perfiles?.nombre || "Sin asignar"}
                </p>
              </Link>
            );
          })}

          {(!peritajes || peritajes.length === 0) && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-[#0a2a6b] rounded-2xl bg-white dark:bg-[#001c55]">
              <ClipboardCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-[15px] font-bold text-slate-700 dark:text-slate-200">Sin peritajes todavía</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Se inician desde la ficha de un lead en el CRM.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
