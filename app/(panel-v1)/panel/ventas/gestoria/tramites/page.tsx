import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ClipboardList } from "lucide-react";
import NotificacionesBell from "../../../../NotificacionesBell";
import TramitesClient from "./TramitesClient";

export default async function TramitesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const [{ data: tramites }, { data: responsables }] = await Promise.all([
    supabase
      .from("tramites_gestoria")
      .select(
        "id, tipo_tramite, estado, fecha_ingreso, fecha_estimada_fin, proxima_tarea, proxima_fecha, modalidad, realizado_por, vehiculo_id, venta_id, responsable_id, vehiculos(marca, modelo, patente), boletos_venta(nombre, apellido, numero), perfiles:responsable_id(nombre)"
      )
      .order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, rol").in("rol", ["admin", "encargado", "gestoria"]).eq("activo", true).order("nombre"),
  ]);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Trámites</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Transferencias, patentamientos, altas y bajas — {tramites?.length || 0} en total
            </p>
          </div>
        </div>
        <NotificacionesBell seccion="gestoria" />
      </header>

      <TramitesClient tramitesIniciales={(tramites || []) as any} responsables={responsables || []} />
    </div>
  );
}
