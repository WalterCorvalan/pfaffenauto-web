"use client";

import { useState, useMemo, useEffect } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, Search } from "lucide-react";
import NuevoReclamoModal from "./NuevoReclamoModal";
import ReclamoDetalleModal from "./ReclamoDetalleModal";

const ESTANCADO_DIAS = 3;

const PRIORIDAD_CLASS: Record<string, string> = {
  Baja: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  Normal: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  Alta: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  Urgente: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};
const ESTADO_CLASS: Record<string, string> = {
  abierto: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  en_curso: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  cerrado: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400",
};
const ESTADO_LABEL: Record<string, string> = { abierto: "Abierto", en_curso: "En curso", cerrado: "Cerrado" };

interface Perfil { id: string; nombre: string; roles: string[] }

export default function ReclamosClient({ reclamosIniciales, perfiles, miPerfil }: { reclamosIniciales: any[]; perfiles: Perfil[]; miPerfil: Perfil | null }) {
  const [reclamos, setReclamos] = useState(reclamosIniciales);
  const [tab, setTab] = useState<"abierto" | "en_curso" | "cerrado">("abierto");
  const [busqueda, setBusqueda] = useState("");
  const [filtroAsignado, setFiltroAsignado] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("");
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [reclamoAbiertoId, setReclamoAbiertoId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("reclamo");
    if (id) setReclamoAbiertoId(id);
  }, []);

  useEffect(() => {
    const canal = supabase2
      .channel(`reclamos-live-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reclamos" }, async () => {
        const { data } = await supabase2.from("reclamos").select("*, asignado:perfiles!reclamos_asignado_a_fkey(id, nombre)").order("created_at", { ascending: false });
        if (data) setReclamos(data);
      })
      .subscribe();
    return () => { supabase2.removeChannel(canal); };
  }, []);

  const actualizarUno = (r: any) => setReclamos((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...r } : x)));

  const abiertos = reclamos.filter((r) => r.estado === "abierto");
  const enCurso = reclamos.filter((r) => r.estado === "en_curso");
  const cerrados = reclamos.filter((r) => r.estado === "cerrado");
  const urgentes = reclamos.filter((r) => r.estado !== "cerrado" && r.prioridad === "Urgente");
  const estancados = reclamos.filter((r) => r.estado !== "cerrado" && (Date.now() - new Date(r.ultimo_movimiento_at).getTime()) / 86400000 >= ESTANCADO_DIAS);

  const resolucionProm = useMemo(() => {
    const conTiempo = cerrados.filter((r) => r.cerrado_en);
    if (conTiempo.length === 0) return null;
    const totalHoras = conTiempo.reduce((acc, r) => acc + (new Date(r.cerrado_en).getTime() - new Date(r.created_at).getTime()) / 3600000, 0);
    const prom = totalHoras / conTiempo.length;
    return prom < 24 ? `${Math.round(prom)}h` : `${Math.round(prom / 24)}d`;
  }, [cerrados]);

  const listaPorTab = tab === "abierto" ? abiertos : tab === "en_curso" ? enCurso : cerrados;

  const filtrados = listaPorTab.filter((r) => {
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const match = r.titulo?.toLowerCase().includes(q) || r.cliente_nombre?.toLowerCase().includes(q) || r.cliente_telefono?.includes(q) || r.referencia?.toLowerCase().includes(q) || r.tipo?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filtroAsignado && r.asignado_a !== filtroAsignado) return false;
    if (filtroPrioridad && r.prioridad !== filtroPrioridad) return false;
    return true;
  });

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold">Reclamos</h1>
          <p className="text-sm text-slate-400">{abiertos.length} reclamo{abiertos.length === 1 ? "" : "s"} sin cerrar</p>
        </div>
        <button onClick={() => setMostrarNuevo(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm">
          <Plus className="w-4 h-4" /> Nuevo reclamo
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-5">
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
          <p className="text-2xl font-black">{abiertos.length}</p>
          <p className="text-xs text-slate-400">Abiertos</p>
        </div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
          <p className="text-2xl font-black text-blue-600">{enCurso.length}</p>
          <p className="text-xs text-slate-400">En curso</p>
        </div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
          <p className="text-2xl font-black text-rose-600">{urgentes.length}</p>
          <p className="text-xs text-slate-400">Urgentes</p>
        </div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
          <p className="text-2xl font-black text-amber-600">{estancados.length}</p>
          <p className="text-xs text-slate-400">Estancados<br /><span className="text-[10px]">sin moverse +{ESTANCADO_DIAS}d</span></p>
        </div>
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4">
          <p className="text-2xl font-black">{resolucionProm ?? "—"}</p>
          <p className="text-xs text-slate-400">Resolución prom.<br /><span className="text-[10px]">de los cerrados</span></p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 mb-4">
        {(["abierto", "en_curso", "cerrado"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px flex items-center gap-1.5 ${tab === t ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            {t === "abierto" ? "Abiertos" : t === "en_curso" ? "En curso" : "Cerrados"}
            {t !== "cerrado" && <span className="text-[10px] font-bold bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-full">{t === "abierto" ? abiertos.length : enCurso.length}</span>}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por título, cliente, teléfono, referencia, tipo..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none" />
        </div>
        <select value={filtroAsignado} onChange={(e) => setFiltroAsignado(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none">
          <option value="">Todos los asignados</option>
          {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none">
          <option value="">Todas las prioridades</option>
          {["Baja", "Normal", "Alta", "Urgente"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Sin reclamos acá</p>
            <p className="text-xs text-slate-400 mt-1">Ningún reclamo matchea este tab/filtro.</p>
          </div>
        ) : (
          filtrados.map((r) => {
            const conPedido = !!r.pedido_atencion_sector;
            return (
              <button
                key={r.id}
                onClick={() => setReclamoAbiertoId(r.id)}
                className={`w-full text-left px-4 py-3.5 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-between gap-3 ${conPedido ? "bg-amber-50 dark:bg-amber-500/10" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📣</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.titulo}</p>
                    {conPedido && <span className="text-[9px] font-black uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded-full shrink-0">Pedido</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{r.cliente_nombre} <span className="mx-1">·</span> <span className="bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{r.tipo}</span> {r.asignado && <> <span className="mx-1">·</span> {r.asignado.nombre}</>} <span className="mx-1">·</span> {new Date(r.created_at).toLocaleDateString("es-AR")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500">{Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000) === 0 ? "hoy" : `${Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000)}d`}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${PRIORIDAD_CLASS[r.prioridad]}`}>{r.prioridad}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${ESTADO_CLASS[r.estado]}`}>{ESTADO_LABEL[r.estado]}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {mostrarNuevo && miPerfil && (
        <NuevoReclamoModal
          perfiles={perfiles}
          miId={miPerfil.id}
          onClose={() => setMostrarNuevo(false)}
          onCreado={(r) => setReclamos((prev) => [r, ...prev])}
        />
      )}

      {reclamoAbiertoId && miPerfil && (
        <ReclamoDetalleModal
          reclamoId={reclamoAbiertoId}
          miId={miPerfil.id}
          perfiles={perfiles}
          onClose={() => setReclamoAbiertoId(null)}
          onActualizado={actualizarUno}
        />
      )}
    </div>
  );
}
