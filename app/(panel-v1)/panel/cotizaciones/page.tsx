import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ClipboardList, CheckCircle, Clock, MapPin } from "lucide-react";
import NotificacionesBell from "../../NotificacionesBell";
import CotizacionesClient from "./CotizacionesClient";

export default async function CotizacionesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  // FILTRO LOGÍSTICO: tasaciones/permutas — "venta" (nos ofrecen su auto para
  // comprarlo) tiene su propia sección "Comprar" del panel.
  const [{ data: cotizaciones }, { data: vendedores }] = await Promise.all([
    supabase
      .from("cotizaciones")
      .select("*")
      .neq("tipo_peritaje", "consignacion")
      .neq("tipo_peritaje", "financiacion")
      .neq("tipo_peritaje", "venta")
      .order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, rol").in("rol", ["vendedor", "encargado", "admin"]).eq("activo", true).order("nombre"),
  ]);

  // ================= MÉTRICAS INTEGRADAS =================
  const total = cotizaciones?.length || 0;
  const tasados = cotizaciones?.filter(c => c.precio_sugerido).length || 0;
  const pendientes = total - tasados;
  const presenciales = cotizaciones?.filter(c => c.tipo_peritaje?.toLowerCase().includes("presencial")).length || 0;

  // Historial: agrupamos por teléfono para detectar clientes con más de una tasación
  const historialPorTelefono: Record<string, typeof cotizaciones> = {};
  (cotizaciones || []).forEach((c) => {
    const lista = historialPorTelefono[c.telefono] || [];
    lista.push(c);
    historialPorTelefono[c.telefono] = lista;
  });

  // Permuta: cada cotización con vehiculo_id apunta al auto que el cliente
  // quiere comprar — traemos precio/marca/modelo de esos autos para mostrar
  // "resta $X" sin que el vendedor tenga que ir a buscar el precio a mano.
  const idsVehiculosObjetivo = [...new Set((cotizaciones || []).filter((c) => c.vehiculo_id).map((c) => c.vehiculo_id as string))];
  const { data: vehiculosObjetivo } = idsVehiculosObjetivo.length
    ? await supabase.from("vehiculos").select("id, marca, modelo, precio_publicado_ars, precio_publicado_usd").in("id", idsVehiculosObjetivo)
    : { data: [] as any[] };
  const vehiculoObjetivoPorId: Record<string, any> = {};
  (vehiculosObjetivo || []).forEach((v) => { vehiculoObjetivoPorId[v.id] = v; });

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">

      {/* ================= HEADER Y MÉTRICAS ================= */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-3.5 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-[#002a6e] border border-blue-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-[#0145F2] dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">
              Solicitudes de Tasación
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Vehículos ingresados para venta directa o permuta
            </p>
          </div>
        </div>

        {/* Resumen de Métricas tipo Badges */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          <NotificacionesBell seccion="cotizaciones" />
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <ClipboardList className="w-3.5 h-3.5 text-slate-400" /> {total} Recibidas
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-700 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-amber-500" /> {pendientes} Procesando
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-700 whitespace-nowrap">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {tasados} Tasados
          </div>
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md text-[11px] font-bold text-blue-700 whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 text-blue-500" /> {presenciales} Presenciales
          </div>
        </div>
      </header>

      <CotizacionesClient
        cotizaciones={(cotizaciones || []) as any}
        vehiculoObjetivoPorId={vehiculoObjetivoPorId}
        historialPorTelefono={historialPorTelefono as any}
        vendedores={vendedores || []}
      />
    </div>
  );
}
