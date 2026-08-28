"use client";

import { useState, useEffect, useRef } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2, Pencil, MessageCircle, PlayCircle, BellRing, CheckCircle2, RotateCcw, Paperclip, Send } from "lucide-react";
import { crearAlerta } from "@/lib/panelV2/alertas";

const SECTORES = [
  { value: "ventas", label: "Ventas" },
  { value: "gestoria", label: "Gestoría" },
  { value: "finanzas", label: "Finanzas" },
  { value: "taller", label: "Taller" },
  { value: "recepcion", label: "Recepción" },
  { value: "admin", label: "Admin" },
];

const ESTADO_LABEL: Record<string, string> = { abierto: "Abierto", en_curso: "En curso", cerrado: "Cerrado" };
const ESTADO_CLASS: Record<string, string> = {
  abierto: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  en_curso: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  cerrado: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400",
};
const PRIORIDAD_CLASS: Record<string, string> = {
  Baja: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  Normal: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  Alta: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  Urgente: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const TIPO_ICONO: Record<string, string> = {
  creacion: "📣", comentario: "💬", cambio_estado: "🔄", pedido_atencion: "🔔", cierre: "✅", reapertura: "↩️",
};

function tiempoRelativo(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias === 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias}d`;
}

interface Perfil { id: string; nombre: string; roles: string[] }

interface Props {
  reclamoId: string;
  miId: string;
  perfiles: Perfil[];
  onClose: () => void;
  onActualizado: (reclamo: any) => void;
}

export default function ReclamoDetalleModal({ reclamoId, miId, perfiles, onClose, onActualizado }: Props) {
  const [reclamo, setReclamo] = useState<any>(null);
  const [seguimiento, setSeguimiento] = useState<any[]>([]);
  const [adjuntos, setAdjuntos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mostrarPedido, setMostrarPedido] = useState(false);
  const [sectorPedido, setSectorPedido] = useState("");
  const [mensajePedido, setMensajePedido] = useState("");
  const [mostrarCierre, setMostrarCierre] = useState(false);
  const [notaCierre, setNotaCierre] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cargar = async () => {
    const [{ data: r }, { data: s }, { data: a }] = await Promise.all([
      supabase2.from("reclamos").select("*, asignado:perfiles!reclamos_asignado_a_fkey(id, nombre)").eq("id", reclamoId).single(),
      supabase2.from("reclamo_seguimiento").select("*, autor:perfiles(id, nombre)").eq("reclamo_id", reclamoId).order("created_at", { ascending: true }),
      supabase2.from("reclamo_adjuntos").select("*").eq("reclamo_id", reclamoId).order("created_at", { ascending: false }),
    ]);
    setReclamo(r);
    setSeguimiento(s || []);
    setAdjuntos(a || []);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [reclamoId]);

  const autorNombre = perfiles.find((p) => p.id === miId)?.nombre || "Alguien";

  const registrarMovimiento = async (tipo: string, texto: string, sector?: string) => {
    await supabase2.from("reclamo_seguimiento").insert({ reclamo_id: reclamoId, autor_id: miId, tipo, texto, sector: sector || null });
  };

  const cambiarEstado = async (nuevoEstado: string, texto: string) => {
    const { data } = await supabase2.from("reclamos").update({ estado: nuevoEstado }).eq("id", reclamoId).select("*, asignado:perfiles!reclamos_asignado_a_fkey(id, nombre)").single();
    await registrarMovimiento("cambio_estado", texto);
    if (data) { setReclamo(data); onActualizado(data); }
    await cargar();
  };

  const tomar = () => cambiarEstado("en_curso", `${autorNombre} tomó el reclamo (En curso)`);
  const volverAbierto = () => cambiarEstado("abierto", `${autorNombre} lo volvió a Abierto`);

  const cerrar = async () => {
    if (!notaCierre.trim()) return;
    const { data } = await supabase2.from("reclamos").update({ estado: "cerrado", nota_cierre: notaCierre.trim() }).eq("id", reclamoId).select("*, asignado:perfiles!reclamos_asignado_a_fkey(id, nombre)").single();
    await registrarMovimiento("cierre", `Cerrado: ${notaCierre.trim()}`);
    if (data) { setReclamo(data); onActualizado(data); }
    setMostrarCierre(false);
    setNotaCierre("");
    await cargar();
  };

  const reabrir = async () => {
    const { data } = await supabase2.from("reclamos").update({ estado: "abierto" }).eq("id", reclamoId).select("*, asignado:perfiles!reclamos_asignado_a_fkey(id, nombre)").single();
    await registrarMovimiento("reapertura", `${autorNombre} reabrió el reclamo`);
    if (data) { setReclamo(data); onActualizado(data); }
    await cargar();
  };

  const enviarComentario = async () => {
    if (!comentario.trim()) return;
    setEnviando(true);
    await registrarMovimiento("comentario", comentario.trim());
    setComentario("");
    setEnviando(false);
    await cargar();
  };

  const pedirAtencion = async () => {
    if (!sectorPedido) return;
    await registrarMovimiento("pedido_atencion", mensajePedido.trim() || `${autorNombre} pidió atención de ${SECTORES.find((s) => s.value === sectorPedido)?.label}`, sectorPedido);
    setMostrarPedido(false);
    setSectorPedido("");
    setMensajePedido("");
    await cargar();
    const { data: r } = await supabase2.from("reclamos").select("*, asignado:perfiles!reclamos_asignado_a_fkey(id, nombre)").eq("id", reclamoId).single();
    if (r) { setReclamo(r); onActualizado(r); }
  };

  const subirArchivo = async (file: File) => {
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("carpeta", "reclamos");
      const res = await fetch("/api/panel-v2/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error subiendo el archivo");
      await supabase2.from("reclamo_adjuntos").insert({ reclamo_id: reclamoId, nombre: data.nombre || file.name, url: data.publicUrl, subido_por: miId });
      await cargar();
    } catch (e) {
      alert("No se pudo subir el archivo.");
    } finally {
      setSubiendo(false);
    }
  };

  if (cargando || !reclamo) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white" />
      </div>
    );
  }

  const whatsappHref = reclamo.cliente_telefono
    ? `https://wa.me/${reclamo.cliente_telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${reclamo.cliente_nombre}! Te escribimos de Pfaffen Autos por tu reclamo: ${reclamo.titulo}.`)}`
    : null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 sticky top-0 bg-white dark:bg-[#111] z-10">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{reclamo.tipo} · Cliente: {reclamo.cliente_nombre}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${ESTADO_CLASS[reclamo.estado]}`}>{ESTADO_LABEL[reclamo.estado]}</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${PRIORIDAD_CLASS[reclamo.prioridad]}`}>{reclamo.prioridad}</span>
            <span className="text-[10px] font-semibold text-slate-400">{tiempoRelativo(reclamo.created_at)}</span>
            {reclamo.asignado && <span className="text-[10px] font-semibold text-slate-400">Asignado a {reclamo.asignado.nombre}</span>}
          </div>

          {reclamo.pedido_atencion_sector && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">🔔 Pedido a {SECTORES.find((s) => s.value === reclamo.pedido_atencion_sector)?.label || reclamo.pedido_atencion_sector}</p>
              {reclamo.pedido_atencion_mensaje && <p className="text-xs text-amber-700/80 dark:text-amber-300/70 mt-0.5">{reclamo.pedido_atencion_mensaje}</p>}
            </div>
          )}

          <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3.5">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Cliente</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{reclamo.cliente_nombre}</p>
                <p className="text-xs text-slate-400">{[reclamo.cliente_telefono, reclamo.cliente_email].filter(Boolean).join(" · ")}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Referencia</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{reclamo.referencia || "—"}</p>
              </div>
            </div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Descripción</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{reclamo.descripcion || "—"}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20 hover:bg-emerald-100">
                <MessageCircle className="w-3.5 h-3.5" /> Responder por WhatsApp
              </a>
            )}
            {reclamo.estado === "abierto" && (
              <button onClick={tomar} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">
                <PlayCircle className="w-3.5 h-3.5" /> Tomar (En curso)
              </button>
            )}
            {reclamo.estado === "en_curso" && (
              <button onClick={volverAbierto} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">
                <RotateCcw className="w-3.5 h-3.5" /> Volver a Abierto
              </button>
            )}
            {reclamo.estado !== "cerrado" && (
              <button onClick={() => setMostrarPedido((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">
                <BellRing className="w-3.5 h-3.5" /> Pedir atención
              </button>
            )}
            {reclamo.estado !== "cerrado" ? (
              <button onClick={() => setMostrarCierre((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white">
                <CheckCircle2 className="w-3.5 h-3.5" /> Cerrar reclamo
              </button>
            ) : (
              <button onClick={reabrir} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20">
                <RotateCcw className="w-3.5 h-3.5" /> Reabrir
              </button>
            )}
          </div>

          {mostrarPedido && (
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-3.5 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Pedir atención a un sector</p>
              <select value={sectorPedido} onChange={(e) => setSectorPedido(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none">
                <option value="">— Elegí un sector —</option>
                {SECTORES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <textarea value={mensajePedido} onChange={(e) => setMensajePedido(e.target.value)} rows={2} placeholder="Mensaje (opcional): qué necesitás de ese sector..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setMostrarPedido(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500">Cancelar</button>
                <button onClick={pedirAtencion} disabled={!sectorPedido} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Enviar pedido
                </button>
              </div>
            </div>
          )}

          {mostrarCierre && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-3.5 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-300">Nota de cierre</p>
              <textarea value={notaCierre} onChange={(e) => setNotaCierre(e.target.value)} rows={2} placeholder="¿Cómo se resolvió?" className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setMostrarCierre(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500">Cancelar</button>
                <button onClick={cerrar} disabled={!notaCierre.trim()} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50">Cerrar reclamo</button>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Adjuntos</p>
              <button onClick={() => fileRef.current?.click()} disabled={subiendo} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50">
                {subiendo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />} Adjuntar archivo
              </button>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && subirArchivo(e.target.files[0])} />
            </div>
            {adjuntos.length === 0 ? (
              <p className="text-xs text-slate-400">Sin adjuntos. Subí fotos del daño, comprobantes o documentos (imagen o PDF).</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {adjuntos.map((a) => (
                  <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100">{a.nombre}</a>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Seguimiento</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {seguimiento.map((s) => (
                <div key={s.id} className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{TIPO_ICONO[s.tipo] || "💬"} {s.autor?.nombre || "Sistema"}</p>
                    <p className="text-[10px] text-slate-400">{new Date(s.created_at).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  {s.texto && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{s.texto}</p>}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={2} placeholder="Escribí una actualización del seguimiento..." className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm outline-none" />
              <button onClick={enviarComentario} disabled={enviando || !comentario.trim()} className="px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 shrink-0">
                {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
