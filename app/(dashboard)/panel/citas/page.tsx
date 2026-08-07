import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { CalendarCheck, Phone, CarFront, MapPin, Clock, Users, CheckCircle2, XCircle, CalendarClock } from "lucide-react";
import CambiarEstadoVisita from "./CambiarEstadoVisita";

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
      id, nombre_cliente, telefono_cliente, fecha_visita, horario_visita, sucursal, estado,
      vehiculos ( marca, modelo, patente )
    `)
    .order("fecha_visita", { ascending: true })
    .order("horario_visita", { ascending: true });

  const hoy = new Date().toISOString().split("T")[0];
  const proximas = visitas?.filter((v) => v.fecha_visita >= hoy && v.estado !== "Cancelada") || [];
  const pasadas = visitas?.filter((v) => v.fecha_visita < hoy || v.estado === "Cancelada") || [];

  // ================= MÉTRICAS AUTOMÁTICAS =================
  const totalVisitas = visitas?.length || 0;
  const asistieron = visitas?.filter((v) => v.estado === "Asistió").length || 0;
  const canceladas = visitas?.filter((v) => v.estado === "Cancelada").length || 0;
  const pendientes = visitas?.filter((v) => v.estado === "Pendiente" || v.estado === "Confirmada").length || 0;

  const badgeEstado = (estado: string) => {
    switch (estado) {
      case "Pendiente": return "bg-amber-900/20 text-amber-400 border-amber-700/40";
      case "Confirmada": return "bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/30";
      case "Asistió": return "bg-emerald-900/20 text-emerald-400 border-emerald-700/40";
      case "Cancelada": return "bg-rose-900/20 text-rose-400 border-rose-700/40";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const Tarjeta = ({ v }: { v: any }) => (
    <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:border-[#2d3d54] transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3" />
            {new Date(`${v.fecha_visita}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", timeZone: "UTC" })} · {v.horario_visita}
          </span>
          <h3 className="font-semibold text-white text-base">{v.nombre_cliente}</h3>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${badgeEstado(v.estado)}`}>
          {v.estado}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 text-sm text-slate-400">
        <a href={`https://wa.me/${v.telefono_cliente.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#25D366] transition-colors w-fit">
          <Phone className="w-3.5 h-3.5" /> {v.telefono_cliente}
        </a>
        <span className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" /> {v.sucursal}
        </span>
        {v.vehiculos ? (
          <span className="flex items-center gap-2 text-[#0ea5e9]">
            <CarFront className="w-3.5 h-3.5" /> {v.vehiculos.marca} {v.vehiculos.modelo} {v.vehiculos.patente ? `(${v.vehiculos.patente})` : ""}
          </span>
        ) : (
          <span className="flex items-center gap-2 text-slate-500 italic">
            <CarFront className="w-3.5 h-3.5" /> Sin auto específico
          </span>
        )}
      </div>

      <div className="pt-2 border-t border-[#1e293b] mt-auto">
        <CambiarEstadoVisita visitaId={v.id} estadoActual={v.estado} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b1329] pt-4 md:pt-8 pb-16 px-3 md:px-6 text-slate-100 w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
        
        {/* Encabezado */}
        <div className="flex items-center gap-3.5 mb-7">
          <div className="w-11 h-11 rounded-xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5 text-[#0ea5e9]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">
              Citas / Agenda
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Visitas reservadas por clientes desde la web
            </p>
          </div>
        </div>

        {/* ================= TARJETAS DE MÉTRICAS ================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Agendadas</p>
              <h3 className="text-xl font-black text-white">{totalVisitas}</h3>
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Por venir</p>
              <h3 className="text-xl font-black text-white">{pendientes}</h3>
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Asistieron</p>
              <h3 className="text-xl font-black text-emerald-400">{asistieron}</h3>
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Canceladas</p>
              <h3 className="text-xl font-black text-rose-400">{canceladas}</h3>
            </div>
          </div>
        </div>

        {/* Próximas */}
        <div className="mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Próximas ({proximas.length})
          </h2>
          {proximas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proximas.map((v) => (
                <Tarjeta key={v.id} v={v} />
              ))}
            </div>
          ) : (
            <div className="p-10 text-center border border-dashed border-[#1e293b] rounded-2xl text-slate-500 text-sm">
              No hay citas próximas agendadas.
            </div>
          )}
        </div>

        {/* Historial */}
        {pasadas.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Historial ({pasadas.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
              {pasadas.map((v) => (
                <Tarjeta key={v.id} v={v} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}