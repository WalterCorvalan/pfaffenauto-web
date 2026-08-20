"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { notificarPersona } from "@/lib/notificaciones";
import { CHECKLIST_PERITAJE } from "@/lib/peritajeChecklist";
import {
  ArrowLeft, User, Phone, CarFront, Calendar, Plus, X,
  CheckCircle2, Circle, FileText, Ban, Trophy, Clock, AlertTriangle,
  MapPin, StickyNote, Radio, Car, LifeBuoy, History, Edit2, Check,
  Flame, Snowflake, Minus, Receipt, Wallet, Printer, Paperclip, ClipboardCheck,
} from "lucide-react";

const ESTADOS = ["Nuevo", "Contactado", "Interesado", "Cliente", "Perdido"];
const ESTADO_COLOR: Record<string, string> = {
  Nuevo: "bg-amber-50 dark:bg-[#002a6e] text-amber-700 dark:text-amber-300 border-amber-200 dark:border-[#0a2a6b]",
  Contactado: "bg-amber-50 dark:bg-[#002a6e] text-amber-700 dark:text-amber-300 border-amber-200 dark:border-[#0a2a6b]",
  Interesado: "bg-amber-50 dark:bg-[#002a6e] text-amber-700 dark:text-amber-300 border-amber-200 dark:border-[#0a2a6b]",
  Cliente: "bg-emerald-50 dark:bg-[#002a6e] text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-[#0a2a6b]",
  Perdido: "bg-rose-50 dark:bg-[#002a6e] text-rose-700 dark:text-rose-300 border-rose-200 dark:border-[#0a2a6b]",
};

const TIPOS_TAREA = ["Llamar", "Enviar Email", "Enviar SMS", "Enviar WhatsApp", "Visitar al Cliente", "Cliente visita salón"];
const ESTADOS_TEST_DRIVE = ["Programado", "Realizado", "Cancelado"];

const CALIFICACIONES = [
  { value: "", label: "Sin calificar", icono: Minus, color: "text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#0a2a6b] bg-slate-50 dark:bg-[#00246b]" },
  { value: "caliente", label: "Caliente", icono: Flame, color: "text-rose-600 dark:text-rose-300 border-rose-200 dark:border-[#0a2a6b] bg-rose-50 dark:bg-[#002a6e]" },
  { value: "tibio", label: "Tibio", icono: Clock, color: "text-amber-600 dark:text-amber-300 border-amber-200 dark:border-[#0a2a6b] bg-amber-50 dark:bg-[#002a6e]" },
  { value: "frio", label: "Frío", icono: Snowflake, color: "text-sky-600 dark:text-sky-300 border-sky-200 dark:border-[#0a2a6b] bg-sky-50 dark:bg-[#002a6e]" },
];

const inputClass = "w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] transition-colors text-slate-900 dark:text-white";

export default function LeadDetailClient({
  lead, vendedores, vehiculosStock, motivosCierre, tareasIniciales, testDrivesIniciales, eventos, usuarioActual,
  presupuestos, senas, boletos, peritajes,
}: {
  lead: any; vendedores: any[]; vehiculosStock: any[]; motivosCierre: any[]; tareasIniciales: any[];
  testDrivesIniciales: any[]; eventos: any[]; usuarioActual: { id?: string; rol?: string };
  presupuestos: any[]; senas: any[]; boletos: any[]; peritajes: any[];
}) {
  const router = useRouter();
  const [creandoPeritaje, setCreandoPeritaje] = useState(false);

  const iniciarPeritaje = async () => {
    setCreandoPeritaje(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: peritaje, error } = await supabase
        .from("peritajes")
        .insert({ cotizacion_id: lead.id, vehiculo_id: lead.vehiculo_id || null, realizado_por: user?.id || null })
        .select("id")
        .single();
      if (error) throw error;

      const items = CHECKLIST_PERITAJE.flatMap((grupo) =>
        grupo.items.map((item, i) => ({ peritaje_id: peritaje.id, categoria: grupo.categoria, item, orden: i }))
      );
      const { error: errorItems } = await supabase.from("peritaje_items").insert(items);
      if (errorItems) throw errorItems;

      router.push(`/panel/peritajes/${peritaje.id}`);
    } catch (err) {
      alert("No se pudo iniciar el peritaje.");
      setCreandoPeritaje(false);
    }
  };
  // Agrupamos por sucursal preferida del lead para que el encargado encuentre
  // rápido al vendedor correcto (mismo patrón que VendedorEditor de stock).
  const vendedoresSucursal = vendedores.filter((v: any) => v.sucursales?.nombre === lead.sucursal_preferida);
  const vendedoresOtros = vendedores.filter((v: any) => v.sucursales?.nombre !== lead.sucursal_preferida);

  const puedeEditar =
    usuarioActual?.rol === "admin" ||
    usuarioActual?.rol === "encargado" ||
    !lead.vendedor_id ||
    lead.vendedor_id === usuarioActual?.id;
  const [guardandoVendedor, setGuardandoVendedor] = useState(false);
  const [guardandoVehiculo, setGuardandoVehiculo] = useState(false);
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [guardandoCalificacion, setGuardandoCalificacion] = useState(false);
  const [tareaACompletar, setTareaACompletar] = useState<any | null>(null);
  const [resultadoTarea, setResultadoTarea] = useState("");
  const [guardandoResultado, setGuardandoResultado] = useState(false);
  const [tareas, setTareas] = useState(tareasIniciales);
  const [showTareaModal, setShowTareaModal] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [motivoCierreId, setMotivoCierreId] = useState("");
  const [motivos, setMotivos] = useState(motivosCierre);
  const [nuevoMotivoNombre, setNuevoMotivoNombre] = useState("");
  const [creandoMotivo, setCreandoMotivo] = useState(false);

  const [tipoTarea, setTipoTarea] = useState(TIPOS_TAREA[0]);
  const [tituloTarea, setTituloTarea] = useState("");
  const [fechaTarea, setFechaTarea] = useState("");
  const [guardandoTarea, setGuardandoTarea] = useState(false);

  const [editandoDomicilio, setEditandoDomicilio] = useState(false);
  const [domicilio, setDomicilio] = useState(lead.domicilio || "");
  const [editandoNotas, setEditandoNotas] = useState(false);
  const [notas, setNotas] = useState(lead.notas || "");

  const [testDrives, setTestDrives] = useState(testDrivesIniciales);
  const [showTestDriveModal, setShowTestDriveModal] = useState(false);
  const [fechaTestDrive, setFechaTestDrive] = useState("");
  const [vehiculoTestDriveId, setVehiculoTestDriveId] = useState(lead.vehiculo_id || "");
  const [guardandoTestDrive, setGuardandoTestDrive] = useState(false);

  const [showAsistenciaModal, setShowAsistenciaModal] = useState(false);
  const [notaAsistencia, setNotaAsistencia] = useState("");
  const [asistenciaParaId, setAsistenciaParaId] = useState("");
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false);

  const numeroLimpio = String(lead.telefono || "").replace(/\D/g, "");
  const linkWhatsApp = numeroLimpio
    ? `https://wa.me/549${numeroLimpio}?text=${encodeURIComponent(`¡Hola ${lead.nombre}! Te escribimos de Pfaffen Autos por tu consulta.`)}`
    : null;

  const registrarEvento = async (tipo: string, descripcion: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("eventos_lead").insert({ cotizacion_id: lead.id, tipo, descripcion, creado_por: user?.id });
  };

  const cambiarEstado = async (nuevo: string) => {
    if (nuevo === "Perdido") {
      setShowCierreModal(true);
      return;
    }
    setGuardandoEstado(true);
    await supabase.from("cotizaciones").update({ estado: nuevo }).eq("id", lead.id);
    await registrarEvento("estado", `Estado cambiado a "${nuevo}"`);
    setGuardandoEstado(false);
    router.refresh();
  };

  const cerrarComoVenta = async () => {
    setGuardandoEstado(true);
    await supabase.from("cotizaciones").update({ estado: "Cliente" }).eq("id", lead.id);
    await registrarEvento("cierre", "Cerrado como venta generada");
    setGuardandoEstado(false);
    setShowCierreModal(false);
    router.refresh();
  };

  const cerrarComoDesistido = async () => {
    if (!motivoCierreId) return alert("Elegí un motivo.");
    setGuardandoEstado(true);
    await supabase.from("cotizaciones").update({ estado: "Perdido", motivo_cierre_id: motivoCierreId }).eq("id", lead.id);
    const nombreMotivo = motivos.find((m) => m.id === motivoCierreId)?.nombre || "";
    await registrarEvento("cierre", `Cerrado como desistido — ${nombreMotivo}`);
    setGuardandoEstado(false);
    setShowCierreModal(false);
    router.refresh();
  };

  const cambiarCalificacion = async (nueva: string) => {
    setGuardandoCalificacion(true);
    await supabase.from("cotizaciones").update({ calificacion: nueva || null }).eq("id", lead.id);
    const label = CALIFICACIONES.find((c) => c.value === nueva)?.label || "Sin calificar";
    await registrarEvento("calificacion", `Grado de interés cambiado a "${label}"`);
    setGuardandoCalificacion(false);
    router.refresh();
  };

  const cambiarVendedor = async (vendedorId: string) => {
    setGuardandoVendedor(true);
    await supabase.from("cotizaciones").update({ vendedor_id: vendedorId || null }).eq("id", lead.id);
    const nombreVendedor = vendedores.find((v) => v.id === vendedorId)?.nombre;
    await registrarEvento("asignacion", vendedorId ? `Reasignado a ${nombreVendedor}` : "Vendedor removido");
    setGuardandoVendedor(false);
    router.refresh();
  };

  const cambiarVehiculo = async (vehiculoId: string) => {
    setGuardandoVehiculo(true);
    await supabase.from("cotizaciones").update({ vehiculo_id: vehiculoId || null }).eq("id", lead.id);
    const v = vehiculosStock.find((x) => x.id === vehiculoId);
    await registrarEvento("vehiculo", vehiculoId ? `Vinculado a ${v?.marca} ${v?.modelo}` : "Vehículo desvinculado");
    setGuardandoVehiculo(false);
    router.refresh();
  };

  const guardarDomicilio = async () => {
    await supabase.from("cotizaciones").update({ domicilio }).eq("id", lead.id);
    setEditandoDomicilio(false);
    router.refresh();
  };

  const guardarNotas = async () => {
    await supabase.from("cotizaciones").update({ notas }).eq("id", lead.id);
    setEditandoNotas(false);
    router.refresh();
  };

  const agendarTestDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaTestDrive) return alert("Elegí fecha y hora.");
    setGuardandoTestDrive(true);
    try {
      const { data, error } = await supabase.from("test_drives").insert({
        cotizacion_id: lead.id,
        vehiculo_id: vehiculoTestDriveId || null,
        fecha_hora: new Date(fechaTestDrive).toISOString(),
      }).select("*").single();
      if (error) throw error;
      setTestDrives((prev) => [data, ...prev]);
      await registrarEvento("test_drive", "Test drive agendado");
      router.refresh();
      setShowTestDriveModal(false);
      setFechaTestDrive("");
    } catch (err) {
      console.error(err);
      alert("Error al agendar el test drive.");
    } finally {
      setGuardandoTestDrive(false);
    }
  };

  const cambiarEstadoTestDrive = async (td: any, nuevo: string) => {
    setTestDrives((prev) => prev.map((t) => (t.id === td.id ? { ...t, estado: nuevo } : t)));
    await supabase.from("test_drives").update({ estado: nuevo }).eq("id", td.id);
    await registrarEvento("test_drive", `Test drive marcado como "${nuevo}"`);
    router.refresh();
  };

  const pedirAsistencia = async () => {
    if (!asistenciaParaId) return alert("Elegí a quién pedirle ayuda.");
    setGuardandoAsistencia(true);
    await supabase.from("cotizaciones").update({
      asistencia_solicitada: true,
      asistencia_nota: notaAsistencia || null,
      asistencia_para: asistenciaParaId,
      asistencia_atendida: false,
    }).eq("id", lead.id);
    const nombreDestinatario = vendedores.find((v) => v.id === asistenciaParaId)?.nombre;
    await registrarEvento("asistencia", `Asistencia pedida a ${nombreDestinatario}` + (notaAsistencia ? `: ${notaAsistencia}` : ""));
    notificarPersona(
      supabase,
      asistenciaParaId,
      "asistencia_pedida",
      `Te pidieron asistencia en el lead de ${lead.nombre}` + (notaAsistencia ? `: ${notaAsistencia}` : ""),
      `/panel/crm/${lead.id}`,
      "crm"
    ).catch((err) => console.error("[crm] error notificando asistencia:", err));
    setGuardandoAsistencia(false);
    setShowAsistenciaModal(false);
    router.refresh();
  };

  const crearMotivo = async () => {
    if (!nuevoMotivoNombre.trim()) return;
    setCreandoMotivo(true);
    try {
      const { data, error } = await supabase.from("motivos_cierre").insert({ nombre: nuevoMotivoNombre.trim() }).select("*").single();
      if (error) throw error;
      setMotivos((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setMotivoCierreId(data.id);
      setNuevoMotivoNombre("");
    } catch (err) {
      console.error(err);
      alert("Error al crear el motivo.");
    } finally {
      setCreandoMotivo(false);
    }
  };

  const marcarAsistenciaAtendida = async () => {
    await supabase.from("cotizaciones").update({ asistencia_atendida: true }).eq("id", lead.id);
    await registrarEvento("asistencia", "Asistencia atendida");
    router.refresh();
  };

  const vehiculosSugeridos = useMemo(() => {
    if (!lead.marca) return vehiculosStock;
    const marcaLower = String(lead.marca).toLowerCase();
    const sugeridos = vehiculosStock.filter((v: any) => v.marca?.toLowerCase() === marcaLower);
    const resto = vehiculosStock.filter((v: any) => v.marca?.toLowerCase() !== marcaLower);
    return [...sugeridos, ...resto];
  }, [vehiculosStock, lead.marca]);

  const crearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaTarea) return alert("Elegí fecha y hora.");
    setGuardandoTarea(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("tareas_lead").insert({
        cotizacion_id: lead.id,
        tipo: tipoTarea,
        titulo: tituloTarea || null,
        fecha_vencimiento: new Date(fechaTarea).toISOString(),
        creado_por: user?.id,
      }).select("*").single();
      if (error) throw error;
      setTareas((prev) => [...prev, data].sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime()));
      await registrarEvento("tarea", `Tarea creada: ${tipoTarea}`);
      router.refresh();
      setShowTareaModal(false);
      setTituloTarea("");
      setFechaTarea("");
    } catch (err) {
      console.error(err);
      alert("Error al crear la tarea.");
    } finally {
      setGuardandoTarea(false);
    }
  };

  const toggleCompletada = async (tarea: any) => {
    if (!tarea.completada) {
      // Al completar pedimos resultado; al descompletar no hace falta.
      setTareaACompletar(tarea);
      setResultadoTarea("");
      return;
    }
    setTareas((prev) => prev.map((t) => (t.id === tarea.id ? { ...t, completada: false } : t)));
    await supabase.from("tareas_lead").update({ completada: false }).eq("id", tarea.id);
  };

  const confirmarCompletarTarea = async () => {
    if (!tareaACompletar) return;
    setGuardandoResultado(true);
    setTareas((prev) => prev.map((t) => (t.id === tareaACompletar.id ? { ...t, completada: true, resultado: resultadoTarea || null } : t)));
    await supabase.from("tareas_lead").update({ completada: true, resultado: resultadoTarea || null }).eq("id", tareaACompletar.id);
    await registrarEvento("tarea", `Tarea completada: ${tareaACompletar.tipo}` + (resultadoTarea ? ` — ${resultadoTarea}` : ""));
    setGuardandoResultado(false);
    setTareaACompletar(null);
    router.refresh();
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

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#F9FAFB] dark:bg-[#001233] pb-20">
      <div className="max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <Link href="/panel/crm" className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300 flex items-center gap-2 text-sm transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Volver al pipeline
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{lead.nombre}</h1>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{lead.tipo_peritaje === "online" ? "Cotización web" : lead.tipo_peritaje}</p>
            </div>
            <select
              value={lead.estado || "Nuevo"}
              disabled={guardandoEstado || !puedeEditar}
              onChange={(e) => cambiarEstado(e.target.value)}
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer disabled:opacity-50 shrink-0 ${ESTADO_COLOR[lead.estado] || ESTADO_COLOR.Nuevo}`}
            >
              {ESTADOS.map((e) => (<option key={e} value={e}>{e}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-4 text-[13px] text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {lead.telefono || "Sin teléfono"}</span>
            {linkWhatsApp && (
              <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-300 font-bold text-[12px] hover:underline">WhatsApp</a>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mr-1">Grado de interés:</span>
            {CALIFICACIONES.map((c) => {
              const Icono = c.icono;
              const activo = (lead.calificacion || "") === c.value;
              return (
                <button
                  key={c.value || "sin"}
                  onClick={() => puedeEditar && cambiarCalificacion(c.value)}
                  disabled={guardandoCalificacion || !puedeEditar}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 ${
                    activo ? c.color + " ring-1 ring-current" : "text-slate-400 dark:text-slate-500 border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#001c55] hover:bg-slate-50 dark:hover:bg-[#00246b]"
                  }`}
                >
                  <Icono className="w-3 h-3" /> {c.label}
                </button>
              );
            })}
          </div>

          {lead.motivo_cierre_id && lead.estado === "Perdido" && (
            <p className="text-[11px] text-rose-600 dark:text-rose-300 font-bold mt-2 bg-rose-50 dark:bg-[#002a6e] border border-rose-200 dark:border-[#0a2a6b] rounded-lg px-2.5 py-1.5 w-fit">
              Motivo: {motivos.find((m) => m.id === lead.motivo_cierre_id)?.nombre || lead.motivo_cierre_id}
            </p>
          )}
        </div>

        {/* Solo lectura si el lead es de otro vendedor */}
        {!puedeEditar && (
          <div className="bg-slate-100 dark:bg-[#00246b] border border-slate-300 dark:border-[#0a2a6b] rounded-2xl p-3.5 text-center">
            <p className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
              Este lead está asignado a {lead.perfiles?.nombre || "otro vendedor"} — solo podés verlo, no editarlo.
            </p>
          </div>
        )}

        {/* Banner de asistencia */}
        {lead.asistencia_solicitada && !lead.asistencia_atendida && (
          <div className="bg-orange-500 border-2 border-orange-600 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-md shadow-orange-200 dark:shadow-none">
            <div className="flex items-start gap-3">
              <LifeBuoy className="w-6 h-6 text-white mt-0.5 shrink-0 animate-pulse" />
              <div>
                <p className="text-[13px] font-black text-white uppercase tracking-wide">
                  🆘 Asistencia solicitada{lead.asistencia_para ? ` a ${vendedores.find((v) => v.id === lead.asistencia_para)?.nombre || ""}` : ""}
                </p>
                {lead.asistencia_nota && <p className="text-[13px] text-white/95 mt-1 font-medium">{lead.asistencia_nota}</p>}
              </div>
            </div>
            <button onClick={marcarAsistenciaAtendida} className="shrink-0 text-[11px] font-bold text-orange-700 bg-white px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors">
              Marcar atendida
            </button>
          </div>
        )}
        {(!lead.asistencia_solicitada || lead.asistencia_atendida) && (
          <button
            onClick={() => setShowAsistenciaModal(true)}
            className="flex items-center justify-center gap-2 w-full bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#00246b] text-slate-600 dark:text-slate-300 font-bold py-2 rounded-xl text-[11px] uppercase tracking-widest transition-colors"
          >
            <LifeBuoy className="w-3.5 h-3.5" /> Pedir asistencia
          </button>
        )}

        {/* Vendedor (mobile) — en desktop se repite en el sidebar, acá se oculta */}
        <div className="lg:hidden bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Vendedor asignado
          </h2>
          <select
            defaultValue={lead.vendedor_id || ""}
            disabled={guardandoVendedor || !puedeEditar}
            onChange={(e) => cambiarVendedor(e.target.value)}
            className={`${inputClass} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin asignar</option>
            {[...vendedoresSucursal, ...vendedoresOtros].map((v: any) => (
              <option key={v.id} value={v.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">
                {v.nombre}{vendedoresOtros.includes(v) ? " (otra sucursal)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-5 lg:items-start space-y-5 lg:space-y-0">
        <div className="lg:col-span-2 space-y-5">
        {/* Vehículo vinculado */}
        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <CarFront className="w-3.5 h-3.5" /> Vehículo de interés
          </h2>
          {(lead.marca || lead.modelo) && !lead.vehiculo_id && (
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-2">Consultó por: <strong className="text-slate-700 dark:text-slate-200">{lead.marca} {lead.modelo} {lead.anio ? `(${lead.anio})` : ""}</strong> — vinculalo a uno del stock:</p>
          )}
          <select
            defaultValue={lead.vehiculo_id || ""}
            disabled={guardandoVehiculo || !puedeEditar}
            onChange={(e) => cambiarVehiculo(e.target.value)}
            className={`${inputClass} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin vincular</option>
            {vehiculosSugeridos.map((v: any) => (
              <option key={v.id} value={v.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{v.marca} {v.modelo} {v.patente ? `— ${v.patente}` : ""}</option>
            ))}
          </select>
        </div>

        {/* Prospecto */}
        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" /> Prospecto
          </h2>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Domicilio</span>
              {!editandoDomicilio && puedeEditar && (
                <button onClick={() => setEditandoDomicilio(true)} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300"><Edit2 className="w-3 h-3" /></button>
              )}
            </div>
            {editandoDomicilio ? (
              <div className="flex gap-2">
                <input autoFocus value={domicilio} onChange={(e) => setDomicilio(e.target.value)} placeholder="Calle, localidad..." className={inputClass} />
                <button onClick={guardarDomicilio} className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl"><Check className="w-4 h-4" /></button>
              </div>
            ) : (
              <p className="text-[13px] text-slate-700 dark:text-slate-200">{lead.domicilio || "Sin domicilio"}</p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1"><StickyNote className="w-3 h-3" /> Notas</span>
              {!editandoNotas && puedeEditar && (
                <button onClick={() => setEditandoNotas(true)} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300"><Edit2 className="w-3 h-3" /></button>
              )}
            </div>
            {editandoNotas ? (
              <div className="space-y-2">
                <textarea autoFocus rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} className={inputClass} />
                <button onClick={guardarNotas} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase tracking-widest py-2 rounded-xl">Guardar</button>
              </div>
            ) : (
              <p className="text-[13px] text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{lead.notas || "Sin notas"}</p>
            )}
          </div>
        </div>

        {/* Canal de ingreso */}
        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5" /> Canal de ingreso
          </h2>
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-[12px]">
            <Dato label="Canal de origen" valor={lead.canal_origen} />
            <Dato label="Tipo de peritaje" valor={lead.tipo_peritaje} />
            <Dato label="Sucursal preferida" valor={lead.sucursal_preferida} />
            <Dato label="Email" valor={lead.email} />
            <Dato label="¿Puede venir a sucursal?" valor={lead.puede_venir_sucursal === null ? undefined : (lead.puede_venir_sucursal ? "Sí" : "No")} />
            <Dato label="Teléfono verificado" valor={lead.telefono_verificado === null ? undefined : (lead.telefono_verificado ? "Sí" : "No")} />
          </div>
        </div>

        {/* Tareas de seguimiento */}
        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Tareas de seguimiento
            </h2>
            {puedeEditar && (
              <button onClick={() => setShowTareaModal(true)} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-sky-300 hover:text-indigo-700 dark:hover:text-sky-200">
                <Plus className="w-3.5 h-3.5" /> Nueva
              </button>
            )}
          </div>

          <TareasGrupo titulo="Vencidas" icono={<AlertTriangle className="w-3.5 h-3.5 text-rose-500" />} tareas={vencidas} onToggle={toggleCompletada} />
          <TareasGrupo titulo="Hoy" icono={<Clock className="w-3.5 h-3.5 text-amber-500" />} tareas={hoy} onToggle={toggleCompletada} />
          <TareasGrupo titulo="Próximas" icono={<Calendar className="w-3.5 h-3.5 text-slate-400" />} tareas={proximas} onToggle={toggleCompletada} />
          {vencidas.length === 0 && hoy.length === 0 && proximas.length === 0 && (
            <p className="text-[12px] text-slate-400 dark:text-slate-500 italic py-2">Sin tareas pendientes.</p>
          )}
        </div>

        {/* Historial comercial: presupuestos, señas, boleto y su documentación */}
        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Historial comercial
          </h2>

          {presupuestos.length === 0 && senas.length === 0 && boletos.length === 0 && (
            <p className="text-[12px] text-slate-400 dark:text-slate-500 italic">Todavía no se generó ningún presupuesto, seña ni venta para este lead.</p>
          )}

          {presupuestos.map((p: any) => (
            <RegistroComercial
              key={`p-${p.id}`}
              icono={<FileText className="w-4 h-4" />}
              titulo={`Presupuesto N° ${p.numero}`}
              fecha={p.fecha}
              monto={p.precio_venta_ars ? `$ ${Number(p.precio_venta_ars).toLocaleString("es-AR")}` : p.precio_venta_usd ? `US$ ${Number(p.precio_venta_usd).toLocaleString("es-AR")}` : null}
              href={`/panel/presupuestos/imprimir/${p.id}`}
            />
          ))}
          {senas.map((s: any) => (
            <RegistroComercial
              key={`s-${s.id}`}
              icono={<Wallet className="w-4 h-4" />}
              titulo={`Seña N° ${s.numero}`}
              fecha={s.fecha}
              estado={s.estado}
              monto={s.venta_ars ? `$ ${Number(s.venta_ars).toLocaleString("es-AR")}` : s.venta_usd ? `US$ ${Number(s.venta_usd).toLocaleString("es-AR")}` : null}
              href={`/panel/senas/imprimir/${s.id}`}
            />
          ))}
          {boletos.map((b: any) => (
            <RegistroComercial
              key={`b-${b.id}`}
              icono={<Receipt className="w-4 h-4" />}
              titulo={`Venta N° ${b.numero}`}
              fecha={b.fecha}
              monto={b.venta_ars ? `$ ${Number(b.venta_ars).toLocaleString("es-AR")}` : b.venta_usd ? `US$ ${Number(b.venta_usd).toLocaleString("es-AR")}` : null}
              href={`/panel/boletos/imprimir/${b.id}`}
              documentos={b.documentacion_ventas}
            />
          ))}

          {puedeEditar && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-[#0a2a6b]">
              <Link href={`/panel/presupuestos/nuevo?cotizacion_id=${lead.id}`} className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-[11px] uppercase tracking-widest transition-colors">
                <Plus className="w-3.5 h-3.5" /> Presupuesto
              </Link>
              <Link href={`/panel/senas/nuevo?cotizacion_id=${lead.id}`} className="flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-800 dark:bg-[#00246b] dark:hover:bg-[#002a6e] text-white font-bold py-2 rounded-xl text-[11px] uppercase tracking-widest transition-colors">
                <Plus className="w-3.5 h-3.5" /> Seña
              </Link>
              <Link href={`/panel/boletos/nuevo?cotizacion_id=${lead.id}`} className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[11px] uppercase tracking-widest transition-colors">
                <Plus className="w-3.5 h-3.5" /> Venta
              </Link>
            </div>
          )}
        </div>

        {/* Peritaje */}
        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ClipboardCheck className="w-3.5 h-3.5" /> Peritaje
            </h2>
            {puedeEditar && (
              <button
                onClick={iniciarPeritaje}
                disabled={creandoPeritaje}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-sky-300 hover:text-indigo-700 dark:hover:text-sky-200 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" /> {creandoPeritaje ? "Iniciando..." : "Iniciar peritaje"}
              </button>
            )}
          </div>
          {peritajes.length === 0 ? (
            <p className="text-[12px] text-slate-400 dark:text-slate-500 italic">Todavía no se hizo un peritaje de este vehículo.</p>
          ) : (
            <div className="space-y-2">
              {peritajes.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/panel/peritajes/${p.id}`}
                  className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] rounded-xl p-3 hover:border-indigo-300 dark:hover:border-sky-400/50 transition-colors"
                >
                  <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
                    {new Date(p.created_at).toLocaleDateString("es-AR")}
                  </span>
                  <span className="flex items-center gap-2 text-[11px] font-bold">
                    {p.puntaje !== null && p.puntaje !== undefined && (
                      <span className={p.puntaje >= 70 ? "text-emerald-600 dark:text-emerald-300" : p.puntaje >= 40 ? "text-amber-600 dark:text-amber-300" : "text-rose-600 dark:text-rose-300"}>
                        {p.puntaje}%
                      </span>
                    )}
                    <span className="text-slate-400 dark:text-slate-500 uppercase tracking-widest">{p.estado}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Test Drive */}
        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Car className="w-3.5 h-3.5" /> Test Drive
            </h2>
            {puedeEditar && (
              <button onClick={() => setShowTestDriveModal(true)} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-sky-300 hover:text-indigo-700 dark:hover:text-sky-200">
                <Plus className="w-3.5 h-3.5" /> Agendar
              </button>
            )}
          </div>
          {testDrives.length === 0 ? (
            <p className="text-[12px] text-slate-400 dark:text-slate-500 italic py-2">Sin test drives agendados.</p>
          ) : (
            <div className="space-y-1.5">
              {testDrives.map((td: any) => {
                const v = vehiculosStock.find((x) => x.id === td.vehiculo_id);
                return (
                  <div key={td.id} className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] rounded-lg px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-slate-800 dark:text-white">{v ? `${v.marca} ${v.modelo}` : "Sin auto"}</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(td.fecha_hora).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <select
                      value={td.estado}
                      onChange={(e) => cambiarEstadoTestDrive(td, e.target.value)}
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border outline-none cursor-pointer bg-white dark:bg-[#001c55] border-slate-200 dark:border-[#0a2a6b] text-slate-600 dark:text-slate-300 shrink-0"
                    >
                      {ESTADOS_TEST_DRIVE.map((e) => (<option key={e} value={e}>{e}</option>))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        </div>

        <div className="lg:col-span-1 space-y-5">
        {/* Vendedor (desktop) */}
        <div className="hidden lg:block bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Vendedor asignado
          </h2>
          <select
            defaultValue={lead.vendedor_id || ""}
            disabled={guardandoVendedor || !puedeEditar}
            onChange={(e) => cambiarVendedor(e.target.value)}
            className={`${inputClass} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin asignar</option>
            {[...vendedoresSucursal, ...vendedoresOtros].map((v: any) => (
              <option key={v.id} value={v.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">
                {v.nombre}{vendedoresOtros.includes(v) ? " (otra sucursal)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Eventos */}
        <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5 shadow-sm">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <History className="w-3.5 h-3.5" /> Eventos
          </h2>
          <div className="space-y-2.5">
            {eventos.map((ev: any) => (
              <div key={ev.id} className="text-[12px] border-l-2 border-slate-200 dark:border-[#0a2a6b] pl-3">
                <p className="text-slate-700 dark:text-slate-200 font-medium">{ev.descripcion}</p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {new Date(ev.created_at).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {ev.perfiles?.nombre ? ` · ${ev.perfiles.nombre}` : ""}
                </span>
              </div>
            ))}
            <div className="text-[12px] border-l-2 border-slate-200 dark:border-[#0a2a6b] pl-3">
              <p className="text-slate-700 dark:text-slate-200 font-medium">Lead creado{lead.canal_origen ? ` — ${lead.canal_origen}` : ""}</p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {new Date(lead.created_at).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>

        {/* Cerrar */}
        {lead.estado !== "Perdido" && lead.estado !== "Cliente" && puedeEditar && (
          <button
            onClick={() => setShowCierreModal(true)}
            className="flex items-center justify-center gap-2 w-full bg-white dark:bg-[#001c55] border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-[#002a6e] text-rose-600 dark:text-rose-300 font-bold py-2.5 rounded-xl text-[12px] uppercase tracking-widest transition-colors"
          >
            <Ban className="w-4 h-4" /> Cerrar lead
          </button>
        )}
        </div>
        </div>
      </div>

      {/* Modal nueva tarea */}
      {showTareaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !guardandoTarea && setShowTareaModal(false)}></div>
          <div className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nueva tarea</h3>
              <button onClick={() => setShowTareaModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={crearTarea} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Tipo</label>
                <select value={tipoTarea} onChange={(e) => setTipoTarea(e.target.value)} className={inputClass}>
                  {TIPOS_TAREA.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Fecha y hora *</label>
                <input required type="datetime-local" value={fechaTarea} onChange={(e) => setFechaTarea(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Título (opcional)</label>
                <input value={tituloTarea} onChange={(e) => setTituloTarea(e.target.value)} placeholder="Ej: Confirmar interés en el Corolla" className={inputClass} />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowTareaModal(false)} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-white dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#002a6e] text-slate-600 dark:text-slate-300 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={guardandoTarea} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  {guardandoTarea ? "Guardando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal cerrar lead */}
      {showCierreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !guardandoEstado && setShowCierreModal(false)}></div>
          <div className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cerrar lead</h3>
              <button onClick={() => setShowCierreModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={cerrarComoVenta}
              disabled={guardandoEstado}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-[12px] uppercase tracking-widest mb-4 disabled:opacity-50"
            >
              <Trophy className="w-4 h-4" /> Venta generada
            </button>
            <div className="border-t border-slate-100 dark:border-[#0a2a6b] pt-4">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Desistido — Motivo *</label>
              <select value={motivoCierreId} onChange={(e) => setMotivoCierreId(e.target.value)} className={inputClass}>
                <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar motivo...</option>
                {motivos.map((m) => (<option key={m.id} value={m.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{m.nombre}</option>))}
              </select>
              <div className="flex gap-2 mt-2">
                <input
                  value={nuevoMotivoNombre}
                  onChange={(e) => setNuevoMotivoNombre(e.target.value)}
                  placeholder="+ Nuevo motivo..."
                  className="flex-1 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-3 py-2 text-[12px] outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#002a6e] text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={crearMotivo}
                  disabled={creandoMotivo || !nuevoMotivoNombre.trim()}
                  className="shrink-0 text-[11px] font-bold text-indigo-600 dark:text-sky-300 hover:text-indigo-700 dark:hover:text-sky-200 bg-indigo-50 dark:bg-[#002a6e] hover:bg-indigo-100 dark:hover:bg-[#00246b] px-3 rounded-lg disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
              <button
                onClick={cerrarComoDesistido}
                disabled={guardandoEstado}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-white dark:bg-[#001c55] border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-[#002a6e] text-rose-600 dark:text-rose-300 font-bold py-2.5 rounded-xl text-[12px] uppercase tracking-widest disabled:opacity-50"
              >
                <Ban className="w-4 h-4" /> Desistir
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal agendar test drive */}
      {showTestDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !guardandoTestDrive && setShowTestDriveModal(false)}></div>
          <div className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Agendar Test Drive</h3>
              <button onClick={() => setShowTestDriveModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={agendarTestDrive} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Vehículo</label>
                <select value={vehiculoTestDriveId} onChange={(e) => setVehiculoTestDriveId(e.target.value)} className={inputClass}>
                  <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin especificar</option>
                  {vehiculosStock.map((v: any) => (<option key={v.id} value={v.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{v.marca} {v.modelo} {v.patente ? `— ${v.patente}` : ""}</option>))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Fecha y hora *</label>
                <input required type="datetime-local" value={fechaTestDrive} onChange={(e) => setFechaTestDrive(e.target.value)} className={inputClass} />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowTestDriveModal(false)} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-white dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#002a6e] text-slate-600 dark:text-slate-300 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={guardandoTestDrive} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  {guardandoTestDrive ? "Guardando..." : "Agendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal resultado de la tarea */}
      {tareaACompletar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !guardandoResultado && setTareaACompletar(null)}></div>
          <div className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Completar tarea</h3>
              <button onClick={() => setTareaACompletar(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-3">{tareaACompletar.tipo}{tareaACompletar.titulo ? ` — ${tareaACompletar.titulo}` : ""}</p>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Resultado (opcional)</label>
            <textarea autoFocus rows={3} value={resultadoTarea} onChange={(e) => setResultadoTarea(e.target.value)} placeholder="¿Qué pasó? Ej: no atendió, pidió que lo llamen mañana..." className={inputClass} />
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={() => setTareaACompletar(null)} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-white dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#002a6e] text-slate-600 dark:text-slate-300 rounded-xl transition-colors">Cancelar</button>
              <button onClick={confirmarCompletarTarea} disabled={guardandoResultado} className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50">
                {guardandoResultado ? "Guardando..." : "Completar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pedir asistencia */}
      {showAsistenciaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !guardandoAsistencia && setShowAsistenciaModal(false)}></div>
          <div className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 dark:border-[#0a2a6b] pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pedir asistencia</h3>
              <button onClick={() => setShowAsistenciaModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Pedirle ayuda a *</label>
            <select value={asistenciaParaId} onChange={(e) => setAsistenciaParaId(e.target.value)} className={inputClass}>
              <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Seleccionar persona...</option>
              {vendedores.map((v) => (<option key={v.id} value={v.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{v.nombre}</option>))}
            </select>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block mt-4">Nota (opcional)</label>
            <textarea rows={3} value={notaAsistencia} onChange={(e) => setNotaAsistencia(e.target.value)} placeholder="Contale qué necesitás..." className={inputClass} />
            <button
              onClick={pedirAsistencia}
              disabled={guardandoAsistencia}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-[12px] uppercase tracking-widest disabled:opacity-50"
            >
              <LifeBuoy className="w-4 h-4" /> {guardandoAsistencia ? "Enviando..." : "Solicitar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RegistroComercial({
  icono, titulo, fecha, monto, estado, href, documentos,
}: {
  icono: React.ReactNode; titulo: string; fecha: string; monto?: string | null; estado?: string; href: string; documentos?: { id: string; tipo_documento: string; estado: string | null }[];
}) {
  return (
    <div className="bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] rounded-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-indigo-600 dark:text-sky-300 shrink-0">{icono}</span>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate">{titulo}</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {new Date(`${fecha}T12:00:00Z`).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}
              {estado ? ` · ${estado}` : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {monto && <span className="text-[12px] font-black text-slate-700 dark:text-slate-200">{monto}</span>}
          <Link href={href} target="_blank" className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-sky-300" title="Imprimir">
            <Printer className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
      {documentos && documentos.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-[#0a2a6b] flex flex-wrap gap-1.5">
          {documentos.map((d) => (
            <span key={d.id} className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-400">
              <Paperclip className="w-2.5 h-2.5" /> {d.tipo_documento} {d.estado ? `(${d.estado})` : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block">{label}</span>
      <span className="text-slate-700 dark:text-slate-200 font-medium">{valor || "—"}</span>
    </div>
  );
}

function TareasGrupo({ titulo, icono, tareas, onToggle }: { titulo: string; icono: React.ReactNode; tareas: any[]; onToggle: (t: any) => void }) {
  if (tareas.length === 0) return null;
  return (
    <div className="mb-3 last:mb-0">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-1.5">
        {icono} {titulo} ({tareas.length})
      </h3>
      <div className="space-y-1.5">
        {tareas.map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 bg-slate-50 dark:bg-[#00246b] border border-slate-100 dark:border-[#0a2a6b] rounded-lg px-3 py-2">
            <button onClick={() => onToggle(t)} className="shrink-0">
              {t.completada ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /> : <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={`text-[12px] font-bold ${t.completada ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-800 dark:text-white"}`}>
                {t.tipo}{t.titulo ? ` — ${t.titulo}` : ""}
              </p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {new Date(t.fecha_vencimiento).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
              {t.resultado && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">"{t.resultado}"</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
