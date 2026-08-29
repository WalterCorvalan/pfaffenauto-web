"use client";

import { useState, useEffect } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { X, Loader2, ChevronDown, MessageCircle, Phone, Clock } from "lucide-react";
import { fmtFechaLocal, hoyLocalISO } from "@/lib/panelV2/fechas";

interface Perfil { id: string; nombre: string; roles: string[] }

const ESTADOS = [
  { value: "pendiente_contacto", label: "Pendiente contacto", emoji: "⏳", desc: "Todavía no se contactó al dueño." },
  { value: "contactado", label: "Contactado", emoji: "📞", desc: "Ya se habló con el dueño." },
  { value: "agendado", label: "Agendado", emoji: "📅", desc: "Se coordinó una fecha para el ingreso." },
  { value: "ingreso_local", label: "Ingresó al local", emoji: "🏠", desc: "El vehículo ya está en la agencia." },
  { value: "publicado", label: "Publicado", emoji: "📣", desc: "Expuesto al público — esperando oferta o cierre." },
  { value: "cancelado", label: "Cancelado", emoji: "✕", desc: "El dueño desistió o se descartó." },
  { value: "consignado", label: "Consignado", emoji: "✅", desc: "Cerrada — quedó formalmente en consignación." },
];
const ESTADO_MAP = Object.fromEntries(ESTADOS.map((e) => [e.value, e]));

export default function ConsignacionDetalleModal({ consignacionId, perfiles, soyAdmin, onClose, onActualizado, onEliminado }: {
  consignacionId: string; perfiles: Perfil[]; soyAdmin: boolean; onClose: () => void; onActualizado: (c: any) => void; onEliminado: (id: string) => void;
}) {
  const [consignacion, setConsignacion] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [mostrarEstados, setMostrarEstados] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [vehiculoDescripcion, setVehiculoDescripcion] = useState("");
  const [vendedorId, setVendedorId] = useState("");
  const [publicada, setPublicada] = useState(false);
  const [observaciones, setObservaciones] = useState("");

  const cargar = async () => {
    const { data } = await supabase2.from("consignaciones").select("*, vendedor:perfiles!consignaciones_vendedor_id_fkey ( id, nombre )").eq("id", consignacionId).single();
    if (data) {
      setConsignacion(data);
      setVehiculoDescripcion(data.vehiculo_descripcion || "");
      setVendedorId(data.vendedor_id || "");
      setPublicada(data.publicada);
      setObservaciones(data.observaciones || "");
    }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, [consignacionId]);

  const cambiarEstado = async (nuevo: string) => {
    if (nuevo === "consignado" && consignacion.estado !== "consignado") {
      if (!confirm("¿Marcar esta consignación como Consignado? Se salta el resto de los pasos.")) return;
    }
    const { data } = await supabase2.from("consignaciones").update({ estado: nuevo }).eq("id", consignacionId).select("*, vendedor:perfiles!consignaciones_vendedor_id_fkey ( id, nombre )").single();
    if (data) { setConsignacion(data); onActualizado(data); }
    setMostrarEstados(false);
  };

  const marcarContactoHoy = async () => {
    const { data } = await supabase2.from("consignaciones").update({ ultimo_contacto: hoyLocalISO() }).eq("id", consignacionId).select("*, vendedor:perfiles!consignaciones_vendedor_id_fkey ( id, nombre )").single();
    if (data) { setConsignacion(data); onActualizado(data); }
  };

  const togglePublicada = async (val: boolean) => {
    setPublicada(val);
    const { data } = await supabase2.from("consignaciones").update({ publicada: val }).eq("id", consignacionId).select("*, vendedor:perfiles!consignaciones_vendedor_id_fkey ( id, nombre )").single();
    if (data) { setConsignacion(data); onActualizado(data); }
  };

  const guardarEdicion = async () => {
    setGuardando(true);
    try {
      const { data, error } = await supabase2.from("consignaciones").update({
        vehiculo_descripcion: vehiculoDescripcion.trim(), vendedor_id: vendedorId || null, publicada, observaciones: observaciones.trim() || null,
      }).eq("id", consignacionId).select("*, vendedor:perfiles!consignaciones_vendedor_id_fkey ( id, nombre )").single();
      if (error) throw error;
      setConsignacion(data);
      onActualizado(data);
      setEditando(false);
    } catch {
      alert("No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const cancelarConsignacion = async () => {
    if (!confirm("¿Cancelar esta consignación?")) return;
    await cambiarEstado("cancelado");
  };

  const eliminar = async () => {
    if (!confirm("¿Eliminar esta consignación? No se puede deshacer.")) return;
    const { error, count } = await supabase2.from("consignaciones").delete({ count: "exact" }).eq("id", consignacionId);
    if (error || !count) { alert("No se pudo eliminar."); return; }
    onEliminado(consignacionId);
    onClose();
  };

  if (cargando || !consignacion) {
    return <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white" /></div>;
  }

  const estadoInfo = ESTADO_MAP[consignacion.estado];
  const whatsappHref = consignacion.cliente_telefono
    ? `https://wa.me/${consignacion.cliente_telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`¡Hola ${consignacion.cliente_nombre}! Te escribimos de Pfaffen Autos por la consignación de tu ${consignacion.vehiculo_descripcion}.`)}`
    : null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-end px-5 pt-4 sticky top-0 bg-white dark:bg-[#111] z-10">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${consignacion.estado === "consignado" || consignacion.estado === "publicado" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>{estadoInfo.emoji} {estadoInfo.label}</span>
            {consignacion.vendedor?.nombre && <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">{consignacion.vendedor.nombre}</span>}
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">{fmtFechaLocal(consignacion.fecha_alta)}</span>
            {consignacion.publicada && <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Publicada</span>}
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Cliente</p>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{consignacion.cliente_nombre}</p>
              {consignacion.cliente_telefono && (
                <div className="flex items-center gap-3 mt-1">
                  <a href={`tel:${consignacion.cliente_telefono}`} className="flex items-center gap-1 text-xs font-semibold text-rose-600"><Phone className="w-3.5 h-3.5" /> {consignacion.cliente_telefono}</a>
                  {whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</a>}
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Vehículo a consignar</p>
            {editando ? (
              <textarea value={vehiculoDescripcion} onChange={(e) => setVehiculoDescripcion(e.target.value)} rows={2} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm outline-none" />
            ) : (
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3"><p className="text-sm text-slate-700 dark:text-slate-200">{consignacion.vehiculo_descripcion}</p></div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Seguimiento</p>
              <button onClick={marcarContactoHoy} className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-300"><Clock className="w-3.5 h-3.5" /> Marcar contacto hoy</button>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Vendedor</span>
                {editando ? (
                  <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs">
                    <option value="">Sin asignar</option>
                    {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                ) : (
                  <span className="text-xs font-bold text-slate-800 dark:text-white">{consignacion.vendedor?.nombre || "Sin asignar"}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Último contacto</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">{consignacion.ultimo_contacto ? fmtFechaLocal(consignacion.ultimo_contacto) : "Sin registro — usando fecha de alta."}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Publicada</span>
                <input type="checkbox" checked={publicada} onChange={(e) => (editando ? setPublicada(e.target.checked) : togglePublicada(e.target.checked))} className="w-4 h-4 accent-rose-600" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Estado</p>
              <div className="relative">
                <button onClick={() => setMostrarEstados((v) => !v)} className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1">Cambiar estado <ChevronDown className="w-3.5 h-3.5" /></button>
                {mostrarEstados && (
                  <div className="absolute right-0 mt-1 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl w-56 py-1 z-20">
                    {ESTADOS.filter((e) => e.value !== consignacion.estado).map((e) => (
                      <button key={e.value} onClick={() => cambiarEstado(e.value)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-white/5">{e.emoji} {e.label}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3 flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${consignacion.estado === "consignado" || consignacion.estado === "publicado" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>{estadoInfo.emoji} {estadoInfo.label}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{estadoInfo.desc}</span>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Observaciones y fechas</p>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Observaciones</span>
                {editando ? (
                  <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs outline-none" />
                ) : (
                  <span className="text-xs font-bold text-slate-800 dark:text-white text-right">{consignacion.observaciones || "—"}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Fecha de alta</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">📅 {fmtFechaLocal(consignacion.fecha_alta)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-100 dark:border-white/10 sticky bottom-0 bg-white dark:bg-[#111]">
          <button onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-500">Cerrar</button>
          <div className="flex-1" />
          {editando ? (
            <>
              <button onClick={() => setEditando(false)} className="px-3 py-2 text-xs font-semibold text-slate-500">Descartar</button>
              <button onClick={guardarEdicion} disabled={guardando} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">{guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Guardar</button>
            </>
          ) : (
            <>
              {consignacion.estado !== "cancelado" && consignacion.estado !== "consignado" && (
                <button onClick={cancelarConsignacion} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white dark:bg-white/5 border border-rose-200 dark:border-rose-500/20 text-rose-600 rounded-xl">Cancelar consignación</button>
              )}
              <button onClick={() => setEditando(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold">Editar</button>
              {soyAdmin && <button onClick={eliminar} className="px-3 py-2 text-xs font-bold text-rose-600">Eliminar</button>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
