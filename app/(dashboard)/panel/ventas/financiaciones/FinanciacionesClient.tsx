"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Landmark, Car, AlertTriangle, CheckCircle2, Clock, Filter, Inbox, Phone, MessageSquareText, CreditCard, ChevronDown, History } from "lucide-react";
import NotificacionesBell from "../../../NotificacionesBell";

interface Financiacion {
  id: string;
  venta_id: string;
  tipo: string | null;
  entidad: string | null;
  monto: number | null;
  cuotas: number | null;
  fecha_vencimiento: string | null;
  estado: string | null;
  created_at: string;
  boleto: {
    nombre: string | null;
    apellido: string | null;
    marca: string | null;
    modelo: string | null;
    dominio: string | null;
  } | null;
}

const ESTADOS = ["Pendiente", "Cobrado", "Vencido"];

// Solicitudes entrantes (leads que piden crédito, todavía no compraron nada)
const ESTADOS_SOLICITUD = ["Pendiente", "Contactado", "Convertido", "Descartado"];

const badgeSolicitud = (estado: string) => {
  switch (estado) {
    case "Convertido": return "bg-emerald-500 text-white border-emerald-500";
    case "Descartado": return "bg-rose-500 text-white border-rose-500";
    default: return "bg-amber-500 text-white border-amber-500";
  }
};

interface Solicitud {
  id: string;
  nombre: string;
  telefono: string;
  marca: string;
  modelo: string;
  anio: number;
  version: string | null;
  sucursal_preferida: string | null;
  estado: string | null;
}

const badgeEstado = (estado: string) => {
  switch (estado) {
    case "Cobrado": return "bg-emerald-500 text-white border-emerald-500";
    case "Vencido": return "bg-rose-500 text-white border-rose-500";
    default: return "bg-amber-500 text-white border-amber-500";
  }
};

const bordeEstado = (estado: string) => {
  switch (estado) {
    case "Cobrado": return "border-l-emerald-400";
    case "Vencido": return "border-l-rose-400";
    default: return "border-l-amber-400";
  }
};

export default function FinanciacionesClient({ financiacionesIniciales, solicitudesIniciales }: { financiacionesIniciales: Financiacion[]; solicitudesIniciales: Solicitud[] }) {
  const router = useRouter();
  const [financiaciones, setFinanciaciones] = useState(financiacionesIniciales);
  const [solicitudes, setSolicitudes] = useState(solicitudesIniciales);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [actualizandoSolicitudId, setActualizandoSolicitudId] = useState<string | null>(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  const cambiarEstadoSolicitud = async (id: string, nuevoEstado: string) => {
    const estadoPrevio = solicitudes.find((s) => s.id === id)?.estado || "Pendiente";
    setActualizandoSolicitudId(id);
    try {
      const { error } = await supabase.from("cotizaciones").update({ estado: nuevoEstado }).eq("id", id);
      if (error) throw error;
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s)));
      if (nuevoEstado === "Convertido") {
        router.push(`/panel/boletos/nuevo?cotizacion_id=${id}&estado_anterior=${encodeURIComponent(estadoPrevio)}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error al actualizar la solicitud.");
    } finally {
      setActualizandoSolicitudId(null);
    }
  };

  const hoy = new Date().toISOString().split("T")[0];

  // Auto-marcar como vencidas visualmente las que ya pasaron de fecha y siguen Pendiente
  const conVencimientoCalculado = financiaciones.map((f) => {
    if (f.estado === "Pendiente" && f.fecha_vencimiento && f.fecha_vencimiento < hoy) {
      return { ...f, estadoVisual: "Vencido" };
    }
    return { ...f, estadoVisual: f.estado || "Pendiente" };
  });

  const filtradas = conVencimientoCalculado.filter((f) => filtroEstado === "todos" || f.estadoVisual === filtroEstado);

  // Solo mostramos las solicitudes activas (Pendiente/Contactado) — una vez que
  // el encargado la marca Convertida o Descartada, sale de la vista para no
  // acumularse para siempre.
  const solicitudesActivas = solicitudes.filter((s) => !s.estado || s.estado === "Pendiente" || s.estado === "Contactado");
  const solicitudesHistorial = solicitudes.filter((s) => s.estado === "Convertido" || s.estado === "Descartado");

  const totales = useMemo(() => {
    const pendiente = conVencimientoCalculado.filter((f) => f.estadoVisual === "Pendiente").reduce((a, f) => a + (Number(f.monto) || 0), 0);
    const vencido = conVencimientoCalculado.filter((f) => f.estadoVisual === "Vencido").reduce((a, f) => a + (Number(f.monto) || 0), 0);
    const cobrado = conVencimientoCalculado.filter((f) => f.estadoVisual === "Cobrado").reduce((a, f) => a + (Number(f.monto) || 0), 0);
    return { pendiente, vencido, cobrado };
  }, [conVencimientoCalculado]);

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    setActualizandoId(id);
    try {
      const { error } = await supabase.from("financiaciones").update({ estado: nuevoEstado }).eq("id", id);
      if (error) throw error;
      setFinanciaciones((prev) => prev.map((f) => (f.id === id ? { ...f, estado: nuevoEstado } : f)));
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el estado.");
    } finally {
      setActualizandoId(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#001233] overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">Financiaciones</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Prendas bancarias y planes de pago de las ventas</p>
          </div>
          {solicitudesActivas.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 bg-indigo-50 dark:bg-[#002a6e] border border-indigo-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg">
              <span className="text-sm font-bold text-indigo-700 dark:text-sky-300">{solicitudesActivas.length}</span>
              <span className="text-xs font-medium text-indigo-600 dark:text-sky-300">Solicitudes de crédito</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <NotificacionesBell seccion="financiacion" />
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mr-1" />
          {["todos", ...ESTADOS].map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-colors ${
                filtroEstado === e ? "bg-slate-100 dark:bg-[#00246b] text-slate-900 dark:text-white border border-slate-200 dark:border-[#0a2a6b]" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#00246b]"
              }`}
            >
              {e === "todos" ? "Todos" : e}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] dark:bg-[#001233] custom-scrollbar">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* ================= SOLICITUDES ENTRANTES (leads que piden crédito, aún no compraron) ================= */}
          {solicitudesActivas.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                <Inbox className="w-3.5 h-3.5" /> Solicitudes Entrantes ({solicitudesActivas.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {solicitudesActivas.map((s) => (
                  <div key={s.id} className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border bg-indigo-50 dark:bg-[#002a6e] text-indigo-700 dark:text-sky-300 border-indigo-200 dark:border-[#0a2a6b] flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> Crédito
                      </span>
                      <select
                        value={s.estado || "Pendiente"}
                        disabled={actualizandoSolicitudId === s.id}
                        onChange={(e) => cambiarEstadoSolicitud(s.id, e.target.value)}
                        className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer shadow-sm transition-transform hover:scale-105 disabled:opacity-50 ${badgeSolicitud(s.estado || "Pendiente")}`}
                      >
                        {ESTADOS_SOLICITUD.map((e) => (<option key={e} value={e} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{e}</option>))}
                      </select>
                    </div>
                    <h3 className="font-bold text-[14px] text-slate-900 dark:text-white mb-1">{s.nombre}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
                      <Phone className="w-3 h-3" /> {s.telefono}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1 mb-1">
                      <Car className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {s.marca} {s.modelo} ({s.anio})
                    </p>
                    {s.sucursal_preferida && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2">Deriva a: <strong className="text-slate-600 dark:text-slate-300">{s.sucursal_preferida}</strong></p>
                    )}
                    {s.version && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{s.version}</p>
                    )}
                    <a
                      href={`https://wa.me/${String(s.telefono).replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${s.nombre}! Te escribimos de Pfaffen Autos por tu solicitud de crédito para el ${s.marca} ${s.modelo}.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-[#002a6e] hover:bg-emerald-100 dark:hover:bg-[#00246b] text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                    >
                      <MessageSquareText className="w-3.5 h-3.5" /> Contactar
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#001c55] border border-amber-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">Pendiente de cobro</span>
              <h3 className="text-2xl font-black mt-1 font-mono text-amber-600 dark:text-amber-300">$ {totales.pendiente.toLocaleString("es-AR")}</h3>
            </div>
            <div className="bg-white dark:bg-[#001c55] border border-rose-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Vencido</span>
              <h3 className="text-2xl font-black mt-1 font-mono text-rose-600 dark:text-rose-300">$ {totales.vencido.toLocaleString("es-AR")}</h3>
            </div>
            <div className="bg-white dark:bg-[#001c55] border border-emerald-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">Cobrado</span>
              <h3 className="text-2xl font-black mt-1 font-mono text-emerald-600 dark:text-emerald-300">$ {totales.cobrado.toLocaleString("es-AR")}</h3>
            </div>
          </div>

          <div className="hidden md:block bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 dark:bg-[#00246b] text-white text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6">Vehículo / Cliente</th>
                    <th className="p-4">Entidad</th>
                    <th className="p-4 text-center">Cuotas</th>
                    <th className="p-4">Vencimiento</th>
                    <th className="p-4 text-right">Monto</th>
                    <th className="p-4 pr-6 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                  {filtradas.map((f) => (
                    <tr key={f.id} className={`hover:bg-indigo-50/40 dark:hover:bg-[#00246b] transition-colors border-l-4 ${bordeEstado(f.estadoVisual)}`}>
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-2 text-[13px] font-bold text-slate-900 dark:text-white">
                          <Car className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          {f.boleto?.marca} {f.boleto?.modelo}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{f.boleto?.nombre} {f.boleto?.apellido}</span>
                      </td>
                      <td className="p-4 text-[13px] text-slate-600 dark:text-slate-300">{f.entidad || "—"}</td>
                      <td className="p-4 text-center text-[13px] font-mono text-slate-600 dark:text-slate-300">{f.cuotas || "—"}</td>
                      <td className="p-4 text-[13px] text-slate-600 dark:text-slate-300">
                        {f.fecha_vencimiento ? new Date(`${f.fecha_vencimiento}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—"}
                      </td>
                      <td className="p-4 text-right font-mono text-[13px] font-bold text-slate-800 dark:text-white">$ {Number(f.monto).toLocaleString("es-AR")}</td>
                      <td className="p-4 pr-6 text-center">
                        <select
                          value={f.estado || "Pendiente"}
                          onChange={(e) => cambiarEstado(f.id, e.target.value)}
                          disabled={actualizandoId === f.id}
                          className={`text-[10px] font-bold uppercase tracking-widest border rounded-lg px-2.5 py-1.5 outline-none cursor-pointer shadow-sm transition-transform hover:scale-105 ${badgeEstado(f.estadoVisual)}`}
                        >
                          {ESTADOS.map((e) => (<option key={e} value={e} className="bg-white text-slate-900">{e}</option>))}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {filtradas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                        Sin financiaciones registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: tarjetas apiladas, mismos datos sin scroll horizontal */}
          <div className="md:hidden space-y-3">
            {filtradas.length === 0 && (
              <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500 text-sm italic">
                Sin financiaciones registradas.
              </div>
            )}
            {filtradas.map((f) => (
              <div key={f.id} className={`bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-4 shadow-sm space-y-2 border-l-4 ${bordeEstado(f.estadoVisual)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-slate-900 dark:text-white">
                    <Car className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {f.boleto?.marca} {f.boleto?.modelo}
                  </div>
                  <span className="font-mono text-[13px] font-bold text-slate-800 dark:text-white">$ {Number(f.monto).toLocaleString("es-AR")}</span>
                </div>
                <span className="text-[12px] text-slate-500 dark:text-slate-400 block">{f.boleto?.nombre} {f.boleto?.apellido}</span>
                <p className="text-[12px] text-slate-600 dark:text-slate-300">Entidad: {f.entidad || "—"} · Cuotas: {f.cuotas || "—"}</p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#0a2a6b]">
                  <span className="text-[12px] text-slate-500 dark:text-slate-400">
                    Vence: {f.fecha_vencimiento ? new Date(`${f.fecha_vencimiento}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—"}
                  </span>
                  <select
                    value={f.estado || "Pendiente"}
                    onChange={(e) => cambiarEstado(f.id, e.target.value)}
                    disabled={actualizandoId === f.id}
                    className={`text-[10px] font-bold uppercase tracking-widest border rounded-lg px-2.5 py-1.5 outline-none cursor-pointer shadow-sm transition-transform hover:scale-105 ${badgeEstado(f.estadoVisual)}`}
                  >
                    {ESTADOS.map((e) => (<option key={e} value={e} className="bg-white text-slate-900">{e}</option>))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* ================= HISTORIAL DE SOLICITUDES (Convertidas/Descartadas) ================= */}
          {solicitudesHistorial.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setMostrarHistorial((v) => !v)}
                className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-3"
              >
                <History className="w-3.5 h-3.5" /> Historial de solicitudes ({solicitudesHistorial.length})
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mostrarHistorial ? "rotate-180" : ""}`} />
              </button>
              {mostrarHistorial && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {solicitudesHistorial.map((s) => (
                    <div key={s.id} className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4 shadow-sm opacity-70">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border bg-indigo-50 dark:bg-[#002a6e] text-indigo-700 dark:text-sky-300 border-indigo-200 dark:border-[#0a2a6b] flex items-center gap-1">
                          <CreditCard className="w-3 h-3" /> Crédito
                        </span>
                        <select
                          value={s.estado || "Pendiente"}
                          disabled={actualizandoSolicitudId === s.id}
                          onChange={(e) => cambiarEstadoSolicitud(s.id, e.target.value)}
                          className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer shadow-sm transition-transform hover:scale-105 disabled:opacity-50 ${badgeSolicitud(s.estado || "Pendiente")}`}
                        >
                          {ESTADOS_SOLICITUD.map((e) => (<option key={e} value={e} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{e}</option>))}
                        </select>
                      </div>
                      <h3 className="font-bold text-[14px] text-slate-900 dark:text-white mb-1">{s.nombre}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
                        <Phone className="w-3 h-3" /> {s.telefono}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                        <Car className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {s.marca} {s.modelo} ({s.anio})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
