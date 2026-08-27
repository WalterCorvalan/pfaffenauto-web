"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { buscarClienteDuplicado } from "@/lib/clienteDedupe";
import {
  Search,
  Send,
  CheckCircle2,
  Circle,
  Bot,
  Check,
  Info,
  ChevronRight,
  PanelRight,
  Loader2,
  Megaphone,
  X,
} from "lucide-react";
import NotificacionesBell from "../../NotificacionesBell";

const ETAPAS_PIPELINE = [
  "Nuevo",
  "Contactado",
  "Interesado",
  "Cliente",
  "Perdido",
];

export default function ChatClient({
  conversacionesIniciales,
  conversacionesInstagramIniciales = [],
  vendedores = [],
}: {
  conversacionesIniciales: any[];
  conversacionesInstagramIniciales?: any[];
  vendedores?: { id: string; nombre: string; sucursal_id: string | null }[];
}) {
  const [canal, setCanal] = useState<"whatsapp" | "instagram">("whatsapp");
  const [conversacionesWA, setConversacionesWA] = useState(conversacionesIniciales);
  const [conversacionesIG, setConversacionesIG] = useState(conversacionesInstagramIniciales);
  const conversaciones = canal === "whatsapp" ? conversacionesWA : conversacionesIG;
  const setConversaciones = canal === "whatsapp" ? setConversacionesWA : setConversacionesIG;
  const tablaConversaciones = canal === "whatsapp" ? "whatsapp_conversaciones" : "instagram_conversaciones";
  const tablaMensajes = canal === "whatsapp" ? "whatsapp_mensajes" : "instagram_mensajes";
  const endpointEnviar = canal === "whatsapp" ? "/api/panel/whatsapp/enviar" : "/api/panel/instagram/enviar";
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "no-leidas">("todas");
  const [loading, setLoading] = useState(false);

  // Estados para el formulario de nuevo cliente
  const [creandoClienteManual, setCreandoClienteManual] = useState(false);
  const [guardandoCliente, setGuardandoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    cuit_cuil: "",
    telefono_celular: "",
    telefono_linea: "",
    correo_electronico: "",
    calle: "",
    numero: "",
    depto: "",
    localidad: "",
    codigo_postal: "",
    provincia: "",
    estado_civil: "",
    profesion: "",
    fecha_nacimiento: "",
  });

  // Nuevos estados para el Panel de Detalles
  const [panelAbierto, setPanelAbierto] = useState(true);
  const [etapaActual, setEtapaActual] = useState("Nuevo");
  const [notasLocales, setNotasLocales] = useState("");
  const [guardandoNotas, setGuardandoNotas] = useState(false);

  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // El server (page.tsx) manda la lista inicial por props — sin este efecto,
  // un router.refresh() (ej. disparado por el realtime de abajo) trae props
  // nuevas pero el useState de más arriba nunca las toma, así que una
  // conversación nueva no aparecía hasta recargar la página a mano.
  useEffect(() => {
    setConversacionesWA(conversacionesIniciales);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversacionesIniciales]);

  useEffect(() => {
    setConversacionesIG(conversacionesInstagramIniciales);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversacionesInstagramIniciales]);

  // Bandeja en vivo: cualquier conversación nueva o actualizada (nuevo
  // contacto que escribe por primera vez, cambio de last_message_at, etc)
  // refresca la lista sin que haya que recargar la página a mano.
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const refrescarConDebounce = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => router.refresh(), 400);
    };

    const canalBandeja = supabase
      .channel(`bandeja-chat-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_conversaciones" }, refrescarConDebounce)
      .on("postgres_changes", { event: "*", schema: "public", table: "instagram_conversaciones" }, refrescarConDebounce)
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(canalBandeja);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep link desde /panel/contactos o una notificación: /panel/chat?conversacion=<id>&canal=instagram
  useEffect(() => {
    const conversacionParam = searchParams.get("conversacion");
    const canalParam = searchParams.get("canal");
    if (canalParam === "instagram" || canalParam === "whatsapp") setCanal(canalParam);
    if (conversacionParam) setSeleccionada(conversacionParam);
  }, [searchParams]);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // Cargar mensajes y detalles (etapa y notas) cuando se selecciona un chat
  useEffect(() => {
    if (!seleccionada) return;
    setLoading(true);

    // 1. Traer mensajes
    supabase
      .from(tablaMensajes)
      .select("*")
      .eq("conversacion_id", seleccionada)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMensajes(data || []);
        setLoading(false);
      });

    // 2. Traer estado del pipeline y notas de la conversación
    supabase
      .from(tablaConversaciones)
      .select("estado_pipeline, notas")
      .eq("id", seleccionada)
      .single()
      .then(({ data }) => {
        if (data) {
          setEtapaActual(data.estado_pipeline || "Nuevo");
          setNotasLocales(data.notas || "");
        }
      });

    // 3. Tiempo real: mensajes nuevos (entrantes del cliente o del bot) sin recargar la página.
    const canalRealtime = supabase
      .channel(`${tablaMensajes}:${seleccionada}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: tablaMensajes,
          filter: `conversacion_id=eq.${seleccionada}`,
        },
        (payload) => {
          const nuevo = payload.new as any;
          setMensajes((prev) => {
            if (prev.some((m) => m.id === nuevo.id)) return prev;
            // Reemplaza el eco optimista local (mismo texto/dirección, sin id real todavía).
            const sinEcoLocal = prev.filter(
              (m) =>
                !(
                  m.direccion === "out" &&
                  m.texto === nuevo.texto &&
                  m.status === "pending" &&
                  m.id !== nuevo.id
                ),
            );
            return [...sinEcoLocal, nuevo];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: tablaMensajes,
          filter: `conversacion_id=eq.${seleccionada}`,
        },
        (payload) => {
          const actualizado = payload.new as any;
          setMensajes((prev) =>
            prev.map((m) => (m.id === actualizado.id ? actualizado : m)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalRealtime);
    };
  }, [seleccionada, tablaMensajes, tablaConversaciones]);

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !seleccionada) return;

    const texto = nuevoMensaje.trim();
    setNuevoMensaje("");

    const tempId = crypto.randomUUID();
    const tempMsg = {
      id: tempId,
      conversacion_id: seleccionada,
      direccion: "out",
      tipo: "text",
      texto: texto,
      status: "pending",
      ai_generado: false,
      created_at: new Date().toISOString(),
    };
    setMensajes((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch(endpointEnviar, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversacionId: seleccionada, texto }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Error al enviar", data.error);
        setMensajes((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)),
        );
      }
    } catch (err) {
      console.error("Error al enviar", err);
      setMensajes((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)),
      );
    }
  };

  // Funciones para actualizar Pipeline y Notas
  const cambiarEtapa = async (nuevaEtapa: string) => {
    if (!seleccionada || nuevaEtapa === etapaActual) return;
    setEtapaActual(nuevaEtapa); // Actualización optimista UI
    try {
      await supabase
        .from(tablaConversaciones)
        .update({ estado_pipeline: nuevaEtapa })
        .eq("id", seleccionada);
    } catch (error) {
      console.error("Error actualizando etapa", error);
    }
  };

  const guardarNotas = async () => {
    if (!seleccionada) return;
    setGuardandoNotas(true);
    try {
      await supabase
        .from(tablaConversaciones)
        .update({ notas: notasLocales })
        .eq("id", seleccionada);
    } catch (error) {
      console.error("Error guardando notas", error);
    } finally {
      setGuardandoNotas(false);
    }
  };

  const conversacionActiva = conversaciones.find((c) => c.id === seleccionada);

  const toggleIA = async () => {
    if (!conversacionActiva) return;
    const nuevoValor = !conversacionActiva.ai_habilitada;
    setConversaciones((prev) => prev.map((c) => (c.id === conversacionActiva.id ? { ...c, ai_habilitada: nuevoValor } : c)));
    const { error } = await supabase.from(tablaConversaciones).update({ ai_habilitada: nuevoValor }).eq("id", conversacionActiva.id);
    if (error) {
      setConversaciones((prev) => prev.map((c) => (c.id === conversacionActiva.id ? { ...c, ai_habilitada: !nuevoValor } : c)));
    }
  };
  const contactoActivoRaw = canal === "whatsapp" ? conversacionActiva?.whatsapp_contactos : conversacionActiva?.instagram_contactos;
  const contactoActivo = contactoActivoRaw
    ? {
        nombre_perfil: canal === "whatsapp" ? contactoActivoRaw.nombre_perfil : `@${contactoActivoRaw.username || contactoActivoRaw.ig_user_id}`,
        telefono: canal === "whatsapp" ? contactoActivoRaw.telefono : null,
      }
    : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDay = (dateString: string) => {
    const date = new Date(dateString);
    const difDays = Math.floor(
      (new Date().getTime() - date.getTime()) / (1000 * 3600 * 24),
    );
    if (difDays === 0) return "Hoy";
    if (difDays === 1) return "Ayer";
    return `${difDays} ago`;
  };

  const indexEtapaActual = ETAPAS_PIPELINE.indexOf(etapaActual);

  // nuevos estados arriba del componente
  const [showVincular, setShowVincular] = useState(false);
  const [buscarCliente, setBuscarCliente] = useState("");
  const [clientesResult, setClientesResult] = useState<any[]>([]);
  const [vehiculosResult, setVehiculosResult] = useState<any[]>([]);
  const [buscarVehiculo, setBuscarVehiculo] = useState("");

  // buscar clientes por nombre/apellido (debounce simple con setTimeout si querés)
  const buscarClientesFn = async (q: string) => {
    setBuscarCliente(q);
    if (q.length < 2) return setClientesResult([]);
    const { data } = await supabase
      .from("clientes")
      .select("id, nombre, apellido, telefono_celular")
      .or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%`)
      .limit(5);
    setClientesResult(data || []);
  };

  const buscarVehiculosFn = async (q: string) => {
    setBuscarVehiculo(q);
    if (q.length < 2) return setVehiculosResult([]);
    const { data } = await supabase
      .from("vehiculos")
      .select("id, marca, modelo, patente")
      .or(`marca.ilike.%${q}%,modelo.ilike.%${q}%,patente.ilike.%${q}%`)
      .limit(5);
    setVehiculosResult(data || []);
  };

  const abrirFormularioCliente = () => {
    setNuevoCliente({
      nombre: contactoActivo?.nombre_perfil || "",
      apellido: "",
      dni: "",
      cuit_cuil: "",
      telefono_celular: contactoActivo?.telefono || "",
      telefono_linea: "",
      correo_electronico: "",
      calle: "",
      numero: "",
      depto: "",
      localidad: "",
      codigo_postal: "",
      provincia: "",
      estado_civil: "",
      profesion: "",
      fecha_nacimiento: "",
    });
    setCreandoClienteManual(true);
  };

  const guardarClienteManual = async () => {
    if (!nuevoCliente.nombre.trim() || !nuevoCliente.apellido.trim()) {
      alert("Nombre y apellido son obligatorios.");
      return;
    }
    setGuardandoCliente(true);
    try {
      {
        const existente = await buscarClienteDuplicado(supabase, nuevoCliente);
        if (existente) {
          if (!confirm(`Ya existe un cliente con ese DNI/teléfono: ${existente.nombre} ${existente.apellido}. ¿Usar ese en vez de crear uno nuevo?`)) {
            setGuardandoCliente(false);
            return;
          }
          await vincularCliente(existente.id);
          setCreandoClienteManual(false);
          setGuardandoCliente(false);
          return;
        }
      }
      const { data, error } = await supabase
        .from("clientes")
        .insert({
          ...nuevoCliente,
          fecha_nacimiento: nuevoCliente.fecha_nacimiento || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      await vincularCliente(data.id);
      setCreandoClienteManual(false);
    } catch (err) {
      alert("Error al crear el cliente.");
    } finally {
      setGuardandoCliente(false);
    }
  };

  const vincularCliente = async (clienteId: string) => {
    if (!seleccionada) return;
    await supabase
      .from(tablaConversaciones)
      .update({ cliente_id: clienteId })
      .eq("id", seleccionada);
    setShowVincular(false);
    // refrescar conversacionActiva: lo simple es window.location.reload() o refetch de conversaciones
  };

  const vincularVehiculo = async (vehiculoId: string) => {
    if (!seleccionada) return;
    await supabase
      .from(tablaConversaciones)
      .update({ vehiculo_id: vehiculoId })
      .eq("id", seleccionada);
    setShowVincular(false);
  };

  const reasignarVendedor = async (vendedorId: string) => {
    if (!seleccionada) return;
    const nuevoId = vendedorId || null;
    await supabase
      .from(tablaConversaciones)
      .update({ vendedor_id: nuevoId })
      .eq("id", seleccionada);
    const vendedor = vendedores.find((v) => v.id === nuevoId) || null;
    setConversaciones((prev) =>
      prev.map((c) =>
        c.id === seleccionada ? { ...c, vendedor_id: nuevoId, vendedor } : c,
      ),
    );
  };

  const tibiosYCalientes = conversaciones.filter(
    (c) => c.calificacion === "tibio" || c.calificacion === "caliente",
  );
  const frios = conversaciones.filter(
    (c) => c.calificacion !== "tibio" && c.calificacion !== "caliente",
  );

  const colorCalificacion = (calificacion: string | null) => {
    if (calificacion === "caliente") return "bg-rose-500";
    if (calificacion === "tibio") return "bg-amber-500";
    return "bg-slate-300";
  };

  const renderConversacion = (c: any) => {
    const contactoRaw = canal === "whatsapp" ? c.whatsapp_contactos : c.instagram_contactos;
    const nombreMostrado = canal === "whatsapp" ? contactoRaw?.nombre_perfil : (contactoRaw ? `@${contactoRaw.username || contactoRaw.ig_user_id}` : null);
    const contacto = { nombre_perfil: nombreMostrado, telefono: canal === "whatsapp" ? contactoRaw?.telefono : null };
    const iniciales = (contacto?.nombre_perfil || contacto?.telefono || "?")
      .substring(0, 2)
      .toUpperCase();
    const isActive = seleccionada === c.id;

    return (
      <button
        key={c.id}
        onClick={() => setSeleccionada(c.id)}
        className={`w-full text-left p-3.5 border-b border-slate-100 dark:border-[#0a2a6b] transition-all flex gap-3 ${
          isActive
            ? "bg-emerald-50 dark:bg-[#002a6e] border-l-2 border-l-emerald-700 dark:border-l-emerald-400"
            : "bg-white dark:bg-[#001c55] border-l-2 border-l-transparent hover:bg-slate-50 dark:hover:bg-[#00246b]"
        }`}
      >
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-sm">
            {iniciales}
          </div>
          <span
            className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#001c55] ${colorCalificacion(c.calificacion)}`}
            title={c.calificacion || "Sin calificar"}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-0.5">
            <span
              className={`font-bold text-sm truncate flex items-center gap-1 ${isActive ? "text-emerald-900 dark:text-emerald-200" : "text-slate-900 dark:text-white"}`}
            >
              {c.origen_ads && (
                <span title={c.origen_ads} className="shrink-0 inline-flex">
                  <Megaphone className="w-3 h-3 text-indigo-500 dark:text-sky-300" />
                </span>
              )}
              {contacto?.nombre_perfil || contacto?.telefono}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
              {c.last_message_at ? formatDay(c.last_message_at) : ""}
            </span>
          </div>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate mb-1.5">
            Clic para ver historial...
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="flex w-full h-full text-slate-800 dark:text-slate-200">
      {/* ================= COLUMNA 1: BANDEJA (Izquierda) ================= */}
      <div
        className={`w-full md:w-[320px] flex-col bg-white dark:bg-[#001c55] border-r border-slate-200 dark:border-[#0a2a6b] shrink-0 ${seleccionada ? "hidden md:flex" : "flex"}`}
      >
        <div className="p-4 border-b border-slate-100 dark:border-[#0a2a6b] flex-shrink-0">
          <h2 className="text-[17px] font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              Bandeja{" "}
              <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                {conversaciones.length}
              </span>
            </span>
            <NotificacionesBell seccion="chat" />
          </h2>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setCanal("whatsapp"); setSeleccionada(null); }}
              className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${canal === "whatsapp" ? "bg-emerald-700 text-white" : "bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#002a6e]"}`}
            >
              WhatsApp {conversacionesWA.length}
            </button>
            <button
              onClick={() => { setCanal("instagram"); setSeleccionada(null); }}
              className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${canal === "instagram" ? "bg-emerald-700 text-white" : "bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#002a6e]"}`}
            >
              Instagram {conversacionesIG.length}
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Buscar conversación..."
              className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg py-1.5 pl-9 pr-4 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFiltro("todas")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${filtro === "todas" ? "bg-slate-800 dark:bg-[#00246b] text-white" : "bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#00246b]"}`}
            >
              Todas {conversaciones.length}
            </button>
            <button
              onClick={() => setFiltro("no-leidas")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors flex items-center gap-1 ${filtro === "no-leidas" ? "bg-slate-800 dark:bg-[#00246b] text-white" : "bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#00246b]"}`}
            >
              No leídas{" "}
              <span className="text-[10px] bg-slate-100 dark:bg-[#002a6e] text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full">
                0
              </span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {tibiosYCalientes.length > 0 && (
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-[#00246b] border-b border-slate-100 dark:border-[#0a2a6b] sticky top-0 z-[1]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Tibios y calientes · {tibiosYCalientes.length}
              </span>
            </div>
          )}
          {tibiosYCalientes.map((c) => renderConversacion(c))}

          {frios.length > 0 && (
            <div className="px-3.5 py-2 bg-slate-50 dark:bg-[#00246b] border-y border-slate-100 dark:border-[#0a2a6b] sticky top-0 z-[1]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Fríos · {frios.length}
              </span>
            </div>
          )}
          {frios.map((c) => renderConversacion(c))}
        </div>
      </div>

      {/* ================= COLUMNA 2: CHAT (Centro) ================= */}
      <div
        className={`flex-1 flex flex-col bg-[#F0F2F5] dark:bg-[#001233] relative ${!seleccionada ? "hidden md:flex" : "flex"}`}
      >
        {!seleccionada ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <p className="text-sm font-medium">
              Elige una conversación para ver el hilo
            </p>
          </div>
        ) : (
          <>
            {/* Header del Chat */}
            <div className="h-[60px] bg-white dark:bg-[#001c55] border-b border-slate-200 dark:border-[#0a2a6b] flex justify-between items-center px-6 shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center font-bold text-white text-xs">
                  {(
                    contactoActivo?.nombre_perfil ||
                    contactoActivo?.telefono ||
                    "?"
                  )
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight">
                    {contactoActivo?.nombre_perfil || "Cliente"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {contactoActivo?.telefono}
                  </p>
                </div>
              </div>

              {/* Botón para abrir el panel si está cerrado */}
              <div className="flex items-center gap-2">
                <button
                  className="md:hidden text-emerald-700 dark:text-emerald-300 text-sm font-bold"
                  onClick={() => setSeleccionada(null)}
                >
                  Atrás
                </button>
                {!panelAbierto && (
                  <button
                    onClick={() => setPanelAbierto(true)}
                    className="hidden lg:flex p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-[#00246b] hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors"
                    title="Mostrar detalles"
                  >
                    <PanelRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Historial de Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center py-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Cargando...
                  </span>
                </div>
              ) : (
                mensajes.map((m) => {
                  const out = m.direccion === "out";
                  return (
                    <div
                      key={m.id}
                      className={`flex ${out ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] lg:max-w-[60%] flex flex-col ${out ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`rounded-[10px] px-3.5 py-2 text-[14px] shadow-sm border ${
                            out
                              ? "bg-white dark:bg-[#001c55] border-slate-200 dark:border-[#0a2a6b] text-slate-800 dark:text-slate-100 rounded-tr-none"
                              : "bg-white dark:bg-[#001c55] border-slate-200 dark:border-[#0a2a6b] text-slate-800 dark:text-slate-100 rounded-tl-none"
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">
                            {m.texto}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                            {out && m.ai_generado && (
                              <Bot className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            )}
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              {formatDate(m.created_at)}
                            </span>
                            {out && (
                              <Check className="w-3.5 h-3.5 text-blue-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={mensajesEndRef} />
            </div>

            {/* Input para Escribir */}
            <div className="p-4 bg-[#F0F2F5] dark:bg-[#001233]">
              <form
                onSubmit={enviarMensaje}
                className="flex items-center gap-3 max-w-4xl mx-auto bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-2 py-1.5 shadow-sm"
              >
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-transparent px-3 py-2 text-[15px] text-slate-800 dark:text-white outline-none"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!nuevoMensaje.trim()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white p-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* ================= COLUMNA 3: DETALLES (Derecha) ================= */}
      {seleccionada && panelAbierto && (
        <div className="w-[300px] bg-white dark:bg-[#001c55] border-l border-slate-200 dark:border-[#0a2a6b] flex-col hidden lg:flex shrink-0 transition-all duration-300">
          {/* Header Detalles */}
          <div className="h-[60px] p-4 border-b border-slate-200 dark:border-[#0a2a6b] flex items-center justify-between shrink-0">
            <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Detalles
            </h3>
            <button
              onClick={() => setPanelAbierto(false)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#00246b] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Info Perfil */}
            <div className="p-6 border-b border-slate-200 dark:border-[#0a2a6b] flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-600 text-xl font-bold flex items-center justify-center text-white mb-3 shadow-sm">
                {(
                  contactoActivo?.nombre_perfil ||
                  contactoActivo?.telefono ||
                  "?"
                )
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                {contactoActivo?.nombre_perfil || "Cliente"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {contactoActivo?.telefono}
              </p>
              {conversacionActiva?.origen_ads && (
                <div className="mt-3 flex items-center gap-1.5 bg-indigo-50 dark:bg-[#002a6e] border border-indigo-200 dark:border-[#0a2a6b] text-indigo-700 dark:text-sky-300 text-[11px] font-bold px-2.5 py-1 rounded-full max-w-full">
                  <Megaphone className="w-3 h-3 shrink-0" />
                  <span
                    className="truncate"
                    title={conversacionActiva.origen_ads}
                  >
                    {conversacionActiva.origen_ads}
                  </span>
                </div>
              )}
            </div>

            {/* IA Toggle */}
            <div className="p-6 border-b border-slate-200 dark:border-[#0a2a6b]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    IA en esta conversación
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {conversacionActiva?.ai_habilitada ? "Activada" : "Pausada"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleIA}
                  className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${conversacionActiva?.ai_habilitada ? "bg-emerald-700 justify-end" : "bg-slate-300 dark:bg-[#00246b] justify-start"}`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </button>
              </div>
              {!conversacionActiva?.ai_habilitada && (
                <div className="bg-amber-50 dark:bg-[#002a6e] border border-amber-200 dark:border-[#0a2a6b] p-3 rounded-lg flex gap-2">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    Falta la clave de IA de la instancia o intervino un humano.
                  </p>
                </div>
              )}
            </div>

            {/* Etapa del Pipeline */}
            <div className="p-6 border-b border-slate-200 dark:border-[#0a2a6b]">
              <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                Etapa del Pipeline
              </h4>
              <div className="space-y-4 relative">
                <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-slate-200 dark:bg-[#0a2a6b] -z-10"></div>

                {ETAPAS_PIPELINE.map((etapa, i) => {
                  const isCompleted = i < indexEtapaActual;
                  const isCurrent = i === indexEtapaActual;

                  return (
                    <div
                      key={etapa}
                      onClick={() => cambiarEtapa(etapa)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="bg-white dark:bg-[#001c55] z-10 flex items-center justify-center">
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-200 transition-colors" />
                        ) : isCurrent ? (
                          <Circle className="w-5 h-5 text-slate-800 dark:text-slate-100 fill-slate-700 dark:fill-slate-200" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors bg-white dark:bg-[#001c55]" />
                        )}
                      </div>
                      <span
                        className={`text-[13px] transition-colors ${
                          isCurrent
                            ? "text-slate-900 dark:text-white font-bold"
                            : isCompleted
                              ? "text-slate-700 dark:text-slate-200 font-medium"
                              : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                        }`}
                      >
                        {etapa}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vendedor asignado */}
            <div className="p-6 border-b border-slate-200 dark:border-[#0a2a6b]">
              <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Vendedor asignado
              </h4>
              <select
                value={conversacionActiva?.vendedor_id || ""}
                onChange={(e) => reasignarVendedor(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-3 py-2 text-sm font-medium text-slate-800 dark:text-white outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin asignar</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">
                    {v.nombre}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowVincular(true)}
              className="mt-3 w-full bg-slate-100 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-200 dark:hover:bg-[#002a6e] text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2 rounded-lg"
            >
              {conversacionActiva?.cliente_id
                ? "Cliente vinculado ✓"
                : "Vincular a cliente / auto"}
            </button>
            {showVincular && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white dark:bg-[#001c55] rounded-xl p-5 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {creandoClienteManual
                        ? "Nuevo Cliente"
                        : "Vincular conversación"}
                    </h3>
                    <button
                      onClick={() => {
                        setShowVincular(false);
                        setCreandoClienteManual(false);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {creandoClienteManual ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400"
                          placeholder="Nombre *"
                          value={nuevoCliente.nombre}
                          onChange={(e) =>
                            setNuevoCliente({
                              ...nuevoCliente,
                              nombre: e.target.value,
                            })
                          }
                        />
                        <input
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400"
                          placeholder="Apellido *"
                          value={nuevoCliente.apellido}
                          onChange={(e) =>
                            setNuevoCliente({
                              ...nuevoCliente,
                              apellido: e.target.value,
                            })
                          }
                        />
                        <input
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400"
                          placeholder="DNI"
                          value={nuevoCliente.dni}
                          onChange={(e) =>
                            setNuevoCliente({
                              ...nuevoCliente,
                              dni: e.target.value,
                            })
                          }
                        />
                        <input
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400"
                          placeholder="CUIT/CUIL"
                          value={nuevoCliente.cuit_cuil}
                          onChange={(e) =>
                            setNuevoCliente({
                              ...nuevoCliente,
                              cuit_cuil: e.target.value,
                            })
                          }
                        />
                        <input
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400"
                          placeholder="Teléfono celular"
                          value={nuevoCliente.telefono_celular}
                          onChange={(e) =>
                            setNuevoCliente({
                              ...nuevoCliente,
                              telefono_celular: e.target.value,
                            })
                          }
                        />
                        <input
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400"
                          placeholder="Tel. de línea"
                          value={nuevoCliente.telefono_linea}
                          onChange={(e) =>
                            setNuevoCliente({
                              ...nuevoCliente,
                              telefono_linea: e.target.value,
                            })
                          }
                        />
                        <input
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400 col-span-2"
                          placeholder="Correo electrónico"
                          value={nuevoCliente.correo_electronico}
                          onChange={(e) =>
                            setNuevoCliente({
                              ...nuevoCliente,
                              correo_electronico: e.target.value,
                            })
                          }
                        />
                        <input
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400 col-span-2"
                          type="date"
                          title="Fecha de nacimiento"
                          value={nuevoCliente.fecha_nacimiento}
                          onChange={(e) =>
                            setNuevoCliente({
                              ...nuevoCliente,
                              fecha_nacimiento: e.target.value,
                            })
                          }
                        />
                        <input
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400"
                          placeholder="Calle"
                          value={nuevoCliente.calle}
                          onChange={(e) =>
                            setNuevoCliente({
                              ...nuevoCliente,
                              calle: e.target.value,
                            })
                          }
                        />
                        <input
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400"
                          placeholder="Número"
                          value={nuevoCliente.numero}
                          onChange={(e) =>
                            setNuevoCliente({
                              ...nuevoCliente,
                              numero: e.target.value,
                            })
                          }
                        />
                        <input
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400"
                          placeholder="Depto"
                          value={nuevoCliente.depto}
                          onChange={(e) =>
                            setNuevoCliente({
                              ...nuevoCliente,
                              depto: e.target.value,
                            })
                          }
                        />
                        <input
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400"
                          placeholder="Localidad"
                          value={nuevoCliente.localidad}
                          onChange={(e) =>
                            setNuevoCliente({
                              ...nuevoCliente,
                              localidad: e.target.value,
                            })
                          }
                        />
                        <input
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400"
                          placeholder="C. Postal"
                          value={nuevoCliente.codigo_postal}
                          onChange={(e) =>
                            setNuevoCliente({
                              ...nuevoCliente,
                              codigo_postal: e.target.value,
                            })
                          }
                        />
                        <input
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400"
                          placeholder="Provincia"
                          value={nuevoCliente.provincia}
                          onChange={(e) =>
                            setNuevoCliente({
                              ...nuevoCliente,
                              provincia: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={guardarClienteManual}
                          disabled={guardandoCliente}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-[11px] uppercase tracking-widest disabled:opacity-50 transition-colors"
                        >
                          {guardandoCliente
                            ? "Guardando..."
                            : "Usar este cliente"}
                        </button>
                        <button
                          onClick={() => setCreandoClienteManual(false)}
                          className="w-full mt-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 py-2"
                        >
                          Volver a buscar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Búsqueda Cliente actual */}
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          Cliente
                        </label>
                        <input
                          value={buscarCliente}
                          onChange={(e) => buscarClientesFn(e.target.value)}
                          placeholder="Buscar por nombre..."
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm mt-1"
                        />
                        {clientesResult.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => vincularCliente(c.id)}
                            className="block w-full text-left text-sm text-slate-700 dark:text-slate-200 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-[#00246b] rounded mt-1"
                          >
                            {c.nombre} {c.apellido} — {c.telefono_celular}
                          </button>
                        ))}
                        <button
                          onClick={abrirFormularioCliente}
                          className="text-xs text-emerald-700 dark:text-emerald-300 font-bold mt-3"
                        >
                          + Crear cliente nuevo con estos datos
                        </button>
                      </div>

                      {/* Búsqueda Vehículo actual */}
                      <div className="border-t border-slate-100 dark:border-[#0a2a6b] pt-4">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          Vehículo (opcional)
                        </label>
                        <input
                          value={buscarVehiculo}
                          onChange={(e) => buscarVehiculosFn(e.target.value)}
                          placeholder="Marca, modelo o patente..."
                          className="w-full border border-slate-200 dark:border-[#0a2a6b] bg-white dark:bg-[#00246b] text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm mt-1"
                        />
                        {vehiculosResult.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => vincularVehiculo(v.id)}
                            className="block w-full text-left text-sm text-slate-700 dark:text-slate-200 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-[#00246b] rounded mt-1"
                          >
                            {v.marca} {v.modelo}{" "}
                            {v.patente ? `(${v.patente})` : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bloque de Notas */}
            <div className="p-6">
              <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Notas
              </h4>
              <textarea
                value={notasLocales}
                onChange={(e) => setNotasLocales(e.target.value)}
                placeholder="Notas internas sobre este contacto..."
                className="w-full h-32 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-3 text-[13px] text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none custom-scrollbar"
              />
              <button
                onClick={guardarNotas}
                disabled={guardandoNotas}
                className="mt-3 bg-slate-100 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] hover:bg-slate-200 dark:hover:bg-[#002a6e] text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 w-max"
              >
                {guardandoNotas && <Loader2 className="w-3 h-3 animate-spin" />}
                {guardandoNotas ? "Guardando..." : "Guardar notas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
