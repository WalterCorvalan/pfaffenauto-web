"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, Search, KeyRound } from "lucide-react";
import NuevaConsignacionModal from "./NuevaConsignacionModal";
import ConsignacionDetalleModal from "./ConsignacionDetalleModal";
import { fmtFechaLocal } from "@/lib/panelV2/fechas";

interface Perfil { id: string; nombre: string; roles: string[] }
interface Cliente { id: string; nombre: string; telefono: string | null }

const ESTADO_LABEL: Record<string, string> = {
  pendiente_contacto: "Pendiente contacto", contactado: "Contactado", agendado: "Agendado",
  ingreso_local: "Ingresó al local", publicado: "Publicado", cancelado: "Cancelado", consignado: "Consignado",
};
const ESTADO_COLOR: Record<string, string> = {
  pendiente_contacto: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  contactado: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  agendado: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  ingreso_local: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
  publicado: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  cancelado: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  consignado: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
};

const TABS: { value: string; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pendiente_contacto", label: "Pendiente contacto" },
  { value: "contactado", label: "Contactado" },
  { value: "agendado", label: "Agendado" },
  { value: "ingreso_local", label: "Ingresó al local" },
  { value: "publicado", label: "Publicado" },
  { value: "consignado", label: "Consignadas" },
  { value: "cancelado", label: "Canceladas" },
];

export default function ConsignacionesClient({ consignacionesIniciales, perfiles, clientes, miId, soyAdmin }: { consignacionesIniciales: any[]; perfiles: Perfil[]; clientes: Cliente[]; miId: string; soyAdmin: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [consignaciones, setConsignaciones] = useState(consignacionesIniciales);
  const [tab, setTab] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [filtroVendedor, setFiltroVendedor] = useState("");
  const [modalNueva, setModalNueva] = useState(false);
  const [detalleId, setDetalleId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("consignacion");
    if (id) setDetalleId(id);
  }, [searchParams]);

  const activas = consignaciones.filter((c) => c.estado !== "cancelado" && c.estado !== "consignado");
  const porContactar = activas.filter((c) => c.estado === "pendiente_contacto").length;
  const publicadas = consignaciones.filter((c) => c.publicada).length;

  const filtradas = useMemo(() => {
    let l = consignaciones;
    if (tab !== "todas") l = l.filter((c) => c.estado === tab);
    if (filtroVendedor) l = l.filter((c) => c.vendedor_id === filtroVendedor);
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      l = l.filter((c) => [c.cliente_nombre, c.cliente_telefono, c.vehiculo_descripcion].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    return l;
  }, [consignaciones, tab, filtroVendedor, busqueda]);

  const perfilMap = Object.fromEntries(perfiles.map((p) => [p.id, p.nombre]));

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><KeyRound className="w-5 h-5 text-rose-600" /> Consignaciones</h1>
          <p className="text-sm text-slate-400">{consignaciones.length} consignación{consignaciones.length === 1 ? "" : "es"} · {porContactar} por contactar · {publicadas} publicadas</p>
        </div>
        <button onClick={() => setModalNueva(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm">
          <Plus className="w-4 h-4" /> Nueva consignación
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 my-4 overflow-x-auto">
        {TABS.map((t) => {
          const n = t.value === "todas" ? consignaciones.length : consignaciones.filter((c) => c.estado === t.value).length;
          return (
            <button key={t.value} onClick={() => setTab(t.value)} className={`px-3 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px flex items-center gap-1.5 ${tab === t.value ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
              {t.label} {n > 0 && <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-full">{n}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por cliente o vehículo..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none" />
        </div>
        <select value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none">
          <option value="">Todos los vendedores</option>
          {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {filtradas.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 flex flex-col items-center justify-center text-center">
          <KeyRound className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Sin consignaciones</p>
          <p className="text-xs text-slate-400 mt-1">Ningún registro matchea este tab/filtro.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3">Último contacto</th>
                <th className="px-4 py-3">Publicada</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c) => (
                <tr key={c.id} onClick={() => setDetalleId(c.id)} className="border-b border-slate-50 dark:border-white/5 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtFechaLocal(c.fecha_alta)}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{c.cliente_nombre}</p>
                    {c.cliente_telefono && <p className="text-[11px] text-slate-400">{c.cliente_telefono}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{c.vehiculo_descripcion}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{c.vendedor?.nombre || perfilMap[c.vendedor_id] || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{c.ultimo_contacto ? fmtFechaLocal(c.ultimo_contacto) : "—"}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.publicada ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-400 dark:bg-white/10"}`}>{c.publicada ? "Sí" : "No"}</span></td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${ESTADO_COLOR[c.estado]}`}>{ESTADO_LABEL[c.estado]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalNueva && (
        <NuevaConsignacionModal
          perfiles={perfiles}
          clientes={clientes}
          miId={miId}
          onClose={() => setModalNueva(false)}
          onCreado={(c) => setConsignaciones((prev) => [c, ...prev])}
        />
      )}

      {detalleId && (
        <ConsignacionDetalleModal
          consignacionId={detalleId}
          perfiles={perfiles}
          soyAdmin={soyAdmin}
          onClose={() => { setDetalleId(null); if (searchParams.get("consignacion")) router.replace("/panel-v2/consignaciones"); }}
          onActualizado={(c) => setConsignaciones((prev) => prev.map((x) => (x.id === c.id ? { ...x, ...c } : x)))}
          onEliminado={(id) => setConsignaciones((prev) => prev.filter((x) => x.id !== id))}
        />
      )}
    </div>
  );
}
