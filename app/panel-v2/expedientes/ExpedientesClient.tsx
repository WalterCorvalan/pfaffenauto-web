"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import { Search, FolderPlus, Trash2, Pencil, Lock } from "lucide-react";
import ExpedienteDetalleModal from "./ExpedienteDetalleModal";
import { fmtFechaLocal } from "@/lib/panelV2/fechas";

interface Perfil { id: string; nombre: string; roles: string[] }

const ESTADO_LABEL: Record<string, string> = { abierto: "En proceso", en_tramite: "En proceso", cerrado: "Finalizado" };
const ESTADO_CLASS: Record<string, string> = {
  abierto: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  en_tramite: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  cerrado: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
};

export default function ExpedientesClient({
  expedientesIniciales, perfiles, miId, miPerfil, gastosPorExpediente,
}: { expedientesIniciales: any[]; perfiles: Perfil[]; miId: string; miPerfil: any; gastosPorExpediente: Record<string, { vendedor: number; comprador: number }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expedientes, setExpedientes] = useState(expedientesIniciales);
  const [tab, setTab] = useState<"proceso" | "transferidos" | "reventas">("proceso");
  const [busqueda, setBusqueda] = useState("");
  const [filtroGestor, setFiltroGestor] = useState("");
  const [detalleId, setDetalleId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("expediente");
    if (id) setDetalleId(id);
  }, [searchParams]);

  const perfilMap = useMemo(() => Object.fromEntries(perfiles.map((p) => [p.id, p.nombre])), [perfiles]);
  const soyAdmin = miPerfil?.roles?.includes("admin") ?? false;
  const puedeOperacionCaida = miPerfil?.roles?.some((r: string) => r === "admin" || r === "finanzas") ?? false;
  const puedeVerLiquidacion = miPerfil?.roles?.some((r: string) => ["admin", "finanzas", "gestoria"].includes(r)) ?? false;

  const activos = expedientes.filter((e) => !e.archivado && !e.es_reventa);
  const enProceso = activos.filter((e) => e.estado !== "cerrado");
  const transferidos = activos.filter((e) => e.estado === "cerrado");
  const reventas = expedientes.filter((e) => e.es_reventa && !e.archivado);
  const pendientesConfirmacion = activos.filter((e) => !e.confirmado_comprador || !e.confirmado_consignacion);

  const lista = tab === "proceso" ? enProceso : tab === "transferidos" ? transferidos : reventas;

  const filtrados = useMemo(() => {
    let l = lista;
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      l = l.filter((e) => {
        const v = e.venta || {};
        return [e.titulo, v.vehiculo_patente, v.comprador_nombre, v.comprador_dni, v.comprador_telefono, v.propietario_nombre, v.propietario_telefono, v.vehiculo_marca, v.vehiculo_modelo, e.gestor_asignado_id ? perfilMap[e.gestor_asignado_id] : ""]
          .filter(Boolean).join(" ").toLowerCase().includes(q);
      });
    }
    if (filtroGestor) l = l.filter((e) => e.gestor_asignado_id === filtroGestor);
    return l;
  }, [lista, busqueda, filtroGestor, perfilMap]);

  const eliminar = async (e: any) => {
    if (!soyAdmin) return;
    if (!confirm(`¿Eliminar el expediente de ${e.venta?.comprador_nombre}? No se puede deshacer.`)) return;
    const { error, count } = await supabase2.from("expedientes").delete({ count: "exact" }).eq("id", e.id);
    if (error || !count) { alert("No se pudo eliminar."); return; }
    setExpedientes((prev) => prev.filter((x) => x.id !== e.id));
  };

  const actualizarUno = (e: any) => setExpedientes((prev) => prev.map((x) => (x.id === e.id ? { ...x, ...e } : x)));

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><FolderPlus className="w-5 h-5 text-rose-600" /> Expedientes</h1>
          <p className="text-sm text-slate-400">{activos.length} expedientes · {enProceso.length} en trámite · {transferidos.length} cerrados o transferidos</p>
        </div>
      </div>

      <button onClick={() => setTab("transferidos")} className="flex items-center gap-2 my-4 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-bold w-fit">
        ✅ Finalizados <span className="text-xs bg-white dark:bg-white/10 px-2 py-0.5 rounded-full">{transferidos.length}</span>
      </button>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 mb-4">
        {[
          { v: "proceso" as const, l: "En proceso", n: enProceso.length },
          { v: "transferidos" as const, l: "Transferidos", n: transferidos.length },
          { v: "reventas" as const, l: "Reventas", n: reventas.length },
        ].map((t) => (
          <button key={t.v} onClick={() => setTab(t.v)} className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px flex items-center gap-1.5 ${tab === t.v ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            {t.l} <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-full">{t.n}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Patente, dominio, comprador, vendedor, propietario, gestor, DNI, teléfono..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none" />
        </div>
        <select value={filtroGestor} onChange={(e) => setFiltroGestor(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none">
          <option value="">Todos los gestores</option>
          {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {pendientesConfirmacion.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4 mb-4">
          <p className="text-sm font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5"><Lock className="w-4 h-4" /> Tenés {pendientesConfirmacion.length} expediente{pendientesConfirmacion.length === 1 ? "" : "s"} pendiente{pendientesConfirmacion.length === 1 ? "" : "s"} de tu confirmación</p>
          <p className="text-xs text-rose-700/70 dark:text-rose-300/60 mt-0.5">Hacé clic en cualquiera para abrirlo y tildar el cierre desde el banner rojo en la cabecera del expediente.</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {pendientesConfirmacion.map((e) => (
              <button key={e.id} onClick={() => setDetalleId(e.id)} className="text-xs font-bold bg-white dark:bg-white/10 px-2.5 py-1 rounded-lg text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20">
                {e.titulo || `EXP — ${e.venta?.vehiculo_marca || ""} ${e.venta?.vehiculo_modelo || ""}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtrados.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 flex flex-col items-center justify-center text-center">
          <FolderPlus className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Todavía no hay expedientes</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">Los expedientes se generan automáticamente al cerrar una venta — no hay alta manual en v2.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Expediente</th>
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3">Consignador</th>
                <th className="px-4 py-3">Parte Vendedora</th>
                <th className="px-4 py-3">Parte Compradora</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Gastos</th>
                <th className="px-4 py-3 w-px"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((e) => {
                const v = e.venta || {};
                const pendiente = !e.confirmado_comprador || !e.confirmado_consignacion;
                const gastos = gastosPorExpediente[e.id] || { vendedor: 0, comprador: 0 };
                const dias = Math.floor((Date.now() - new Date(e.fecha_apertura || e.created_at).getTime()) / 86400000);
                const hitosPct = 0; // se calcula real dentro del detalle
                return (
                  <tr key={e.id} onClick={() => setDetalleId(e.id)} className={`border-b border-slate-50 dark:border-white/5 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 ${pendiente ? "bg-rose-50/60 dark:bg-rose-500/5 border-l-4 border-l-rose-500" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{e.titulo || `EXP — ${v.vehiculo_marca || ""} ${v.vehiculo_modelo || ""}`}</p>
                        {v.vehiculo_patente && <span className="text-[9px] font-bold bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{v.vehiculo_patente}</span>}
                      </div>
                      {pendiente && <p className="text-[9px] font-black uppercase text-rose-600 mt-1">🔒 Bloqueado hasta confirmación de las partes</p>}
                      <p className="text-[11px] text-slate-400 mt-0.5">{[v.vehiculo_marca, v.vehiculo_modelo, v.vehiculo_anio].filter(Boolean).join(" ")}</p>
                      <p className="text-[10px] text-slate-400">{fmtFechaLocal(e.fecha_apertura || e.created_at)} · Día {dias} {e.plazo_dias ? `de ${e.plazo_dias}` : ""}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{[v.vehiculo_marca, v.vehiculo_modelo, v.vehiculo_anio].filter(Boolean).join(" ") || "—"}</td>
                    <td className="px-4 py-3 text-xs text-indigo-600 dark:text-indigo-300 font-semibold">{v.responsable_consignacion_id ? perfilMap[v.responsable_consignacion_id] : "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      {v.propietario_nombre ? <span className="text-slate-700 dark:text-slate-200">{v.propietario_nombre}</span> : "—"}
                      <p className={`text-[9px] font-bold ${e.confirmado_consignacion ? "text-emerald-500" : "text-amber-500"}`}>{e.confirmado_consignacion ? "✅ Confirmado" : "⏳ Pendiente"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="text-slate-700 dark:text-slate-200">{v.comprador_nombre || "—"}</span>
                      <p className={`text-[9px] font-bold ${e.confirmado_comprador ? "text-emerald-500" : "text-amber-500"}`}>{e.confirmado_comprador ? "✅ Confirmado" : "⏳ Pendiente"}</p>
                    </td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${ESTADO_CLASS[e.estado]}`}>{ESTADO_LABEL[e.estado] || e.estado}</span></td>
                    <td className="px-4 py-3 text-[10px] text-slate-400">Vend: {gastos.vendedor > 0 ? gastos.vendedor.toLocaleString("es-AR") : "—"}<br />Comp: {gastos.comprador > 0 ? gastos.comprador.toLocaleString("es-AR") : "—"}</td>
                    <td className="px-4 py-3 w-px" onClick={(ev) => ev.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDetalleId(e.id)} className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300"><Pencil className="w-3.5 h-3.5" /></button>
                        {soyAdmin && <button onClick={() => eliminar(e)} className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-rose-600 hover:text-white text-rose-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
          gananciasOcultas={miPerfil?.ganancias_ocultas ?? false}
          onClose={() => { setDetalleId(null); if (searchParams.get("expediente")) router.replace("/panel-v2/expedientes"); }}
          onActualizado={actualizarUno}
          onEliminado={(id) => setExpedientes((prev) => prev.filter((x) => x.id !== id))}
        />
      )}
    </div>
  );
}
