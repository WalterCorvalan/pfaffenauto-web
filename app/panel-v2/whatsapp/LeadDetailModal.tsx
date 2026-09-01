"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase2 } from "@/lib/supabase2/client";
import {
  X, User, Phone, CarFront, Calendar, Plus, CheckCircle2, Circle, FileText,
  Ban, Clock, AlertTriangle, MapPin, StickyNote, Radio, Car, LifeBuoy, History,
  Edit2, Check, Flame, Snowflake, Minus, Receipt, Wallet, ClipboardCheck, Loader2, MessageCircle,
} from "lucide-react";

const ESTADOS_LEAD = [
  { value: "nuevo", label: "Nuevo" },
  { value: "asignado", label: "Contactado" },
  { value: "calificando", label: "Interesado" },
  { value: "convertido", label: "Cliente" },
  { value: "perdido", label: "Perdido" },
];
const ESTADO_COLOR: Record<string, string> = {
  nuevo: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20",
  asignado: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
  calificando: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20",
  convertido: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20",
  perdido: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20",
};

const TIPOS_TAREA = ["Llamar", "Enviar Email", "Enviar SMS", "Enviar WhatsApp", "Visitar al Cliente", "Cliente visita salón"];
const ESTADOS_TEST_DRIVE = ["Programado", "Realizado", "Cancelado"];
const CALIFICACIONES = [
  { value: "", label: "Sin calificar", icono: Minus, color: "text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5" },
  { value: "caliente", label: "Caliente", icono: Flame, color: "text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10" },
  { value: "tibio", label: "Tibio", icono: Clock, color: "text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10" },
  { value: "frio", label: "Frío", icono: Snowflake, color: "text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/10" },
];

const inputClass = "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-500";
const labelClass = "text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5";

interface Perfil { id: string; nombre: string; roles: string[] }

function Dato({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div>
      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase tracking-widest font-bold mb-0.5">{label}</span>
      <span className="text-[13px] font-bold text-slate-800 dark:text-white">{valor || "—"}</span>
    </div>
  );
}

export default function LeadDetailModal({
  leadId, origen, miId, vendedores, onClose, onActualizado,
}: { leadId: string; origen: "whatsapp" | "instagram"; miId: string; vendedores: Perfil[]; onClose: () => void; onActualizado: (id: string, patch: any) => void }) {
  const tabla = origen === "whatsapp" ? "whatsapp_conversaciones" : "instagram_conversaciones";
  const campoFk = origen === "whatsapp" ? "whatsapp_conversacion_id" : "instagram_conversacion_id";
  const contactoTabla = origen === "whatsapp" ? "whatsapp_contactos" : "instagram_contactos";

  const [cargando, setCargando] = useState(true);
  const [lead, setLead] = useState<any>(null);
  const [contacto, setContacto] = useState<any>(null);
  const [vehiculo, setVehiculo] = useState<any>(null);
  const [vehiculosStock, setVehiculosStock] = useState<any[]>([]);
  const [tareas, setTareas] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [testDrives, setTestDrives] = useState<any[]>([]);
  const [peritajes, setPeritajes] = useState<any[]>([]);
  const [senas, setSenas] = useState<any[]>([]);
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [ventas, setVentas] = useState<any[]>([]);
  const [motivos, setMotivos] = useState<any[]>([]);

  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [guardandoCalificacion, setGuardandoCalificacion] = useState(false);
  const [guardandoVendedor, setGuardandoVendedor] = useState(false);
  const [guardandoVehiculo, setGuardandoVehiculo] = useState(false);
  const [creandoPeritaje, setCreandoPeritaje] = useState(false);

  const [showCierreModal, setShowCierreModal] = useState(false);
  const [motivoCierreId, setMotivoCierreId] = useState("");
  const [nuevoMotivoNombre, setNuevoMotivoNombre] = useState("");
  const [creandoMotivo, setCreandoMotivo] = useState(false);

  const [editandoDomicilio, setEditandoDomicilio] = useState(false);
  const [domicilio, setDomicilio] = useState("");
  const [editandoCanalOrigen, setEditandoCanalOrigen] = useState(false);
  const [canalOrigen, setCanalOrigen] = useState("");
  const [editandoNotas, setEditandoNotas] = useState(false);
  const [notas, setNotas] = useState("");

  const [showTareaModal, setShowTareaModal] = useState(false);
  const [tipoTarea, setTipoTarea] = useState(TIPOS_TAREA[0]);
  const [tituloTarea, setTituloTarea] = useState("");
  const [fechaTarea, setFechaTarea] = useState("");
  const [guardandoTarea, setGuardandoTarea] = useState(false);
  const [tareaACompletar, setTareaACompletar] = useState<any | null>(null);
  const [resultadoTarea, setResultadoTarea] = useState("");
  const [guardandoResultado, setGuardandoResultado] = useState(false);

  const [showTestDriveModal, setShowTestDriveModal] = useState(false);
  const [fechaTestDrive, setFechaTestDrive] = useState("");
  const [vehiculoTestDriveId, setVehiculoTestDriveId] = useState("");
  const [guardandoTestDrive, setGuardandoTestDrive] = useState(false);

  const [showAsistenciaModal, setShowAsistenciaModal] = useState(false);
  const [notaAsistencia, setNotaAsistencia] = useState("");
  const [asistenciaParaId, setAsistenciaParaId] = useState("");
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false);

  const cargar = async () => {
    const { data: l } = await supabase2.from(tabla).select("*").eq("id", leadId).single();
    if (!l) { setCargando(false); return; }
    setLead(l);
    setDomicilio(l.domicilio || "");
    setCanalOrigen(l.canal_origen || "");
    setNotas(l.notas || "");
    setVehiculoTestDriveId(l.vehiculo_id || "");

    const [{ data: c }, { data: v }, { data: vs }, { data: t }, { data: e }, { data: td }, { data: p }, { data: mot }] = await Promise.all([
      supabase2.from(contactoTabla).select("*").eq("id", l.contacto_id).single(),
      l.vehiculo_id ? supabase2.from("vehiculos").select("id, marca, modelo, anio, patente").eq("id", l.vehiculo_id).single() : Promise.resolve({ data: null }),
      supabase2.from("vehiculos").select("id, marca, modelo, patente").in("estado", ["disponible", "reservado"]).order("marca"),
      supabase2.from("tareas_lead").select("*").eq(campoFk, leadId).order("fecha_vencimiento"),
      supabase2.from("eventos_lead").select("*, autor:perfiles(nombre)").eq(campoFk, leadId).order("created_at", { ascending: false }),
      supabase2.from("test_drives").select("*").eq(campoFk, leadId).order("fecha_hora", { ascending: false }),
      supabase2.from("peritajes_lead").select("id, estado, puntaje, created_at").eq(campoFk, leadId),
      supabase2.from("motivos_cierre").select("*").order("nombre"),
    ]);
    setContacto(c);
    setVehiculo(v);
    setVehiculosStock(vs || []);
    setTareas(t || []);
    setEventos(e || []);
    setTestDrives(td || []);
    setPeritajes(p || []);
    setMotivos(mot || []);

    if (l.cliente_id) {
      const [{ data: s }, { data: pr }, { data: vt }] = await Promise.all([
        supabase2.from("senas").select("id, numero, estado, fecha, venta_ars, venta_usd").eq("cliente_id", l.cliente_id).order("fecha", { ascending: false }),
        supabase2.from("presupuestos").select("id, numero, fecha, precio_ars, precio_usd").eq("cliente_id", l.cliente_id).order("fecha", { ascending: false }),
        supabase2.from("ventas").select("id, created_at, precio_venta, moneda_venta").eq("cliente_id", l.cliente_id).order("created_at", { ascending: false }),
      ]);
      setSenas(s || []);
      setPresupuestos(pr || []);
      setVentas(vt || []);
    } else {
      setSenas([]); setPresupuestos([]); setVentas([]);
    }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [leadId]);

  const registrarEvento = async (tipo: string, descripcion: string) => {
    await supabase2.from("eventos_lead").insert({ [campoFk]: leadId, tipo, descripcion, creado_por: miId });
    const { data: e } = await supabase2.from("eventos_lead").select("*, autor:perfiles(nombre)").eq(campoFk, leadId).order("created_at", { ascending: false });
    setEventos(e || []);
  };

  const patch = async (payload: any) => {
    const { data, error } = await supabase2.from(tabla).update(payload).eq("id", leadId).select("*").single();
    if (error) throw error;
    setLead(data);
    onActualizado(leadId, data);
    return data;
  };

  const cambiarEstado = async (nuevo: string) => {
    if (nuevo === "perdido") { setShowCierreModal(true); return; }
    setGuardandoEstado(true);
    try {
      await patch({ estado_lead: nuevo });
      await registrarEvento("estado", `Estado cambiado a "${ESTADOS_LEAD.find((e) => e.value === nuevo)?.label}"`);
    } catch { alert("No se pudo cambiar el estado."); } finally { setGuardandoEstado(false); }
  };

  const confirmarCierre = async () => {
    if (!motivoCierreId) return alert("Elegí un motivo.");
    setGuardandoEstado(true);
    try {
      await patch({ estado_lead: "perdido", motivo_cierre_id: motivoCierreId });
      const nombreMotivo = motivos.find((m) => m.id === motivoCierreId)?.nombre || "";
      await registrarEvento("cierre", `Cerrado como perdido — ${nombreMotivo}`);
      setShowCierreModal(false);
      setMotivoCierreId("");
    } catch { alert("No se pudo cerrar el lead."); } finally { setGuardandoEstado(false); }
  };

  const crearMotivo = async () => {
    if (!nuevoMotivoNombre.trim()) return;
    setCreandoMotivo(true);
    try {
      const { data, error } = await supabase2.from("motivos_cierre").insert({ nombre: nuevoMotivoNombre.trim() }).select("*").single();
      if (error) throw error;
      setMotivos((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setMotivoCierreId(data.id);
      setNuevoMotivoNombre("");
    } catch { alert("No se pudo crear el motivo."); } finally { setCreandoMotivo(false); }
  };

  const cambiarCalificacion = async (nueva: string) => {
    setGuardandoCalificacion(true);
    try {
      await patch({ calificacion: nueva || null });
      await registrarEvento("calificacion", `Grado de interés cambiado a "${CALIFICACIONES.find((c) => c.value === nueva)?.label}"`);
    } catch { alert("No se pudo cambiar el grado de interés."); } finally { setGuardandoCalificacion(false); }
  };

  const cambiarVendedor = async (vendedorId: string) => {
    setGuardandoVendedor(true);
    try {
      await patch({ vendedor_id: vendedorId || null });
      const nombre = vendedores.find((v) => v.id === vendedorId)?.nombre;
      await registrarEvento("asignacion", vendedorId ? `Reasignado a ${nombre}` : "Vendedor removido");
    } catch { alert("No se pudo reasignar."); } finally { setGuardandoVendedor(false); }
  };

  const cambiarVehiculo = async (vehiculoId: string) => {
    setGuardandoVehiculo(true);
    try {
      const data = await patch({ vehiculo_id: vehiculoId || null });
      const v = vehiculosStock.find((x) => x.id === vehiculoId);
      setVehiculo(v ? { ...v } : null);
      await registrarEvento("vehiculo", vehiculoId ? `Vinculado a ${v?.marca} ${v?.modelo}` : "Vehículo desvinculado");
    } catch { alert("No se pudo vincular el vehículo."); } finally { setGuardandoVehiculo(false); }
  };

  const guardarDomicilio = async () => { await patch({ domicilio }); setEditandoDomicilio(false); };
  const guardarCanalOrigen = async () => {
    await patch({ canal_origen: canalOrigen || null });
    setEditandoCanalOrigen(false);
    await registrarEvento("canal_origen", canalOrigen ? `Canal de origen marcado: ${canalOrigen}` : "Canal de origen borrado");
  };
  const guardarNotas = async () => { await patch({ notas }); setEditandoNotas(false); };

  const crearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaTarea) return alert("Elegí fecha y hora.");
    setGuardandoTarea(true);
    try {
      const { data, error } = await supabase2.from("tareas_lead").insert({
        [campoFk]: leadId, tipo: tipoTarea, titulo: tituloTarea || null, fecha_vencimiento: new Date(fechaTarea).toISOString(), creado_por: miId,
      }).select("*").single();
      if (error) throw error;
      setTareas((prev) => [...prev, data].sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime()));
      await registrarEvento("tarea", `Tarea creada: ${tipoTarea}`);
      setShowTareaModal(false); setTituloTarea(""); setFechaTarea("");
    } catch { alert("Error al crear la tarea."); } finally { setGuardandoTarea(false); }
  };

  const toggleCompletada = (tarea: any) => {
    if (!tarea.completada) { setTareaACompletar(tarea); setResultadoTarea(""); return; }
    supabase2.from("tareas_lead").update({ completada: false }).eq("id", tarea.id);
    setTareas((prev) => prev.map((t) => (t.id === tarea.id ? { ...t, completada: false } : t)));
  };

  const confirmarCompletarTarea = async () => {
    if (!tareaACompletar) return;
    setGuardandoResultado(true);
    try {
      await supabase2.from("tareas_lead").update({ completada: true, resultado: resultadoTarea || null }).eq("id", tareaACompletar.id);
      setTareas((prev) => prev.map((t) => (t.id === tareaACompletar.id ? { ...t, completada: true, resultado: resultadoTarea || null } : t)));
      await registrarEvento("tarea", `Tarea completada: ${tareaACompletar.tipo}` + (resultadoTarea ? ` — ${resultadoTarea}` : ""));
      setTareaACompletar(null);
    } catch { alert("No se pudo completar la tarea."); } finally { setGuardandoResultado(false); }
  };

  const agendarTestDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaTestDrive) return alert("Elegí fecha y hora.");
    setGuardandoTestDrive(true);
    try {
      const { data, error } = await supabase2.from("test_drives").insert({
        [campoFk]: leadId, vehiculo_id: vehiculoTestDriveId || null, fecha_hora: new Date(fechaTestDrive).toISOString(),
      }).select("*").single();
      if (error) throw error;
      setTestDrives((prev) => [data, ...prev]);
      await registrarEvento("test_drive", "Test drive agendado");
      setShowTestDriveModal(false); setFechaTestDrive("");
    } catch { alert("Error al agendar el test drive."); } finally { setGuardandoTestDrive(false); }
  };

  const cambiarEstadoTestDrive = async (td: any, nuevo: string) => {
    setTestDrives((prev) => prev.map((t) => (t.id === td.id ? { ...t, estado: nuevo } : t)));
    await supabase2.from("test_drives").update({ estado: nuevo }).eq("id", td.id);
    await registrarEvento("test_drive", `Test drive marcado como "${nuevo}"`);
  };

  const pedirAsistencia = async () => {
    if (!asistenciaParaId) return alert("Elegí a quién pedirle ayuda.");
    setGuardandoAsistencia(true);
    try {
      await patch({ asistencia_solicitada: true, asistencia_nota: notaAsistencia || null, asistencia_para: asistenciaParaId, asistencia_atendida: false });
      const nombre = vendedores.find((v) => v.id === asistenciaParaId)?.nombre;
      await registrarEvento("asistencia", `Asistencia pedida a ${nombre}` + (notaAsistencia ? `: ${notaAsistencia}` : ""));
      setShowAsistenciaModal(false); setNotaAsistencia("");
    } catch { alert("No se pudo pedir asistencia."); } finally { setGuardandoAsistencia(false); }
  };

  const marcarAsistenciaAtendida = async () => {
    await patch({ asistencia_atendida: true });
    await registrarEvento("asistencia", "Asistencia atendida");
  };

  const iniciarPeritaje = async () => {
    setCreandoPeritaje(true);
    try {
      const { data: id, error } = await supabase2.rpc("crear_peritaje_desde_lead", {
        [origen === "whatsapp" ? "p_whatsapp_conversacion_id" : "p_instagram_conversacion_id"]: leadId,
        p_realizado_por: miId,
      });
      if (error) throw error;
      window.open(`/panel-v2/peritajes/${id}`, "_blank");
      await cargar();
    } catch { alert("No se pudo iniciar el peritaje."); } finally { setCreandoPeritaje(false); }
  };

  const { vencidas, hoy, proximas } = useMemo(() => {
    const ahora = new Date();
    const finHoy = new Date(ahora); finHoy.setHours(23, 59, 59, 999);
    const inicioHoy = new Date(ahora); inicioHoy.setHours(0, 0, 0, 0);
    const abiertas = tareas.filter((t) => !t.completada);
    return {
      vencidas: abiertas.filter((t) => new Date(t.fecha_vencimiento) < inicioHoy),
      hoy: abiertas.filter((t) => { const f = new Date(t.fecha_vencimiento); return f >= inicioHoy && f <= finHoy; }),
      proximas: abiertas.filter((t) => new Date(t.fecha_vencimiento) > finHoy),
    };
  }, [tareas]);

  if (cargando || !lead) {
    return <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white" /></div>;
  }

  const nombre = contacto?.nombre_perfil || contacto?.username || contacto?.telefono || "Sin nombre";
  const telefono = contacto?.telefono || "";
  const numeroLimpio = String(telefono).replace(/\D/g, "");
  const linkWhatsApp = numeroLimpio ? `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(`¡Hola ${nombre}! Te escribimos de Pfaffen Autos.`)}` : null;
  const paramsLead = `${campoFk}=${leadId}`;
  const puedeEditar = true;

  const TareasGrupo = ({ titulo, icono, tareas }: { titulo: string; icono: React.ReactNode; tareas: any[] }) =>
    tareas.length === 0 ? null : (
      <div className="mb-2 last:mb-0">
        <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">{icono} {titulo}</p>
        <div className="space-y-1">
          {tareas.map((t) => (
            <button key={t.id} onClick={() => toggleCompletada(t)} className="flex items-center gap-2 w-full text-left">
              {t.completada ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
              <span className={`text-xs ${t.completada ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`}>{t.tipo}{t.titulo ? ` — ${t.titulo}` : ""}</span>
              <span className="text-[10px] text-slate-400 ml-auto shrink-0">{new Date(t.fecha_vencimiento).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</span>
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-end px-5 pt-4 sticky top-0 bg-white dark:bg-[#111] z-10">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 pb-6 space-y-4">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{nombre}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Consulta por {origen === "whatsapp" ? "WhatsApp" : "Instagram"}</p>
              </div>
              <select value={lead.estado_lead || "nuevo"} disabled={guardandoEstado} onChange={(e) => cambiarEstado(e.target.value)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer disabled:opacity-50 shrink-0 ${ESTADO_COLOR[lead.estado_lead] || ESTADO_COLOR.nuevo}`}>
                {ESTADOS_LEAD.map((e) => (<option key={e.value} value={e.value}>{e.label}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-4 text-[13px] text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {telefono || "Sin teléfono"}</span>
              {linkWhatsApp && <a href={linkWhatsApp} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-300 font-bold text-xs hover:underline flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</a>}
            </div>
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-1">Grado de interés:</span>
              {CALIFICACIONES.map((c) => {
                const Icono = c.icono;
                const activo = (lead.calificacion || "") === c.value;
                return (
                  <button key={c.value || "sin"} onClick={() => cambiarCalificacion(c.value)} disabled={guardandoCalificacion}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${activo ? c.color + " ring-1 ring-current" : "text-slate-400 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10"}`}>
                    <Icono className="w-3 h-3" /> {c.label}
                  </button>
                );
              })}
            </div>
            {lead.motivo_cierre_id && lead.estado_lead === "perdido" && (
              <p className="text-[11px] text-rose-600 dark:text-rose-300 font-bold mt-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg px-2.5 py-1.5 w-fit">
                Motivo: {motivos.find((m) => m.id === lead.motivo_cierre_id)?.nombre || "—"}
              </p>
            )}
          </div>

          {lead.asistencia_solicitada && !lead.asistencia_atendida ? (
            <div className="bg-orange-500 border-2 border-orange-600 rounded-2xl p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <LifeBuoy className="w-6 h-6 text-white mt-0.5 shrink-0 animate-pulse" />
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wide">🆘 Asistencia solicitada{lead.asistencia_para ? ` a ${vendedores.find((v) => v.id === lead.asistencia_para)?.nombre || ""}` : ""}</p>
                  {lead.asistencia_nota && <p className="text-xs text-white/95 mt-1 font-medium">{lead.asistencia_nota}</p>}
                </div>
              </div>
              <button onClick={marcarAsistenciaAtendida} className="shrink-0 text-[11px] font-bold text-orange-700 bg-white px-3 py-1.5 rounded-lg hover:bg-orange-50">Marcar atendida</button>
            </div>
          ) : (
            <button onClick={() => setShowAsistenciaModal(true)} className="flex items-center justify-center gap-2 w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold py-2 rounded-xl text-[11px] uppercase tracking-widest">
              <LifeBuoy className="w-3.5 h-3.5" /> Pedir asistencia
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4">
                <h2 className={labelClass}><CarFront className="w-3.5 h-3.5" /> Vehículo de interés</h2>
                <select value={lead.vehiculo_id || ""} disabled={guardandoVehiculo} onChange={(e) => cambiarVehiculo(e.target.value)} className={inputClass}>
                  <option value="">Sin vincular</option>
                  {vehiculosStock.map((v: any) => (<option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.patente ? `— ${v.patente}` : ""}</option>))}
                </select>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4">
                <h2 className={labelClass}><User className="w-3.5 h-3.5" /> Vendedor asignado</h2>
                <select value={lead.vendedor_id || ""} disabled={guardandoVendedor} onChange={(e) => cambiarVendedor(e.target.value)} className={inputClass}>
                  <option value="">Sin asignar</option>
                  {vendedores.map((v) => (<option key={v.id} value={v.id}>{v.nombre}</option>))}
                </select>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4 space-y-3">
                <h2 className={labelClass}><MapPin className="w-3.5 h-3.5" /> Prospecto</h2>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Domicilio</span>
                    {!editandoDomicilio && <button onClick={() => setEditandoDomicilio(true)} className="text-slate-400 hover:text-rose-600"><Edit2 className="w-3 h-3" /></button>}
                  </div>
                  {editandoDomicilio ? (
                    <div className="flex gap-2"><input autoFocus value={domicilio} onChange={(e) => setDomicilio(e.target.value)} className={inputClass} /><button onClick={guardarDomicilio} className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-lg"><Check className="w-4 h-4" /></button></div>
                  ) : (<p className="text-[13px] text-slate-700 dark:text-slate-200">{lead.domicilio || "Sin domicilio"}</p>)}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><StickyNote className="w-3 h-3" /> Notas</span>
                    {!editandoNotas && <button onClick={() => setEditandoNotas(true)} className="text-slate-400 hover:text-rose-600"><Edit2 className="w-3 h-3" /></button>}
                  </div>
                  {editandoNotas ? (
                    <div className="space-y-2"><textarea autoFocus rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} className={inputClass} /><button onClick={guardarNotas} className="w-full bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold uppercase tracking-widest py-2 rounded-lg">Guardar</button></div>
                  ) : (<p className="text-[13px] text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{lead.notas || "Sin notas"}</p>)}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4">
                <h2 className={labelClass}><Radio className="w-3.5 h-3.5" /> Canal de ingreso</h2>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-[12px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase tracking-widest font-bold mb-0.5">Canal de origen</span>
                    {editandoCanalOrigen ? (
                      <div className="flex items-center gap-1.5">
                        <select autoFocus value={canalOrigen} onChange={(e) => setCanalOrigen(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs outline-none">
                          <option value="">Sin especificar</option>
                          <option value="Google Ads">Google Ads</option><option value="Meta Ads">Meta Ads</option><option value="MercadoLibre">MercadoLibre</option><option value="WhatsApp">WhatsApp</option><option value="Referido">Referido</option>
                        </select>
                        <button onClick={guardarCanalOrigen} className="text-emerald-600 text-[11px] font-bold">Guardar</button>
                      </div>
                    ) : (<button onClick={() => setEditandoCanalOrigen(true)} className="text-[13px] font-bold text-slate-800 dark:text-white hover:underline">{lead.canal_origen || "—"}</button>)}
                  </div>
                  <Dato label="Sucursal" valor={vehiculo ? undefined : "—"} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className={labelClass + " mb-0"}><History className="w-3.5 h-3.5" /> Eventos</h2>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {eventos.length === 0 ? <p className="text-xs text-slate-400 italic">Lead creado</p> : eventos.map((ev) => (
                    <div key={ev.id} className="text-xs">
                      <p className="text-slate-700 dark:text-slate-200">{ev.descripcion}</p>
                      <p className="text-[10px] text-slate-400">{ev.autor?.nombre || "Sistema"} · {new Date(ev.created_at).toLocaleString("es-AR")}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className={labelClass + " mb-0"}><Calendar className="w-3.5 h-3.5" /> Tareas de seguimiento</h2>
                  <button onClick={() => setShowTareaModal(true)} className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700"><Plus className="w-3.5 h-3.5" /> Nueva</button>
                </div>
                <TareasGrupo titulo="Vencidas" icono={<AlertTriangle className="w-3.5 h-3.5 text-rose-500" />} tareas={vencidas} />
                <TareasGrupo titulo="Hoy" icono={<Clock className="w-3.5 h-3.5 text-amber-500" />} tareas={hoy} />
                <TareasGrupo titulo="Próximas" icono={<Calendar className="w-3.5 h-3.5 text-slate-400" />} tareas={proximas} />
                {vencidas.length === 0 && hoy.length === 0 && proximas.length === 0 && <p className="text-xs text-slate-400 italic">Sin tareas pendientes.</p>}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4 space-y-3">
            <h2 className={labelClass}><FileText className="w-3.5 h-3.5" /> Historial comercial</h2>
            {presupuestos.length === 0 && senas.length === 0 && ventas.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Todavía no se generó ningún presupuesto, seña ni venta para este lead.</p>
            ) : (
              <div className="space-y-1.5">
                {presupuestos.map((p: any) => (
                  <Link key={`p-${p.id}`} href={`/panel-v2/presupuestos/imprimir/${p.id}`} className="flex items-center justify-between bg-white dark:bg-white/5 rounded-lg px-3 py-2 text-xs hover:border-rose-300 border border-transparent">
                    <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Presupuesto N° {p.numero}</span>
                    <span className="font-bold">{p.precio_ars ? `$ ${Number(p.precio_ars).toLocaleString("es-AR")}` : p.precio_usd ? `US$ ${Number(p.precio_usd).toLocaleString("es-AR")}` : ""}</span>
                  </Link>
                ))}
                {senas.map((s: any) => (
                  <Link key={`s-${s.id}`} href={`/panel-v2/senas/imprimir/${s.id}`} className="flex items-center justify-between bg-white dark:bg-white/5 rounded-lg px-3 py-2 text-xs hover:border-rose-300 border border-transparent">
                    <span className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Seña N° {s.numero}</span>
                    <span className="font-bold">{s.venta_ars ? `$ ${Number(s.venta_ars).toLocaleString("es-AR")}` : s.venta_usd ? `US$ ${Number(s.venta_usd).toLocaleString("es-AR")}` : ""}</span>
                  </Link>
                ))}
                {ventas.map((b: any) => (
                  <div key={`b-${b.id}`} className="flex items-center justify-between bg-white dark:bg-white/5 rounded-lg px-3 py-2 text-xs">
                    <span className="flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5" /> Venta — {new Date(b.created_at).toLocaleDateString("es-AR")}</span>
                    <span className="font-bold">{b.moneda_venta} {Number(b.precio_venta).toLocaleString("es-AR")}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <Link href={`/panel-v2/presupuestos?nuevo=1&${paramsLead}`} className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-[11px] uppercase tracking-widest">
                <Plus className="w-3.5 h-3.5" /> Presupuesto
              </Link>
              <Link href={`/panel-v2/senas?nuevo=1&${paramsLead}`} className="flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/20 text-white font-bold py-2 rounded-xl text-[11px] uppercase tracking-widest">
                <Plus className="w-3.5 h-3.5" /> Seña
              </Link>
              <Link href={`/panel-v2/ventas?nuevo=1&${paramsLead}`} className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[11px] uppercase tracking-widest">
                <Plus className="w-3.5 h-3.5" /> Venta
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className={labelClass + " mb-0"}><ClipboardCheck className="w-3.5 h-3.5" /> Peritaje</h2>
                <button onClick={iniciarPeritaje} disabled={creandoPeritaje} className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 disabled:opacity-50">
                  <Plus className="w-3.5 h-3.5" /> {creandoPeritaje ? "Iniciando..." : "Iniciar peritaje"}
                </button>
              </div>
              {peritajes.length === 0 ? <p className="text-xs text-slate-400 italic">Todavía no se hizo un peritaje de este vehículo.</p> : (
                <div className="space-y-2">
                  {peritajes.map((p: any) => (
                    <Link key={p.id} href={`/panel-v2/peritajes/${p.id}`} className="flex items-center justify-between gap-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3 hover:border-rose-300">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{new Date(p.created_at).toLocaleDateString("es-AR")}</span>
                      <span className="flex items-center gap-2 text-[11px] font-bold">
                        {p.puntaje != null && <span className={p.puntaje >= 70 ? "text-emerald-600" : p.puntaje >= 40 ? "text-amber-600" : "text-rose-600"}>{p.puntaje}%</span>}
                        <span className="text-slate-400 uppercase">{p.estado}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className={labelClass + " mb-0"}><Car className="w-3.5 h-3.5" /> Test Drive</h2>
                <button onClick={() => setShowTestDriveModal(true)} className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700"><Plus className="w-3.5 h-3.5" /> Agendar</button>
              </div>
              {testDrives.length === 0 ? <p className="text-xs text-slate-400 italic">Sin test drives agendados.</p> : (
                <div className="space-y-1.5">
                  {testDrives.map((td: any) => {
                    const v = vehiculosStock.find((x) => x.id === td.vehiculo_id);
                    return (
                      <div key={td.id} className="flex items-center justify-between gap-2 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white">{v ? `${v.marca} ${v.modelo}` : "Sin auto"}</p>
                          <span className="text-[10px] text-slate-400">{new Date(td.fecha_hora).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <select value={td.estado} onChange={(e) => cambiarEstadoTestDrive(td, e.target.value)} className="text-[10px] font-bold uppercase px-2 py-1 rounded border outline-none bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 shrink-0">
                          {ESTADOS_TEST_DRIVE.map((e) => (<option key={e} value={e}>{e}</option>))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {showTareaModal && (
          <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4" onClick={() => setShowTareaModal(false)}>
            <form onSubmit={crearTarea} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-5 w-full max-w-sm space-y-3">
              <h3 className="font-bold text-sm">Nueva tarea</h3>
              <select value={tipoTarea} onChange={(e) => setTipoTarea(e.target.value)} className={inputClass}>{TIPOS_TAREA.map((t) => <option key={t} value={t}>{t}</option>)}</select>
              <input value={tituloTarea} onChange={(e) => setTituloTarea(e.target.value)} placeholder="Título (opcional)" className={inputClass} />
              <input type="datetime-local" value={fechaTarea} onChange={(e) => setFechaTarea(e.target.value)} className={inputClass} required />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowTareaModal(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-500">Cancelar</button><button type="submit" disabled={guardandoTarea} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50">Crear</button></div>
            </form>
          </div>
        )}

        {tareaACompletar && (
          <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4" onClick={() => setTareaACompletar(null)}>
            <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-5 w-full max-w-sm space-y-3">
              <h3 className="font-bold text-sm">Completar: {tareaACompletar.tipo}</h3>
              <textarea value={resultadoTarea} onChange={(e) => setResultadoTarea(e.target.value)} rows={3} placeholder="Resultado (opcional)" className={inputClass} />
              <div className="flex justify-end gap-2"><button onClick={() => setTareaACompletar(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-500">Cancelar</button><button onClick={confirmarCompletarTarea} disabled={guardandoResultado} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50">Completar</button></div>
            </div>
          </div>
        )}

        {showTestDriveModal && (
          <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4" onClick={() => setShowTestDriveModal(false)}>
            <form onSubmit={agendarTestDrive} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-5 w-full max-w-sm space-y-3">
              <h3 className="font-bold text-sm">Agendar test drive</h3>
              <select value={vehiculoTestDriveId} onChange={(e) => setVehiculoTestDriveId(e.target.value)} className={inputClass}>
                <option value="">Sin auto</option>
                {vehiculosStock.map((v: any) => (<option key={v.id} value={v.id}>{v.marca} {v.modelo}</option>))}
              </select>
              <input type="datetime-local" value={fechaTestDrive} onChange={(e) => setFechaTestDrive(e.target.value)} className={inputClass} required />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowTestDriveModal(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-500">Cancelar</button><button type="submit" disabled={guardandoTestDrive} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50">Agendar</button></div>
            </form>
          </div>
        )}

        {showAsistenciaModal && (
          <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4" onClick={() => setShowAsistenciaModal(false)}>
            <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-5 w-full max-w-sm space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-1.5"><LifeBuoy className="w-4 h-4" /> Pedir asistencia</h3>
              <select value={asistenciaParaId} onChange={(e) => setAsistenciaParaId(e.target.value)} className={inputClass}>
                <option value="">— Elegí a quién —</option>
                {vendedores.map((v) => (<option key={v.id} value={v.id}>{v.nombre}</option>))}
              </select>
              <textarea value={notaAsistencia} onChange={(e) => setNotaAsistencia(e.target.value)} rows={2} placeholder="Nota (opcional)" className={inputClass} />
              <div className="flex justify-end gap-2"><button onClick={() => setShowAsistenciaModal(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-500">Cancelar</button><button onClick={pedirAsistencia} disabled={guardandoAsistencia} className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold disabled:opacity-50">Pedir ayuda</button></div>
            </div>
          </div>
        )}

        {showCierreModal && (
          <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4" onClick={() => setShowCierreModal(false)}>
            <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-5 w-full max-w-sm space-y-3">
              <h3 className="font-bold text-sm">¿Por qué se pierde este lead?</h3>
              <select value={motivoCierreId} onChange={(e) => setMotivoCierreId(e.target.value)} className={inputClass}>
                <option value="">Seleccionar motivo...</option>
                {motivos.map((m) => (<option key={m.id} value={m.id}>{m.nombre}</option>))}
              </select>
              <div className="flex gap-2"><input value={nuevoMotivoNombre} onChange={(e) => setNuevoMotivoNombre(e.target.value)} placeholder="Nuevo motivo..." className={inputClass} /><button onClick={crearMotivo} disabled={creandoMotivo} className="shrink-0 px-3 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-bold">+</button></div>
              <div className="flex justify-end gap-2"><button onClick={() => setShowCierreModal(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-500">Cancelar</button><button onClick={confirmarCierre} disabled={guardandoEstado} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"><Ban className="w-3.5 h-3.5" /> Confirmar cierre</button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
