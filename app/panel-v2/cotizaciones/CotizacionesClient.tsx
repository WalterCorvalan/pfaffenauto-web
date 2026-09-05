"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import { crearAlerta } from "@/lib/panelV2/alertas";
import {
  Search, FileText, Wrench, Plus, CheckCircle2, XCircle, BellRing, Repeat,
  Pencil, MessageSquare, Globe, ExternalLink,
} from "lucide-react";
import { fmtFechaLocal } from "@/lib/panelV2/fechas";
import NuevaCotizacionModal from "./NuevaCotizacionModal";
import MigrarBorradoresModal from "./MigrarBorradoresModal";
import CotizacionDetalleModal from "./CotizacionDetalleModal";
import ModificarCotizacionModal from "./ModificarCotizacionModal";

interface Cotizacion {
  id: string; cliente_id: string | null; cliente_nombre: string; vehiculo_id: string | null; vehiculo_descripcion: string | null; vendedor_id: string | null;
  precio_sugerido: number; moneda: string; fecha_emision: string; fecha_vencimiento: string | null;
  condiciones_pago: string | null; notas: string | null; estado: string; revision_pedida: boolean; revision_mensaje: string | null;
  permuta_marca: string | null; permuta_modelo: string | null; permuta_anio: number | null; permuta_km: number | null;
  permuta_estado: string | null; permuta_patente: string | null; permuta_tasacion: number | null; created_at: string;
  precio_aprobado: number | null; notas_admin: string | null; updated_at: string;
  conversacion: { autor_nombre: string; texto: string; created_at: string }[];
  historial: { estado: string; actor_nombre: string; created_at: string }[];
}

// SLA de respuesta a una cotización pendiente: 48h. Se colorea según cuánto
// tiempo lleva esperando, igual que el resto de "pendiente hace Xh".
function horasPendiente(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}
function tiempoPendienteLabel(iso: string) {
  const h = horasPendiente(iso);
  if (h < 1) return `${Math.round(h * 60)}min`;
  if (h < 24) return `${Math.floor(h)}h`;
  return `${Math.floor(h / 24)}d ${Math.floor(h % 24)}h`;
}
interface Perfil { id: string; nombre: string; roles: string[] }
interface Cliente { id: string; nombre: string; telefono: string | null; dni_cuit: string | null }
interface Vehiculo { id: string; marca: string; modelo: string; anio: number; patente: string | null; precio_venta: number; moneda_venta: string; estado: string }
interface LeadWeb { id: string; nombre: string; telefono: string | null; marca: string; modelo: string | null; anio: number | null; oferta_calculada: number | null; precio_esperado_cliente: number | null; estado: string; created_at: string; tipo: string }

type Tab = "pendiente" | "aprobada" | "rechazada";

export default function CotizacionesClient({
  cotizacionesIniciales, perfiles, clientes, vehiculos, miId, slaHoras = 48, leadsWebIniciales = [],
}: { cotizacionesIniciales: Cotizacion[]; perfiles: Perfil[]; clientes: Cliente[]; vehiculos: Vehiculo[]; miId: string; slaHoras?: number; leadsWebIniciales?: LeadWeb[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cotizaciones, setCotizaciones] = useState(cotizacionesIniciales);
  const [tab, setTab] = useState<Tab>("pendiente");
  const [query, setQuery] = useState("");
  const [vendedorFiltro, setVendedorFiltro] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalMigrar, setModalMigrar] = useState(false);
  const [editando, setEditando] = useState<Cotizacion | null>(null);
  const [detalle, setDetalle] = useState<Cotizacion | null>(null);
  const [modificando, setModificando] = useState<Cotizacion | null>(null);
  const [pidiendoAtencionId, setPidiendoAtencionId] = useState<string | null>(null);
  const [mensajeAtencion, setMensajeAtencion] = useState("");
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") {
      setModalNuevo(true);
      router.replace("/panel-v2/cotizaciones");
    }
  }, [searchParams, router]);

  const perfilMap = useMemo(() => Object.fromEntries(perfiles.map((p) => [p.id, p.nombre])), [perfiles]);
  const miNombre = perfilMap[miId] || "Usuario";
  const soyAdmin = perfiles.find((p) => p.id === miId)?.roles?.includes("admin") ?? false;

  const onCreado = (c: Cotizacion) => setCotizaciones((prev) => (prev.some((x) => x.id === c.id) ? prev.map((x) => (x.id === c.id ? c : x)) : [c, ...prev]));

  const comentar = async (c: Cotizacion, textoForzado?: string) => {
    const texto = textoForzado ?? prompt("Comentario:");
    if (!texto || !texto.trim()) return null;
    const entrada = { autor_nombre: miNombre, texto: texto.trim(), created_at: new Date().toISOString() };
    const nuevaConversacion = [...(c.conversacion || []), entrada];
    const { error } = await supabase2.from("cotizaciones").update({ conversacion: nuevaConversacion }).eq("id", c.id);
    if (!error) setCotizaciones((prev) => prev.map((x) => (x.id === c.id ? { ...x, conversacion: nuevaConversacion } : x)));
    return nuevaConversacion;
  };
  const onMigradas = (ids: string[]) => setCotizaciones((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, estado: "pendiente" } : c)));

  const cambiarEstado = async (c: Cotizacion, nuevoEstado: "aprobada" | "rechazada") => {
    setActualizandoId(c.id);
    const notaAdmin = nuevoEstado === "aprobada" ? "Aprobada al precio sugerido (acción rápida)." : "Rechazada (acción rápida).";
    const nuevoHistorial = [...(c.historial || []), { estado: nuevoEstado, actor_nombre: miNombre, created_at: new Date().toISOString() }];
    const payload: any = { estado: nuevoEstado, revision_pedida: false, revision_mensaje: null, notas_admin: notaAdmin, historial: nuevoHistorial, updated_at: new Date().toISOString() };
    if (nuevoEstado === "aprobada") payload.precio_aprobado = c.precio_sugerido;
    const { error } = await supabase2.from("cotizaciones").update(payload).eq("id", c.id);
    if (!error) setCotizaciones((prev) => prev.map((x) => (x.id === c.id ? { ...x, ...payload } : x)));
    if (!error) await comentar({ ...c, conversacion: c.conversacion }, notaAdmin);
    setActualizandoId(null);
  };

  const pedirAtencion = async (c: Cotizacion) => {
    setActualizandoId(c.id);
    const { error } = await supabase2.from("cotizaciones").update({ revision_pedida: true, revision_mensaje: mensajeAtencion || null }).eq("id", c.id);
    if (!error) {
      setCotizaciones((prev) => prev.map((x) => (x.id === c.id ? { ...x, revision_pedida: true, revision_mensaje: mensajeAtencion || null } : x)));
      const admins = perfiles.filter((p) => p.roles?.includes("admin"));
      for (const admin of admins) {
        await crearAlerta(supabase2, admin.id, `Revisión pedida: ${c.cliente_nombre}`, {
          mensaje: mensajeAtencion || `${miNombre} pidió atención en una cotización.`,
          link: "/panel-v2/cotizaciones", tipo: "cotizacion", prioridad: "alta",
        });
      }
    }
    setPidiendoAtencionId(null);
    setMensajeAtencion("");
    setActualizandoId(null);
  };

  const filtradas = useMemo(() => {
    let lista = cotizaciones.filter((c) => c.estado === tab);
    if (vendedorFiltro) lista = lista.filter((c) => c.vendedor_id === vendedorFiltro);
    if (desde) lista = lista.filter((c) => c.fecha_emision >= desde);
    if (hasta) lista = lista.filter((c) => c.fecha_emision <= hasta);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      lista = lista.filter((c) => [c.cliente_nombre, c.vehiculo_descripcion, c.condiciones_pago].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return lista;
  }, [cotizaciones, tab, vendedorFiltro, desde, hasta, query]);

  const contadores = {
    pendiente: cotizaciones.filter((c) => c.estado === "pendiente").length,
    aprobada: cotizaciones.filter((c) => c.estado === "aprobada").length,
    rechazada: cotizaciones.filter((c) => c.estado === "rechazada").length,
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/5 px-6 py-4 bg-white dark:bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Cotizaciones</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{contadores.pendiente} pendientes · {contadores.aprobada} aprobadas · {contadores.rechazada} rechazadas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setModalMigrar(true)} className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-600 dark:text-slate-300"><Wrench className="w-4 h-4" /> Migrar borradores</button>
          <button onClick={() => setModalNuevo(true)} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors"><Plus className="w-4 h-4" /> Nueva cotización</button>
        </div>
      </header>

      <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02]">
        {[["pendiente", "Pendientes"], ["aprobada", "Aprobadas"], ["rechazada", "Rechazadas"]].map(([v, label]) => (
          <button key={v} onClick={() => setTab(v as Tab)} className={`px-3 py-2.5 text-sm font-bold border-b-2 transition-colors ${tab === v ? "border-rose-600 text-rose-600 dark:text-rose-400" : "border-transparent text-slate-400"}`}>{label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#141414] p-6">
        {leadsWebIniciales.length > 0 && (
          <div className="mb-6 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/10">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Tasaciones pedidas desde la web ({leadsWebIniciales.length})</p>
              <Link href="/panel-v2/peritajes" className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1">Gestionar en Peritajes <ExternalLink className="w-3 h-3" /></Link>
            </div>
            <p className="text-[11px] text-slate-400 px-4 pt-2">Solo lectura — se gestionan y convierten en peritaje desde el módulo Peritajes.</p>
            <div className="divide-y divide-slate-50 dark:divide-white/5">
              {leadsWebIniciales.map((l) => (
                <div key={l.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-white truncate">{l.nombre} <span className="text-[10px] font-bold uppercase text-slate-400 ml-1">{l.tipo === "permuta" ? "Permuta" : "Tasación"}</span></p>
                    <p className="text-[11px] text-slate-400 truncate">{[l.marca, l.modelo, l.anio].filter(Boolean).join(" ") || "—"} · {l.telefono || "sin teléfono"}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-bold text-slate-700 dark:text-slate-200">{(l.oferta_calculada ?? l.precio_esperado_cliente) ? `$ ${Number(l.oferta_calculada ?? l.precio_esperado_cliente).toLocaleString("es-AR")}` : "—"}</p>
                    <p className="text-[10px] text-slate-400">{fmtFechaLocal(l.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cliente, vehículo, notas..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400" />
          </div>
          <select value={vendedorFiltro} onChange={(e) => setVendedorFiltro(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white">
            <option value="">Todos los vendedores</option>
            {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white" />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white" />
        </div>

        {filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Sin resultados</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Todavía no hay cotizaciones cargadas. Podés crear una desde el botón de arriba.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-slate-100 dark:border-white/10">
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Vehículo</th>
                    <th className="px-4 py-3">Precios</th>
                    <th className="px-4 py-3">Vendedor</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {filtradas.map((c) => {
                    const horas = horasPendiente(c.created_at);
                    const slaColor = horas >= slaHoras ? "bg-rose-500" : horas >= slaHoras / 2 ? "bg-amber-500" : "bg-emerald-500";
                    const slaPct = Math.min(100, (horas / slaHoras) * 100);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5">
                        <td className="px-4 py-3 align-top cursor-pointer" onClick={() => setDetalle(c)}>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{c.cliente_nombre}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{fmtFechaLocal(c.fecha_emision)}</p>
                        </td>
                        <td className="px-4 py-3 align-top cursor-pointer" onClick={() => setDetalle(c)}>
                          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{c.vehiculo_descripcion || "—"}</p>
                          {(c.permuta_marca || c.permuta_modelo || c.permuta_estado) && (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20">
                              <Repeat className="w-3 h-3" /> PERMUTA: {[c.permuta_marca, c.permuta_modelo].filter(Boolean).join(" ") || c.permuta_estado}{c.permuta_anio ? ` (${c.permuta_anio})` : ""}{c.permuta_km ? ` · ${c.permuta_km.toLocaleString("es-AR")}km` : ""}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-[12px] text-slate-500 dark:text-slate-400 space-y-0.5 cursor-pointer" onClick={() => setDetalle(c)}>
                          <p><span className="text-slate-400 uppercase text-[9px] font-bold">Sug.</span> <strong className="text-slate-800 dark:text-white">{c.moneda} {c.precio_sugerido.toLocaleString("es-AR")}</strong></p>
                          {tab !== "pendiente" && <p><span className="text-slate-400 uppercase text-[9px] font-bold">Aprob.</span> {c.precio_aprobado != null ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">{c.moneda} {c.precio_aprobado.toLocaleString("es-AR")}</span> : <span className="text-slate-400">Pendiente</span>}</p>}
                          {c.permuta_tasacion != null && <p><span className="text-slate-400 uppercase text-[9px] font-bold">Toma</span> <span className="text-indigo-600 dark:text-indigo-300 font-bold">{c.moneda} {c.permuta_tasacion.toLocaleString("es-AR")}</span></p>}
                        </td>
                        <td className="px-4 py-3 align-top text-[13px] text-slate-600 dark:text-slate-300 cursor-pointer" onClick={() => setDetalle(c)}>{c.vendedor_id ? perfilMap[c.vendedor_id] : "Sin vendedor"}</td>
                        <td className="px-4 py-3 align-top min-w-[260px]">
                          <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded-full border ${tab === "pendiente" ? "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10" : tab === "aprobada" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20" : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20"}`}>
                            {tab === "pendiente" ? "Pendiente" : tab === "aprobada" ? "Aprobada" : "Rechazada"}
                          </span>
                          {tab !== "pendiente" && <p className="text-[10px] text-slate-400 mt-1">{tab === "aprobada" ? "Aprobada" : "Rechazada"} el {fmtFechaLocal(c.updated_at.slice(0, 10))}</p>}

                          {c.revision_pedida && (
                            <span className="flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 w-fit">
                              <BellRing className="w-3 h-3" /> Revisión pedida{c.revision_mensaje ? `: ${c.revision_mensaje}` : ""}
                            </span>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                            {tab === "pendiente" && (
                              <>
                                <button onClick={() => cambiarEstado(c, "aprobada")} disabled={actualizandoId === c.id} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 disabled:opacity-50"><CheckCircle2 className="w-3.5 h-3.5" /> Aprobar</button>
                                <button onClick={() => setModificando(c)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10"><Pencil className="w-3.5 h-3.5" /> Modificar</button>
                                <button onClick={() => cambiarEstado(c, "rechazada")} disabled={actualizandoId === c.id} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 disabled:opacity-50"><XCircle className="w-3.5 h-3.5" /> Rechazar</button>
                                <button onClick={() => comentar(c)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10"><MessageSquare className="w-3.5 h-3.5" /> Comentar</button>
                                {!c.revision_pedida && (
                                  pidiendoAtencionId === c.id ? (
                                    <div className="flex items-center gap-1.5 w-full mt-1">
                                      <input autoFocus value={mensajeAtencion} onChange={(e) => setMensajeAtencion(e.target.value)} placeholder="¿Por qué urge?" className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-rose-500 text-slate-900 dark:text-white" onKeyDown={(e) => e.key === "Enter" && pedirAtencion(c)} />
                                      <button onClick={() => pedirAtencion(c)} disabled={actualizandoId === c.id} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 shrink-0">Enviar</button>
                                      <button onClick={() => setPidiendoAtencionId(null)} className="text-[11px] text-slate-400 shrink-0">Cancelar</button>
                                    </div>
                                  ) : (
                                    <button onClick={() => setPidiendoAtencionId(c.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20"><BellRing className="w-3.5 h-3.5" /> Pedir atención</button>
                                  )
                                )}
                              </>
                            )}
                            {tab === "aprobada" && (
                              <a href={`/panel-v2/ventas?cotizacion=${c.id}`} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20"><Repeat className="w-3.5 h-3.5" /> Convertir en venta</a>
                            )}
                            {tab !== "pendiente" && <button onClick={() => setEditando(c)} className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><Pencil className="w-3.5 h-3.5" /> Editar</button>}
                          </div>

                          {tab === "pendiente" && (
                            <div className="mt-2.5 max-w-[220px]">
                              <p className="text-[10px] font-semibold text-slate-400">Pendiente hace {tiempoPendienteLabel(c.created_at)}</p>
                              <div className="h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden mt-1">
                                <div className={`h-full ${slaColor} rounded-full transition-all`} style={{ width: `${slaPct}%` }} />
                              </div>
                              <div className="flex justify-between text-[9px] text-slate-300 dark:text-slate-600 mt-0.5"><span>0</span><span>{Math.round(slaHoras / 3)}h</span><span>{Math.round((slaHoras / 3) * 2)}h</span><span>{slaHoras}h</span></div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {(modalNuevo || editando) && <NuevaCotizacionModal clientes={clientes} vehiculos={vehiculos} perfiles={perfiles} miId={miId} miNombre={miNombre} editando={editando || undefined} onClose={() => { setModalNuevo(false); setEditando(null); }} onCreado={onCreado} />}
      {modalMigrar && <MigrarBorradoresModal onClose={() => setModalMigrar(false)} onMigradas={onMigradas} />}
      {modificando && (
        <ModificarCotizacionModal
          cotizacion={modificando}
          vendedorNombre={modificando.vendedor_id ? perfilMap[modificando.vendedor_id] : "Sin vendedor"}
          miNombre={miNombre}
          onClose={() => setModificando(null)}
          onDecidido={(actualizada) => setCotizaciones((prev) => prev.map((x) => (x.id === actualizada.id ? actualizada : x)))}
        />
      )}
      {detalle && (
        <CotizacionDetalleModal
          cotizacion={cotizaciones.find((x) => x.id === detalle.id) || detalle}
          vendedorNombre={detalle.vendedor_id ? perfilMap[detalle.vendedor_id] : "Sin vendedor"}
          soyAdmin={soyAdmin}
          onClose={() => setDetalle(null)}
          onComentar={(texto) => comentar(detalle, texto)}
          onEliminar={async () => {
            if (!confirm("¿Eliminar esta cotización? No se puede deshacer.")) return;
            const { error, count } = await supabase2.from("cotizaciones").delete({ count: "exact" }).eq("id", detalle.id);
            if (error || !count) { alert("No se pudo eliminar (sin permiso o ya no existe)."); return; }
            setCotizaciones((prev) => prev.filter((x) => x.id !== detalle.id));
            setDetalle(null);
          }}
          onEditar={() => { setEditando(detalle); setDetalle(null); }}
        />
      )}
    </div>
  );
}
