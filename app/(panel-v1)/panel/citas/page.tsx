import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { CalendarCheck, CarFront, MapPin, Clock, Users, CheckCircle2, XCircle, CalendarClock, MessageSquareText } from "lucide-react";
import EstadoVisitaSelector from "./EstadoVisitaSelector";
import VendedorVisitaSelector from "./VendedorVisitaSelector";
import NotificacionesBell from "../../NotificacionesBell";

export default async function CitasPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: visitas } = await supabase
    .from("visitas_agendadas")
    .select(`
      id, nombre_cliente, telefono_cliente, fecha_visita, horario_visita, sucursal, estado, vendedor_id, vehiculo_id,
      vehiculos ( marca, modelo, patente, vendedor_asignado_id )
    `)
    .order("fecha_visita", { ascending: true })
    .order("horario_visita", { ascending: true });

  const { data: perfilesVendedores } = await supabase
    .from("perfiles")
    .select("id, nombre, sucursales ( nombre )")
    .eq("rol", "vendedor")
    .order("nombre");

  const vendedores = (perfilesVendedores || []).map((v: any) => ({
    id: v.id,
    nombre: v.nombre,
    sucursalNombre: v.sucursales?.nombre || null,
  }));

  const hoy = new Date().toISOString().split("T")[0];
  const proximas = visitas?.filter((v) => v.fecha_visita >= hoy && v.estado !== "Cancelada") || [];
  const pasadas = visitas?.filter((v) => v.fecha_visita < hoy || v.estado === "Cancelada") || [];

  // ================= MÉTRICAS INTEGRADAS AL HEADER =================
  const totalVisitas = visitas?.length || 0;
  const asistieron = visitas?.filter((v) => v.estado === "Asistió").length || 0;
  const canceladas = visitas?.filter((v) => v.estado === "Cancelada").length || 0;
  const pendientes = visitas?.filter((v) => v.estado === "Pendiente" || v.estado === "Confirmada").length || 0;

  const badgeEstado = (estado: string) => {
    switch (estado) {
      case "Pendiente": return "bg-amber-500 text-white border-amber-500";
      case "Confirmada": return "bg-indigo-500 text-white border-indigo-500";
      case "Asistió": return "bg-emerald-500 text-white border-emerald-500";
      case "Cancelada": return "bg-rose-500 text-white border-rose-500";
      default: return "bg-slate-400 text-white border-slate-400";
    }
  };

  const bordeEstado = (estado: string) => {
    switch (estado) {
      case "Pendiente": return "border-t-amber-400";
      case "Confirmada": return "border-t-indigo-400";
      case "Asistió": return "border-t-emerald-400";
      case "Cancelada": return "border-t-rose-400";
      default: return "border-t-slate-300";
    }
  };

  const Tarjeta = ({ v }: { v: any }) => (
    <div className={`bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] border-t-4 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all group ${bordeEstado(v.estado)}`}>

      {/* Cabecera de la Tarjeta */}
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${badgeEstado(v.estado)}`}>
          {v.estado}
        </span>
        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(`${v.fecha_visita}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", timeZone: "UTC" })} · {v.horario_visita}
        </span>
      </div>

      {/* Info del Cliente */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
          {v.nombre_cliente.substring(0, 2).toUpperCase()}
        </div>
        <h3 className="font-bold text-[14px] text-slate-900 dark:text-white truncate">
          {v.nombre_cliente}
        </h3>
      </div>

      {/* Info de la Visita */}
      <div className="bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] p-3 rounded-lg mb-4 flex-1 space-y-2.5">
        <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="font-medium truncate">{v.sucursal}</span>
        </div>
        {v.vehiculo_id ? (
          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
            <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="font-medium truncate">
              {vendedores.find((vd) => vd.id === v.vehiculos?.vendedor_asignado_id)?.nombre || "Sin vendedor (auto sin asignar)"}
            </span>
          </div>
        ) : (
          <VendedorVisitaSelector visitaId={v.id} visitaSucursal={v.sucursal} vendedorActualId={v.vendedor_id} vendedores={vendedores} />
        )}
        <div className="flex items-center gap-2 text-[11px]">
          <CarFront className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          {v.vehiculos ? (
            <span className="font-semibold text-indigo-700 dark:text-sky-300 truncate">
              {v.vehiculos.marca} {v.vehiculos.modelo} {v.vehiculos.patente ? `(${v.vehiculos.patente})` : ""}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic">Visita general (Sin auto)</span>
          )}
        </div>
      </div>

      {/* Footer: Acciones */}
      <div className="pt-3 border-t border-slate-100 dark:border-[#0a2a6b] flex items-center justify-between gap-2 mt-auto">
        <EstadoVisitaSelector visitaId={v.id} estadoActual={v.estado} />
        <a
          href={`https://wa.me/${v.telefono_cliente.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="bg-green-50 dark:bg-[#002a6e] hover:bg-green-100 dark:hover:bg-[#00246b] text-green-600 dark:text-green-300 p-1.5 rounded-md transition-colors shrink-0"
          title="Contactar por WhatsApp"
        >
          <MessageSquareText className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </a>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">

      {/* ================= HEADER Y MÉTRICAS ================= */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-3.5 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">
              Agenda de Citas
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Visitas reservadas por clientes desde la web
            </p>
          </div>
        </div>

        {/* Resumen de Métricas tipo Badges */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {totalVisitas} Total
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-[#002a6e] border border-amber-200 dark:border-[#0a2a6b] px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
            <CalendarClock className="w-3.5 h-3.5 text-amber-500" /> {pendientes} Por venir
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-[#002a6e] border border-emerald-200 dark:border-[#0a2a6b] px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {asistieron} Asistieron
          </div>
          <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-[#002a6e] border border-rose-200 dark:border-[#0a2a6b] px-2.5 py-1 rounded-md text-[11px] font-bold text-rose-700 dark:text-rose-300 whitespace-nowrap">
            <XCircle className="w-3.5 h-3.5 text-rose-500" /> {canceladas} Canceladas
          </div>
          <NotificacionesBell seccion="citas" />
        </div>
      </header>

      {/* ================= ÁREA SCROLLABLE ================= */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1800px] mx-auto">

          {/* SECCIÓN: Próximas */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Citas Próximas
              </h2>
              <span className="bg-slate-200 dark:bg-[#00246b] text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {proximas.length}
              </span>
            </div>

            {proximas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {proximas.map((v) => (
                  <Tarjeta key={v.id} v={v} />
                ))}
              </div>
            ) : (
              <div className="p-10 text-center border-2 border-dashed border-slate-200 dark:border-[#0a2a6b] rounded-xl bg-white dark:bg-[#001c55] text-slate-500 dark:text-slate-400 text-sm">
                No hay citas próximas agendadas.
              </div>
            )}
          </div>

          {/* SECCIÓN: Historial */}
          {pasadas.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Historial
                </h2>
                <span className="bg-slate-200 dark:bg-[#00246b] text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {pasadas.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 opacity-70 hover:opacity-100 transition-opacity">
                {pasadas.map((v) => (
                  <Tarjeta key={v.id} v={v} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}