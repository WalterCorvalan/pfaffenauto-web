"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Wallet } from "lucide-react";
import ExpedienteDetalleModal from "../../expedientes/ExpedienteDetalleModal";
import { fmtFechaLocal } from "@/lib/panelV2/fechas";

interface Perfil { id: string; nombre: string; roles: string[] }

const ESTADO_GESTORIA_LABEL: Record<string, string> = { abierto: "En proceso", en_tramite: "En proceso", cerrado: "Finalizado" };
const ESTADO_TESORERIA_LABEL: Record<string, string> = { pendiente: "Pendiente pago", en_proceso: "En proceso", pagado: "Pagado" };
const ESTADO_TESORERIA_CLASS: Record<string, string> = {
  pendiente: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  en_proceso: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  pagado: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
};

export default function ExpedientesTesoreriaClient({
  expedientesIniciales, perfiles, miId, miPerfil, gastosPorExpediente,
}: { expedientesIniciales: any[]; perfiles: Perfil[]; miId: string; miPerfil: any; gastosPorExpediente: Record<string, { vendedor: number; comprador: number }>; cuentas: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expedientes, setExpedientes] = useState(expedientesIniciales);
  const [tab, setTab] = useState<"activos" | "procesados" | "caidas">("activos");
  const [busqueda, setBusqueda] = useState("");
  const [detalleId, setDetalleId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("expediente");
    if (id) setDetalleId(id);
  }, [searchParams]);

  const soyAdmin = miPerfil?.roles?.includes("admin") ?? false;
  const puedeOperacionCaida = miPerfil?.roles?.some((r: string) => r === "admin" || r === "finanzas") ?? false;
  const puedeVerLiquidacion = miPerfil?.roles?.some((r: string) => ["admin", "finanzas", "gestoria"].includes(r)) ?? false;

  const noArchivados = expedientes.filter((e) => !e.archivado);
  const caidas = noArchivados.filter((e) => e.venta?.estado === "caida");
  const procesados = noArchivados.filter((e) => e.venta?.estado !== "caida" && e.venta?.estado_pago_tesoreria === "pagado");
  const activos = noArchivados.filter((e) => e.venta?.estado !== "caida" && e.venta?.estado_pago_tesoreria !== "pagado");

  const lista = tab === "activos" ? activos : tab === "procesados" ? procesados : caidas;

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return lista;
    const q = busqueda.trim().toLowerCase();
    return lista.filter((e) => {
      const v = e.venta || {};
      return [e.titulo, v.vehiculo_patente, v.comprador_nombre, v.propietario_nombre, v.vehiculo_marca, v.vehiculo_modelo].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [lista, busqueda]);

  const actualizarUno = (e: any) => setExpedientes((prev) => prev.map((x) => (x.id === e.id ? { ...x, ...e, venta: e.venta || x.venta } : x)));

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-1"><Wallet className="w-5 h-5 text-rose-600" /> Expedientes Tesorería</h1>
      <p className="text-sm text-slate-400 mb-4">Pago al vendedor y cobro al comprador, expediente por expediente.</p>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 mb-4">
        {[
          { v: "activos" as const, l: "Activos", n: activos.length },
          { v: "procesados" as const, l: "Procesados", n: procesados.length },
          { v: "caidas" as const, l: "Operaciones caídas", n: caidas.length },
        ].map((t) => (
          <button key={t.v} onClick={() => setTab(t.v)} className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px flex items-center gap-1.5 ${tab === t.v ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            {t.l} <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-full">{t.n}</span>
          </button>
        ))}
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Cliente, vehículo, dominio, propietario..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none" />
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 flex flex-col items-center justify-center text-center">
          <Wallet className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Sin expedientes acá</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Expediente</th>
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3">Partes</th>
                <th className="px-4 py-3">Estado Gestoría</th>
                <th className="px-4 py-3">Estado Tesorería</th>
                <th className="px-4 py-3">Gastos</th>
                <th className="px-4 py-3 w-px"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((e) => {
                const v = e.venta || {};
                const gastos = gastosPorExpediente[e.id] || { vendedor: 0, comprador: 0 };
                return (
                  <tr key={e.id} onClick={() => setDetalleId(e.id)} className="border-b border-slate-50 dark:border-white/5 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{e.titulo || `EXP — ${v.vehiculo_marca || ""} ${v.vehiculo_modelo || ""}`}</p>
                        {v.vehiculo_patente && <span className="text-[9px] font-bold bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{v.vehiculo_patente}</span>}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{fmtFechaLocal(e.fecha_apertura || e.created_at)}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {[v.vehiculo_marca, v.vehiculo_modelo, v.vehiculo_anio ? `(${v.vehiculo_anio})` : ""].filter(Boolean).join(" ") || "—"}
                      {v.propietario_nombre && <p className="text-[11px] text-slate-400 mt-0.5">{v.propietario_nombre}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-200">
                      <p>{v.propietario_nombre || "—"}</p>
                      <p className="text-slate-400">{v.comprador_nombre ? `${v.comprador_nombre} (comprador)` : "—"}</p>
                    </td>
                    <td className="px-4 py-3"><span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300">{ESTADO_GESTORIA_LABEL[e.estado] || e.estado}</span></td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${ESTADO_TESORERIA_CLASS[v.estado_pago_tesoreria] || ESTADO_TESORERIA_CLASS.pendiente}`}>{v.estado === "caida" ? "Operación caída" : ESTADO_TESORERIA_LABEL[v.estado_pago_tesoreria] || "Pendiente pago"}</span></td>
                    <td className="px-4 py-3 text-[10px] text-slate-400">Vend: {gastos.vendedor > 0 ? gastos.vendedor.toLocaleString("es-AR") : "—"}<br />Comp: {gastos.comprador > 0 ? gastos.comprador.toLocaleString("es-AR") : "—"}</td>
                    <td className="px-4 py-3 w-px" onClick={(ev) => ev.stopPropagation()}>
                      <button onClick={() => setDetalleId(e.id)} className="px-3 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg">Gestionar</button>
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
          tabInicial="Estado de Pago"
          onClose={() => { setDetalleId(null); if (searchParams.get("expediente")) router.replace("/panel-v2/tesoreria/expedientes"); }}
          onActualizado={actualizarUno}
          onEliminado={(id: string) => setExpedientes((prev) => prev.filter((x) => x.id !== id))}
        />
      )}
    </div>
  );
}
