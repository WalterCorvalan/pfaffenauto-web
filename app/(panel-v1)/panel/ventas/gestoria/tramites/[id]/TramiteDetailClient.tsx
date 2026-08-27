"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { ArrowLeft, FileText, User, CarFront, Loader2, Save, History, ExternalLink, Wallet, TrendingUp, TrendingDown, Clock3, CheckCircle2 } from "lucide-react";
import { ESTADOS_TRAMITE, TIPOS_TRAMITE, MODALIDADES_TRAMITE, cambiarEstadoTramite } from "@/lib/tramites";
import RegistrarMovimientoModal from "./RegistrarMovimientoModal";

interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  patente: string | null;
  anio: number;
  sucursales: { nombre: string } | { nombre: string }[] | null;
}

interface Venta {
  id: string;
  numero: number | null;
  nombre: string;
  apellido: string;
  dni: string | null;
  telefono_celular: string | null;
  codigo_seguimiento: string | null;
  cliente_id: string | null;
}

interface Tramite {
  id: string;
  tipo_tramite: string;
  estado: string;
  fecha_ingreso: string;
  fecha_estimada_fin: string | null;
  responsable_id: string | null;
  modalidad: string;
  realizado_por: string | null;
  observaciones: string | null;
  proxima_tarea: string | null;
  proxima_fecha: string | null;
  vehiculo_id: string;
  venta_id: string | null;
  vehiculos: Vehiculo | Vehiculo[] | null;
  boletos_venta: Venta | Venta[] | null;
}

interface Historial {
  id: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  created_at: string;
  perfiles: { nombre: string } | { nombre: string }[] | null;
}

interface Movimiento {
  id: string;
  tipo: string;
  concepto: string | null;
  monto: number;
  medio_pago: string | null;
  comprobante_url: string | null;
  observaciones: string | null;
  fecha: string;
  aprobado: boolean;
}

function uno<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] || null : v;
}

function nombreSucursal(s: Vehiculo["sucursales"]) {
  if (!s) return null;
  return Array.isArray(s) ? s[0]?.nombre : s.nombre;
}

export default function TramiteDetailClient({ tramite, historialInicial, responsables, movimientosIniciales }: { tramite: Tramite; historialInicial: Historial[]; responsables: { id: string; nombre: string | null }[]; movimientosIniciales: Movimiento[] }) {
  const router = useRouter();
  const vehiculo = uno(tramite.vehiculos);
  const venta = uno(tramite.boletos_venta);
  const [movimientos, setMovimientos] = useState(movimientosIniciales);
  const [marcandoCobrado, setMarcandoCobrado] = useState<string | null>(null);

  const cobrado = movimientos.filter((m) => m.tipo === "ingreso" && m.medio_pago !== "Pendiente").reduce((acc, m) => acc + Number(m.monto), 0);
  const gastos = movimientos.filter((m) => m.tipo === "egreso").reduce((acc, m) => acc + Number(m.monto), 0);
  const pendienteCobro = movimientos.filter((m) => m.tipo === "ingreso" && m.medio_pago === "Pendiente").reduce((acc, m) => acc + Number(m.monto), 0);
  const ganancia = cobrado - gastos;
  const saldoTramite = cobrado + pendienteCobro - gastos;

  const marcarCobrado = async (m: Movimiento) => {
    const medio = prompt("¿Con qué medio se cobró? (Efectivo / Transferencia / Depósito / Tarjeta)", "Efectivo");
    if (!medio) return;
    setMarcandoCobrado(m.id);
    try {
      const { error } = await supabase.from("movimientos_caja").update({ medio_pago: medio }).eq("id", m.id);
      if (error) throw error;
      setMovimientos((prev) => prev.map((x) => (x.id === m.id ? { ...x, medio_pago: medio } : x)));
    } catch {
      alert("No se pudo actualizar el cobro.");
    } finally {
      setMarcandoCobrado(null);
    }
  };

  const [estado, setEstado] = useState(tramite.estado);
  const [tipoTramite, setTipoTramite] = useState(tramite.tipo_tramite);
  const [fechaEstimadaFin, setFechaEstimadaFin] = useState(tramite.fecha_estimada_fin || "");
  const [responsableId, setResponsableId] = useState(tramite.responsable_id || "");
  const [modalidad, setModalidad] = useState(tramite.modalidad);
  const [realizadoPor, setRealizadoPor] = useState(tramite.realizado_por || "");
  const [observaciones, setObservaciones] = useState(tramite.observaciones || "");
  const [proximaTarea, setProximaTarea] = useState(tramite.proxima_tarea || "");
  const [proximaFecha, setProximaFecha] = useState(tramite.proxima_fecha || "");
  const [historial, setHistorial] = useState(historialInicial);
  const [guardando, setGuardando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const handleCambiarEstado = async (nuevoEstado: string) => {
    setCambiandoEstado(true);
    const estadoAnterior = estado;
    setEstado(nuevoEstado);
    const nombreAuto = vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}${vehiculo.patente ? ` (${vehiculo.patente})` : ""}` : "un vehículo";
    const ok = await cambiarEstadoTramite(supabase, tramite.id, estadoAnterior, nuevoEstado as any, responsableId || null, {
      mensaje: `Trámite de ${nombreAuto} pasó a "${nuevoEstado}".`,
      link: `/panel/ventas/gestoria/tramites/${tramite.id}`,
    });
    if (!ok) {
      setEstado(estadoAnterior);
      alert("No se pudo cambiar el estado.");
    } else {
      setHistorial((prev) => [{ id: crypto.randomUUID(), estado_anterior: estadoAnterior, estado_nuevo: nuevoEstado, created_at: new Date().toISOString(), perfiles: null }, ...prev]);
    }
    setCambiandoEstado(false);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const { error } = await supabase
        .from("tramites_gestoria")
        .update({
          tipo_tramite: tipoTramite,
          fecha_estimada_fin: fechaEstimadaFin || null,
          responsable_id: responsableId || null,
          modalidad,
          realizado_por: modalidad === "Gestoría propia" ? null : realizadoPor || null,
          observaciones: observaciones || null,
          proxima_tarea: proximaTarea || null,
          proxima_fecha: proximaFecha || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tramite.id);
      if (error) throw error;
      router.refresh();
    } catch {
      alert("No se pudo guardar el trámite.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#F9FAFB] dark:bg-[#001233] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => router.back()} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300 flex items-center gap-2 text-sm transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        {/* Info que ya existe en el CRM — solo lectura acá */}
        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CarFront className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
                {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : "Vehículo"} {vehiculo?.patente ? `(${vehiculo.patente})` : ""}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {vehiculo?.anio} {nombreSucursal(vehiculo?.sucursales || null) ? `· ${nombreSucursal(vehiculo?.sucursales || null)}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {vehiculo && (
                <Link href={`/panel/vehiculo/${vehiculo.id}/documentacion`} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg hover:border-indigo-200 hover:text-indigo-600 dark:hover:text-sky-300 transition-colors">
                  <FileText className="w-3.5 h-3.5" /> Legajo documental
                </Link>
              )}
              {venta && (
                <Link href={`/panel/ventas/seguimiento/${venta.id}`} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] px-3 py-1.5 rounded-lg hover:border-indigo-200 hover:text-indigo-600 dark:hover:text-sky-300 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Ver venta N° {venta.numero}
                </Link>
              )}
            </div>
          </div>

          {venta && (
            <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] rounded-lg px-3 py-2">
              <User className="w-3.5 h-3.5 shrink-0" />
              {venta.nombre} {venta.apellido} {venta.dni ? `— DNI ${venta.dni}` : ""} {venta.telefono_celular ? `— ${venta.telefono_celular}` : ""}
            </div>
          )}
        </div>

        {/* Caja del trámite — cobrado, gastos, pendiente, ganancia */}
        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Caja del trámite
            </h2>
            <RegistrarMovimientoModal tramiteId={tramite.id} vehiculoId={tramite.vehiculo_id} patente={vehiculo?.patente || null} clienteId={venta?.cliente_id || null} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div className="bg-emerald-50 dark:bg-[#002a6e] border border-emerald-100 dark:border-[#0a2a6b] rounded-xl p-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-300 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Cobrado</p>
              <p className="text-[15px] font-black text-emerald-700 dark:text-emerald-300 mt-1">$ {cobrado.toLocaleString("es-AR")}</p>
            </div>
            <div className="bg-rose-50 dark:bg-[#002a6e] border border-rose-100 dark:border-[#0a2a6b] rounded-xl p-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-300 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Gastos</p>
              <p className="text-[15px] font-black text-rose-700 dark:text-rose-300 mt-1">$ {gastos.toLocaleString("es-AR")}</p>
            </div>
            <div className="bg-amber-50 dark:bg-[#002a6e] border border-amber-100 dark:border-[#0a2a6b] rounded-xl p-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-300 flex items-center gap-1"><Clock3 className="w-3 h-3" /> Pendiente de cobro</p>
              <p className="text-[15px] font-black text-amber-700 dark:text-amber-300 mt-1">$ {pendienteCobro.toLocaleString("es-AR")}</p>
            </div>
            <div className="bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] rounded-xl p-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-600 dark:text-sky-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ganancia</p>
              <p className="text-[15px] font-black text-indigo-700 dark:text-sky-300 mt-1">$ {ganancia.toLocaleString("es-AR")}</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4">Saldo del trámite (con lo pendiente incluido): <span className="font-bold text-slate-600 dark:text-slate-300">$ {saldoTramite.toLocaleString("es-AR")}</span></p>

          <div className="space-y-1.5">
            {movimientos.length === 0 && <p className="text-[12px] text-slate-400 dark:text-slate-500 italic py-2">Sin movimientos todavía.</p>}
            {movimientos.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 py-2 px-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#00246b] transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md shrink-0 ${m.tipo === "ingreso" ? "bg-emerald-50 dark:bg-[#002a6e] text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-[#002a6e] text-rose-700 dark:text-rose-300"}`}>
                    {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}
                  </span>
                  <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">{m.concepto || "—"}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">{m.fecha}</span>
                  {m.comprobante_url && (
                    <a href={m.comprobante_url} target="_blank" rel="noreferrer" className="text-indigo-500 dark:text-sky-400 shrink-0" title="Ver comprobante">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white">$ {Number(m.monto).toLocaleString("es-AR")}</span>
                  {m.medio_pago === "Pendiente" ? (
                    <button onClick={() => marcarCobrado(m)} disabled={marcandoCobrado === m.id} className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-[#002a6e] border border-amber-200 dark:border-[#0a2a6b] px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50">
                      {marcandoCobrado === m.id ? "..." : "Marcar cobrado"}
                    </button>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{m.medio_pago}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estado — con historial */}
        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Estado del trámite</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {ESTADOS_TRAMITE.map((e) => (
              <button
                key={e}
                onClick={() => e !== estado && handleCambiarEstado(e)}
                disabled={cambiandoEstado}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors disabled:opacity-50 ${
                  estado === e ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white dark:bg-[#00246b] border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400 hover:border-indigo-300"
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          {historial.length > 0 && (
            <div className="border-t border-slate-100 dark:border-[#0a2a6b] pt-3 space-y-1.5">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-2">
                <History className="w-3 h-3" /> Historial
              </h3>
              {historial.map((h) => {
                const resp = uno(h.perfiles);
                return (
                  <div key={h.id} className="text-[12px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{h.estado_nuevo}</span>
                    <span>— {new Date(h.created_at).toLocaleString("es-AR")}</span>
                    {resp && <span className="text-indigo-500 dark:text-sky-400">({resp.nombre})</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Datos del trámite */}
        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Datos del trámite</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tipo de trámite</label>
              <select value={tipoTramite} onChange={(e) => setTipoTramite(e.target.value)} className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white">
                {TIPOS_TRAMITE.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Responsable asignado</label>
              <select value={responsableId} onChange={(e) => setResponsableId(e.target.value)} className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white">
                <option value="">Sin asignar</option>
                {responsables.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Fecha estimada de finalización</label>
              <input type="date" value={fechaEstimadaFin} onChange={(e) => setFechaEstimadaFin(e.target.value)} className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Fecha de ingreso</label>
              <input type="text" value={tramite.fecha_ingreso} disabled className="w-full bg-slate-100 dark:bg-[#002a6e] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2 text-sm text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Modalidad</label>
              <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white">
                {MODALIDADES_TRAMITE.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {modalidad !== "Gestoría propia" && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Quién lo realiza</label>
                <input value={realizadoPor} onChange={(e) => setRealizadoPor(e.target.value)} placeholder="Ej: Amium, La Concorde, Nissan..." className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Próxima tarea</label>
              <input value={proximaTarea} onChange={(e) => setProximaTarea(e.target.value)} placeholder="Ej: Retirar título en Registro..." className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Próxima fecha</label>
              <input type="date" value={proximaFecha} onChange={(e) => setProximaFecha(e.target.value)} className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Observaciones internas</label>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={3} placeholder="Comentarios internos sobre este trámite..." className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none" />
          </div>

          <button
            onClick={guardar}
            disabled={guardando}
            className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
