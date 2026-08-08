"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
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
} from "lucide-react";

const ETAPAS_PIPELINE = [
  "Nuevo",
  "En conversación",
  "Interesado",
  "Cliente",
  "Perdido",
];

export default function ChatClient({
  conversacionesIniciales,
}: {
  conversacionesIniciales: any[];
}) {
  const [conversaciones] = useState(conversacionesIniciales);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "no-leidas">("todas");
  const [loading, setLoading] = useState(false);

  // Nuevos estados para el Panel de Detalles
  const [panelAbierto, setPanelAbierto] = useState(true);
  const [etapaActual, setEtapaActual] = useState("Nuevo");
  const [notasLocales, setNotasLocales] = useState("");
  const [guardandoNotas, setGuardandoNotas] = useState(false);

  const mensajesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // Cargar mensajes y detalles (etapa y notas) cuando se selecciona un chat
  useEffect(() => {
    if (!seleccionada) return;
    setLoading(true);

    // 1. Traer mensajes
    supabase
      .from("whatsapp_mensajes")
      .select("*")
      .eq("conversacion_id", seleccionada)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMensajes(data || []);
        setLoading(false);
      });

    // 2. Traer estado del pipeline y notas de la conversación
    supabase
      .from("whatsapp_conversaciones")
      .select("estado_pipeline, notas")
      .eq("id", seleccionada)
      .single()
      .then(({ data }) => {
        if (data) {
          setEtapaActual(data.estado_pipeline || "Nuevo");
          setNotasLocales(data.notas || "");
        }
      });
  }, [seleccionada]);

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !seleccionada) return;

    const texto = nuevoMensaje.trim();
    setNuevoMensaje("");

    const tempMsg = {
      id: crypto.randomUUID(),
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
      const { error } = await supabase.from("whatsapp_mensajes").insert({
        conversacion_id: seleccionada,
        direccion: "out",
        tipo: "text",
        texto: texto,
        ai_generado: false,
        status: "pending",
      });
      if (error) throw error;
    } catch (err) {
      console.error("Error al enviar", err);
    }
  };

  // Funciones para actualizar Pipeline y Notas
  const cambiarEtapa = async (nuevaEtapa: string) => {
    if (!seleccionada || nuevaEtapa === etapaActual) return;
    setEtapaActual(nuevaEtapa); // Actualización optimista UI
    try {
      await supabase
        .from("whatsapp_conversaciones")
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
        .from("whatsapp_conversaciones")
        .update({ notas: notasLocales })
        .eq("id", seleccionada);
    } catch (error) {
      console.error("Error guardando notas", error);
    } finally {
      setGuardandoNotas(false);
    }
  };

  const conversacionActiva = conversaciones.find((c) => c.id === seleccionada);
  const contactoActivo = conversacionActiva?.whatsapp_contactos;

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

  // crear cliente nuevo a partir del contacto de WhatsApp
  const crearClienteDesdeContacto = async () => {
    if (!contactoActivo) return;
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nombre: contactoActivo.nombre_perfil || "Sin nombre",
        apellido: "",
        telefono_celular: contactoActivo.telefono,
      })
      .select("id")
      .single();
    if (error) return alert("Error creando cliente");
    await vincularCliente(data.id);
  };

  const vincularCliente = async (clienteId: string) => {
    if (!seleccionada) return;
    await supabase
      .from("whatsapp_conversaciones")
      .update({ cliente_id: clienteId })
      .eq("id", seleccionada);
    setShowVincular(false);
    // refrescar conversacionActiva: lo simple es window.location.reload() o refetch de conversaciones
  };

  const vincularVehiculo = async (vehiculoId: string) => {
    if (!seleccionada) return;
    await supabase
      .from("whatsapp_conversaciones")
      .update({ vehiculo_id: vehiculoId })
      .eq("id", seleccionada);
    setShowVincular(false);
  };

  return (
    <div className="flex w-full h-full text-slate-800">
      {/* ================= COLUMNA 1: BANDEJA (Izquierda) ================= */}
      <div className="w-full md:w-[320px] flex flex-col bg-white border-r border-slate-200 shrink-0">
        <div className="p-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-[17px] font-bold text-slate-900 mb-4 flex items-center gap-2">
            Bandeja{" "}
            <span className="text-sm font-normal text-slate-400">
              {conversaciones.length}
            </span>
          </h2>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar conversación..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-sm outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFiltro("todas")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${filtro === "todas" ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              Todas {conversaciones.length}
            </button>
            <button
              onClick={() => setFiltro("no-leidas")}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors flex items-center gap-1 ${filtro === "no-leidas" ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              No leídas{" "}
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                0
              </span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversaciones.map((c) => {
            const contacto = c.whatsapp_contactos;
            const iniciales = (
              contacto?.nombre_perfil ||
              contacto?.telefono ||
              "?"
            )
              .substring(0, 2)
              .toUpperCase();
            const isActive = seleccionada === c.id;

            return (
              <button
                key={c.id}
                onClick={() => setSeleccionada(c.id)}
                className={`w-full text-left p-3.5 border-b border-slate-100 transition-all flex gap-3 ${
                  isActive
                    ? "bg-emerald-50 border-l-2 border-l-emerald-700"
                    : "bg-white border-l-2 border-l-transparent hover:bg-slate-50"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {iniciales}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <span
                      className={`font-bold text-sm truncate ${isActive ? "text-emerald-900" : "text-slate-900"}`}
                    >
                      {contacto?.nombre_perfil || contacto?.telefono}
                    </span>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {c.last_message_at ? formatDay(c.last_message_at) : ""}
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-500 truncate mb-1.5">
                    Clic para ver historial...
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= COLUMNA 2: CHAT (Centro) ================= */}
      <div
        className={`flex-1 flex flex-col bg-[#F0F2F5] relative ${!seleccionada ? "hidden md:flex" : "flex"}`}
      >
        {!seleccionada ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <p className="text-sm font-medium">
              Elige una conversación para ver el hilo
            </p>
          </div>
        ) : (
          <>
            {/* Header del Chat */}
            <div className="h-[60px] bg-white border-b border-slate-200 flex justify-between items-center px-6 shrink-0 shadow-sm z-10">
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
                  <h3 className="font-bold text-slate-900 text-[15px] leading-tight">
                    {contactoActivo?.nombre_perfil || "Cliente"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {contactoActivo?.telefono}
                  </p>
                </div>
              </div>

              {/* Botón para abrir el panel si está cerrado */}
              <div className="flex items-center gap-2">
                <button
                  className="md:hidden text-emerald-700 text-sm font-bold"
                  onClick={() => setSeleccionada(null)}
                >
                  Atrás
                </button>
                {!panelAbierto && (
                  <button
                    onClick={() => setPanelAbierto(true)}
                    className="hidden lg:flex p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-md transition-colors"
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
                  <span className="text-xs text-slate-500">Cargando...</span>
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
                              ? "bg-white border-slate-200 text-slate-800 rounded-tr-none"
                              : "bg-white border-slate-200 text-slate-800 rounded-tl-none"
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">
                            {m.texto}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                            {out && m.ai_generado && (
                              <Bot className="w-3 h-3 text-slate-400" />
                            )}
                            <span className="text-[10px] text-slate-400 font-medium">
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
            <div className="p-4 bg-[#F0F2F5]">
              <form
                onSubmit={enviarMensaje}
                className="flex items-center gap-3 max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl px-2 py-1.5 shadow-sm"
              >
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-transparent px-3 py-2 text-[15px] text-slate-800 outline-none"
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
        <div className="w-[300px] bg-white border-l border-slate-200 flex-col hidden lg:flex shrink-0 transition-all duration-300">
          {/* Header Detalles */}
          <div className="h-[60px] p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Detalles
            </h3>
            <button
              onClick={() => setPanelAbierto(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Info Perfil */}
            <div className="p-6 border-b border-slate-200 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-slate-600 text-xl font-bold flex items-center justify-center text-white mb-3 shadow-sm">
                {(
                  contactoActivo?.nombre_perfil ||
                  contactoActivo?.telefono ||
                  "?"
                )
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <h3 className="font-bold text-slate-900 text-lg">
                {contactoActivo?.nombre_perfil || "Cliente"}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {contactoActivo?.telefono}
              </p>
            </div>

            {/* IA Toggle */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    IA en esta conversación
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {conversacionActiva?.ai_habilitada ? "Activada" : "Pausada"}
                  </p>
                </div>
                <div
                  className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${conversacionActiva?.ai_habilitada ? "bg-emerald-700 justify-end" : "bg-slate-300 justify-start"}`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
              {!conversacionActiva?.ai_habilitada && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-2">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Falta la clave de IA de la instancia o intervino un humano.
                  </p>
                </div>
              )}
            </div>

            {/* Etapa del Pipeline */}
            <div className="p-6 border-b border-slate-200">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Etapa del Pipeline
              </h4>
              <div className="space-y-4 relative">
                <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-slate-200 -z-10"></div>

                {ETAPAS_PIPELINE.map((etapa, i) => {
                  const isCompleted = i < indexEtapaActual;
                  const isCurrent = i === indexEtapaActual;

                  return (
                    <div
                      key={etapa}
                      onClick={() => cambiarEtapa(etapa)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="bg-white z-10 flex items-center justify-center">
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                        ) : isCurrent ? (
                          <Circle className="w-5 h-5 text-slate-800 fill-slate-700" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors bg-white" />
                        )}
                      </div>
                      <span
                        className={`text-[13px] transition-colors ${
                          isCurrent
                            ? "text-slate-900 font-bold"
                            : isCompleted
                              ? "text-slate-700 font-medium"
                              : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      >
                        {etapa}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setShowVincular(true)}
              className="mt-3 w-full bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg"
            >
              {conversacionActiva?.cliente_id
                ? "Cliente vinculado ✓"
                : "Vincular a cliente / auto"}
            </button>
            {showVincular && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl p-5 w-full max-w-sm space-y-4">
                  <h3 className="font-bold text-sm">Vincular conversación</h3>

                  <div>
                    <label className="text-xs font-bold text-slate-500">
                      Cliente
                    </label>
                    <input
                      value={buscarCliente}
                      onChange={(e) => buscarClientesFn(e.target.value)}
                      placeholder="Buscar por nombre..."
                      className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                    />
                    {clientesResult.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => vincularCliente(c.id)}
                        className="block w-full text-left text-sm px-2 py-1.5 hover:bg-slate-50 rounded"
                      >
                        {c.nombre} {c.apellido} — {c.telefono_celular}
                      </button>
                    ))}
                    <button
                      onClick={crearClienteDesdeContacto}
                      className="text-xs text-emerald-700 font-bold mt-2"
                    >
                      + Crear cliente nuevo con estos datos
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500">
                      Vehículo (opcional)
                    </label>
                    <input
                      value={buscarVehiculo}
                      onChange={(e) => buscarVehiculosFn(e.target.value)}
                      placeholder="Marca, modelo o patente..."
                      className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                    />
                    {vehiculosResult.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => vincularVehiculo(v.id)}
                        className="block w-full text-left text-sm px-2 py-1.5 hover:bg-slate-50 rounded"
                      >
                        {v.marca} {v.modelo} {v.patente ? `(${v.patente})` : ""}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowVincular(false)}
                    className="text-xs text-slate-500"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            {/* Bloque de Notas */}
            <div className="p-6">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Notas
              </h4>
              <textarea
                value={notasLocales}
                onChange={(e) => setNotasLocales(e.target.value)}
                placeholder="Notas internas sobre este contacto..."
                className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[13px] text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none custom-scrollbar"
              />
              <button
                onClick={guardarNotas}
                disabled={guardandoNotas}
                className="mt-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 w-max"
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
