"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { ArrowLeft, Search, CheckCircle2, Circle, Wrench } from "lucide-react";
import { ETAPAS_TALLER, ETAPA_LABEL, indiceEtapa, etapaSiguiente, etapaAnterior, puedeAvanzarAEntrega } from "../etapasTaller";

// Vista mobile-web para que los mecánicos avancen las OTs desde el celular,
// parados en el taller -- sin app nativa (ver conversación 29/9: se
// descartó por el esfuerzo de mantener un codebase aparte + tiendas de
// apps). Botones grandes, una sola columna, sin menús ni tablas.

function TarjetaOT({ orden, mecanicoNombre, onClick }: { orden: any; mecanicoNombre: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl p-4 active:scale-[0.98] transition-transform">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{orden.patente || "Sin patente"}</p>
        {orden.gestoria_lista && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
      </div>
      <p className="text-base font-bold text-slate-900 dark:text-white truncate">{orden.marca} {orden.modelo}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{orden.cliente_nombre} · {mecanicoNombre}</p>
      <div className="mt-3 inline-block bg-[#0145F2]/10 text-[#0145F2] dark:text-[#5b8dff] text-[11px] font-bold px-3 py-1.5 rounded-full">
        {ETAPA_LABEL[orden.estado] || orden.estado}
      </div>
    </button>
  );
}

function DetalleOT({ orden, mecanicoNombre, onVolver, onActualizada }: { orden: any; mecanicoNombre: string; onVolver: () => void; onActualizada: (o: any) => void }) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const indiceActual = indiceEtapa(orden.estado);
  const siguiente = etapaSiguiente(orden.estado);
  const anterior = etapaAnterior(orden.estado);

  const cambiarEstado = async (nuevoEstado: string | null) => {
    if (!nuevoEstado) return;
    if (nuevoEstado === "entrega" && !puedeAvanzarAEntrega(orden.estado, orden.gestoria_lista)) {
      setError("Falta marcar Gestoría como lista para pasar a Entrega.");
      return;
    }
    setError("");
    setGuardando(true);
    const { data, error: err } = await supabase2.from("taller_ordenes").update({ estado: nuevoEstado }).eq("id", orden.id).select().single();
    setGuardando(false);
    if (err) return setError("No se pudo actualizar.");
    onActualizada(data);
  };

  const toggleGestoria = async () => {
    setGuardando(true);
    const { data, error: err } = await supabase2.from("taller_ordenes").update({ gestoria_lista: !orden.gestoria_lista }).eq("id", orden.id).select().single();
    setGuardando(false);
    if (err) return setError("No se pudo actualizar Gestoría.");
    onActualizada(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#141414]">
      <div className="sticky top-0 z-10 bg-white dark:bg-[#141414] border-b border-slate-200 dark:border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={onVolver} className="p-2 -ml-2 text-slate-500 dark:text-slate-300 active:bg-slate-100 dark:active:bg-white/10 rounded-xl">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{orden.patente || "Sin patente"}</p>
          <p className="text-sm font-black text-slate-900 dark:text-white truncate">{orden.marca} {orden.modelo}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">{orden.cliente_nombre} · {mecanicoNombre}</p>

        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Etapa actual</p>
          <p className="text-2xl font-black text-[#0145F2] dark:text-[#5b8dff]">{ETAPA_LABEL[orden.estado] || orden.estado}</p>
        </div>

        {error && <p className="text-sm text-rose-500 font-bold text-center">{error}</p>}

        <button
          onClick={() => cambiarEstado(siguiente)}
          disabled={guardando || !siguiente}
          className="w-full py-5 bg-[#0145F2] active:bg-[#0138c9] text-white font-black text-base rounded-2xl shadow-lg shadow-blue-500/20 disabled:opacity-40"
        >
          {siguiente ? `Pasar a: ${ETAPA_LABEL[siguiente]}` : "Última etapa"}
        </button>

        <button
          onClick={() => cambiarEstado(anterior)}
          disabled={guardando || !anterior}
          className="w-full py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-2xl disabled:opacity-40"
        >
          Volver a etapa anterior
        </button>

        <button
          onClick={toggleGestoria}
          disabled={guardando}
          className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
            orden.gestoria_lista
              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
              : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10"
          }`}
        >
          {orden.gestoria_lista ? <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" /> : <Circle className="w-6 h-6 text-slate-300 shrink-0" />}
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Gestoría {orden.gestoria_lista ? "lista" : "pendiente"}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Tocá para {orden.gestoria_lista ? "desmarcar" : "marcar como lista"}</p>
          </div>
        </button>

        <div className="pt-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Todas las etapas</p>
          <div className="space-y-1">
            {ETAPAS_TALLER.map((e, i) => (
              <div key={e.value} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${i === indiceActual ? "bg-[#0145F2]/10 text-[#0145F2] dark:text-[#5b8dff]" : i < indiceActual ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>
                {i < indiceActual ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : i === indiceActual ? <div className="w-4 h-4 rounded-full bg-[#0145F2] shrink-0" /> : <Circle className="w-4 h-4 text-slate-200 dark:text-slate-700 shrink-0" />}
                {e.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TallerMovilClient({ ordenesIniciales, mecanicos }: { ordenesIniciales: any[]; mecanicos: any[] }) {
  const [ordenes, setOrdenes] = useState(ordenesIniciales);
  const [seleccionada, setSeleccionada] = useState<any>(null);
  const [busqueda, setBusqueda] = useState("");

  const actualizarOrden = (actualizada: any) => {
    setOrdenes((prev) => prev.map((o) => (o.id === actualizada.id ? actualizada : o)));
    setSeleccionada(actualizada);
  };

  const nombreMecanico = (id: string | null) => mecanicos.find((m) => m.id === id)?.nombre || "Sin asignar";

  if (seleccionada) {
    return (
      <DetalleOT
        orden={seleccionada}
        mecanicoNombre={nombreMecanico(seleccionada.mecanico_id)}
        onVolver={() => setSeleccionada(null)}
        onActualizada={actualizarOrden}
      />
    );
  }

  const filtro = busqueda.trim().toLowerCase();
  const ordenesFiltradas = filtro
    ? ordenes.filter((o) => [o.patente, o.cliente_nombre, o.marca, o.modelo].some((v) => (v || "").toLowerCase().includes(filtro)))
    : ordenes;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#141414]">
      <div className="sticky top-0 z-10 bg-white dark:bg-[#141414] border-b border-slate-200 dark:border-white/10 px-4 py-4">
        <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Wrench className="w-5 h-5 text-[#0145F2]" /> Taller
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por patente, cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:border-[#0145F2] text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {ordenesFiltradas.length === 0 ? (
          <div className="text-center py-16">
            <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No hay OTs activas.</p>
          </div>
        ) : (
          ordenesFiltradas.map((o) => (
            <TarjetaOT key={o.id} orden={o} mecanicoNombre={nombreMecanico(o.mecanico_id)} onClick={() => setSeleccionada(o)} />
          ))
        )}
      </div>
    </div>
  );
}
