"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import {
  Search, Send, CheckCircle2, Circle, Bot, Check, Info, ChevronRight, PanelRight,
  Loader2, Megaphone, X, MessageSquareText, AtSign,
} from "lucide-react";

const ETAPAS_PIPELINE: { value: string; label: string }[] = [
  { value: "sin_contactar", label: "Sin contactar" },
  { value: "contactado", label: "Contactado" },
  { value: "visita", label: "Visita" },
  { value: "negociacion", label: "Negociación" },
  { value: "cerrado", label: "Cerrado" },
  { value: "perdido", label: "Perdido" },
];

export default function ChatClient({
  conversacionesIniciales,
  conversacionesInstagramIniciales = [],
  vendedores = [],
}: {
  conversacionesIniciales: any[];
  conversacionesInstagramIniciales?: any[];
  vendedores?: { id: string; nombre: string }[];
}) {
  const [canal, setCanal] = useState<"whatsapp" | "instagram">("whatsapp");
  const esIG = canal === "instagram";
  const [conversacionesWA, setConversacionesWA] = useState(conversacionesIniciales);
  const [conversacionesIG, setConversacionesIG] = useState(conversacionesInstagramIniciales);
  const conversaciones = canal === "whatsapp" ? conversacionesWA : conversacionesIG;
  const setConversaciones = canal === "whatsapp" ? setConversacionesWA : setConversacionesIG;
  const tablaConversaciones = canal === "whatsapp" ? "whatsapp_conversaciones" : "instagram_conversaciones";
  const tablaMensajes = canal === "whatsapp" ? "whatsapp_mensajes" : "instagram_mensajes";
  const endpointEnviar = canal === "whatsapp" ? "/api/panel-v2/whatsapp/enviar" : "/api/panel-v2/instagram/enviar";
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "no-leidas">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarPlantillas, setMostrarPlantillas] = useState(false);
  const [plantillas, setPlantillas] = useState<any[]>([]);

  const [creandoClienteManual, setCreandoClienteManual] = useState(false);
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: "", telefono: "", email: "", dni_cuit: "" });

  const [panelAbierto, setPanelAbierto] = useState(true);
  const [etapaActual, setEtapaActual] = useState("sin_contactar");
  const [notasLocales, setNotasLocales] = useState("");
  const [guardandoNotas, setGuardandoNotas] = useState(false);

  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => { setConversacionesWA(conversacionesIniciales); }, [conversacionesIniciales]);
  useEffect(() => { setConversacionesIG(conversacionesInstagramIniciales); }, [conversacionesInstagramIniciales]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const refrescarConDebounce = () => { clearTimeout(timeoutId); timeoutId = setTimeout(() => router.refresh(), 400); };
    const canalBandeja = supabase2
      .channel(`bandeja-chat-v2-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_conversaciones" }, refrescarConDebounce)
      .on("postgres_changes", { event: "*", schema: "public", table: "instagram_conversaciones" }, refrescarConDebounce)
      .subscribe();
    return () => { clearTimeout(timeoutId); supabase2.removeChannel(canalBandeja); };
  }, [router]);

  useEffect(() => {
    const conversacionParam = searchParams.get("conversacion");
    const canalParam = searchParams.get("canal");
    if (canalParam === "instagram" || canalParam === "whatsapp") setCanal(canalParam);
    if (conversacionParam) setSeleccionada(conversacionParam);
  }, [searchParams]);

  useEffect(() => { mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes]);

  useEffect(() => {
    if (!seleccionada) return;
    setLoading(true);

    supabase2.from(tablaMensajes).select("*").eq("conversacion_id", seleccionada).order("created_at", { ascending: true }).then(({ data }) => {
      setMensajes(data || []);
      setLoading(false);
    });

    supabase2.from(tablaConversaciones).select("estado_pipeline, notas, unread_count").eq("id", seleccionada).single().then(({ data }) => {
      if (data) {
        setEtapaActual(data.estado_pipeline || "sin_contactar");
        setNotasLocales(data.notas || "");
        // Al entrar a la charla se marca leída sola (promesa del manual).
        if (data.unread_count > 0) {
          supabase2.from(tablaConversaciones).update({ unread_count: 0 }).eq("id", seleccionada).then(() => {
            setConversaciones((prev) => prev.map((c) => (c.id === seleccionada ? { ...c, unread_count: 0 } : c)));
          });
        }
      }
    });

    const canalRealtime = supabase2
      .channel(`${tablaMensajes}:${seleccionada}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: tablaMensajes, filter: `conversacion_id=eq.${seleccionada}` }, (payload) => {
        const nuevo = payload.new as any;
        setMensajes((prev) => {
          if (prev.some((m) => m.id === nuevo.id)) return prev;
          const sinEcoLocal = prev.filter((m) => !(m.direccion === "out" && m.texto === nuevo.texto && m.status === "pending" && m.id !== nuevo.id));
          return [...sinEcoLocal, nuevo];
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: tablaMensajes, filter: `conversacion_id=eq.${seleccionada}` }, (payload) => {
        const actualizado = payload.new as any;
        setMensajes((prev) => prev.map((m) => (m.id === actualizado.id ? actualizado : m)));
      })
      .subscribe();

    return () => { supabase2.removeChannel(canalRealtime); };
  }, [seleccionada, tablaMensajes, tablaConversaciones]);

  useEffect(() => {
    supabase2.from("whatsapp_plantillas").select("*").eq("activa", true).order("sector").then(({ data }) => setPlantillas(data || []));
  }, []);

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !seleccionada) return;

    const texto = nuevoMensaje.trim();
    setNuevoMensaje("");

    const tempId = crypto.randomUUID();
    const tempMsg = { id: tempId, conversacion_id: seleccionada, direccion: "out", tipo: "text", texto, status: "pending", ai_generado: false, created_at: new Date().toISOString() };
    setMensajes((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch(endpointEnviar, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversacionId: seleccionada, texto }) });
      const data = await res.json();
      if (!res.ok) {
        console.error("Error al enviar", data.error);
        setMensajes((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)));
      } else {
        // Responder a mano toma la charla: refleja acá lo que el endpoint ya
        // hizo en la base (pausar la IA + pasar a "Contactado" si estaba
        // "Sin contactar"), sin esperar al round-trip de realtime.
        setConversaciones((prev) => prev.map((c) => (c.id === seleccionada
          ? { ...c, ai_habilitada: false, estado_pipeline: !c.estado_pipeline || c.estado_pipeline === "sin_contactar" ? "contactado" : c.estado_pipeline }
          : c)));
        setEtapaActual((prev) => (!prev || prev === "sin_contactar" ? "contactado" : prev));
      }
    } catch (err) {
      console.error("Error al enviar", err);
      setMensajes((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)));
    }
  };

  const insertarPlantilla = (texto: string) => {
    setNuevoMensaje((prev) => (prev ? `${prev} ${texto}` : texto));
    setMostrarPlantillas(false);
  };

  const cambiarEtapa = async (nuevaEtapa: string) => {
    if (!seleccionada || nuevaEtapa === etapaActual) return;
    setEtapaActual(nuevaEtapa);
    await supabase2.from(tablaConversaciones).update({ estado_pipeline: nuevaEtapa }).eq("id", seleccionada);
  };

  const guardarNotas = async () => {
    if (!seleccionada) return;
    setGuardandoNotas(true);
    try {
      await supabase2.from(tablaConversaciones).update({ notas: notasLocales }).eq("id", seleccionada);
    } finally {
      setGuardandoNotas(false);
    }
  };

  const conversacionActiva = conversaciones.find((c) => c.id === seleccionada);

  const toggleIA = async () => {
    if (!conversacionActiva) return;
    const nuevoValor = !conversacionActiva.ai_habilitada;
    setConversaciones((prev) => prev.map((c) => (c.id === conversacionActiva.id ? { ...c, ai_habilitada: nuevoValor } : c)));
    const { error } = await supabase2.from(tablaConversaciones).update({ ai_habilitada: nuevoValor }).eq("id", conversacionActiva.id);
    if (error) setConversaciones((prev) => prev.map((c) => (c.id === conversacionActiva.id ? { ...c, ai_habilitada: !nuevoValor } : c)));
  };

  const contactoActivoRaw = canal === "whatsapp" ? conversacionActiva?.whatsapp_contactos : conversacionActiva?.instagram_contactos;
  const contactoActivo = contactoActivoRaw
    ? { nombre_perfil: canal === "whatsapp" ? contactoActivoRaw.nombre_perfil : `@${contactoActivoRaw.username || contactoActivoRaw.ig_user_id}`, telefono: canal === "whatsapp" ? contactoActivoRaw.telefono : null }
    : null;

  const formatDate = (dateString: string) => new Date(dateString).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const formatDay = (dateString: string) => {
    const difDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
    if (difDays === 0) return "Hoy";
    if (difDays === 1) return "Ayer";
    return `${difDays} días`;
  };

  const indexEtapaActual = ETAPAS_PIPELINE.findIndex((e) => e.value === etapaActual);

  const [showVincular, setShowVincular] = useState(false);
  const [buscarCliente, setBuscarCliente] = useState("");
  const [clientesResult, setClientesResult] = useState<any[]>([]);
  const [vehiculosResult, setVehiculosResult] = useState<any[]>([]);
  const [buscarVehiculo, setBuscarVehiculo] = useState("");

  const buscarClientesFn = async (q: string) => {
    setBuscarCliente(q);
    if (q.length < 2) return setClientesResult([]);
    const { data } = await supabase2.from("clientes").select("id, nombre, telefono, dni_cuit").or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%,dni_cuit.ilike.%${q}%`).limit(5);
    setClientesResult(data || []);
  };

  const buscarVehiculosFn = async (q: string) => {
    setBuscarVehiculo(q);
    if (q.length < 2) return setVehiculosResult([]);
    const { data } = await supabase2.from("vehiculos").select("id, marca, modelo, patente").or(`marca.ilike.%${q}%,modelo.ilike.%${q}%,patente.ilike.%${q}%`).limit(5);
    setVehiculosResult(data || []);
  };

  const abrirFormularioCliente = () => {
    setNuevoCliente({ nombre: contactoActivo?.nombre_perfil || "", telefono: contactoActivo?.telefono || "", email: "", dni_cuit: "" });
    setCreandoClienteManual(true);
  };

  const guardarClienteManual = async () => {
    if (!nuevoCliente.nombre.trim()) { alert("El nombre es obligatorio."); return; }
    setGuardandoCliente(true);
    try {
      let clienteId: string | null = null;
      if (nuevoCliente.telefono.trim() || nuevoCliente.dni_cuit.trim()) {
        const filtros: string[] = [];
        if (nuevoCliente.telefono.trim()) filtros.push(`telefono.eq.${nuevoCliente.telefono.trim()}`);
        if (nuevoCliente.dni_cuit.trim()) filtros.push(`dni_cuit.eq.${nuevoCliente.dni_cuit.trim()}`);
        const { data: existentes } = await supabase2.from("clientes").select("id, nombre").or(filtros.join(","));
        if (existentes && existentes.length > 0) {
          if (!confirm(`Ya existe un cliente con ese teléfono/DNI: ${existentes[0].nombre}. ¿Usar ese en vez de crear uno nuevo?`)) {
            setGuardandoCliente(false);
            return;
          }
          clienteId = existentes[0].id;
        }
      }
      if (!clienteId) {
        const { data, error } = await supabase2.from("clientes").insert({
          nombre: nuevoCliente.nombre.trim(), telefono: nuevoCliente.telefono || null, email: nuevoCliente.email || null, dni_cuit: nuevoCliente.dni_cuit || null,
          origen: canal === "whatsapp" ? "WhatsApp" : "Instagram", canal_ingreso: "lead_digital",
        }).select("id").single();
        if (error) throw error;
        clienteId = data.id;
      }
      await vincularCliente(clienteId!);
      setCreandoClienteManual(false);
    } catch {
      alert("Error al crear el cliente.");
    } finally {
      setGuardandoCliente(false);
    }
  };

  const vincularCliente = async (clienteId: string) => {
    if (!seleccionada) return;
    await supabase2.from(tablaConversaciones).update({ cliente_id: clienteId }).eq("id", seleccionada);
    setConversaciones((prev) => prev.map((c) => (c.id === seleccionada ? { ...c, cliente_id: clienteId } : c)));
    setShowVincular(false);
  };

  const vincularVehiculo = async (vehiculoId: string) => {
    if (!seleccionada) return;
    await supabase2.from(tablaConversaciones).update({ vehiculo_id: vehiculoId }).eq("id", seleccionada);
    setConversaciones((prev) => prev.map((c) => (c.id === seleccionada ? { ...c, vehiculo_id: vehiculoId } : c)));
    setShowVincular(false);
  };

  const reasignarVendedor = async (vendedorId: string) => {
    if (!seleccionada) return;
    const nuevoId = vendedorId || null;
    await supabase2.from(tablaConversaciones).update({ vendedor_id: nuevoId }).eq("id", seleccionada);
    const vendedor = vendedores.find((v) => v.id === nuevoId) || null;
    setConversaciones((prev) => prev.map((c) => (c.id === seleccionada ? { ...c, vendedor_id: nuevoId, vendedor } : c)));
  };

  const conversacionesFiltradas = conversaciones.filter((c) => {
    if (filtro === "no-leidas" && !(c.unread_count > 0)) return false;
    if (busqueda.trim()) {
      const contactoRaw = canal === "whatsapp" ? c.whatsapp_contactos : c.instagram_contactos;
      const texto = canal === "whatsapp" ? [contactoRaw?.nombre_perfil, contactoRaw?.telefono].join(" ") : [contactoRaw?.username, contactoRaw?.ig_user_id].join(" ");
      if (!texto.toLowerCase().includes(busqueda.trim().toLowerCase())) return false;
    }
    return true;
  });

  const noLeidasTotal = conversaciones.filter((c) => c.unread_count > 0).length;
  const tibiosYCalientes = conversacionesFiltradas.filter((c) => c.calificacion === "tibio" || c.calificacion === "caliente");
  const frios = conversacionesFiltradas.filter((c) => c.calificacion !== "tibio" && c.calificacion !== "caliente");

  const colorCalificacion = (calificacion: string | null) => {
    if (calificacion === "caliente") return "bg-rose-500";
    if (calificacion === "tibio") return "bg-amber-500";
    return "bg-slate-300";
  };

  const renderConversacion = (c: any) => {
    const contactoRaw = canal === "whatsapp" ? c.whatsapp_contactos : c.instagram_contactos;
    const nombreMostrado = canal === "whatsapp" ? contactoRaw?.nombre_perfil : (contactoRaw ? `@${contactoRaw.username || contactoRaw.ig_user_id}` : null);
    const contacto = { nombre_perfil: nombreMostrado, telefono: canal === "whatsapp" ? contactoRaw?.telefono : null };
    const iniciales = (contacto?.nombre_perfil || contacto?.telefono || "?").substring(0, 2).toUpperCase();
    const isActive = seleccionada === c.id;

    return (
      <button
        key={c.id}
        onClick={() => setSeleccionada(c.id)}
        className={`w-full text-left p-3.5 border-b border-slate-100 dark:border-white/5 transition-all flex gap-3 ${isActive ? "bg-emerald-50 dark:bg-emerald-500/10 border-l-2 border-l-emerald-700 dark:border-l-emerald-400" : "bg-white dark:bg-transparent border-l-2 border-l-transparent hover:bg-slate-50 dark:hover:bg-white/5"}`}
      >
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-sm">{iniciales}</div>
          <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#111] ${colorCalificacion(c.calificacion)}`} title={c.calificacion || "Sin calificar"} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-0.5">
            <span className={`font-bold text-sm truncate flex items-center gap-1 ${isActive ? "text-emerald-900 dark:text-emerald-200" : "text-slate-900 dark:text-white"}`}>
              {c.origen_ads && <span title={c.origen_ads} className="shrink-0 inline-flex"><Megaphone className="w-3 h-3 text-indigo-500 dark:text-sky-300" /></span>}
              {contacto?.nombre_perfil || contacto?.telefono}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{c.last_message_at ? formatDay(c.last_message_at) : ""}</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate mb-1.5">{c.vendedor?.nombre ? `Asignado a ${c.vendedor.nombre}` : "Sin asignar"}</p>
            {c.unread_count > 0 && <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full shrink-0">{c.unread_count}</span>}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex w-full h-full text-slate-800 dark:text-slate-200">
      {/* COLUMNA 1: BANDEJA */}
      <div className={`w-full md:w-[280px] flex-col bg-white dark:bg-[#111] border-r border-slate-200 dark:border-white/10 shrink-0 ${seleccionada ? "hidden md:flex" : "flex"}`}>
        <div className="p-2.5 border-b border-slate-100 dark:border-white/10 shrink-0 space-y-2">
          <div className="flex gap-1.5">
            <button onClick={() => { setCanal("whatsapp"); setSeleccionada(null); }} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-bold rounded-lg transition-colors ${canal === "whatsapp" ? "bg-emerald-700 text-white" : "bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"}`}>
              <MessageSquareText className="w-3.5 h-3.5" /> WhatsApp {conversacionesWA.length}
            </button>
            <button onClick={() => { setCanal("instagram"); setSeleccionada(null); }} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-bold rounded-lg transition-colors ${canal === "instagram" ? "bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white" : "bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"}`}>
              <AtSign className="w-3.5 h-3.5" /> Instagram {conversacionesIG.length}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar..." className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500" />
            </div>
            <button onClick={() => setFiltro(filtro === "todas" ? "no-leidas" : "todas")} title="No leídas" className={`shrink-0 px-2 py-1.5 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1 ${filtro === "no-leidas" ? "bg-slate-800 dark:bg-white/10 text-white" : "bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"}`}>
              {noLeidasTotal > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />} {noLeidasTotal}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {tibiosYCalientes.length > 0 && (
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 sticky top-0 z-[1]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Tibios y calientes · {tibiosYCalientes.length}</span>
            </div>
          )}
          {tibiosYCalientes.map((c) => renderConversacion(c))}
          {frios.length > 0 && (
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-white/5 border-y border-slate-100 dark:border-white/10 sticky top-0 z-[1]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Fríos · {frios.length}</span>
            </div>
          )}
          {frios.map((c) => renderConversacion(c))}
          {conversacionesFiltradas.length === 0 && <p className="text-center text-xs text-slate-400 py-8">Sin conversaciones.</p>}
        </div>
      </div>

      {/* COLUMNA 2: CHAT */}
      <div className={`flex-1 flex flex-col relative ${!seleccionada ? "hidden md:flex" : "flex"} ${esIG ? "bg-[#fafafa] dark:bg-[#0A0A0A]" : "bg-[#e5ddd4] dark:bg-[#0b141a]"}`}
        style={!esIG ? { backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z'/%3E%3C/g%3E%3C/svg%3E\")" } : undefined}>
        {!seleccionada ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <p className="text-sm font-medium">Elige una conversación para ver el hilo</p>
          </div>
        ) : (
          <>
            <div className={`h-[56px] flex justify-between items-center px-4 shrink-0 shadow-sm z-10 ${esIG ? "bg-white dark:bg-[#111] border-b border-slate-200 dark:border-white/10" : "bg-emerald-700 dark:bg-[#202c33]"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 ${esIG ? "bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600" : "bg-emerald-900/40 dark:bg-white/10"}`}>
                  {(contactoActivo?.nombre_perfil || contactoActivo?.telefono || "?").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className={`font-bold text-[15px] leading-tight ${esIG ? "text-slate-900 dark:text-white" : "text-white"}`}>{contactoActivo?.nombre_perfil || "Cliente"}</h3>
                  <p className={`text-[11px] font-medium ${esIG ? "text-slate-500 dark:text-slate-400" : "text-emerald-100/80"}`}>{contactoActivo?.telefono}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className={`md:hidden text-sm font-bold ${esIG ? "text-emerald-700 dark:text-emerald-300" : "text-white"}`} onClick={() => setSeleccionada(null)}>Atrás</button>
                {!panelAbierto && (
                  <button onClick={() => setPanelAbierto(true)} className={`hidden lg:flex p-1.5 rounded-md transition-colors ${esIG ? "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200" : "text-emerald-100 hover:bg-white/10"}`} title="Mostrar detalles">
                    <PanelRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-1.5 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center py-4"><span className="text-xs text-slate-500 dark:text-slate-400">Cargando...</span></div>
              ) : (
                mensajes.map((m) => {
                  const out = m.direccion === "out";
                  const burbujaOut = esIG ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white border-transparent" : "bg-[#d9fdd3] dark:bg-[#005c4b] border-transparent text-slate-800 dark:text-white";
                  const burbujaIn = "bg-white dark:bg-[#1f2c34] border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-100";
                  return (
                    <div key={m.id} className={`flex ${out ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] xl:max-w-[65%] flex flex-col ${out ? "items-end" : "items-start"}`}>
                        <div className={`rounded-[10px] px-3 py-2 text-[14.5px] shadow-sm border ${out ? burbujaOut : burbujaIn} ${out ? "rounded-tr-none" : "rounded-tl-none"}`}>
                          <p className="leading-relaxed whitespace-pre-wrap">{m.texto}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 ${out && !esIG ? "opacity-60" : "opacity-70"}`}>
                            {out && m.ai_generado && <Bot className="w-3 h-3" />}
                            <span className="text-[10px] font-medium">{formatDate(m.created_at)}</span>
                            {out && (m.status === "failed" ? <X className="w-3.5 h-3.5 text-rose-500" /> : <Check className={`w-3.5 h-3.5 ${esIG ? "" : "text-blue-500 dark:text-sky-300"}`} />)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={mensajesEndRef} />
            </div>

            <div className={`p-3 relative ${esIG ? "bg-[#fafafa] dark:bg-[#0A0A0A]" : "bg-transparent"}`}>
              {mostrarPlantillas && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-56 overflow-y-auto z-20">
                  {plantillas.length === 0 ? (
                    <p className="text-xs text-slate-400 p-3">Sin plantillas cargadas — se configuran en Configuración.</p>
                  ) : (
                    plantillas.map((p) => (
                      <button key={p.id} onClick={() => insertarPlantilla(p.texto)} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/10 last:border-0">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.nombre} <span className="text-[10px] font-normal text-slate-400">· {p.sector}</span></p>
                        <p className="text-[11px] text-slate-400 truncate">{p.texto}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
              <form onSubmit={enviarMensaje} className="flex items-center gap-2 bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1.5 shadow-sm">
                <button type="button" onClick={() => setMostrarPlantillas((v) => !v)} title="Plantillas" className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 shrink-0">
                  <MessageSquareText className="w-4 h-4" />
                </button>
                <input type="text" value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} placeholder="Escribe un mensaje..." className="flex-1 bg-transparent px-1 py-2 text-[15px] text-slate-800 dark:text-white outline-none" autoComplete="off" />
                <button type="submit" disabled={!nuevoMensaje.trim()} className="bg-emerald-700 hover:bg-emerald-800 text-white p-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* COLUMNA 3: DETALLES */}
      {seleccionada && panelAbierto && (
        <div className="w-[260px] bg-white dark:bg-[#111] border-l border-slate-200 dark:border-white/10 flex-col hidden lg:flex shrink-0">
          <div className="h-[60px] p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
            <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Detalles</h3>
            <button onClick={() => setPanelAbierto(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-600 text-xl font-bold flex items-center justify-center text-white mb-3 shadow-sm">
                {(contactoActivo?.nombre_perfil || contactoActivo?.telefono || "?").substring(0, 2).toUpperCase()}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">{contactoActivo?.nombre_perfil || "Cliente"}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{contactoActivo?.telefono}</p>
              {conversacionActiva?.origen_ads && (
                <div className="mt-3 flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-sky-300 text-[11px] font-bold px-2.5 py-1 rounded-full max-w-full">
                  <Megaphone className="w-3 h-3 shrink-0" /> <span className="truncate" title={conversacionActiva.origen_ads}>{conversacionActiva.origen_ads}</span>
                </div>
              )}
            </div>

            <div className="p-6 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">IA en esta conversación</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{conversacionActiva?.ai_habilitada ? "Activada" : "Pausada"}</p>
                </div>
                <button type="button" onClick={toggleIA} className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${conversacionActiva?.ai_habilitada ? "bg-emerald-700 justify-end" : "bg-slate-300 dark:bg-white/10 justify-start"}`}>
                  <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </button>
              </div>
              {conversacionActiva?.handoff_at && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 rounded-lg flex gap-2">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    <p>{conversacionActiva.handoff_reason === "cliente_pidio_humano" ? "El cliente pidió hablar con una persona." : "La IA dejó de responder."}</p>
                    {conversacionActiva.handoff_resumen && <p className="mt-1 font-semibold">{conversacionActiva.handoff_resumen}</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-b border-slate-200 dark:border-white/10">
              <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Etapa del Pipeline</h4>
              <div className="space-y-4 relative">
                <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-slate-200 dark:bg-white/10 -z-10" />
                {ETAPAS_PIPELINE.map((etapa, i) => {
                  const isCompleted = i < indexEtapaActual;
                  const isCurrent = i === indexEtapaActual;
                  return (
                    <div key={etapa.value} onClick={() => cambiarEtapa(etapa.value)} className="flex items-center gap-3 cursor-pointer group">
                      <div className="bg-white dark:bg-[#111] z-10 flex items-center justify-center">
                        {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-200 transition-colors" /> : isCurrent ? <Circle className="w-5 h-5 text-slate-800 dark:text-slate-100 fill-slate-700 dark:fill-slate-200" /> : <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors bg-white dark:bg-[#111]" />}
                      </div>
                      <span className={`text-[13px] transition-colors ${isCurrent ? "text-slate-900 dark:text-white font-bold" : isCompleted ? "text-slate-700 dark:text-slate-200 font-medium" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>{etapa.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-b border-slate-200 dark:border-white/10">
              <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Vendedor asignado</h4>
              <select value={conversacionActiva?.vendedor_id || ""} onChange={(e) => reasignarVendedor(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 dark:text-white outline-none focus:border-emerald-600 cursor-pointer">
                <option value="">Sin asignar</option>
                {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </div>

            <div className="p-6 pb-0">
              <button onClick={() => setShowVincular(true)} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2 rounded-lg">
                {conversacionActiva?.cliente_id ? "Cliente vinculado ✓" : "Vincular a cliente / auto"}
              </button>
            </div>

            {showVincular && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white dark:bg-[#111] rounded-xl p-5 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{creandoClienteManual ? "Nuevo cliente" : "Vincular conversación"}</h3>
                    <button onClick={() => { setShowVincular(false); setCreandoClienteManual(false); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-4 h-4" /></button>
                  </div>

                  {creandoClienteManual ? (
                    <div className="space-y-3">
                      <input className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400" placeholder="Nombre *" value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
                      <input className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400" placeholder="Teléfono" value={nuevoCliente.telefono} onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} />
                      <input className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400" placeholder="Email" value={nuevoCliente.email} onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })} />
                      <input className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400" placeholder="DNI/CUIT" value={nuevoCliente.dni_cuit} onChange={(e) => setNuevoCliente({ ...nuevoCliente, dni_cuit: e.target.value })} />
                      <div className="pt-1">
                        <button onClick={guardarClienteManual} disabled={guardandoCliente} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-[11px] uppercase tracking-widest disabled:opacity-50 transition-colors">
                          {guardandoCliente ? "Guardando..." : "Usar este cliente"}
                        </button>
                        <button onClick={() => setCreandoClienteManual(false)} className="w-full mt-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 py-2">Volver a buscar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Cliente</label>
                        <input value={buscarCliente} onChange={(e) => buscarClientesFn(e.target.value)} placeholder="Buscar por nombre, teléfono o DNI..." className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm mt-1" />
                        {clientesResult.map((c) => (
                          <button key={c.id} onClick={() => vincularCliente(c.id)} className="block w-full text-left text-sm text-slate-700 dark:text-slate-200 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded mt-1">
                            {c.nombre} {c.telefono ? `— ${c.telefono}` : ""}
                          </button>
                        ))}
                        <button onClick={abrirFormularioCliente} className="text-xs text-emerald-700 dark:text-emerald-300 font-bold mt-3">+ Crear cliente nuevo con estos datos</button>
                      </div>
                      <div className="border-t border-slate-100 dark:border-white/10 pt-4">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Vehículo (opcional)</label>
                        <input value={buscarVehiculo} onChange={(e) => buscarVehiculosFn(e.target.value)} placeholder="Marca, modelo o patente..." className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm mt-1" />
                        {vehiculosResult.map((v) => (
                          <button key={v.id} onClick={() => vincularVehiculo(v.id)} className="block w-full text-left text-sm text-slate-700 dark:text-slate-200 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded mt-1">
                            {v.marca} {v.modelo} {v.patente ? `(${v.patente})` : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-6">
              <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Notas</h4>
              <textarea value={notasLocales} onChange={(e) => setNotasLocales(e.target.value)} placeholder="Notas internas sobre este contacto..." className="w-full h-32 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-[13px] text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none custom-scrollbar" />
              <button onClick={guardarNotas} disabled={guardandoNotas} className="mt-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 w-max">
                {guardandoNotas && <Loader2 className="w-3 h-3 animate-spin" />} {guardandoNotas ? "Guardando..." : "Guardar notas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
