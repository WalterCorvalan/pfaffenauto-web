"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import { ChevronDown, ChevronRight, MessageCircle, Check, ClipboardList, AlertTriangle, Clock, ShieldAlert, Lock } from "lucide-react";
import ExpedienteDetalleModal from "../expedientes/ExpedienteDetalleModal";
import { fmtFechaLocal, hoyLocalISO } from "@/lib/panelV2/fechas";

interface Perfil { id: string; nombre: string; roles: string[] }

const ESTADO_LABEL: Record<string, string> = { abierto: "En proceso", en_tramite: "En proceso", cerrado: "Finalizado" };
const ESTADO_CLASS: Record<string, string> = {
  abierto: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  en_tramite: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  cerrado: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
};
const PRIORIDAD_COLOR: Record<string, string> = { Baja: "text-slate-500", Media: "text-amber-500", Alta: "text-rose-500" };

export default function GestoriaClient({
  expedientesIniciales, hitosPorExpediente, checklistPorExpediente, perfiles, miId, soyAdmin, puedeOperacionCaida, puedeVerLiquidacion, gananciasOcultas,
}: {
  expedientesIniciales: any[]; hitosPorExpediente: Record<string, any[]>; checklistPorExpediente: Record<string, any[]>;
  perfiles: Perfil[]; miId: string; soyAdmin: boolean; puedeOperacionCaida: boolean; puedeVerLiquidacion: boolean; gananciasOcultas: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expedientes, setExpedientes] = useState(expedientesIniciales);
  const [hitos, setHitos] = useState(hitosPorExpediente);
  const [checklist, setChecklist] = useState(checklistPorExpediente);
  const [tab, setTab] = useState<"activos" | "finalizados">("activos");
  const [vista, setVista] = useState<"cards" | "tabla">("cards");
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [detalleId, setDetalleId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("expediente");
    if (id) setDetalleId(id);
  }, [searchParams]);

  const perfilMap = useMemo(() => Object.fromEntries(perfiles.map((p) => [p.id, p.nombre])), [perfiles]);
  const hoy = hoyLocalISO();
  const en7dias = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const activos = expedientes.filter((e) => e.estado !== "cerrado");
  const finalizados = expedientes.filter((e) => e.estado === "cerrado");

  const vencidos = activos.filter((e) => e.vencimiento && e.vencimiento < hoy).length;
  const vencen7 = activos.filter((e) => e.vencimiento && e.vencimiento >= hoy && e.vencimiento <= en7dias).length;
  const sinConfirmar = activos.filter((e) => !e.confirmado_comprador || !e.confirmado_consignacion).length;
  const demorados = activos.filter((e) => {
    const dias = Math.floor((Date.now() - new Date(e.fecha_apertura || e.created_at).getTime()) / 86400000);
    return dias > 15;
  }).length;

  const lista = tab === "activos" ? activos : finalizados;

  const toggleExpandido = (id: string) => setExpandidos((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const expandirTodos = () => setExpandidos(new Set(lista.map((e) => e.id)));
  const minimizarTodos = () => setExpandidos(new Set());

  const toggleHito = async (expedienteId: string, h: any) => {
    const nuevo = !h.completado;
    await supabase2.from("expediente_hitos").update({ completado: nuevo, completado_en: nuevo ? new Date().toISOString() : null }).eq("id", h.id);
    setHitos((prev) => ({ ...prev, [expedienteId]: prev[expedienteId].map((x) => (x.id === h.id ? { ...x, completado: nuevo } : x)) }));
  };

  const toggleChecklist = async (expedienteId: string, item: any) => {
    const nuevo = !item.completado;
    await supabase2.rpc("expediente_checklist_tildar", { p_item_id: item.id, p_completado: nuevo });
    setChecklist((prev) => ({ ...prev, [expedienteId]: prev[expedienteId].map((x) => (x.id === item.id ? { ...x, completado: nuevo } : x)) }));
  };

  const whatsapp = (telefono: string | null | undefined, mensaje: string) =>
    telefono ? `https://wa.me/${telefono.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}` : null;

  const actualizarUno = (e: any) => setExpedientes((prev) => prev.map((x) => (x.id === e.id ? { ...x, ...e } : x)));

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><ClipboardList className="w-5 h-5 text-rose-600" /> Gestoría — Estado de Transferencias</h1>
          <p className="text-sm text-slate-400">Vista de seguimiento de expedientes activos</p>
        </div>
        <div className="flex items-center gap-2">
          <button disabled title="Todavía no construido" className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 text-slate-300 opacity-60 cursor-not-allowed">💲 Nuevo Recibo</button>
          <button disabled title="Todavía no construido" className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 text-slate-300 opacity-60 cursor-not-allowed">📄 Nuevo Boleto</button>
          <button onClick={minimizarTodos} className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">⌃ Minimizar todos</button>
          <button onClick={expandirTodos} className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">⌄ Expandir todos</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        {[
          { label: "Vencidos", n: vencidos, icon: AlertTriangle, color: "text-rose-500" },
          { label: "Vencen 7 días", n: vencen7, icon: Clock, color: "text-amber-500" },
          { label: "Sin confirmar", n: sinConfirmar, icon: ShieldAlert, color: "text-orange-500" },
          { label: "Demorados >15d", n: demorados, icon: AlertTriangle, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
            </div>
            <span className="text-3xl font-black text-slate-800 dark:text-white">{s.n}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 mb-4">
        <div className="flex items-center gap-1">
          {[{ v: "activos" as const, l: "Activos", n: activos.length }, { v: "finalizados" as const, l: "Finalizados", n: finalizados.length }].map((t) => (
            <button key={t.v} onClick={() => setTab(t.v)} className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px flex items-center gap-1.5 ${tab === t.v ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
              {t.l} <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-full">{t.n}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pb-2">
          <p className="text-xs text-slate-400 hidden sm:block">Mostrando {lista.length} expediente{lista.length === 1 ? "" : "s"} {tab === "activos" ? "activo" + (lista.length === 1 ? "" : "s") : "finalizado" + (lista.length === 1 ? "" : "s")}</p>
          <div className="flex items-center bg-slate-100 dark:bg-white/10 rounded-lg p-0.5">
            <button onClick={() => setVista("cards")} className={`px-2.5 py-1 text-xs font-bold rounded-md ${vista === "cards" ? "bg-white dark:bg-white/10 shadow-sm" : "text-slate-500"}`}>▦ Cards</button>
            <button onClick={() => setVista("tabla")} className={`px-2.5 py-1 text-xs font-bold rounded-md ${vista === "tabla" ? "bg-white dark:bg-white/10 shadow-sm" : "text-slate-500"}`}>☰ Tabla</button>
          </div>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 flex flex-col items-center justify-center text-center">
          <ClipboardList className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Sin expedientes en este tab</p>
        </div>
      ) : vista === "tabla" ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3">Comprador</th>
                <th className="px-4 py-3">Gestor</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Avance</th>
                <th className="px-4 py-3">Vence</th>
                <th className="px-4 py-3">Días</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((e) => {
                const v = e.venta || {};
                const h = hitos[e.id] || [];
                const pct = h.length ? Math.round((h.filter((x) => x.completado).length / h.length) * 100) : 0;
                const dias = Math.floor((Date.now() - new Date(e.fecha_apertura || e.created_at).getTime()) / 86400000);
                return (
                  <tr key={e.id} onClick={() => setDetalleId(e.id)} className="border-b border-slate-50 dark:border-white/5 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{v.vehiculo_marca} {v.vehiculo_modelo}</p>
                      <p className="text-[11px] text-slate-400">{v.vehiculo_patente || "s/patente"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{v.comprador_nombre || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{e.gestor_asignado_id ? perfilMap[e.gestor_asignado_id] : "—"}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${ESTADO_CLASS[e.estado]}`}>{ESTADO_LABEL[e.estado] || e.estado}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 w-28">
                        <div className="h-1.5 flex-1 bg-slate-200 dark:bg-white/10 rounded-full"><div className="h-1.5 bg-rose-500 rounded-full" style={{ width: `${pct}%` }} /></div>
                        <span className="text-[10px] text-slate-400">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{e.vencimiento ? fmtFechaLocal(e.vencimiento) : "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{dias}d</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((e) => {
            const v = e.venta || {};
            const h = hitos[e.id] || [];
            const c = checklist[e.id] || [];
            const vendedora = c.filter((x) => x.parte === "vendedora");
            const compradora = c.filter((x) => x.parte === "compradora");
            const pendiente = !e.confirmado_comprador || !e.confirmado_consignacion;
            const abierto = expandidos.has(e.id);
            const docsFaltantesVendedora = vendedora.filter((x) => !x.completado).map((x) => x.nombre);
            const docsFaltantesCompradora = compradora.filter((x) => !x.completado).map((x) => x.nombre);

            return (
              <div key={e.id} className={`rounded-2xl overflow-hidden ${pendiente ? "border-2 border-rose-300 dark:border-rose-500/40" : "border border-slate-200 dark:border-white/10"}`}>
                {pendiente && (
                  <div className="bg-rose-50 dark:bg-rose-500/10 px-4 py-2 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                    <div>
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-300">Bloqueado — Pendiente confirmación</p>
                      <p className="text-[10px] text-rose-700/70 dark:text-rose-300/60">El vendedor responsable debe confirmar el cierre de la operación.</p>
                    </div>
                  </div>
                )}
                <button onClick={() => toggleExpandido(e.id)} className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-left">
                  {abierto ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span className={`text-xs font-bold shrink-0 ${PRIORIDAD_COLOR[e.prioridad]}`}>🟡 {e.prioridad}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white shrink-0">{e.titulo || `EXP — ${v.vehiculo_marca || ""} ${v.vehiculo_modelo || ""} (${v.vehiculo_anio || ""})`}</span>
                  {v.vehiculo_patente && <span className="text-[9px] font-bold bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded shrink-0">{v.vehiculo_patente}</span>}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ESTADO_CLASS[e.estado]}`}>{ESTADO_LABEL[e.estado] || e.estado}</span>
                  {pendiente && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 shrink-0">🔒 Pendiente</span>}
                  <span className="flex-1" />
                  <span className="ml-auto flex items-center gap-1.5 flex-wrap justify-end text-[11px] text-slate-400">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500" /> {v.comprador_nombre}
                  </span>
                </button>

                {!abierto && (
                  <div className="px-4 pb-3 -mt-1 bg-white dark:bg-white/5 text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>{v.vehiculo_marca} {v.vehiculo_modelo}</span>
                    <span>👤 {v.comprador_nombre}</span>
                    <span>📁 {e.gestor_asignado_id ? perfilMap[e.gestor_asignado_id] : "sin asignar"}</span>
                    <span>✓ {h.filter((x) => x.completado).length}/{h.length} hitos · {h.length ? Math.round((h.filter((x) => x.completado).length / h.length) * 100) : 0}%</span>
                    <span>Docs V:{vendedora.filter((x) => x.completado).length}/{vendedora.length} · C:{compradora.filter((x) => x.completado).length}/{compradora.length}</span>
                  </div>
                )}

                {abierto && (
                  <div className="p-4 bg-white dark:bg-white/5 border-t border-slate-100 dark:border-white/10 space-y-4">
                    <p className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Apertura: {fmtFechaLocal(e.fecha_apertura || e.created_at)} {e.vencimiento && <>· Vence: {fmtFechaLocal(e.vencimiento)}</>}</p>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center justify-between">Hitos de la transferencia <span>{h.filter((x) => x.completado).length}/{h.length}</span></p>
                      <div className="flex items-center">
                        {h.map((hito, i) => (
                          <div key={hito.id} className="flex flex-col items-center flex-1 last:flex-none">
                            <div className="flex items-center w-full">
                              <button onClick={() => toggleHito(e.id, hito)} title={hito.nombre} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${hito.completado ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-400"}`}>
                                {hito.completado ? <Check className="w-4 h-4" /> : i + 1}
                              </button>
                              {i < h.length - 1 && <div className={`h-0.5 flex-1 ${h[i + 1]?.completado || hito.completado ? "bg-emerald-300" : "bg-slate-200 dark:bg-white/10"}`} />}
                            </div>
                            <p className="text-[9px] text-center text-slate-400 mt-1 w-16">{hito.nombre}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-purple-50/60 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20 rounded-xl p-3">
                        <p className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center justify-between">🔑 Parte Vendedora <span className="text-[10px] font-normal text-slate-400">{vendedora.filter((x) => x.completado).length}/{vendedora.length} docs</span></p>
                        <div className="h-1 bg-purple-100 dark:bg-purple-500/10 rounded-full mt-1.5 mb-2"><div className="h-1 bg-purple-400 rounded-full" style={{ width: `${vendedora.length ? (vendedora.filter((x) => x.completado).length / vendedora.length) * 100 : 0}%` }} /></div>
                        <div className="space-y-1">
                          {vendedora.map((item) => (
                            <button key={item.id} onClick={() => toggleChecklist(e.id, item)} className="flex items-center gap-1.5 w-full text-left">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${item.completado ? "bg-emerald-500" : "bg-amber-400"}`} />
                              <span className={`text-xs ${item.completado ? "text-slate-400 line-through" : "text-slate-600 dark:text-slate-300"}`}>{item.nombre}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="bg-emerald-50/60 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3">
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">👤 {v.comprador_nombre || "Comprador"} <span className="text-[10px] font-normal text-slate-400">{compradora.filter((x) => x.completado).length}/{compradora.length} docs</span></p>
                        <div className="h-1 bg-emerald-100 dark:bg-emerald-500/10 rounded-full mt-1.5 mb-2"><div className="h-1 bg-emerald-400 rounded-full" style={{ width: `${compradora.length ? (compradora.filter((x) => x.completado).length / compradora.length) * 100 : 0}%` }} /></div>
                        <div className="space-y-1">
                          {compradora.map((item) => (
                            <button key={item.id} onClick={() => toggleChecklist(e.id, item)} className="flex items-center gap-1.5 w-full text-left">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${item.completado ? "bg-emerald-500" : "bg-amber-400"}`} />
                              <span className={`text-xs ${item.completado ? "text-slate-400 line-through" : "text-slate-600 dark:text-slate-300"}`}>{item.nombre}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a href={whatsapp(v.propietario_telefono, `Hola ${v.propietario_nombre || ""}, te escribimos de Pfaffen Autos por la transferencia de tu ${v.vehiculo_marca} ${v.vehiculo_modelo}.${docsFaltantesVendedora.length ? " Nos faltan estos documentos: " + docsFaltantesVendedora.join(", ") + "." : ""}`) || undefined} target="_blank" rel="noreferrer"
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 ${v.propietario_telefono ? "border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50" : "border-slate-100 dark:border-white/10 text-slate-300 pointer-events-none"}`}>
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp vendedor
                      </a>
                      <a href={whatsapp(v.comprador_telefono, `Hola ${v.comprador_nombre || ""}, te escribimos de Pfaffen Autos por la transferencia de tu ${v.vehiculo_marca} ${v.vehiculo_modelo}.${docsFaltantesCompradora.length ? " Nos faltan estos documentos: " + docsFaltantesCompradora.join(", ") + "." : ""}`) || undefined} target="_blank" rel="noreferrer"
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 ${v.comprador_telefono ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-300 pointer-events-none"}`}>
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp comprador
                      </a>
                      <button onClick={() => setDetalleId(e.id)} className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white">Abrir detalle →</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {detalleId && (
        <ExpedienteDetalleModal
          expedienteId={detalleId}
          miId={miId}
          perfiles={perfiles}
          soyAdmin={soyAdmin}
          puedeOperacionCaida={puedeOperacionCaida}
          puedeVerLiquidacion={puedeVerLiquidacion}
          gananciasOcultas={gananciasOcultas}
          onClose={() => { setDetalleId(null); if (searchParams.get("expediente")) router.replace("/panel-v2/gestoria"); }}
          onActualizado={actualizarUno}
          onEliminado={(id) => setExpedientes((prev) => prev.filter((x) => x.id !== id))}
        />
      )}
    </div>
  );
}
